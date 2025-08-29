const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const crypto = require('crypto');
// Use global fetch if available (Node >= 18); otherwise lazy-load node-fetch
const fetchFn = (global.fetch ? global.fetch : ((...args) => import('node-fetch').then(({default: f}) => f(...args))));
const fetch = (...args) => fetchFn(...args);

// Modularized DB schema creators
const { createMessagesSchema } = require('./database/messages');
const { createDonationsSchema } = require('./database/donations');

require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Auth0 Management API helpers
 * Never expose the Management token to the client. These helpers run server-side only.
 */
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const MGMT_CLIENT_ID = process.env.AUTH0_MGMT_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
const MGMT_CLIENT_SECRET = process.env.AUTH0_MGMT_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;

// Simple in-memory token cache to avoid hitting Auth0 on every request
let mgmtTokenCache = { token: null, expiresAt: 0 };

async function getManagementToken() {
  // Return cached token if valid for at least 60s more
  if (mgmtTokenCache.token && mgmtTokenCache.expiresAt - Date.now() > 60_000) {
    return mgmtTokenCache.token;
  }
  if (!AUTH0_DOMAIN || !MGMT_CLIENT_ID || !MGMT_CLIENT_SECRET) {
    throw new Error('Auth0 Management API credentials are not configured in .env');
  }
  const url = `https://${AUTH0_DOMAIN}/oauth/token`;
  const body = {
    client_id: MGMT_CLIENT_ID,
    client_secret: MGMT_CLIENT_SECRET,
    audience: `https://${AUTH0_DOMAIN}/api/v2/`,
  grant_type: 'client_credentials',
  // Ensure token has required scopes for user reads
  scope: process.env.AUTH0_MGMT_SCOPES || 'read:users read:users_app_metadata'
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Failed to get management token (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  const expiresInMs = (data.expires_in || 3600) * 1000;
  mgmtTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + expiresInMs
  };
  return data.access_token;
}

async function fetchAuth0User(auth0Id) {
  const token = await getManagementToken();
  const url = `https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Auth0 user fetch failed (${resp.status}): ${text}`);
  }
  return resp.json();
}

function upsertBasicUser({ auth0_id, email, name, picture }) {
  const sql = `
    INSERT INTO users (auth0_id, email, name, picture, user_type)
    VALUES (?, ?, ?, ?, COALESCE(?, 'alumni'))
    ON CONFLICT (auth0_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name),
      picture = COALESCE(EXCLUDED.picture, users.picture),
      user_type = COALESCE(EXCLUDED.user_type, users.user_type)
    RETURNING *
  `;
  return dbQuery(sql, [auth0_id, email || null, name || null, picture || null, deriveRole(email)])
    .then(r => r.rows && r.rows[0]);
}

// Simple role derivation using configured email lists
function deriveRole(email) {
  if (!email) return 'alumni';
  const e = String(email).toLowerCase().trim();
  const domain = e.split('@')[1] || '';
  const admins = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const studentDomains = (process.env.STUDENT_EMAIL_DOMAINS || 'pvppcoe.ac.in').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const students = (process.env.STUDENT_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (admins.includes(e)) return 'admin';
  if (studentDomains.includes(domain)) return 'student';
  if (students.includes(e)) return 'student';
  return 'alumni';
}

// MySQL connection (pool for resilience)
const useConnectionString = !!process.env.DATABASE_URL;
const db = useConnectionString
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mockapp_db',
      port: Number(process.env.DB_PORT) || 5432,
      ssl: /true|require/i.test(String(process.env.DB_SSL || 'false')) ? { rejectUnauthorized: false } : undefined,
    });

// Ensure DB session timezone is IST for all connections (affects SQL timezone-sensitive functions)
try {
  db.on('connect', (client) => {
    client.query("SET TIME ZONE 'Asia/Kolkata'").catch(() => {});
  });
} catch {}

async function dbQuery(text, params = []) {
  // Convert MySQL-style '?' placeholders to Postgres-style $1, $2 ...
  let idx = 0;
  const sql = text.replace(/\?/g, () => `$${++idx}`);
  const res = await db.query(sql, params);
  return res;
}

let lastDbStatus = 'unknown';
let lastDbError = null;
function checkDb(callback) {
  db.query('SELECT 1')
    .then(() => { lastDbStatus = 'connected'; lastDbError = null; callback && callback(true); })
    .catch((err) => { lastDbStatus = 'disconnected'; lastDbError = err.message; callback && callback(false); });
}

// Initial DB check and table initialization
checkDb((ok) => {
  if (ok) {
    console.log('Connected to Postgres database');
    initializeTables();
  } else {
    console.warn('Postgres not connected at startup. Will continue and serve limited features.');
    console.log('Please check your Postgres/Neon configuration in .env file');
    if (useConnectionString) {
      const redacted = (process.env.DATABASE_URL || '').replace(/:\\?[^:@/]+@/,'://***@');
      console.log('Using DATABASE_URL:', redacted);
    } else {
      console.log('Current config:', {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        database: process.env.DB_NAME || 'mockapp_db',
        port: process.env.DB_PORT || 5432,
        ssl: process.env.DB_SSL || 'false',
        passwordSet: !!process.env.DB_PASSWORD
      });
    }
  }
});

// Initialize database tables
async function initializeTables() {
  try {
    // users table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        auth0_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NULL,
        name VARCHAR(255),
        picture TEXT,
        bio TEXT,
        user_type VARCHAR(20) DEFAULT 'alumni',
        graduation_year INT,
        major VARCHAR(255),
        current_job VARCHAR(255),
        company VARCHAR(255),
        job_title VARCHAR(255),
        linkedin_url VARCHAR(500),
        github_url VARCHAR(500),
        website_url VARCHAR(500),
        location VARCHAR(255),
        skills TEXT,
        is_mentor BOOLEAN DEFAULT FALSE,
        registration_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await dbQuery('CREATE INDEX IF NOT EXISTS idx_auth0_id ON users(auth0_id)');
    await dbQuery('CREATE INDEX IF NOT EXISTS idx_email ON users(email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_user_type ON users(user_type)');
  // Initialize modularized schemas for messages and donations
  await createMessagesSchema(dbQuery);
  await createDonationsSchema(dbQuery);

  console.log('Tables are ready');
  } catch (e) {
    console.error('DB init error:', e.message);
  }
}

// Legacy MySQL-era migration helpers removed; schema is managed via modularized creators above.

// Auth0 JWT middleware
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
});

// Public routes (no authentication required)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Alumni Portal API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      public: ['/api/health'],
      protected: ['/api/protected', '/api/users', '/api/users/profile', '/api/data/:table']
    }
  });
});

app.get('/api/health', (req, res) => {
  checkDb(() => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: lastDbStatus,
      lastDbError,
      auth0: {
        domain: process.env.AUTH0_DOMAIN ? 'configured' : 'not configured',
        audience: process.env.AUTH0_AUDIENCE ? 'configured' : 'not configured'
      }
    });
  });
});

// Protected route example
app.get('/api/protected', checkJwt, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.auth });
});

// Store user info after login (example endpoint)
app.post('/api/users', checkJwt, (req, res) => {
  const { sub, email, name, picture } = req.body;
  if (!sub || !email) {
    return res.status(400).json({ error: 'Missing user info' });
  }
  const sql = `
    INSERT INTO users (auth0_id, email, name, picture)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (auth0_id)
    DO UPDATE SET email = EXCLUDED.email,
                  name = COALESCE(EXCLUDED.name, users.name),
                  picture = COALESCE(EXCLUDED.picture, users.picture)
    RETURNING *
  `;
  dbQuery(sql, [sub, email, name || null, picture || null])
    .then(r => res.json({ message: 'User stored/updated', user: r.rows[0] }))
    .catch(err => res.status(500).json({ error: 'Database error', details: err.message }));
});

// Get current user's profile (requires Auth0 JWT)
app.get('/api/users/profile', checkJwt, (req, res) => {
  try { console.log('Profile request auth:', req.auth); } catch {}
  const auth0Id = req.auth && req.auth.sub;
  const email = req.auth && req.auth["https://schemas.quickstart/email"] || req.auth && req.auth.email; // best-effort
  if (!auth0Id) return res.status(401).json({ error: 'Unauthorized' });

  dbQuery('SELECT * FROM users WHERE auth0_id = ? LIMIT 1', [auth0Id]).then(async ({ rows }) => {
    if (!rows) {
      console.error('DB error selecting user profile: no rows field');
      // If DB is down, still return a minimal profile so the app can proceed
      return res.status(200).json({
        user: {
          auth0_id: auth0Id,
          email: email || null,
          registration_completed: false,
        },
        warning: 'database_unavailable'
      });
    }

    // If not present locally, attempt to fetch from Auth0 Management API and seed the DB
  if (!rows || rows.length === 0) {
      try {
        const auth0User = await fetchAuth0User(auth0Id);
        let seeded = null;
        try {
          seeded = await upsertBasicUser({
            auth0_id: auth0Id,
            email: auth0User.email || email || null,
            name: auth0User.name || auth0User.nickname || null,
            picture: auth0User.picture || null,
          });
        } catch (dbErr) {
          console.warn('Upsert skipped due to DB error:', dbErr.message);
        }
        return res.status(200).json({ user: seeded || { auth0_id: auth0Id, email: auth0User.email || email || null, registration_completed: false } });
      } catch (e) {
        console.warn('Profile seed from Auth0 failed:', e.message);
        // Upsert minimal with derived role
        try {
          const seeded = await upsertBasicUser({ auth0_id: auth0Id, email: email || null, name: null, picture: null });
          return res.status(200).json({ user: seeded || { auth0_id: auth0Id, email: email || null, registration_completed: false } });
        } catch (_) {
          return res.status(200).json({
            user: {
              auth0_id: auth0Id,
              email: email || null,
              registration_completed: false,
              user_type: (email ? deriveRole(email) : 'alumni')
            }
          });
        }
      }
    }

    const u = rows[0];
    // Backfill role if missing
    if (!u.user_type && email) {
      const role = deriveRole(email);
      dbQuery('UPDATE users SET user_type = ? WHERE auth0_id = ?', [role, auth0Id]).catch(()=>{});
      u.user_type = role;
    } else if (email) {
      // Auto-correct role based on domain/email rules (don't downgrade admins)
      const expected = deriveRole(email);
      if (u.user_type !== expected && u.user_type !== 'admin') {
        dbQuery('UPDATE users SET user_type = ? WHERE auth0_id = ?', [expected, auth0Id]).catch(()=>{});
        u.user_type = expected;
      }
    }
    return res.json({ user: u });
  }).catch((err) => {
    console.error('DB error selecting user profile:', err.message);
    return res.status(200).json({ user: { auth0_id: auth0Id, email: email || null, registration_completed: false }, warning: 'database_unavailable' });
  });
});

// Centralized error handler for JWT errors to avoid 500s
app.use((err, req, res, next) => {
  if (err && err.name === 'UnauthorizedError') {
    console.warn('JWT unauthorized:', err.message);
    return res.status(401).json({ error: 'invalid_token', message: err.message });
  }
  return next(err);
});

// Create or update current user's profile
app.put('/api/users/profile', checkJwt, (req, res) => {
  const auth0Id = req.auth && req.auth.sub;
  const email = req.body.email || (req.auth && (req.auth["https://schemas.quickstart/email"] || req.auth.email));
  if (!auth0Id || !email) return res.status(400).json({ error: 'Missing auth0_id or email' });

  const {
    name,
    graduationYear,
    course,
    currentCompany,
    jobTitle,
    location,
    linkedIn,
    bio,
    skills,
    isOpenToMentoring
  } = req.body;

  const values = {
    auth0_id: auth0Id,
    email,
    name: name || null,
    graduation_year: graduationYear ? parseInt(graduationYear, 10) : null,
    major: course || null,
    current_job: jobTitle || null,
    company: currentCompany || null,
    job_title: jobTitle || null,
    location: location || null,
    linkedin_url: linkedIn || null,
    bio: bio || null,
    skills: Array.isArray(skills) ? skills.join(',') : (skills || null),
    is_mentor: !!isOpenToMentoring,
    registration_completed: true
  };

  const sql = `
    INSERT INTO users (auth0_id, email, name, graduation_year, major, current_job, company, job_title, location, linkedin_url, bio, skills, is_mentor, registration_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (auth0_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      graduation_year = EXCLUDED.graduation_year,
      major = EXCLUDED.major,
      current_job = EXCLUDED.current_job,
      company = EXCLUDED.company,
      job_title = EXCLUDED.job_title,
      location = EXCLUDED.location,
      linkedin_url = EXCLUDED.linkedin_url,
      bio = EXCLUDED.bio,
      skills = EXCLUDED.skills,
      is_mentor = EXCLUDED.is_mentor,
      registration_completed = EXCLUDED.registration_completed
  `;

  const params = [
    values.auth0_id,
    values.email,
    values.name,
    values.graduation_year,
    values.major,
    values.current_job,
    values.company,
    values.job_title,
    values.location,
    values.linkedin_url,
    values.bio,
    values.skills,
    values.is_mentor,
    values.registration_completed
  ];

  dbQuery(sql, params)
    .then(() => dbQuery('SELECT * FROM users WHERE auth0_id = ? LIMIT 1', [auth0Id]))
    .then(r => res.json({ message: 'Profile saved', user: r.rows && r.rows[0] }))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Manual sync: fetch the authenticated user's profile from Auth0 and upsert into local DB
app.post('/api/users/sync-self', checkJwt, async (req, res) => {
  try {
    const auth0Id = req.auth && req.auth.sub;
    if (!auth0Id) return res.status(401).json({ error: 'Unauthorized' });
    const auth0User = await fetchAuth0User(auth0Id);
    const seeded = await upsertBasicUser({
      auth0_id: auth0Id,
      email: auth0User.email || null,
      name: auth0User.name || auth0User.nickname || null,
      picture: auth0User.picture || null,
    });
    return res.json({ message: 'Synced from Auth0', user: seeded });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Donation endpoints
app.get('/api/donations', (req, res) => {
  const { page = 1, limit = 10, status, donor_email } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `SELECT donations.*, (donations.created_at AT TIME ZONE 'Asia/Kolkata') AS created_at_ist, (donations.updated_at AT TIME ZONE 'Asia/Kolkata') AS updated_at_ist FROM donations`;
  let countQuery = 'SELECT COUNT(*) as total FROM donations';
  let params = [];
  let countParams = [];
  
  const whereConditions = [];
  
  if (status) {
    whereConditions.push('transaction_status = ?');
    params.push(status);
    countParams.push(status);
  }
  
  if (donor_email) {
    whereConditions.push('donor_email = ?');
    params.push(donor_email);
    countParams.push(donor_email);
  }
  
  if (whereConditions.length > 0) {
    const whereClause = ' WHERE ' + whereConditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  // Get total count
  dbQuery(countQuery, countParams)
    .then(({ rows }) => {
      const total = rows && rows[0] ? Number(rows[0].total) : 0;
      return dbQuery(query, params).then(({ rows: results }) => ({ total, results }));
    })
    .then(({ total, results }) => {
      res.json({
        donations: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

app.post('/api/donations', (req, res) => {
  const {
    donor_name,
    donor_email,
    donor_phone,
    amount,
    currency = 'INR',
    payment_method,
    payment_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    transaction_status = 'pending',
    donation_type = 'one-time',
    cause_category,
    anonymous = false,
    message
  } = req.body;

  // Validation
  if (!donor_name || !donor_email || !amount || !payment_method) {
    return res.status(400).json({ 
      error: 'Missing required fields: donor_name, donor_email, amount, payment_method' 
    });
  }

  const query = `
    INSERT INTO donations (
      donor_name, donor_email, user_email, donor_phone, amount, currency, payment_method,
      payment_id, order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
      transaction_status, donation_type, cause_category, anonymous, message, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id, created_at
  `;

  const values = [
    donor_name, donor_email, donor_email, donor_phone, amount, currency, payment_method,
    payment_id, razorpay_order_id || payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
    transaction_status, donation_type, cause_category, anonymous, message, message
  ];

  dbQuery(query, values)
    .then(({ rows }) => {
      const row = rows && rows[0];
      res.status(201).json({
        id: row?.id,
        donor_name,
        donor_email,
        amount,
        transaction_status,
        created_at: row?.created_at || new Date().toISOString()
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

app.get('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  
  dbQuery(`SELECT donations.*, (donations.created_at AT TIME ZONE 'Asia/Kolkata') AS created_at_ist, (donations.updated_at AT TIME ZONE 'Asia/Kolkata') AS updated_at_ist FROM donations WHERE id = ?`, [id])
    .then(({ rows }) => {
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Donation not found' });
      res.json(rows[0]);
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

app.put('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Get current donation
  dbQuery('SELECT * FROM donations WHERE id = ?', [id]).then(({ rows }) => {
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    // Build update query
    const allowedFields = [
      'donor_name', 'donor_email', 'donor_phone', 'transaction_status',
      'razorpay_payment_id', 'razorpay_signature', 'receipt_sent', 'message'
    ];
    
    const updateFields = [];
    const values = [];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(id);
    const query = `UPDATE donations SET ${updateFields.join(', ')} WHERE id = ?`;
    dbQuery(query, values)
      .then(() => res.json({ message: 'Donation updated successfully' }))
      .catch(err => res.status(500).json({ error: err.message }));
  }).catch(err => res.status(500).json({ error: err.message }));
});

app.delete('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  
  dbQuery('DELETE FROM donations WHERE id = ?', [id])
    .then(({ rowCount }) => {
      if (!rowCount) return res.status(404).json({ error: 'Donation not found' });
      res.json({ message: 'Donation deleted successfully' });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

// Analytics endpoint
app.get('/api/donations/analytics/summary', (req, res) => {
  const queries = {
    totalAmount: "SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE transaction_status = 'completed'",
    totalDonations: "SELECT COUNT(*) as count FROM donations WHERE transaction_status = 'completed'",
    monthlyAmount: `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM donations 
      WHERE transaction_status = 'completed' 
      AND created_at >= NOW() - INTERVAL '1 month'
    `,
    monthlyDonations: `
      SELECT COUNT(*) as count 
      FROM donations 
      WHERE transaction_status = 'completed' 
      AND created_at >= NOW() - INTERVAL '1 month'
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    dbQuery(query)
      .then(({ rows }) => { results[key] = rows[0]; completed++; if (completed === totalQueries) {
        res.json({
          totalDonationAmount: Number(results.totalAmount.total || 0),
          totalDonations: Number(results.totalDonations.count || 0),
          monthlyDonationAmount: Number(results.monthlyAmount.total || 0),
          monthlyDonations: Number(results.monthlyDonations.count || 0)
        });
      }})
      .catch(err => res.status(500).json({ error: err.message }));
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
}); 

/**
 * Messaging with AES-256-GCM encryption at rest
 */

// Derive a 32-byte key from ENCRYPTION_KEY env (use SHA-256 of provided string)
function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_KEY || 'dev-secret-change-me';
  return crypto.createHash('sha256').update(secret).digest(); // 32 bytes
}

function buildThreadKey(a, b) {
  const [x, y] = [String(a).toLowerCase().trim(), String(b).toLowerCase().trim()].sort();
  return `${x}|${y}`;
}

function encryptText(plainText) {
  const iv = crypto.randomBytes(12); // GCM recommended iv length
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, tag, encrypted };
}

function decryptText(iv, tag, encryptedBuffer) {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted.toString('utf8');
}

// Normalize possible pg BYTEA representations to Buffer (handles Buffer or "\\x..." hex string)
function toBuffer(val) {
  if (Buffer.isBuffer(val)) return val;
  if (typeof val === 'string') {
    // pg should return Buffer for bytea, but be defensive
    if (val.startsWith('\\x')) {
      try { return Buffer.from(val.slice(2), 'hex'); } catch { return Buffer.from(val); }
    }
    return Buffer.from(val);
  }
  return Buffer.from([]);
}

// Create/send a message
app.post('/api/messages', async (req, res) => {
  const { sender_email, receiver_email, content } = req.body || {};
  if (!sender_email || !receiver_email || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'sender_email, receiver_email and non-empty content are required' });
  }

  try {
    const thread_key = buildThreadKey(sender_email, receiver_email);
    const { iv, tag, encrypted } = encryptText(content);
    const sql = `
      INSERT INTO messages (thread_key, sender_email, receiver_email, iv, auth_tag, ciphertext)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id, created_at
    `;
    const { rows } = await dbQuery(sql, [thread_key, sender_email, receiver_email, iv, tag, encrypted]);
    const row = rows && rows[0];
    return res.status(201).json({ id: row?.id, thread_key, created_at: row?.created_at });
  } catch (e) {
    console.error('DB/Encryption error inserting message:', e.message);
    return res.status(500).json({ error: 'Failed to send message', details: e.message });
  }
});

// Get messages in a conversation between user and with (optionally mark as read for receiver)
app.get('/api/messages', async (req, res) => {
  const { user, with: other, limit = 100, markRead } = req.query || {};
  if (!user || !other) {
    return res.status(400).json({ error: 'Query params user and with are required' });
  }
  const thread_key = buildThreadKey(user, other);
  try {
  const { rows } = await dbQuery('SELECT * FROM messages WHERE thread_key = ? ORDER BY created_at ASC LIMIT ?', [thread_key, Number(limit)]);

    // Optionally mark messages addressed to the requester as read (fire-and-forget)
    if (markRead === '1' || markRead === 'true') {
      dbQuery('UPDATE messages SET read_at = NOW() WHERE thread_key = ? AND receiver_email = ? AND read_at IS NULL', [thread_key, user]).catch(() => {});
    }

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
      return {
        id: r.id,
        sender_email: r.sender_email,
        receiver_email: r.receiver_email,
        content,
        created_at: r.created_at,
        read_at: r.read_at,
      };
    });

    return res.json({ thread_key, messages });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get threads list for a user (latest message per thread)
app.get('/api/messages/threads', async (req, res) => {
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
        // First (newest) row for this thread
        let content = '';
        try {
          const iv = toBuffer(r.iv);
          const tag = toBuffer(r.auth_tag);
          const cipher = toBuffer(r.ciphertext);
          content = decryptText(iv, tag, cipher);
        } catch (e) {
          content = '[Unable to decrypt message]';
        }
        // Determine the other participant
        const other = r.sender_email.toLowerCase() === String(user).toLowerCase() ? r.receiver_email : r.sender_email;
        map.set(r.thread_key, {
          thread_key: r.thread_key,
          other,
          last_message: content,
          last_at: r.created_at,
          unread: 0,
        });
      }
    }

    // Compute unread counts
    for (const r of rows || []) {
      if (!r.read_at && r.receiver_email.toLowerCase() === String(user).toLowerCase()) {
        const t = map.get(r.thread_key);
        if (t) t.unread += 1;
      }
    }

    return res.json({ threads: Array.from(map.values()) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});