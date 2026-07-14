const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbQuery } = require('../config/db');
const { sendAlumniUnderReviewEmail, readAlumniAutoApproveSetting } = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-connecting-future-key-change-me-in-production';
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || 'supersecret-connecting-future-refresh-key-change-me';

async function register(req, res) {
  try {
    const { email, password, name, graduation_year, major } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailLower = String(email).trim().toLowerCase();

    // Check if email already exists
    const { rows: existing } = await dbQuery('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [emailLower]);
    if (existing && existing.length) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Enforce role based on email domain
    const user_type = emailLower.endsWith('@pvppcoe.ac.in') ? 'student' : 'alumni';

    // Check auto-approve setting for alumni
    let shouldAutoApproveAlumni = false;
    if (user_type === 'alumni') {
      try {
        shouldAutoApproveAlumni = await readAlumniAutoApproveSetting();
      } catch (settingErr) {
        console.warn('Failed to read alumni auto-approve setting:', settingErr.message);
      }
    }
    const approval_status = user_type === 'student' ? 'approved' : (shouldAutoApproveAlumni ? 'approved' : 'pending');

    // Insert user
    const subId = `local|${Date.now()}`;
    const { rows } = await dbQuery(`
      INSERT INTO users (auth0_id, email, password_hash, name, user_type, graduation_year, major, registration_completed, approval_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, ?)
      RETURNING *
    `, [
      subId,
      emailLower,
      passwordHash,
      name || null,
      user_type,
      graduation_year ? Number(graduation_year) : null,
      major || null,
      approval_status
    ]);

    const user = rows[0];

    // Trigger review email asynchronously for alumni
    if (user_type === 'alumni') {
      sendAlumniUnderReviewEmail({ to: user.email, name: user.name }).catch((err) => {
        console.warn('Failed to send registration under-review email:', err.message);
      });
    }

    // Generate JWT and Refresh Token only if approved
    let token = null;
    let refreshToken = null;
    if (approval_status === 'approved') {
      token = jwt.sign(
        {
          sub: user.auth0_id,
          email: user.email,
          'https://schemas.quickstart/email': user.email,
          user_type: user.user_type,
          registration_completed: false
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      refreshToken = jwt.sign(
        { sub: user.auth0_id },
        REFRESH_JWT_SECRET,
        { expiresIn: '7d' }
      );

      await dbQuery('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);
    }

    return res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        registration_completed: false,
        approval_status: user.approval_status
      }
    });
  } catch (e) {
    console.error('Registration failed:', e);
    return res.status(500).json({ error: e.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailLower = String(email).trim().toLowerCase();

    // Check for hardcoded admin credentials
    if (emailLower === 'admin@pvppcoe.ac.in' && password === 'admin123') {
      const adminToken = jwt.sign(
        {
          sub: 'local|admin',
          email: 'admin@pvppcoe.ac.in',
          'https://schemas.quickstart/email': 'admin@pvppcoe.ac.in',
          user_type: 'admin',
          registration_completed: true
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        token: adminToken,
        user: {
          id: 0,
          email: 'admin@pvppcoe.ac.in',
          name: 'System Admin',
          user_type: 'admin',
          registration_completed: true
        }
      });
    }

    // Fetch user
    const { rows } = await dbQuery('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [emailLower]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ error: 'This user was registered via third party. Please log in using Auth0 or set a password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block login for unapproved alumni accounts
    if (user.user_type === 'alumni' && user.approval_status !== 'approved') {
      if (user.approval_status === 'rejected') {
        return res.status(403).json({
          error: `Your account has been rejected by the administrator.${user.approval_reason ? ' Reason: ' + user.approval_reason : ''}`
        });
      } else {
        return res.status(403).json({
          error: 'Your account is pending administrator approval. You will receive an email once approved.'
        });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      {
        sub: user.auth0_id,
        email: user.email,
        'https://schemas.quickstart/email': user.email,
        user_type: user.user_type,
        registration_completed: user.registration_completed
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { sub: user.auth0_id },
      REFRESH_JWT_SECRET,
      { expiresIn: '7d' }
    );

    await dbQuery('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        registration_completed: user.registration_completed,
        approval_status: user.approval_status
      }
    });
  } catch (e) {
    console.error('Login failed:', e);
    return res.status(500).json({ error: e.message });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const auth0Id = decoded.sub;

    const { rows } = await dbQuery('SELECT * FROM users WHERE auth0_id = ? AND refresh_token = ? LIMIT 1', [auth0Id, refreshToken]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token or session revoked' });
    }

    const user = rows[0];

    const token = jwt.sign(
      {
        sub: user.auth0_id,
        email: user.email,
        'https://schemas.quickstart/email': user.email,
        user_type: user.user_type,
        registration_completed: user.registration_completed
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { sub: user.auth0_id },
      REFRESH_JWT_SECRET,
      { expiresIn: '7d' }
    );

    await dbQuery('UPDATE users SET refresh_token = ? WHERE id = ?', [newRefreshToken, user.id]);

    return res.json({
      token,
      refreshToken: newRefreshToken
    });
  } catch (e) {
    console.error('Refresh token request failed:', e);
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  register,
  login,
  refresh
};
