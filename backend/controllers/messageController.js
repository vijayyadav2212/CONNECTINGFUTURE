const { dbQuery } = require('../config/db');
const { getViewUrl } = require('../services/cloudinaryService');
const {
  buildThreadKey,
  encryptText,
  decryptText,
  toBuffer
} = require('../services/cryptoService');
const { areConnected } = require('./connectionController');

const MESSAGE_EDIT_WINDOW_MINUTES = Number(process.env.MESSAGE_EDIT_WINDOW_MINUTES || 15);

function buildPairKey(a, b) {
  const [x, y] = [String(a).toLowerCase().trim(), String(b).toLowerCase().trim()].sort();
  return `${x}|${y}`;
}

async function getUserRoleByEmail(email) {
  const { rows } = await dbQuery('SELECT user_type FROM users WHERE email = ? LIMIT 1', [email]);
  return rows && rows[0] ? (rows[0].user_type || 'alumni') : 'alumni';
}

async function canSendMentorshipMessage(aEmail, bEmail) {
  try {
    const aRole = await getUserRoleByEmail(aEmail);
    const bRole = await getUserRoleByEmail(bEmail);
    const isMentorshipPair = (aRole === 'student' && bRole === 'alumni') || (aRole === 'alumni' && bRole === 'student');
    if (!isMentorshipPair) return { allowed: true };
    const thread_key = buildThreadKey(aEmail, bEmail);
    const { rows } = await dbQuery('SELECT COUNT(*) AS cnt FROM messages WHERE thread_key = ?', [thread_key]);
    const count = rows && rows[0] ? Number(rows[0].cnt) : 0;
    if (count < 20) return { allowed: true };
    const pair_key = buildPairKey(aEmail, bEmail);
    const { rows: subs } = await dbQuery("SELECT id FROM mentorship_subscriptions WHERE pair_key = ? AND status = 'active' AND end_at >= NOW() ORDER BY created_at DESC LIMIT 1", [pair_key]);
    if (subs && subs.length) return { allowed: true };
    const { rows: sess } = await dbQuery("SELECT id, status FROM mentorship_sessions WHERE pair_key = ? AND status IN ('paid','scheduled','completed') ORDER BY created_at DESC LIMIT 1", [pair_key]);
    if (sess && sess.length) return { allowed: true };
    return { allowed: false, reason: 'Free chat limit reached (20 messages). Please purchase a mentorship session or subscription.' };
  } catch (e) {
    return { allowed: true };
  }
}

// POST create message
async function createMessage(req, res) {
  const {
    sender_email,
    receiver_email,
    content,
    attachment_url,
    attachment_name,
    attachment_mime,
    attachment_size,
  } = req.body || {};
  const text = typeof content === 'string' ? content : '';
  const hasText = text.trim().length > 0;
  const hasAttachment = typeof attachment_url === 'string' && attachment_url.trim().length > 0;
  if (!sender_email || !receiver_email || (!hasText && !hasAttachment)) {
    return res.status(400).json({ error: 'sender_email, receiver_email and text or attachment are required' });
  }

  try {
    const thread_key = buildThreadKey(sender_email, receiver_email);
    const gate = await canSendMentorshipMessage(sender_email, receiver_email);
    if (!gate.allowed) {
      return res.status(402).json({ error: gate.reason || 'Chat locked. Purchase a session to continue.' });
    }
    const { iv, tag, encrypted } = encryptText(text);
    const sql = `
      INSERT INTO messages (
        thread_key, sender_email, receiver_email, iv, auth_tag, ciphertext,
        attachment_url, attachment_name, attachment_mime, attachment_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, created_at
    `;
    const { rows } = await dbQuery(sql, [
      thread_key,
      sender_email,
      receiver_email,
      iv,
      tag,
      encrypted,
      hasAttachment ? attachment_url : null,
      hasAttachment ? (attachment_name || null) : null,
      hasAttachment ? (attachment_mime || null) : null,
      hasAttachment ? (Number(attachment_size) || null) : null,
    ]);
    const row = rows && rows[0];
    return res.status(201).json({ id: row?.id, thread_key, created_at: row?.created_at });
  } catch (e) {
    console.error('DB/Encryption error inserting message:', e.message);
    return res.status(500).json({ error: 'Failed to send message', details: e.message });
  }
}

// GET list messages in thread
async function getMessages(req, res) {
  const { user, with: other, limit = 100, markRead } = req.query || {};
  if (!user || !other) {
    return res.status(400).json({ error: 'Query params user and with are required' });
  }
  const thread_key = buildThreadKey(user, other);
  try {
    const { rows } = await dbQuery('SELECT * FROM messages WHERE thread_key = ? ORDER BY created_at ASC LIMIT ?', [thread_key, Number(limit)]);

    if (markRead === '1' || markRead === 'true') {
      dbQuery('UPDATE messages SET read_at = NOW() WHERE thread_key = ? AND receiver_email = ? AND read_at IS NULL', [thread_key, user]).catch(() => { });
    }

    const now = Date.now();
    const editWindowMs = MESSAGE_EDIT_WINDOW_MINUTES * 60 * 1000;
    const requestUser = String(user).toLowerCase();

    const messages = (rows || []).map((r) => {
      let content = '';
      try {
        const iv = toBuffer(r.iv);
        const tag = toBuffer(r.auth_tag);
        const cipher = toBuffer(r.ciphertext);
        content = decryptText(iv, tag, cipher);
      } catch (e) {
        content = '[Unable to decrypt message]';
      }

      const createdTs = new Date(r.created_at).getTime();
      const canEditDelete =
        !r.deleted_at &&
        String(r.sender_email || '').toLowerCase() === requestUser &&
        now - createdTs <= editWindowMs;

      return {
        id: r.id,
        sender_email: r.sender_email,
        receiver_email: r.receiver_email,
        content: r.deleted_at ? '' : content,
        created_at: r.created_at,
        read_at: r.read_at,
        edited_at: r.edited_at,
        deleted_at: r.deleted_at,
        attachment_url: r.attachment_url ? getViewUrl(r.attachment_url, r.attachment_name || '') : null,
        attachment_name: r.attachment_name || null,
        attachment_mime: r.attachment_mime || null,
        attachment_size: r.attachment_size || null,
        can_edit_delete: canEditDelete,
      };
    });

    return res.json({ thread_key, messages, edit_window_minutes: MESSAGE_EDIT_WINDOW_MINUTES });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET messages threads
async function getMessageThreads(req, res) {
  const { user, limit = 50 } = req.query || {};
  if (!user) {
    return res.status(400).json({ error: 'Query param user is required' });
  }

  try {
    const { rows } = await dbQuery(
      'SELECT * FROM messages WHERE sender_email = ? OR receiver_email = ? ORDER BY created_at DESC LIMIT ?',
      [user, user, Number(limit) * 10]
    );

    const map = new Map();
    for (const r of rows || []) {
      if (!map.has(r.thread_key)) {
        let content = '';
        if (r.deleted_at) {
          content = 'Message deleted';
        } else if (r.attachment_url && (!r.ciphertext || toBuffer(r.ciphertext).length === 0)) {
          content = 'Attachment';
        } else {
          try {
            const iv = toBuffer(r.iv);
            const tag = toBuffer(r.auth_tag);
            const cipher = toBuffer(r.ciphertext);
            content = decryptText(iv, tag, cipher) || (r.attachment_url ? 'Attachment' : '');
          } catch (e) {
            content = '[Unable to decrypt message]';
          }
        }
        const other = r.sender_email.toLowerCase() === String(user).toLowerCase() ? r.receiver_email : r.sender_email;
        map.set(r.thread_key, {
          thread_key: r.thread_key,
          other,
          other_name: other,
          last_message: content,
          last_at: r.created_at,
          unread: 0,
        });
      }
    }

    for (const r of rows || []) {
      if (!r.read_at && r.receiver_email.toLowerCase() === String(user).toLowerCase()) {
        const t = map.get(r.thread_key);
        if (t) t.unread += 1;
      }
    }

    const otherEmails = Array.from(new Set(Array.from(map.values()).map(t => t.other).filter(Boolean).map(v => String(v).toLowerCase())));
    if (otherEmails.length) {
      const placeholders = otherEmails.map(() => '?').join(', ');
      const { rows: profiles } = await dbQuery(
        `SELECT LOWER(email) AS email_key, name FROM users WHERE LOWER(email) IN (${placeholders})`,
        otherEmails
      );
      const profileMap = new Map((profiles || []).map(p => [String(p.email_key || '').toLowerCase(), p.name || null]));
      for (const item of map.values()) {
        item.other_name = profileMap.get(String(item.other || '').toLowerCase()) || item.other;
      }
    }

    return res.json({ threads: Array.from(map.values()) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST create connected message (enforce accepted connection)
async function createConnectedMessage(req, res) {
  const {
    sender_email,
    receiver_email,
    content,
    attachment_url,
    attachment_name,
    attachment_mime,
    attachment_size,
  } = req.body || {};
  const text = typeof content === 'string' ? content : '';
  const hasText = text.trim().length > 0;
  const hasAttachment = typeof attachment_url === 'string' && attachment_url.trim().length > 0;
  if (!sender_email || !receiver_email || (!hasText && !hasAttachment)) {
    return res.status(400).json({ error: 'sender_email, receiver_email and text or attachment required' });
  }
  try {
    const ok = await areConnected(sender_email, receiver_email);
    if (!ok) return res.status(403).json({ error: 'Not connected' });
    const gate = await canSendMentorshipMessage(sender_email, receiver_email);
    if (!gate.allowed) {
      return res.status(402).json({ error: gate.reason || 'Chat locked. Purchase a session to continue.' });
    }
    const thread_key = buildThreadKey(sender_email, receiver_email);
    const { iv, tag, encrypted } = encryptText(text);
    const { rows } = await dbQuery(`
      INSERT INTO messages (
        thread_key, sender_email, receiver_email, iv, auth_tag, ciphertext,
        attachment_url, attachment_name, attachment_mime, attachment_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, created_at
    `, [
      thread_key,
      sender_email,
      receiver_email,
      iv,
      tag,
      encrypted,
      hasAttachment ? attachment_url : null,
      hasAttachment ? (attachment_name || null) : null,
      hasAttachment ? (attachment_mime || null) : null,
      hasAttachment ? (Number(attachment_size) || null) : null,
    ]);
    return res.status(201).json({ id: rows[0].id, created_at: rows[0].created_at, thread_key });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// PUT edit message
async function editMessage(req, res) {
  const { id } = req.params;
  const { user_email, content } = req.body || {};
  if (!id || !user_email || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'id, user_email and non-empty content required' });
  }
  try {
    const { rows } = await dbQuery('SELECT * FROM messages WHERE id = ? LIMIT 1', [id]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Message not found' });
    const msg = rows[0];
    if (String(msg.sender_email).toLowerCase() !== String(user_email).toLowerCase()) {
      return res.status(403).json({ error: 'Only sender can edit message' });
    }
    if (msg.deleted_at) return res.status(400).json({ error: 'Cannot edit deleted message' });

    const ageMs = Date.now() - new Date(msg.created_at).getTime();
    const maxMs = MESSAGE_EDIT_WINDOW_MINUTES * 60 * 1000;
    if (ageMs > maxMs) {
      return res.status(403).json({ error: `Edit window expired (${MESSAGE_EDIT_WINDOW_MINUTES} minutes)` });
    }

    const { iv, tag, encrypted } = encryptText(content);
    await dbQuery(
      'UPDATE messages SET iv = ?, auth_tag = ?, ciphertext = ?, edited_at = NOW() WHERE id = ?',
      [iv, tag, encrypted, id]
    );
    return res.json({ message: 'Message updated' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// DELETE message
async function deleteMessage(req, res) {
  const { id } = req.params;
  const { user_email } = req.body || {};
  if (!id || !user_email) {
    return res.status(400).json({ error: 'id and user_email required' });
  }
  try {
    const { rows } = await dbQuery('SELECT * FROM messages WHERE id = ? LIMIT 1', [id]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Message not found' });
    const msg = rows[0];
    if (String(msg.sender_email).toLowerCase() !== String(user_email).toLowerCase()) {
      return res.status(403).json({ error: 'Only sender can delete message' });
    }
    if (msg.deleted_at) return res.json({ message: 'Already deleted' });

    const ageMs = Date.now() - new Date(msg.created_at).getTime();
    const maxMs = MESSAGE_EDIT_WINDOW_MINUTES * 60 * 1000;
    if (ageMs > maxMs) {
      return res.status(403).json({ error: `Delete window expired (${MESSAGE_EDIT_WINDOW_MINUTES} minutes)` });
    }

    await dbQuery('UPDATE messages SET deleted_at = NOW(), edited_at = NOW() WHERE id = ?', [id]);
    return res.json({ message: 'Message deleted' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  createMessage,
  getMessages,
  getMessageThreads,
  createConnectedMessage,
  editMessage,
  deleteMessage
};
