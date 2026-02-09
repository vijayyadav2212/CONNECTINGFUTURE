
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const crypto = require('crypto');
// Use global fetch if available (Node >= 18); otherwise lazy-load node-fetch
const fetchFn = (global.fetch ? global.fetch : ((...args) => import('node-fetch').then(({ default: f }) => f(...args))));
const fetch = (...args) => fetchFn(...args);

// Modularized DB schema creators
const { createMessagesSchema } = require('./database/messages');
const { createDonationsSchema } = require('./database/donations');
const { createRoadmapsSchema } = require('./database/roadmaps');
const { createConnectionsSchema } = require('./database/connections');
const { createMemoriesSchema } = require('./database/memories');
const { createJobsSchema } = require('./database/jobs');
const { createApplicationsSchema } = require('./database/applications');
const { createMentorshipSchema } = require('./database/mentorship');
const { createAcademicProgressSchema } = require('./database/academicProgress');

dotenv.config({ path: __dirname + '/.env' });

const app = express();
app.use(cors());
app.use(express.json());
// Serve uploaded files statically
const uploadsRoot = path.join(__dirname, 'uploads');
const resumesDir = path.join(uploadsRoot, 'resumes');
const memoriesDir = path.join(uploadsRoot, 'memories');
try {
  if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);
  if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir);
  if (!fs.existsSync(memoriesDir)) fs.mkdirSync(memoriesDir);
} catch { }
app.use('/uploads', express.static(uploadsRoot));

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
    client.query("SET TIME ZONE 'Asia/Kolkata'").catch(() => { });
  });
} catch { }

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
      const redacted = (process.env.DATABASE_URL || '').replace(/:\\?[^:@/]+@/, '://***@');
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
        phone VARCHAR(20),
        university VARCHAR(255),
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

    // Schema migration: ensure new columns exist even if table was already created
    try {
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(255)');
    } catch (e) { console.log('User schema migration note:', e.message); }

    await dbQuery('CREATE INDEX IF NOT EXISTS idx_auth0_id ON users(auth0_id)');
    await dbQuery('CREATE INDEX IF NOT EXISTS idx_email ON users(email)');
    await dbQuery('CREATE INDEX IF NOT EXISTS idx_user_type ON users(user_type)');
    // Initialize modularized schemas 
    await createMessagesSchema(dbQuery);
    await createDonationsSchema(dbQuery);
    await createRoadmapsSchema(dbQuery);
    await createConnectionsSchema(dbQuery);
    await createMentorshipSchema(dbQuery);
    await createAcademicProgressSchema(dbQuery);
    await createMemoriesSchema(dbQuery);

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

// 3. API Routes

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

// --- File Uploads (Resume) ---
const allowedResumeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, resumesDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]+/gi, '_');
      const fname = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}${ext}`;
      cb(null, fname);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (allowedResumeTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

app.post('/api/uploads/resume', upload.single('resume'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Resume file is required' });
    const url = `${req.protocol}://${req.get('host')}/uploads/resumes/${req.file.filename}`;
    return res.json({ url, filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
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
  try { console.log('Profile request auth:', req.auth); } catch { }
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
      dbQuery('UPDATE users SET user_type = ? WHERE auth0_id = ?', [role, auth0Id]).catch(() => { });
      u.user_type = role;
    } else if (email) {
      // Auto-correct role based on domain/email rules (don't downgrade admins)
      const expected = deriveRole(email);
      if (u.user_type !== expected && u.user_type !== 'admin') {
        dbQuery('UPDATE users SET user_type = ? WHERE auth0_id = ?', [expected, auth0Id]).catch(() => { });
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
    phone,
    university,
    graduationYear,
    course,
    currentCompany,
    jobTitle,
    location,
    linkedIn,
    gitHub,
    portfolio,
    bio,
    skills,
    isOpenToMentoring,
    picture // Add picture to destructuring
  } = req.body;

  const values = {
    auth0_id: auth0Id,
    email,
    name: name || null,
    phone: phone || null,
    university: university || null,
    graduation_year: graduationYear ? parseInt(graduationYear, 10) : null,
    major: course || null,
    current_job: jobTitle || null,
    company: currentCompany || null,
    job_title: jobTitle || null,
    location: location || null,
    linkedin_url: linkedIn || null,
    github_url: gitHub || null,
    website_url: portfolio || null,
    bio: bio || null,
    skills: Array.isArray(skills) ? skills.join(',') : (skills || null),
    is_mentor: !!isOpenToMentoring,
    picture: picture || null,
    registration_completed: true
  };

  const sql = `
    INSERT INTO users (auth0_id, email, name, phone, university, graduation_year, major, current_job, company, job_title, location, linkedin_url, github_url, website_url, bio, skills, is_mentor, picture, registration_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (auth0_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      university = EXCLUDED.university,
      graduation_year = EXCLUDED.graduation_year,
      major = EXCLUDED.major,
      current_job = EXCLUDED.current_job,
      company = EXCLUDED.company,
      job_title = EXCLUDED.job_title,
      location = EXCLUDED.location,
      linkedin_url = EXCLUDED.linkedin_url,
      github_url = EXCLUDED.github_url,
      website_url = EXCLUDED.website_url,
      bio = EXCLUDED.bio,
      skills = EXCLUDED.skills,
      is_mentor = EXCLUDED.is_mentor,
      picture = COALESCE(EXCLUDED.picture, users.picture),
      registration_completed = EXCLUDED.registration_completed
  `;

  const params = [
    values.auth0_id,
    values.email,
    values.name,
    values.phone,
    values.university,
    values.graduation_year,
    values.major,
    values.current_job,
    values.company,
    values.job_title,
    values.location,
    values.linkedin_url,
    values.github_url,
    values.website_url,
    values.bio,
    values.skills,
    values.is_mentor,
    values.picture,
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

// --- ACADEMIC PROGRESS ROUTES ---

// Compose academic progress response for a user
async function buildAcademicProgressResponse(auth0Id) {
  const { rows: semRows } = await dbQuery(
    'SELECT semester_key, name, gpa, total_credits, is_current FROM academic_semesters WHERE student_auth0_id = ? ORDER BY created_at DESC',
    [auth0Id]
  );
  const { rows: courseRows } = await dbQuery(
    'SELECT semester_key, course_key, name, code, credits, grade, status, progress FROM academic_courses WHERE student_auth0_id = ?',
    [auth0Id]
  );

  const courseBySemester = new Map();
  for (const c of (courseRows || [])) {
    const arr = courseBySemester.get(c.semester_key) || [];
    arr.push({
      id: c.course_key,
      name: c.name,
      code: c.code,
      credits: Number(c.credits || 0),
      grade: c.grade || '',
      status: c.status || 'upcoming',
      progress: Number(c.progress || 0),
    });
    courseBySemester.set(c.semester_key, arr);
  }

  const semesters = (semRows || []).map((s) => ({
    id: s.semester_key,
    name: s.name,
    gpa: Number(s.gpa || 0),
    totalCredits: Number(s.total_credits || 0),
    courses: courseBySemester.get(s.semester_key) || [],
    is_current: !!s.is_current,
  }));

  // Compute overall stats
  const allCourses = (courseRows || []).map((c) => ({ credits: Number(c.credits || 0), status: c.status || 'upcoming' }));
  const totalCredits = allCourses.reduce((sum, c) => sum + c.credits, 0);
  const creditsCompleted = allCourses.filter((c) => c.status === 'completed').reduce((sum, c) => sum + c.credits, 0);
  const gpaValues = (semRows || []).map((s) => Number(s.gpa || 0)).filter((v) => Number.isFinite(v));
  const gpa = gpaValues.length ? Number((gpaValues.reduce((a, b) => a + b, 0) / gpaValues.length).toFixed(2)) : 0;
  const completionRate = totalCredits > 0 ? Number(((creditsCompleted / totalCredits) * 100).toFixed(1)) : 0;
  const current = semesters.find((s) => s.is_current);
  const overallStats = {
    gpa,
    creditsCompleted,
    totalCredits,
    completionRate,
    currentSemesterLabel: current ? current.name : null,
  };

  return { overallStats, semesters };
}

// Get current user's academic progress
app.get('/api/academic-progress/me', checkJwt, async (req, res) => {
  try {
    const auth0Id = req.auth && req.auth.sub;
    if (!auth0Id) return res.status(401).json({ error: 'Unauthorized' });
    const payload = await buildAcademicProgressResponse(auth0Id);
    return res.json(payload);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Replace current user's academic progress with provided semesters/courses
app.put('/api/academic-progress/me', checkJwt, async (req, res) => {
  const auth0Id = req.auth && req.auth.sub;
  if (!auth0Id) return res.status(401).json({ error: 'Unauthorized' });
  const semesters = Array.isArray(req.body && req.body.semesters) ? req.body.semesters : [];
  try {
    await dbQuery('BEGIN');
    // Clear existing
    await dbQuery('DELETE FROM academic_courses WHERE student_auth0_id = ?', [auth0Id]);
    await dbQuery('DELETE FROM academic_semesters WHERE student_auth0_id = ?', [auth0Id]);

    for (const s of semesters) {
      const semester_key = String(s.id || s.name || `sem-${Date.now()}`);
      const name = String(s.name || semester_key);
      const gpa = Number(s.gpa || 0);
      const totalCredits = Number(s.totalCredits || 0);
      const isCurrent = s.id === 'current' ? true : false;
      await dbQuery(
        'INSERT INTO academic_semesters (student_auth0_id, semester_key, name, gpa, total_credits, is_current) VALUES (?, ?, ?, ?, ?, ?)',
        [auth0Id, semester_key, name, gpa, totalCredits, isCurrent]
      );

      const courses = Array.isArray(s.courses) ? s.courses : [];
      for (const c of courses) {
        const course_key = String(c.id || `${semester_key}-${Date.now()}`);
        await dbQuery(
          'INSERT INTO academic_courses (student_auth0_id, semester_key, course_key, name, code, credits, grade, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            auth0Id,
            semester_key,
            course_key,
            String(c.name || ''),
            c.code || null,
            Number(c.credits || 0),
            c.grade || null,
            String(c.status || 'upcoming'),
            Number(c.progress || 0),
          ]
        );
      }
    }

    await dbQuery('COMMIT');
    const payload = await buildAcademicProgressResponse(auth0Id);
    return res.json(payload);
  } catch (e) {
    try { await dbQuery('ROLLBACK'); } catch { }
    return res.status(500).json({ error: e.message });
  }
});

// --- DONATIONS ROUTES ---

app.get('/api/donations', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, donor_email } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const lim = Math.max(1, parseInt(limit));
    const offset = (pageNum - 1) * lim;
    const conditions = [];
    const params = [];
    const countParams = [];
    if (status) { conditions.push('transaction_status = ?'); params.push(status); countParams.push(status); }
    if (donor_email) { conditions.push('donor_email = ?'); params.push(donor_email); countParams.push(donor_email); }
    let baseQuery = "SELECT donations.*, (donations.created_at AT TIME ZONE 'Asia/Kolkata') AS created_at_ist, (donations.updated_at AT TIME ZONE 'Asia/Kolkata') AS updated_at_ist FROM donations";
    let countQuery = 'SELECT COUNT(*) as total FROM donations';
    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const query = baseQuery + ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(lim, offset);
    const countRes = await dbQuery(countQuery, countParams);
    const total = countRes.rows && countRes.rows[0] ? Number(countRes.rows[0].total) : 0;
    const listRes = await dbQuery(query, params);
    return res.json({
      donations: listRes.rows,
      pagination: { page: pageNum, limit: lim, total, totalPages: Math.ceil(total / lim) }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
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
      .then(({ rows }) => {
        results[key] = rows[0]; completed++; if (completed === totalQueries) {
          res.json({
            totalDonationAmount: Number(results.totalAmount.total || 0),
            totalDonations: Number(results.totalDonations.count || 0),
            monthlyDonationAmount: Number(results.monthlyAmount.total || 0),
            monthlyDonations: Number(results.monthlyDonations.count || 0)
          });
        }
      })
      .catch(err => res.status(500).json({ error: err.message }));
  });
});

/**
 * Roadmaps CRUD
 */

// Create a roadmap
app.post('/api/roadmaps', async (req, res) => {
  try {
    const {
      owner_email,
      title,
      description,
      category,
      level,
      duration,
      phases,
      tags,
      modules_link,
      is_published = false
    } = req.body || {};

    if (!owner_email || !title || !description || !category || !level || !duration || !phases) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { rows } = await dbQuery(`
      INSERT INTO roadmaps (owner_email, title, description, category, level, duration, phases, tags, modules_link, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [owner_email, title, description, category, level, duration, parseInt(phases, 10), tags || null, modules_link || null, !!is_published]);

    return res.status(201).json(rows && rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List roadmaps (optionally filter by owner or published status)
app.get('/api/roadmaps', async (req, res) => {
  try {
    const { owner_email, is_published, page = 1, limit = 20 } = req.query || {};
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const conditions = [];
    const params = [];

    if (owner_email) {
      conditions.push('owner_email = ?');
      params.push(owner_email);
    }

    if (is_published !== undefined) {
      conditions.push('is_published = ?');
      params.push(is_published === 'true');
    }

    let query = 'SELECT * FROM roadmaps';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(l, offset);

    const { rows } = await dbQuery(query, params);
    return res.json({ roadmaps: rows, page: p, limit: l });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Get one roadmap
app.get('/api/roadmaps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await dbQuery('SELECT * FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Update a roadmap
app.put('/api/roadmaps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['title', 'description', 'category', 'level', 'duration', 'phases', 'tags', 'modules_link', 'is_published'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(key === 'phases' ? parseInt(req.body[key], 10) : req.body[key]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    // touch updated_at
    updates.push('updated_at = NOW()');
    values.push(id);
    await dbQuery(`UPDATE roadmaps SET ${updates.join(', ')} WHERE id = ?`, values);
    const { rows } = await dbQuery('SELECT * FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    return res.json(rows && rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Delete a roadmap
app.delete('/api/roadmaps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await dbQuery('DELETE FROM roadmaps WHERE id = ?', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * Jobs & Internships CRUD
 */

// Create job/internship
app.post('/api/jobs', async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      description,
      responsibilities,
      requirements,
      benefits,
      salary_min,
      salary_max,
      currency,
      tags,
      status = 'Pending Review',
      featured = false,
      logo,
      industry,
      job_type,
      is_remote = false,
      application_deadline,
      contact_person,
      application_method,
      application_url,
      posted_by,
    } = req.body || {};

    if (!title || !company || !location || !description || !industry || !job_type || !posted_by) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { rows } = await dbQuery(`
      INSERT INTO jobs (
        title, company, location, description, responsibilities, requirements, benefits,
        salary_min, salary_max, currency, tags, status, featured, logo, industry, job_type,
        is_remote, application_deadline, contact_person, application_method, application_url, posted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      title, company, location, description, responsibilities || null, requirements || null, benefits || null,
      salary_min || null, salary_max || null, currency || null, Array.isArray(tags) ? tags.join(',') : (tags || null),
      status, !!featured, logo || null, industry, job_type, !!is_remote,
      application_deadline || null, contact_person || null, application_method || null, application_url || null,
      posted_by
    ]);
    return res.status(201).json(rows && rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List jobs with filters
app.get('/api/jobs', async (req, res) => {
  try {
    const {
      q,
      industry,
      job_type,
      location,
      remote_only,
      status,
      posted_by,
      page = 1,
      limit = 20
    } = req.query || {};

    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const where = [];
    const params = [];

    if (q) {
      const like = `%${String(q).toLowerCase()}%`;
      where.push('(LOWER(title) LIKE ? OR LOWER(company) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(description) LIKE ?)');
      params.push(like, like, like, like);
    }
    if (industry && industry !== 'All Industries') { where.push('industry = ?'); params.push(industry); }
    if (job_type && job_type !== 'All Types') { where.push('job_type = ?'); params.push(job_type); }
    if (location) { where.push('LOWER(location) LIKE ?'); params.push(`%${String(location).toLowerCase()}%`); }
    if (status && status !== 'All Status') { where.push('status = ?'); params.push(status); }
    if (posted_by) { where.push('LOWER(posted_by) = LOWER(?)'); params.push(posted_by); }
    if (remote_only === 'true' || remote_only === '1') { where.push('is_remote = TRUE'); }

    const whereSql = where.length ? (' WHERE ' + where.join(' AND ')) : '';
    const { rows } = await dbQuery(
      `SELECT * FROM jobs${whereSql} ORDER BY posted_date DESC LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );
    const { rows: countRows } = await dbQuery(`SELECT COUNT(*) as total FROM jobs${whereSql}`, params);
    const total = countRows && countRows[0] ? parseInt(countRows[0].total, 10) : 0;
    return res.json({ jobs: rows || [], page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Get one job
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await dbQuery('SELECT * FROM jobs WHERE id = ? LIMIT 1', [id]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Update a job
app.put('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = [
      'title', 'company', 'location', 'description', 'responsibilities', 'requirements', 'benefits',
      'salary_min', 'salary_max', 'currency', 'tags', 'status', 'featured', 'logo', 'industry', 'job_type',
      'is_remote', 'application_deadline', 'contact_person', 'application_method', 'application_url'
    ];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(key === 'tags' && Array.isArray(req.body[key]) ? req.body[key].join(',') : req.body[key]);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    updates.push('updated_at = NOW()');
    values.push(id);
    await dbQuery(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`, values);
    const { rows } = await dbQuery('SELECT * FROM jobs WHERE id = ? LIMIT 1', [id]);
    return res.json(rows && rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Delete a job
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await dbQuery('DELETE FROM jobs WHERE id = ?', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Increment view counter
app.post('/api/jobs/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    await dbQuery('UPDATE jobs SET views = COALESCE(views,0) + 1 WHERE id = ?', [id]);
    const { rows } = await dbQuery('SELECT views FROM jobs WHERE id = ? LIMIT 1', [id]);
    return res.json({ views: rows && rows[0] ? rows[0].views : 0 });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * Applications endpoints
 */

// Apply to a job
app.post('/api/jobs/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { applicant_email, resume_url, cover_letter } = req.body || {};
    if (!applicant_email) return res.status(400).json({ error: 'applicant_email required' });

    // Ensure job exists
    const { rows: jobRows } = await dbQuery('SELECT id FROM jobs WHERE id = ? LIMIT 1', [id]);
    if (!jobRows || !jobRows.length) return res.status(404).json({ error: 'Job not found' });

    // Ensure applicant is a student (alumni cannot apply)
    try {
      const { rows: userRows } = await dbQuery('SELECT user_type FROM users WHERE email = ? LIMIT 1', [applicant_email]);
      const type = userRows && userRows[0] ? String(userRows[0].user_type || '').toLowerCase() : '';
      if (type !== 'student') {
        return res.status(403).json({ error: 'forbidden', message: 'Only students can apply to jobs' });
      }
    } catch (roleErr) {
      // If role lookup fails, deny by default to prevent alumni applying
      return res.status(403).json({ error: 'forbidden', message: 'Only students can apply to jobs' });
    }

    // Upsert application (unique job_id + applicant_email)
    const { rows: existing } = await dbQuery('SELECT * FROM applications WHERE job_id = ? AND applicant_email = ? LIMIT 1', [id, applicant_email]);
    if (existing && existing.length) {
      // If withdrawn, allow re-apply; else return existing
      if (existing[0].status === 'withdrawn') {
        const { rows } = await dbQuery(`
          UPDATE applications SET status = 'applied', resume_url = COALESCE(?, resume_url), cover_letter = COALESCE(?, cover_letter), updated_at = NOW()
          WHERE id = ? RETURNING *
        `, [resume_url || null, cover_letter || null, existing[0].id]);
        await dbQuery('UPDATE jobs SET applied = COALESCE(applied,0) + 1 WHERE id = ?', [id]);
        return res.status(200).json({ application: rows[0] });
      }
      return res.status(200).json({ application: existing[0] });
    }

    const { rows } = await dbQuery(`
      INSERT INTO applications (job_id, applicant_email, status, resume_url, cover_letter)
      VALUES (?, ?, 'applied', ?, ?)
      RETURNING *
    `, [id, applicant_email, resume_url || null, cover_letter || null]);
    await dbQuery('UPDATE jobs SET applied = COALESCE(applied,0) + 1 WHERE id = ?', [id]);
    return res.status(201).json({ application: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List applications for current student (joined with job details)
app.get('/api/applications', async (req, res) => {
  try {
    const { applicant_email, page = 1, limit = 50 } = req.query || {};
    if (!applicant_email) return res.status(400).json({ error: 'applicant_email required' });
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const { rows } = await dbQuery(`
      SELECT a.*, j.title, j.company, j.location, j.job_type, j.industry, j.logo
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.applicant_email = ?
      ORDER BY a.updated_at DESC
      LIMIT ? OFFSET ?
    `, [applicant_email, l, offset]);
    return res.json({ applications: rows, page: p, limit: l });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List applicants for a job
app.get('/api/applications/by-job', async (req, res) => {
  try {
    const { job_id } = req.query || {};
    if (!job_id) return res.status(400).json({ error: 'job_id required' });
    const { rows } = await dbQuery('SELECT * FROM applications WHERE job_id = ? ORDER BY updated_at DESC LIMIT 500', [job_id]);
    return res.json({ applications: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Update application status (withdraw, etc.)
app.put('/api/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['applied', 'withdrawn', 'accepted', 'rejected'];
    if (!allowed.includes(String(status))) return res.status(400).json({ error: 'Invalid status' });
    // Adjust jobs.applied count only when moving to withdrawn
    if (status === 'withdrawn') {
      const { rows: appRows } = await dbQuery('SELECT job_id, status FROM applications WHERE id = ? LIMIT 1', [id]);
      if (appRows && appRows.length && appRows[0].status !== 'withdrawn') {
        await dbQuery('UPDATE jobs SET applied = GREATEST(COALESCE(applied,0) - 1, 0) WHERE id = ?', [appRows[0].job_id]);
      }
    }
    const { rows } = await dbQuery('UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ? RETURNING *', [status, id]);
    return res.json({ application: rows && rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
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
    const gate = await canSendMentorshipMessage(sender_email, receiver_email);
    if (!gate.allowed) {
      return res.status(402).json({ error: gate.reason || 'Chat locked. Purchase a session to continue.' });
    }
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
      dbQuery('UPDATE messages SET read_at = NOW() WHERE thread_key = ? AND receiver_email = ? AND read_at IS NULL', [thread_key, user]).catch(() => { });
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

/**
 * Connection Requests
 */

function buildPairKey(a, b) {
  const [x, y] = [String(a).toLowerCase().trim(), String(b).toLowerCase().trim()].sort();
  return `${x}|${y}`;
}

// Send connection request
app.post('/api/connections/request', async (req, res) => {
  const { requester_email, target_email, message } = req.body || {};
  if (!requester_email || !target_email) {
    return res.status(400).json({ error: 'requester_email and target_email required' });
  }
  if (requester_email.toLowerCase() === target_email.toLowerCase()) {
    return res.status(400).json({ error: 'Cannot connect to self' });
  }
  try {
    const pair_key = buildPairKey(requester_email, target_email);
    // Upsert logic: if existing rejected or removed, recreate; if pending/accepted, return existing state
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
        // recreate a fresh pending record
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
});

// Accept / Reject connection
app.post('/api/connections/respond', async (req, res) => {
  const { user_email, other_email, action } = req.body || {};
  if (!user_email || !other_email || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'user_email, other_email and action (accept|reject) required' });
  }
  try {
    const pair_key = buildPairKey(user_email, other_email);
    const { rows } = await dbQuery('SELECT * FROM connections WHERE pair_key = ? LIMIT 1', [pair_key]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'No request found' });
    const conn = rows[0];
    // Only target can accept/reject a pending request
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
});

// List connections for a user (all states or filter)
app.get('/api/connections', async (req, res) => {
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
});

// Remove connection (either side can remove accepted connection or clear pending)
app.post('/api/connections/remove', async (req, res) => {
  const { user_email, other_email } = req.body || {};
  if (!user_email || !other_email) return res.status(400).json({ error: 'user_email and other_email required' });
  try {
    const pair_key = buildPairKey(user_email, other_email);
    const { rows } = await dbQuery('SELECT * FROM connections WHERE pair_key = ? LIMIT 1', [pair_key]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    const conn = rows[0];
    if (!['pending', 'accepted', 'rejected'].includes(conn.status)) {
      return res.status(400).json({ error: 'Cannot remove in current state' });
    }
    const { rows: updated } = await dbQuery(`
      UPDATE connections SET status = 'removed', updated_at = NOW() WHERE id = ? RETURNING *
    `, [conn.id]);
    return res.json({ connection: updated[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Helper: ensure connection exists and accepted between two emails
async function areConnected(emailA, emailB) {
  const pair_key = buildPairKey(emailA, emailB);
  const { rows } = await dbQuery('SELECT status FROM connections WHERE pair_key = ? LIMIT 1', [pair_key]);
  if (!rows || !rows.length) return false;
  return rows[0].status === 'accepted';
}

// Helper: determine roles for mentorship gating
async function getUserRoleByEmail(email) {
  const { rows } = await dbQuery('SELECT user_type FROM users WHERE email = ? LIMIT 1', [email]);
  return rows && rows[0] ? (rows[0].user_type || 'alumni') : 'alumni';
}

// Mentorship chat gating: allow first 20 messages for student↔alumni pairs; beyond that require paid/scheduled session
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
    const { rows: sess } = await dbQuery("SELECT id, status FROM mentorship_sessions WHERE pair_key = ? AND status IN ('paid','scheduled','completed') ORDER BY created_at DESC LIMIT 1", [pair_key]);
    if (sess && sess.length) return { allowed: true };
    return { allowed: false, reason: 'Free chat limit reached (20 messages). Please purchase a mentorship session.' };
  } catch (e) {
    return { allowed: true };
  }
}

// Protected messaging endpoint variant enforcing accepted connection (optional usage by frontend)
app.post('/api/messages/connected', async (req, res) => {
  const { sender_email, receiver_email, content } = req.body || {};
  if (!sender_email || !receiver_email || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'sender_email, receiver_email and content required' });
  }
  try {
    const ok = await areConnected(sender_email, receiver_email);
    if (!ok) return res.status(403).json({ error: 'Not connected' });
    const gate = await canSendMentorshipMessage(sender_email, receiver_email);
    if (!gate.allowed) {
      return res.status(402).json({ error: gate.reason || 'Chat locked. Purchase a session to continue.' });
    }
    const thread_key = buildThreadKey(sender_email, receiver_email);
    const { iv, tag, encrypted } = encryptText(content);
    const { rows } = await dbQuery(`
      INSERT INTO messages (thread_key, sender_email, receiver_email, iv, auth_tag, ciphertext)
      VALUES (?, ?, ?, ?, ?, ?) RETURNING id, created_at
    `, [thread_key, sender_email, receiver_email, iv, tag, encrypted]);
    return res.status(201).json({ id: rows[0].id, created_at: rows[0].created_at, thread_key });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List users (students or alumni) with optional search & pagination
app.get('/api/users', async (req, res) => {
  try {
    const { type, q, page = 1, limit = 20 } = req.query || {};
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;
    const where = [];
    const params = [];
    if (type && ['student', 'alumni', 'admin'].includes(String(type))) {
      where.push('user_type = ?');
      params.push(type);
    }
    if (q) {
      where.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)');
      const like = `%${String(q).toLowerCase()}%`;
      params.push(like, like);
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows: list } = await dbQuery(`SELECT id, auth0_id, email, name, picture, bio, phone, university, user_type, graduation_year, major, current_job, company, job_title, location, skills, linkedin_url, github_url, website_url, is_mentor FROM users ${whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`, [...params, l, offset]);
    const { rows: countRows } = await dbQuery(`SELECT COUNT(*) as total FROM users ${whereSql}`, params);
    const total = countRows && countRows[0] ? parseInt(countRows[0].total, 10) : 0;
    return res.json({ users: list, page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Fetch user by email (public profile view)
app.get('/api/users/by-email', async (req, res) => {
  try {
    const { email } = req.query || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const { rows } = await dbQuery('SELECT id, auth0_id, email, name, picture, bio, phone, university, user_type, graduation_year, major, current_job, company, job_title, location, skills, linkedin_url, github_url, website_url, is_mentor FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json({ user: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * Mentorship Endpoints
 */

// List available mentors with optional filters
app.get('/api/mentors', async (req, res) => {
  try {
    const { q, min_experience, max_price, min_rating, page = 1, limit = 30 } = req.query || {};
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const where = [];
    const params = [];

    if (q) {
      const like = `%${String(q).toLowerCase()}%`;
      where.push('(LOWER(skills) LIKE ? OR LOWER(topics) LIKE ? OR LOWER(availability) LIKE ?)');
      params.push(like, like, like);
    }
    if (min_experience !== undefined && min_experience !== null && String(min_experience) !== '') {
      where.push('experience_years >= ?');
      params.push(parseInt(min_experience, 10));
    }
    if (max_price !== undefined && max_price !== null && String(max_price) !== '') {
      where.push('price <= ?');
      params.push(Number(max_price));
    }
    if (min_rating !== undefined && min_rating !== null && String(min_rating) !== '') {
      where.push('rating_avg >= ?');
      params.push(Number(min_rating));
    }

    const whereSql = where.length ? (' WHERE ' + where.join(' AND ')) : '';
    const { rows } = await dbQuery(
      `SELECT mentor_email, skills, topics, availability, experience_years, price, rating_avg, rating_count FROM mentors${whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );
    const { rows: countRows } = await dbQuery(`SELECT COUNT(*) AS total FROM mentors${whereSql}`, params);
    const total = countRows && countRows[0] ? parseInt(countRows[0].total, 10) : 0;
    return res.json({ mentors: rows || [], page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Get one mentor profile by email
app.get('/api/mentors/profile', async (req, res) => {
  try {
    const { email } = req.query || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const { rows } = await dbQuery('SELECT mentor_email, skills, topics, availability, experience_years, price, rating_avg, rating_count FROM mentors WHERE LOWER(mentor_email) = LOWER(?) LIMIT 1', [email]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json({ mentor: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Create/update mentor profile (alumni)
app.post('/api/mentors/profile', async (req, res) => {
  try {
    const { email, skills, topics, availability, experience_years, price } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const exp = experience_years === '' || experience_years == null ? 0 : parseInt(experience_years, 10);
    const pr = price === '' || price == null ? 0 : Number(price);
    const sql = `
      INSERT INTO mentors (mentor_email, skills, topics, availability, experience_years, price, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON CONFLICT (mentor_email) DO UPDATE SET
        skills = EXCLUDED.skills,
        topics = EXCLUDED.topics,
        availability = EXCLUDED.availability,
        experience_years = EXCLUDED.experience_years,
        price = EXCLUDED.price,
        updated_at = NOW()
      RETURNING mentor_email, skills, topics, availability, experience_years, price, rating_avg, rating_count
    `;
    const { rows } = await dbQuery(sql, [email, skills || null, topics || null, availability || null, exp, pr]);
    return res.status(201).json({ mentor: rows && rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Create mentorship request
app.post('/api/mentorship/request', async (req, res) => {
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
      // If rejected, allow re-request by resetting status
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
});

// Respond to mentorship request (mentor side)
app.post('/api/mentorship/respond', async (req, res) => {
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
    return res.json({ request: updated[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List mentorship requests for mentor or student
app.get('/api/mentorship/requests', async (req, res) => {
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
});

// Record a paid session (after payment)
app.post('/api/mentorship/sessions/purchase', async (req, res) => {
  const { student_email, mentor_email, amount, currency = 'INR', payment_id, order_id } = req.body || {};
  if (!student_email || !mentor_email || !amount) return res.status(400).json({ error: 'student_email, mentor_email and amount required' });
  try {
    const pair_key = buildPairKey(student_email, mentor_email);
    const { rows } = await dbQuery(
      'INSERT INTO mentorship_sessions (pair_key, student_email, mentor_email, status, amount, currency, payment_id, order_id) VALUES (?, ?, ?, \'paid\', ?, ?, ?, ?) RETURNING *',
      [pair_key, student_email, mentor_email, Number(amount), currency || 'INR', payment_id || null, order_id || null]
    );
    return res.status(201).json({ session: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Schedule a session (student provides meeting_link)
app.post('/api/mentorship/sessions/schedule', async (req, res) => {
  const { session_id, scheduled_at, duration_minutes = 60, meeting_link, notes } = req.body || {};
  if (!session_id || !scheduled_at) return res.status(400).json({ error: 'session_id and scheduled_at required' });
  try {
    const { rows } = await dbQuery('SELECT * FROM mentorship_sessions WHERE id = ? LIMIT 1', [session_id]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Session not found' });
    const sess = rows[0];
    const { rows: updated } = await dbQuery(
      'UPDATE mentorship_sessions SET status = \'scheduled\', scheduled_at = ?, duration_minutes = ?, meeting_link = ?, notes = COALESCE(?, notes), updated_at = NOW() WHERE id = ? RETURNING *',
      [new Date(scheduled_at), Math.max(15, parseInt(duration_minutes, 10) || 60), meeting_link || null, notes || null, session_id]
    );
    return res.json({ session: updated[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Complete a session (mentor marks as completed)
app.post('/api/mentorship/sessions/complete', async (req, res) => {
  const { session_id } = req.body || {};
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    const { rows } = await dbQuery('UPDATE mentorship_sessions SET status = \'completed\', updated_at = NOW() WHERE id = ? RETURNING *', [session_id]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Session not found' });
    return res.json({ session: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List sessions for mentor or student
app.get('/api/mentorship/sessions', async (req, res) => {
  const { mentor_email, student_email, status } = req.query || {};
  if (!mentor_email && !student_email) return res.status(400).json({ error: 'mentor_email or student_email required' });
  try {
    let sql = 'SELECT * FROM mentorship_sessions WHERE 1=1';
    const params = [];
    if (mentor_email) { sql += ' AND mentor_email = ?'; params.push(mentor_email); }
    if (student_email) { sql += ' AND student_email = ?'; params.push(student_email); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY COALESCE(scheduled_at, created_at) ASC LIMIT 200';
    const { rows } = await dbQuery(sql, params);
    return res.json({ sessions: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Submit rating for a mentor after session
app.post('/api/mentorship/ratings', async (req, res) => {
  const { session_id, student_email, mentor_email, rating, feedback } = req.body || {};
  if (!session_id || !student_email || !mentor_email || !rating) {
    return res.status(400).json({ error: 'session_id, student_email, mentor_email and rating required' });
  }
  try {
    const r = Math.max(1, Math.min(5, parseInt(rating, 10)));
    const { rows } = await dbQuery(
      'INSERT INTO mentor_ratings (session_id, student_email, mentor_email, rating, feedback) VALUES (?, ?, ?, ?, ?) RETURNING *',
      [session_id, student_email, mentor_email, r, feedback || null]
    );
    // Update aggregate rating on mentors
    const { rows: agg } = await dbQuery('SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM mentor_ratings WHERE mentor_email = ?', [mentor_email]);
    const avg = agg && agg[0] ? Number(agg[0].avg || 0).toFixed(2) : 0;
    const cnt = agg && agg[0] ? parseInt(agg[0].cnt || 0, 10) : 0;
    await dbQuery('UPDATE mentors SET rating_avg = ?, rating_count = ?, updated_at = NOW() WHERE mentor_email = ?', [avg, cnt, mentor_email]);
    return res.status(201).json({ rating: rows[0], ratingSummary: { rating_avg: Number(avg), rating_count: cnt } });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// --- File Uploads (Memory Image) ---
const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, memoriesDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]+/gi, '_');
      const fname = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}${ext}`;
      cb(null, fname);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (allowedImageTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Invalid image type. Only JPG, PNG, WEBP, GIF are allowed.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.post('/api/uploads/memory-image', imageUpload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    const url = `${req.protocol}://${req.get('host')}/uploads/memories/${req.file.filename}`;
    return res.json({ url, filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// --- Memories SSE Stream ---
const sseClients = new Set();
function broadcastSse(event, data) {
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch { }
  }
}

app.get('/api/memories/stream', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();
  res.write(':\n\n'); // initial comment to establish the stream
  sseClients.add(res);
  req.on('close', () => { sseClients.delete(res); });
});

// --- Memories CRUD ---
// Create a memory
app.post('/api/memories', async (req, res) => {
  try {
    const {
      author_name,
      author_avatar,
      author_batch,
      author_department,
      title,
      description,
      image_url,
      date,
      location,
      tags,
      category,
      type = 'photo',
    } = req.body || {};

    if (!title) return res.status(400).json({ error: 'Title is required' });
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || null);
    const { rows } = await dbQuery(`
      INSERT INTO memories (
        author_name, author_avatar, author_batch, author_department,
        title, description, image_url, date, location, tags, category, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      author_name || null, author_avatar || null, author_batch || null, author_department || null,
      title, description || null, image_url || null, date || null, location || null, tagsStr, category || null, type
    ]);
    const created = rows && rows[0];
    try { broadcastSse('memory-create', created); } catch { }
    return res.status(201).json(created);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List memories with filters
app.get('/api/memories', async (req, res) => {
  try {
    const {
      q,
      category,
      sort = 'recent',
      page = 1,
      limit = 20
    } = req.query || {};

    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const where = [];
    const params = [];
    if (q) {
      const like = `%${String(q).toLowerCase()}%`;
      where.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(author_name) LIKE ?)');
      params.push(like, like, like, like);
    }
    if (category && category !== 'all') { where.push('category = ?'); params.push(category); }

    const whereSql = where.length ? (' WHERE ' + where.join(' AND ')) : '';
    let orderBy = 'created_at DESC';
    if (sort === 'trending') orderBy = 'likes DESC, created_at DESC';
    else if (sort === 'popular') orderBy = 'views DESC, created_at DESC';

    const { rows } = await dbQuery(
      `SELECT * FROM memories${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );
    const { rows: countRows } = await dbQuery(`SELECT COUNT(*) AS total FROM memories${whereSql}`, params);
    const total = countRows && countRows[0] ? parseInt(countRows[0].total, 10) : 0;
    return res.json({ memories: rows || [], page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Increment view counter
app.post('/api/memories/:id/view', async (req, res) => {
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
});

// Like / Unlike a memory
app.post('/api/memories/:id/like', async (req, res) => {
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
});

// Share count
app.post('/api/memories/:id/share', async (req, res) => {
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
});

// Comments
app.get('/api/memories/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await dbQuery('SELECT * FROM memory_comments WHERE memory_id = ? ORDER BY created_at ASC', [id]);
    return res.json({ comments: rows || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/memories/:id/comments', async (req, res) => {
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
});