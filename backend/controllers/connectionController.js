const { dbQuery } = require('../config/db');

function buildPairKey(a, b) {
  const [x, y] = [String(a).toLowerCase().trim(), String(b).toLowerCase().trim()].sort();
  return `${x}|${y}`;
}

async function areConnected(emailA, emailB) {
  const pair_key = buildPairKey(emailA, emailB);
  const { rows } = await dbQuery('SELECT status FROM connections WHERE pair_key = ? LIMIT 1', [pair_key]);
  if (!rows || !rows.length) return false;
  return rows[0].status === 'accepted';
}

// POST send connection request
async function createConnectionRequest(req, res) {
  const { requester_email, target_email, message } = req.body || {};
  if (!requester_email || !target_email) {
    return res.status(400).json({ error: 'requester_email and target_email required' });
  }
  if (requester_email.toLowerCase() === target_email.toLowerCase()) {
    return res.status(400).json({ error: 'Cannot connect to self' });
  }
  try {
    const pair_key = buildPairKey(requester_email, target_email);
    const existing = await dbQuery('SELECT * FROM connections WHERE pair_key = ? LIMIT 1', [pair_key]);
    if (existing.rows && existing.rows.length) {
      const row = existing.rows[0];
      if (row.status === 'pending') {
        return res.json({ connection: row });
      }
      if (row.status === 'accepted') {
        return res.status(409).json({ error: 'Already connected', connection: row });
      }
      if (row.status === 'rejected' || row.status === 'removed') {
        const { rows } = await dbQuery(`
          UPDATE connections SET requester_email = ?, target_email = ?, status = 'pending', message = ?, accepted_at = NULL, updated_at = NOW()
          WHERE id = ? RETURNING *
        `, [requester_email, target_email, message || null, row.id]);
        return res.status(201).json({ connection: rows[0] });
      }
    }
    const { rows } = await dbQuery(`
      INSERT INTO connections (pair_key, requester_email, target_email, status, message)
      VALUES (?, ?, ?, 'pending', ?)
      RETURNING *
    `, [pair_key, requester_email, target_email, message || null]);
    return res.status(201).json({ connection: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST respond to connection request
async function respondConnectionRequest(req, res) {
  const { user_email, other_email, action } = req.body || {};
  if (!user_email || !other_email || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'user_email, other_email and action (accept|reject) required' });
  }
  try {
    const pair_key = buildPairKey(user_email, other_email);
    const { rows } = await dbQuery('SELECT * FROM connections WHERE pair_key = ? LIMIT 1', [pair_key]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'No request found' });
    const conn = rows[0];
    if (conn.status !== 'pending') return res.status(400).json({ error: 'Request not pending' });
    if (conn.requester_email.toLowerCase() === user_email.toLowerCase()) {
      return res.status(403).json({ error: 'Requester cannot respond, only target' });
    }
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { rows: updated } = await dbQuery(`
      UPDATE connections SET status = ?, accepted_at = CASE WHEN ? = 'accepted' THEN NOW() ELSE NULL END, updated_at = NOW()
      WHERE id = ? RETURNING *
    `, [newStatus, newStatus, conn.id]);
    return res.json({ connection: updated[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// GET list connections
async function getConnections(req, res) {
  const { user_email, status } = req.query || {};
  if (!user_email) return res.status(400).json({ error: 'user_email required' });
  try {
    let sql = 'SELECT * FROM connections WHERE requester_email = ? OR target_email = ?';
    const params = [user_email, user_email];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY updated_at DESC LIMIT 200';
    const { rows } = await dbQuery(sql, params);
    return res.json({ connections: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST remove connection
async function removeConnection(req, res) {
  const { user_email, other_email } = req.body || {};
  if (!user_email || !other_email) return res.status(400).json({ error: 'user_email and other_email required' });
  try {
    const pair_key = buildPairKey(user_email, other_email);
    const [connResult, reqResult] = await Promise.all([
      dbQuery('SELECT * FROM connections WHERE pair_key = ? LIMIT 1', [pair_key]),
      dbQuery('SELECT * FROM mentorship_requests WHERE pair_key = ? LIMIT 1', [pair_key]),
    ]);

    const conn = connResult.rows && connResult.rows.length ? connResult.rows[0] : null;
    const mentorshipReq = reqResult.rows && reqResult.rows.length ? reqResult.rows[0] : null;

    if (!conn && !mentorshipReq) {
      return res.status(404).json({ error: 'Not found' });
    }

    let updatedConnection = null;
    let updatedRequest = null;

    if (conn && conn.status !== 'removed') {
      const { rows } = await dbQuery(`
        UPDATE connections SET status = 'removed', updated_at = NOW() WHERE id = ? RETURNING *
      `, [conn.id]);
      updatedConnection = rows && rows.length ? rows[0] : null;
    }

    if (mentorshipReq && mentorshipReq.status !== 'removed') {
      const { rows } = await dbQuery(`
        UPDATE mentorship_requests
        SET status = 'removed', accepted_at = NULL, updated_at = NOW()
        WHERE id = ?
        RETURNING *
      `, [mentorshipReq.id]);
      updatedRequest = rows && rows.length ? rows[0] : null;
    }

    return res.json({
      connection: updatedConnection || conn,
      mentorship_request: updatedRequest || mentorshipReq,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  createConnectionRequest,
  respondConnectionRequest,
  getConnections,
  removeConnection,
  areConnected
};
