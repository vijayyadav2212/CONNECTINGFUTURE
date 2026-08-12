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

    // Fetch mentors from mentors table
    const { rows: mentorsList } = await dbQuery(`SELECT mentor_email AS mentor_email, skills, topics, availability, experience_years, price, subscription_price, subscription_duration_days, rating_avg, rating_count FROM mentors`);
    
    // Fetch alumni users who are marked as mentors or are alumni
    const { rows: userMentors } = await dbQuery(`
      SELECT email AS mentor_email, name, company, job_title, skills, bio, is_mentor, user_type
      FROM users 
      WHERE (is_mentor = true OR LOWER(user_type) = 'alumni')
        AND (LOWER(approval_status) = 'approved' OR approval_status IS NULL)
    `);

    const mentorMap = new Map();

    // First populate from users
    (userMentors || []).forEach(u => {
      if (!u.mentor_email) return;
      const key = u.mentor_email.toLowerCase();
      mentorMap.set(key, {
        mentor_email: u.mentor_email,
        skills: u.skills || 'Mentorship, Career Advice',
        topics: u.job_title ? `${u.job_title}${u.company ? ` at ${u.company}` : ''}` : 'Career Guidance',
        availability: 'Available for Sessions',
        experience_years: 3,
        price: 0,
        subscription_price: 0,
        subscription_duration_days: 30,
        rating_avg: 5.0,
        rating_count: 1
      });
    });

    // Then overwrite/enrich with specific mentor settings if present in mentors table
    (mentorsList || []).forEach(m => {
      if (!m.mentor_email) return;
      const key = m.mentor_email.toLowerCase();
      const existing = mentorMap.get(key) || {};
      mentorMap.set(key, {
        ...existing,
        ...m,
        mentor_email: m.mentor_email || existing.mentor_email,
      });
    });

    let combined = Array.from(mentorMap.values());

    // Apply filtering
    if (q) {
      const queryStr = String(q).toLowerCase();
      combined = combined.filter(m => 
        (m.mentor_email && m.mentor_email.toLowerCase().includes(queryStr)) ||
        (m.skills && String(m.skills).toLowerCase().includes(queryStr)) ||
        (m.topics && String(m.topics).toLowerCase().includes(queryStr))
      );
    }
    if (min_experience) {
      combined = combined.filter(m => Number(m.experience_years || 0) >= Number(min_experience));
    }
    if (max_price) {
      combined = combined.filter(m => Number(m.price || 0) <= Number(max_price));
    }
    if (min_rating) {
      combined = combined.filter(m => Number(m.rating_avg || 0) >= Number(min_rating));
    }

    const paginated = combined.slice(offset, offset + l);

    return res.json({ mentors: paginated, total: combined.length, page: p, limit: l });
  } catch (e) {
    console.error('Error getting mentors:', e.message);
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
    if (mentor_email) { sql += ' AND LOWER(mentor_email) = LOWER(?)'; params.push(mentor_email); }
    if (student_email) { sql += ' AND LOWER(student_email) = LOWER(?)'; params.push(student_email); }
    if (status) { sql += ' AND LOWER(status) = LOWER(?)'; params.push(status); }
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

// GET daily sessions
async function getDailySessions(req, res) {
  try {
    const { mentor_email, student_email, active_only } = req.query || {};
    let sql = 'SELECT * FROM mentor_daily_sessions WHERE 1=1';
    const params = [];
    if (mentor_email) {
      sql += ' AND LOWER(mentor_email) = LOWER(?)';
      params.push(mentor_email);
    }
    if (active_only) {
      sql += ' AND is_active = true AND end_date >= CURRENT_DATE';
    }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const { rows } = await dbQuery(sql, params);
    return res.json({ daily_sessions: rows || [] });
  } catch (e) {
    console.error('Error in getDailySessions:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// POST create daily session
async function createDailySession(req, res) {
  try {
    const {
      mentor_email, title, description, daily_time, timezone, start_date, end_date, duration_minutes, meeting_link, max_mentees
    } = req.body || {};
    if (!mentor_email || !title || !start_date || !end_date || !daily_time) {
      return res.status(400).json({ error: 'mentor_email, title, start_date, end_date and daily_time are required' });
    }
    const { rows } = await dbQuery(
      `INSERT INTO mentor_daily_sessions 
       (mentor_email, title, description, daily_time, timezone, start_date, end_date, duration_minutes, meeting_link, max_mentees, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true) RETURNING *`,
      [
        mentor_email,
        title,
        description || null,
        daily_time,
        timezone || 'Asia/Kolkata',
        start_date,
        end_date,
        Number(duration_minutes) || 60,
        meeting_link || null,
        Number(max_mentees) || 50
      ]
    );
    return res.status(201).json({ daily_session: rows[0] });
  } catch (e) {
    console.error('Error in createDailySession:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// DELETE deactivate daily session
async function deactivateDailySession(req, res) {
  try {
    const { id } = req.params;
    const { mentor_email } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    let sql = 'UPDATE mentor_daily_sessions SET is_active = false, updated_at = NOW() WHERE id = ?';
    const params = [id];
    if (mentor_email) {
      sql += ' AND LOWER(mentor_email) = LOWER(?)';
      params.push(mentor_email);
    }
    sql += ' RETURNING *';
    const { rows } = await dbQuery(sql, params);
    return res.json({ daily_session: rows && rows[0] ? rows[0] : null });
  } catch (e) {
    console.error('Error in deactivateDailySession:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// GET mentorship sessions
async function getMentorshipSessions(req, res) {
  try {
    const { mentor_email, student_email, role, status } = req.query || {};
    if (!mentor_email && !student_email) {
      return res.status(400).json({ error: 'mentor_email or student_email required' });
    }
    let sql = 'SELECT * FROM mentorship_sessions WHERE 1=1';
    const params = [];
    if (mentor_email) {
      sql += ' AND LOWER(mentor_email) = LOWER(?)';
      params.push(mentor_email);
    }
    if (student_email) {
      sql += ' AND LOWER(student_email) = LOWER(?)';
      params.push(student_email);
    }
    if (status) {
      sql += ' AND LOWER(status) = LOWER(?)';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT 200';
    const { rows } = await dbQuery(sql, params);
    return res.json({ sessions: rows || [] });
  } catch (e) {
    console.error('Error in getMentorshipSessions:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// POST schedule session
async function scheduleMentorshipSession(req, res) {
  try {
    const { session_id, scheduled_at, duration_minutes, meeting_link } = req.body || {};
    if (!session_id || !scheduled_at) {
      return res.status(400).json({ error: 'session_id and scheduled_at required' });
    }
    const { rows } = await dbQuery(
      `UPDATE mentorship_sessions 
       SET scheduled_at = ?, duration_minutes = COALESCE(?, duration_minutes), meeting_link = COALESCE(?, meeting_link), status = 'scheduled', updated_at = NOW() 
       WHERE id = ? RETURNING *`,
      [scheduled_at, duration_minutes || null, meeting_link || null, session_id]
    );
    return res.json({ session: rows && rows[0] ? rows[0] : null });
  } catch (e) {
    console.error('Error in scheduleMentorshipSession:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// POST purchase session
async function purchaseMentorshipSession(req, res) {
  try {
    const { student_email, mentor_email, amount, currency, payment_id, order_id } = req.body || {};
    if (!student_email || !mentor_email) {
      return res.status(400).json({ error: 'student_email and mentor_email required' });
    }
    const pair_key = buildPairKey(student_email, mentor_email);
    const numAmount = Number(amount || 0);
    const platform_fee = Number((numAmount * 0.1).toFixed(2));
    const alumni_earnings = Number((numAmount - platform_fee).toFixed(2));
    const { rows } = await dbQuery(
      `INSERT INTO mentorship_sessions 
       (pair_key, student_email, mentor_email, status, amount, currency, payment_id, order_id, platform_fee, alumni_earnings)
       VALUES (?, ?, ?, 'paid', ?, ?, ?, ?, ?, ?) RETURNING *`,
      [pair_key, student_email, mentor_email, numAmount, currency || 'INR', payment_id || null, order_id || null, platform_fee, alumni_earnings]
    );
    return res.status(201).json({ session: rows[0] });
  } catch (e) {
    console.error('Error in purchaseMentorshipSession:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// GET mentorship subscriptions
async function getMentorshipSubscriptions(req, res) {
  try {
    const { student_email, mentor_email } = req.query || {};
    if (!student_email && !mentor_email) {
      return res.status(400).json({ error: 'student_email or mentor_email required' });
    }
    let sql = 'SELECT * FROM mentorship_subscriptions WHERE 1=1';
    const params = [];
    if (student_email) { sql += ' AND LOWER(student_email) = LOWER(?)'; params.push(student_email); }
    if (mentor_email) { sql += ' AND LOWER(mentor_email) = LOWER(?)'; params.push(mentor_email); }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const { rows } = await dbQuery(sql, params);
    return res.json({ subscriptions: rows || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST purchase subscription
async function purchaseMentorshipSubscription(req, res) {
  try {
    const { student_email, mentor_email, amount, currency, duration_days, payment_id, order_id } = req.body || {};
    if (!student_email || !mentor_email) return res.status(400).json({ error: 'student_email and mentor_email required' });
    const pair_key = buildPairKey(student_email, mentor_email);
    const numAmount = Number(amount || 0);
    const days = Math.max(1, Number(duration_days) || 30);
    const platform_fee = Number((numAmount * 0.1).toFixed(2));
    const alumni_earnings = Number((numAmount - platform_fee).toFixed(2));
    const start_at = new Date();
    const end_at = new Date(start_at.getTime() + days * 24 * 60 * 60 * 1000);
    const { rows } = await dbQuery(
      `INSERT INTO mentorship_subscriptions
       (pair_key, student_email, mentor_email, status, amount, currency, duration_days, start_at, end_at, payment_id, order_id, platform_fee, alumni_earnings)
       VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      [pair_key, student_email, mentor_email, numAmount, currency || 'INR', days, start_at, end_at, payment_id || null, order_id || null, platform_fee, alumni_earnings]
    );
    return res.status(201).json({ subscription: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST rating
async function createMentorshipRating(req, res) {
  try {
    const { session_id, student_email, mentor_email, rating, feedback } = req.body || {};
    if (!session_id || !rating) return res.status(400).json({ error: 'session_id and rating required' });
    const numRating = Math.max(1, Math.min(5, Number(rating)));
    const { rows } = await dbQuery(
      `INSERT INTO mentor_ratings (session_id, student_email, mentor_email, rating, feedback)
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
      [session_id, student_email || null, mentor_email || null, numRating, feedback || null]
    );
    return res.status(201).json({ rating: rows[0] });
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
  getAdminMentorshipPayments,
  getDailySessions,
  createDailySession,
  deactivateDailySession,
  getMentorshipSessions,
  scheduleMentorshipSession,
  purchaseMentorshipSession,
  getMentorshipSubscriptions,
  purchaseMentorshipSubscription,
  createMentorshipRating,
};
