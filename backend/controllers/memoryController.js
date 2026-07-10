const { dbQuery } = require('../config/db');
const nodemailer = require('nodemailer');
const { addSseClient, removeSseClient, broadcastSse } = require('../services/sseService');

function splitCsv(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeMemoryRecord(row) {
  if (!row) return row;
  const tags = splitCsv(row.tags);
  const taggedUserIds = splitCsv(row.tagged_user_ids).map((x) => Number(x)).filter((x) => Number.isFinite(x));
  const taggedUserNames = splitCsv(row.tagged_user_names);
  const taggedUserEmails = splitCsv(row.tagged_user_emails);
  const max = Math.max(taggedUserIds.length, taggedUserNames.length, taggedUserEmails.length);
  const taggedUsers = [];
  for (let i = 0; i < max; i += 1) {
    taggedUsers.push({
      id: taggedUserIds[i] || null,
      name: taggedUserNames[i] || null,
      email: taggedUserEmails[i] || null,
    });
  }
  return {
    ...row,
    tags,
    taggedUserIds,
    taggedUserNames,
    taggedUserEmails,
    tagged_users: taggedUsers.filter((u) => u.id || u.name || u.email),
  };
}

function extractMentionNames(text) {
  if (!text) return [];
  const matches = String(text).match(/@([a-zA-Z0-9._]+(?:\s+[a-zA-Z0-9._]+){0,3})/g) || [];
  const names = matches.map((m) => m.replace(/^@/, '').trim()).filter(Boolean);
  return Array.from(new Set(names));
}

async function resolveTaggedUsersFromInput(inputUsers = [], mentionNames = []) {
  const normalized = Array.isArray(inputUsers) ? inputUsers : [];
  const emailSet = new Set();
  const idSet = new Set();

  for (const item of normalized) {
    if (!item || typeof item !== 'object') continue;
    if (item.email) emailSet.add(String(item.email).toLowerCase().trim());
    const numId = Number(item.id);
    if (Number.isFinite(numId) && numId > 0) idSet.add(numId);
  }

  const conditions = [];
  const params = [];

  if (idSet.size) {
    const ids = Array.from(idSet);
    conditions.push(`id IN (${ids.map(() => '?').join(',')})`);
    params.push(...ids);
  }

  if (emailSet.size) {
    const emails = Array.from(emailSet);
    conditions.push(`LOWER(email) IN (${emails.map(() => '?').join(',')})`);
    params.push(...emails);
  }

  if (mentionNames.length) {
    const names = mentionNames.slice(0, 20).map((n) => String(n).trim().toLowerCase()).filter(Boolean);
    if (names.length) {
      conditions.push(`LOWER(COALESCE(name, '')) IN (${names.map(() => '?').join(',')})`);
      params.push(...names);
    }
  }

  if (!conditions.length) return [];

  const { rows } = await dbQuery(
    `SELECT id, email, name FROM users WHERE ${conditions.join(' OR ')}`,
    params
  );

  const uniqueByEmail = new Map();
  for (const row of rows || []) {
    const email = String(row.email || '').toLowerCase();
    if (!email || uniqueByEmail.has(email)) continue;
    uniqueByEmail.set(email, {
      id: row.id,
      email: row.email,
      name: row.name || row.email,
    });
  }

  return Array.from(uniqueByEmail.values()).slice(0, 10);
}

async function createTagNotifications({ memoryId, actorEmail, taggedUsers }) {
  if (!Array.isArray(taggedUsers) || !taggedUsers.length) return;

  const recipients = taggedUsers
    .filter((u) => u && u.email)
    .map((u) => String(u.email).toLowerCase())
    .filter((email) => email && email !== String(actorEmail || '').toLowerCase());

  const uniqueRecipients = Array.from(new Set(recipients));
  if (!uniqueRecipients.length) return;

  for (const recipient of uniqueRecipients) {
    await dbQuery(
      `INSERT INTO memory_tag_notifications (recipient_email, actor_email, memory_id, message)
       VALUES (?, ?, ?, ?)`,
      [recipient, actorEmail || null, memoryId, 'You were tagged in a memory']
    );
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      const baseUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/alumni/memories`;
      for (const recipient of uniqueRecipients) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipient,
          subject: 'You were tagged in a memory',
          html: `<p>You were tagged in a memory.</p><p><a href="${baseUrl}">Open Memories</a></p>`,
        });
      }
    } catch (emailErr) {
      console.warn('Memory tag email notification failed:', emailErr.message);
    }
  }
}

// 1. Memory SSE Stream
async function streamMemories(req, res) {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();
  res.write(':\n\n');
  addSseClient(res);
  req.on('close', () => { removeSseClient(res); });
}

// 2. Create a memory
async function createMemory(req, res) {
  try {
    const {
      author_name,
      author_email,
      author_avatar,
      author_batch,
      author_department,
      title,
      description,
      image_url,
      date,
      location,
      tags,
      tagged_users,
      category,
      type
    } = req.body || {};

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || null);
    const mentionNames = extractMentionNames(description || '');
    const resolvedTaggedUsers = await resolveTaggedUsersFromInput(tagged_users, mentionNames);
    const taggedIdsStr = resolvedTaggedUsers.map((u) => u.id).filter(Boolean).join(',') || null;
    const taggedNamesStr = resolvedTaggedUsers.map((u) => u.name).filter(Boolean).join(',') || null;
    const taggedEmailsStr = resolvedTaggedUsers.map((u) => String(u.email || '').toLowerCase()).filter(Boolean).join(',') || null;
    const { rows } = await dbQuery(`
      INSERT INTO memories (
        author_name, author_avatar, author_batch, author_department,
        title, description, image_url, date, location, tags, tagged_user_ids, tagged_user_names, tagged_user_emails, category, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      author_name || null, author_avatar || null, author_batch || null, author_department || null,
      title,
      description || null,
      image_url || null,
      date || null,
      location || null,
      tagsStr,
      taggedIdsStr,
      taggedNamesStr,
      taggedEmailsStr,
      category || null,
      type,
    ]);
    const created = normalizeMemoryRecord(rows && rows[0]);
    await createTagNotifications({ memoryId: created.id, actorEmail: author_email || null, taggedUsers: resolvedTaggedUsers });
    try { broadcastSse('memory-create', created); } catch { }
    return res.status(201).json(created);
  } catch (e) {
    console.error("Memory Create Error:", e);
    res.status(500).json({ error: e.message });
  }
}

// 3. List memories
async function listMemories(req, res) {
  try {
    const { page = 1, limit = 20, q, tag, author } = req.query || {};
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;
    const where = [];
    const params = [];
    if (q) {
      where.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(COALESCE(tagged_user_names, \'\')) LIKE ?)');
      const like = `%${String(q).toLowerCase()}%`;
      params.push(like, like, like);
    }
    if (tag) { where.push('tags LIKE ?'); params.push(`%${String(tag)}%`); }
    if (author) { where.push('LOWER(author_name) = LOWER(?)'); params.push(author); }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows } = await dbQuery(`SELECT * FROM memories ${whereSql} ORDER BY COALESCE(date, created_at) DESC LIMIT ? OFFSET ?`, [...params, l, offset]);
    return res.json({ memories: (rows || []).map(normalizeMemoryRecord), page: p, limit: l });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// 4. Get single memory
async function getMemoryById(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await dbQuery('SELECT * FROM memories WHERE id = ? LIMIT 1', [id]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json({ memory: normalizeMemoryRecord(rows[0]) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// 5. Get Tag Notifications
async function getTagNotifications(req, res) {
  try {
    const { email, unread_only } = req.query || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const where = ['LOWER(recipient_email) = LOWER(?)'];
    const params = [email];
    if (String(unread_only || '') === '1' || String(unread_only || '').toLowerCase() === 'true') {
      where.push('is_read = FALSE');
    }
    const { rows } = await dbQuery(
      `SELECT * FROM memory_tag_notifications WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT 100`,
      params
    );
    return res.json({ notifications: rows || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// 6. Mark Tag Notification as Read
async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await dbQuery(
      'UPDATE memory_tag_notifications SET is_read = TRUE WHERE id = ? RETURNING *',
      [id]
    );
    if (!rows || !rows.length) return res.status(404).json({ error: 'Notification not found' });
    return res.json({ notification: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// 7. Increment view count
async function incrementViewCount(req, res) {
  try {
    const { id } = req.params;
    await dbQuery('UPDATE memories SET views = COALESCE(views,0) + 1 WHERE id = ?', [id]);
    const { rows } = await dbQuery('SELECT views FROM memories WHERE id = ? LIMIT 1', [id]);
    const views = rows && rows[0] ? rows[0].views : 0;
    try { broadcastSse('memory-view', { id: Number(id), views }); } catch { }
    return res.json({ views });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// 8. Like / Unlike memory
async function likeMemory(req, res) {
  try {
    const { id } = req.params;
    const { action = 'like' } = req.body || {};
    const inc = action === 'unlike' ? -1 : 1;
    await dbQuery('UPDATE memories SET likes = GREATEST(0, COALESCE(likes,0) + ?), is_liked = ? WHERE id = ?', [inc, inc > 0, id]);
    const { rows } = await dbQuery('SELECT likes, is_liked FROM memories WHERE id = ? LIMIT 1', [id]);
    const payload = { id: Number(id), likes: rows && rows[0] ? rows[0].likes : 0, is_liked: rows && rows[0] ? rows[0].is_liked : false };
    try { broadcastSse('memory-like', payload); } catch { }
    return res.json(payload);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// 9. Increment Share Count
async function incrementShareCount(req, res) {
  try {
    const { id } = req.params;
    await dbQuery('UPDATE memories SET share_count = COALESCE(share_count,0) + 1 WHERE id = ?', [id]);
    const { rows } = await dbQuery('SELECT share_count FROM memories WHERE id = ? LIMIT 1', [id]);
    const share_count = rows && rows[0] ? rows[0].share_count : 0;
    try { broadcastSse('memory-share', { id: Number(id), share_count }); } catch { }
    return res.json({ share_count });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// 10. Get comments
async function getComments(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await dbQuery('SELECT * FROM memory_comments WHERE memory_id = ? ORDER BY created_at ASC', [id]);
    return res.json({ comments: rows || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// 11. Add comment
async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { author_name, author_email, author_avatar, text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Comment text is required' });
    const { rows } = await dbQuery(`
      INSERT INTO memory_comments (memory_id, author_name, author_email, author_avatar, text)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `, [id, author_name || null, author_email || null, author_avatar || null, text]);
    await dbQuery('UPDATE memories SET comments_count = COALESCE(comments_count,0) + 1 WHERE id = ?', [id]);
    const created = rows && rows[0];
    try { broadcastSse('memory-comment', { id: Number(id), comment: created }); } catch { }
    return res.status(201).json(created);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  streamMemories,
  createMemory,
  listMemories,
  getMemoryById,
  getTagNotifications,
  markNotificationAsRead,
  incrementViewCount,
  likeMemory,
  incrementShareCount,
  getComments,
  addComment
};
