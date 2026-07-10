const { dbQuery } = require('../config/db');
const { isAdminRequest } = require('../middlewares/authMiddleware');

function buildPairKey(a, b) {
  const emails = [String(a).toLowerCase().trim(), String(b).toLowerCase().trim()];
  emails.sort();
  return emails.join('|');
}

// GET list of mentors
async function getMentors(req, res) {
  try {
    const { q, min_experience, max_price, min_rating, page = 1, limit = 20 } = req.query || {};
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;
    const where = [];
    const params = [];
    if (q) {
      where.push("(LOWER(mentor_email) LIKE ? OR LOWER(skills) LIKE ? OR LOWER(topics) LIKE ?)");
      const like = `%${String(q).toLowerCase()}%`;
      params.push(like, like, like);
    }
    if (min_experience) { where.push('experience_years >= ?'); params.push(Number(min_experience)); }
    if (max_price) { where.push('price <= ?'); params.push(Number(max_price)); }
    if (min_rating) { where.push('rating_avg >= ?'); params.push(Number(min_rating)); }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows: list } = await dbQuery(`SELECT mentor_email AS mentor_email, skills, topics, availability, experience_years, price, subscription_price, subscription_duration_days, rating_avg, rating_count FROM mentors ${whereSql} ORDER BY rating_avg DESC NULLS LAST LIMIT ? OFFSET ?`, [...params, l, offset]);
    return res.json({ mentors: list, page: p, limit: l });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// GET mentor profile
async function getMentorProfile(req, res) {
  try {
    const { email } = req.query || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const { rows } = await dbQuery('SELECT * FROM mentors WHERE LOWER(mentor_email) = LOWER(?) LIMIT 1', [email]);
    const { rows: userRows } = await dbQuery('SELECT skills FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
    const registeredSkills = userRows && userRows[0] ? (userRows[0].skills || '') : '';

    const { rows: ratingRows } = await dbQuery(
      `SELECT 
        COALESCE(AVG(mr.rating), 0) as rating_avg,
        COUNT(*) as rating_count
      FROM mentor_ratings mr
      INNER JOIN mentorship_sessions ms ON mr.session_id = ms.id
      WHERE LOWER(mr.mentor_email) = LOWER(?) 
        AND (ms.status = 'completed' OR (ms.scheduled_at IS NOT NULL AND ms.scheduled_at + (ms.duration_minutes || ' minutes')::interval <= NOW()))`,
      [email]
    );
    
    const calculatedRating = ratingRows?.[0] || {};
    const ratingAvg = parseFloat(calculatedRating.rating_avg || 0);
    const ratingCount = parseInt(calculatedRating.rating_count || 0, 10);

    if (rows && rows.length) {
      const mentor = rows[0];
      return res.json({
        mentor: {
          ...mentor,
          skills: (mentor.skills && String(mentor.skills).trim()) ? mentor.skills : registeredSkills,
          rating_avg: ratingAvg,
          rating_count: ratingCount
        }
      });
    }

    return res.json({
      mentor: {
        mentor_email: email,
        skills: registeredSkills,
        topics: '',
        availability: '',
        experience_years: 0,
        price: 0,
        subscription_price: 0,
        subscription_duration_days: 30,
        payment_upi_id: '',
        rating_avg: ratingAvg,
        rating_count: ratingCount,
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST upsert mentor profile
async function upsertMentorProfile(req, res) {
  try {
    const { email, skills, topics, availability, experience_years, price, subscription_price, subscription_duration_days, payment_upi_id } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const { rows: existing } = await dbQuery('SELECT * FROM mentors WHERE LOWER(mentor_email) = LOWER(?) LIMIT 1', [email]);
    if (existing && existing.length) {
      const { rows } = await dbQuery(
        'UPDATE mentors SET skills = ?, topics = ?, availability = ?, experience_years = ?, price = ?, subscription_price = ?, subscription_duration_days = ?, payment_upi_id = ?, updated_at = NOW() WHERE LOWER(mentor_email) = LOWER(?) RETURNING *',
        [
          skills || null,
          topics || null,
          availability || null,
          Number(experience_years) || 0,
          Number(price) || 0,
          Number(subscription_price) || 0,
          Math.max(1, Number(subscription_duration_days) || 30),
          payment_upi_id || null,
          email
        ]
      );
      return res.json({ mentor: rows[0] });
    }
    const { rows } = await dbQuery(
      'INSERT INTO mentors (mentor_email, skills, topics, availability, experience_years, price, subscription_price, subscription_duration_days, payment_upi_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
      [
        email,
        skills || null,
        topics || null,
        availability || null,
        Number(experience_years) || 0,
        Number(price) || 0,
        Number(subscription_price) || 0,
        Math.max(1, Number(subscription_duration_days) || 30),
        payment_upi_id || null
      ]
    );
    return res.status(201).json({ mentor: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST create mentorship request
async function createMentorshipRequest(req, res) {
  const { student_email, mentor_email, message } = req.body || {};
  if (!student_email || !mentor_email) return res.status(400).json({ error: 'student_email and mentor_email required' });
  if (student_email.toLowerCase() === mentor_email.toLowerCase()) return res.status(400).json({ error: 'Cannot request self' });
  try {
    const pair_key = buildPairKey(student_email, mentor_email);
    const { rows: existing } = await dbQuery('SELECT * FROM mentorship_requests WHERE pair_key = ? LIMIT 1', [pair_key]);
    if (existing && existing.length) {
      const r = existing[0];
      if (r.status === 'pending') return res.json({ request: r });
      if (r.status === 'accepted') return res.status(409).json({ error: 'Already accepted', request: r });
      const { rows } = await dbQuery(
        'UPDATE mentorship_requests SET student_email = ?, mentor_email = ?, status = \'pending\', message = ?, accepted_at = NULL, updated_at = NOW() WHERE id = ? RETURNING *',
        [student_email, mentor_email, message || null, r.id]
      );
      return res.status(201).json({ request: rows[0] });
    }
    const { rows } = await dbQuery(
      'INSERT INTO mentorship_requests (pair_key, student_email, mentor_email, status, message) VALUES (?, ?, ?, \'pending\', ?) RETURNING *',
      [pair_key, student_email, mentor_email, message || null]
    );
    return res.status(201).json({ request: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST respond to mentorship request
async function respondMentorshipRequest(req, res) {
  const { mentor_email, student_email, action } = req.body || {};
  if (!mentor_email || !student_email || !['accept', 'reject'].includes(String(action))) {
    return res.status(400).json({ error: 'mentor_email, student_email and action (accept|reject) required' });
  }
  try {
    const pair_key = buildPairKey(student_email, mentor_email);
    const { rows } = await dbQuery('SELECT * FROM mentorship_requests WHERE pair_key = ? LIMIT 1', [pair_key]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'No request found' });
    const reqRow = rows[0];
    if (reqRow.status !== 'pending') return res.status(400).json({ error: 'Request not pending' });
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { rows: updated } = await dbQuery(
      'UPDATE mentorship_requests SET status = ?, accepted_at = CASE WHEN ? = \'accepted\' THEN NOW() ELSE NULL END, updated_at = NOW() WHERE id = ? RETURNING *',
      [newStatus, newStatus, reqRow.id]
    );
    try {
      const connectionPair = buildPairKey(student_email, mentor_email);
      const { rows: connRows } = await dbQuery('SELECT * FROM connections WHERE pair_key = ? LIMIT 1', [connectionPair]);
      if (action === 'accept') {
        if (connRows && connRows.length) {
          await dbQuery("UPDATE connections SET status = 'accepted', accepted_at = NOW(), updated_at = NOW() WHERE id = ?", [connRows[0].id]);
        } else {
          await dbQuery("INSERT INTO connections (pair_key, requester_email, target_email, status, accepted_at) VALUES (?, ?, ?, 'accepted', NOW())", [connectionPair, student_email, mentor_email]);
        }
      } else {
        if (connRows && connRows.length) {
          await dbQuery("UPDATE connections SET status = 'rejected', updated_at = NOW() WHERE id = ?", [connRows[0].id]);
        }
      }
    } catch (connErr) {
      console.error('Connection upsert after mentorship respond failed:', connErr);
    }
    return res.json({ request: updated[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// GET list mentorship requests
async function getMentorshipRequests(req, res) {
  const { mentor_email, student_email, status } = req.query || {};
  if (!mentor_email && !student_email) return res.status(400).json({ error: 'mentor_email or student_email required' });
  try {
    let sql = 'SELECT * FROM mentorship_requests WHERE 1=1';
    const params = [];
    if (mentor_email) { sql += ' AND mentor_email = ?'; params.push(mentor_email); }
    if (student_email) { sql += ' AND student_email = ?'; params.push(student_email); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY updated_at DESC LIMIT 200';
    const { rows } = await dbQuery(sql, params);
    return res.json({ requests: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// GET admin mentorship payments
async function getAdminMentorshipPayments(req, res) {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { page = 1, limit = 50 } = req.query || {};
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const { rows: sessions } = await dbQuery(`
      SELECT * FROM (
        SELECT
          m.id,
          m.pair_key,
          m.student_email,
          m.mentor_email,
          stu.name AS student_name,
          alu.name AS mentor_name,
          m.status,
          m.amount,
          m.platform_fee,
          m.alumni_earnings,
          m.currency,
          m.payment_id,
          m.order_id,
          m.created_at,
          m.payout_status,
          'session'::text AS transaction_type,
          NULL::int AS duration_days,
          NULL::timestamptz AS start_at,
          NULL::timestamptz AS end_at
        FROM mentorship_sessions m
        LEFT JOIN users stu ON LOWER(stu.email) = LOWER(m.student_email)
        LEFT JOIN users alu ON LOWER(alu.email) = LOWER(m.mentor_email)
        WHERE m.status IN ('paid', 'scheduled', 'completed')

        UNION ALL

        SELECT
          s.id,
          s.pair_key,
          s.student_email,
          s.mentor_email,
          stu.name AS student_name,
          alu.name AS mentor_name,
          s.status,
          s.amount,
          s.platform_fee,
          s.alumni_earnings,
          s.currency,
          s.payment_id,
          s.order_id,
          s.created_at,
          COALESCE(s.payout_status, 'pending') AS payout_status,
          'subscription'::text AS transaction_type,
          s.duration_days,
          s.start_at,
          s.end_at
        FROM mentorship_subscriptions s
        LEFT JOIN users stu ON LOWER(stu.email) = LOWER(s.student_email)
        LEFT JOIN users alu ON LOWER(alu.email) = LOWER(s.mentor_email)
        WHERE s.status IN ('active', 'expired', 'cancelled')
      ) t
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [l, offset]);

    const { rows: totalRows } = await dbQuery(`
      SELECT (
        (SELECT COUNT(*) FROM mentorship_sessions WHERE status IN ('paid', 'scheduled', 'completed')) +
        (SELECT COUNT(*) FROM mentorship_subscriptions WHERE status IN ('active', 'expired', 'cancelled'))
      )::bigint as cnt
    `);
    const total = totalRows && totalRows[0] ? parseInt(totalRows[0].cnt, 10) : 0;

    const { rows: statsRows } = await dbQuery(`
      SELECT
        SUM(amount) as total_volume,
        SUM(platform_fee) as total_platform_fee
      FROM (
        SELECT amount, platform_fee
        FROM mentorship_sessions
        WHERE status IN ('paid', 'scheduled', 'completed')
        UNION ALL
        SELECT amount, platform_fee
        FROM mentorship_subscriptions
        WHERE status IN ('active', 'expired', 'cancelled')
      ) all_txn
    `);
    
    const stats = {
      total_volume: statsRows && statsRows[0] ? Number(statsRows[0].total_volume || 0) : 0,
      total_platform_fee: statsRows && statsRows[0] ? Number(statsRows[0].total_platform_fee || 0) : 0
    };

    return res.json({ sessions, page: p, limit: l, total, totalPages: Math.ceil(total / l), stats });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  getMentors,
  getMentorProfile,
  upsertMentorProfile,
  createMentorshipRequest,
  respondMentorshipRequest,
  getMentorshipRequests,
  getAdminMentorshipPayments
};
