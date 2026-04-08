const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer'); // For sending emails
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const jsonwebtoken = require('jsonwebtoken');
const crypto = require('crypto');
// Use global fetch if available (Node >= 18); otherwise lazy-load node-fetch
const fetchFn = (global.fetch ? global.fetch : ((...args) => import('node-fetch').then(({ default: f }) => f(...args))));
const fetch = (...args) => fetchFn(...args);

// Modularized DB schema creators
const { createMessagesSchema } = require('./database/messages');
const { createDonationsSchema } = require('./database/donations');
const { createRoadmapsSchema } = require('./database/roadmaps');
const { createConnectionsSchema } = require('./database/connections');
const { createJobsSchema } = require('./database/jobs');
const { createApplicationsSchema } = require('./database/applications');
const { createMentorshipSchema } = require('./database/mentorship');
const { createAcademicProgressSchema } = require('./database/academicProgress');
const { createEventsSchema } = require('./database/events');
const { createMemoriesSchema } = require('./database/memories');
const { createExternalJobsSchema } = require('./database/externalJobs');
const { createSiteSettingsSchema } = require('./database/siteSettings');
const { createResumeReviewsSchema } = require('./database/resumeReviews');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config({ path: __dirname + '/.env' });

// Cloudinary upload service (must be imported AFTER dotenv.config())
const {
  uploadEventImage,
  uploadResume,
  uploadReviewResume,
  uploadMessageFile,
  uploadOtherFile,
  uploadMemoryImage,
  getViewUrl,
  getDownloadUrl,
  resolveViewUrl,
} = require('./services/cloudinaryService');

const app = express();
app.use(cors());
app.use(express.json());
// Serve uploaded files statically
const uploadsRoot = path.join(__dirname, 'uploads');
const resumesDir = path.join(uploadsRoot, 'resumes');
const memoriesDir = path.join(uploadsRoot, 'memories');
const messagesDir = path.join(uploadsRoot, 'messages');
try {
  if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);
  if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir);
  if (!fs.existsSync(memoriesDir)) fs.mkdirSync(memoriesDir);
  if (!fs.existsSync(messagesDir)) fs.mkdirSync(messagesDir);
} catch { }
app.use('/uploads', express.static(uploadsRoot));

function getProxyDownloadUrl(fileUrl, filename = '') {
  if (!fileUrl) return '';
  const params = new URLSearchParams({
    url: fileUrl,
    filename: filename || 'download',
  });
  return `/api/files/download?${params.toString()}`;
}

function inferContentTypeFromFilename(filename = '') {
  const ext = String(filename || '').toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'txt': return 'text/plain; charset=utf-8';
    default: return '';
  }
}

async function sendAlumniApprovalEmail({ to, name, status, reason }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !to) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const safeName = name || 'Alumni';
  const normalizedStatus = String(status || '').toLowerCase();
  const isApproved = normalizedStatus === 'approved';
  const subject = isApproved
    ? 'Your alumni profile has been approved'
    : 'Your alumni profile needs an update';

  const html = isApproved
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #4F46E5; color: #fff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Profile Approved</h1>
        </div>
        <div style="padding: 28px; background: #ffffff; color: #111827;">
          <p style="font-size: 16px; margin: 0 0 14px;">Hi ${safeName},</p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 14px;">Your alumni profile has been approved. You can now access the alumni dashboard and community features.</p>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Thank you for keeping your profile updated.</p>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden;">
        <div style="background: #DC2626; color: #fff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Profile Review Feedback</h1>
        </div>
        <div style="padding: 28px; background: #ffffff; color: #111827;">
          <p style="font-size: 16px; margin: 0 0 14px;">Hi ${safeName},</p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Your alumni profile was reviewed and needs a few updates before approval.</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 0 0 18px;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #b91c1c; text-transform: uppercase; letter-spacing: .08em;">Admin Feedback</p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #7f1d1d;">${reason ? String(reason) : 'Please update your profile information and reapply.'}</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; margin: 0; color: #6b7280;">Please update your profile from the alumni settings page and submit it again for review.</p>
        </div>
      </div>
    `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

const MESSAGE_EDIT_WINDOW_MINUTES = Number(process.env.MESSAGE_EDIT_WINDOW_MINUTES || 15);

// --- File Uploads (Event Image) ---
const allowedEventImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);
const eventImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (allowedEventImageTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Invalid image type. Only JPG, PNG, WEBP, GIF are allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for events
});

// Event image upload to Cloudinary
app.post('/api/uploads/event-image', eventImageUpload.single('image'), async (req, res) => {
  try {
    console.log('[EVENT IMAGE UPLOAD] Received request');
    
    if (!req.file) {
      console.error('[EVENT IMAGE UPLOAD] No file in request');
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    console.log('[EVENT IMAGE UPLOAD] File details:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      bufferlength: req.file.buffer.length
    });
    
    const result = await uploadEventImage(req.file.buffer, req.file.originalname);
    const viewUrl = getViewUrl(result, req.file.originalname);
    const downloadUrl = getDownloadUrl(viewUrl, req.file.originalname);
    
    console.log('[EVENT IMAGE UPLOAD] Success:', {
      url: viewUrl,
      publicId: result.public_id
    });
    
    return res.json({
      url: viewUrl,
      downloadUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('[EVENT IMAGE UPLOAD] Error:', error.message || error);
    return res.status(500).json({ 
      error: error.message || 'Failed to upload image',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

// NOTE: Removed duplicate simple GET handler. The main GET /api/events route
// further down handles normalization and filtering. Keep that implementation
// as the single source of truth for event fetching.

/**
 * Auth0 Management API helpers
 * Never expose the Management token to the client. These helpers run server-side only.
 */
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const MGMT_CLIENT_ID = process.env.AUTH0_MGMT_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
const MGMT_CLIENT_SECRET = process.env.AUTH0_MGMT_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;

// Simple in-memory token cache to avoid hitting Auth0 on every request
let mgmtTokenCache = { token: null, expiresAt: 0 };
let alumniLeaderboardCache = { data: null, expiresAt: 0 };
const LEADERBOARD_CACHE_TTL_MS = Number(process.env.LEADERBOARD_CACHE_TTL_MS || 5 * 60 * 1000);

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
    INSERT INTO users (auth0_id, email, name, picture, user_type, approval_status)
    VALUES (?, ?, ?, ?, COALESCE(?, 'alumni'), COALESCE(?, 'pending'))
    ON CONFLICT (auth0_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name),
      picture = COALESCE(EXCLUDED.picture, users.picture),
      user_type = COALESCE(EXCLUDED.user_type, users.user_type),
      approval_status = COALESCE(users.approval_status, EXCLUDED.approval_status)
    RETURNING *
  `;
  return dbQuery(sql, [auth0_id, email || null, name || null, picture || null, deriveRole(email), 'pending'])
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

async function isAdminRequest(req) {
  const email = req.auth && (req.auth['https://schemas.quickstart/email'] || req.auth.email);
  const sub = req.auth && req.auth.sub;
  if (!email && !sub) return false;
  try {
    if (email) {
      const { rows } = await dbQuery('SELECT user_type FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
      if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') return true;
    }
    if (sub) {
      const { rows } = await dbQuery('SELECT user_type FROM users WHERE auth0_id = ? LIMIT 1', [sub]);
      if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') return true;
    }
  } catch (error) {
    console.warn('Admin verification failed:', error && error.message ? error.message : error);
  }
  return false;
}

function getRequestIdentity(req) {
  const email = req.auth && (req.auth['https://schemas.quickstart/email'] || req.auth.email);
  const auth0Id = req.auth && req.auth.sub;
  return {
    email: email ? String(email).trim().toLowerCase() : null,
    auth0Id: auth0Id ? String(auth0Id).trim() : null,
  };
}

// Async version that fetches email from Auth0 if missing from JWT
async function getRequestIdentityWithAuth0Fallback(req) {
  const identity = getRequestIdentity(req);
  
  // If email is already in the token, return it
  if (identity.email) {
    return identity;
  }

  // If we have Auth0 ID but no email, fetch from Auth0 Management API
  if (identity.auth0Id) {
    try {
      const auth0User = await fetchAuth0User(identity.auth0Id);
      if (auth0User && auth0User.email) {
        identity.email = String(auth0User.email).trim().toLowerCase();
      }
    } catch (error) {
      console.error('Failed to fetch email from Auth0:', error.message);
      // Continue without email - the route will fail gracefully
    }
  }

  return identity;
}

const QUIZ_TOKEN_SECRET = process.env.QUIZ_TOKEN_SECRET || process.env.AUTH0_SECRET || 'connectingfuture-quiz-secret';

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signQuizPayload(payload) {
  const data = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', QUIZ_TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyQuizPayload(token) {
  const [data, sig] = String(token || '').split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', QUIZ_TOKEN_SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(data));
    if (!parsed || !parsed.exp || Date.now() > Number(parsed.exp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeJobSearchText(value) {
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[,;]+/g, ' ')
    .trim()
    .toLowerCase();
}

function buildExternalJobCacheKey({ role, location, employmentType, page }) {
  return [normalizeJobSearchText(role), normalizeJobSearchText(location), normalizeJobSearchText(employmentType), String(page || 1)].join('|');
}

function formatExternalSalary(job) {
  const minSalary = job.job_salary_min ?? job.salary_min ?? job.min_salary;
  const maxSalary = job.job_salary_max ?? job.salary_max ?? job.max_salary;
  const currency = job.job_salary_currency ?? job.salary_currency ?? job.currency;
  if (minSalary && maxSalary) return `${currency ? `${currency} ` : ''}${minSalary} - ${maxSalary}`.trim();
  if (minSalary) return `${currency ? `${currency} ` : ''}${minSalary}+`.trim();
  if (job.job_salary || job.salary) return String(job.job_salary || job.salary);
  return 'Not specified';
}

function formatExternalLocation(job, fallbackLocation) {
  const locationParts = [job.job_city, job.job_state, job.job_country].filter(Boolean).map(String);
  if (locationParts.length) return locationParts.join(', ');
  if (job.job_location) return String(job.job_location);
  return fallbackLocation || 'Remote / Flexible';
}

function mapJSearchJob(job) {
  return {
    job_id: String(job.job_id || job.id || crypto.randomUUID()),
    title: job.job_title || job.title || 'Untitled role',
    company: job.employer_name || job.company || 'Unknown company',
    location: formatExternalLocation(job, job.location),
    apply_link: job.job_apply_link || job.apply_link || job.job_google_link || job.job_url || '',
    employment_type: job.job_employment_type || job.employment_type || 'Not specified',
    salary: formatExternalSalary(job),
    posted_date: job.job_posted_at_datetime_utc || job.job_posted_at || job.posted_date || null,
    logo_url: job.employer_logo || job.logo_url || null,
    job_type: job.job_employment_type || job.employment_type || null,
    description: job.job_description || job.description || '',
    source: 'rapidapi-jsearch'
  };
}

const externalJobsRateLimit = new Map();

function allowExternalJobsRequest(ipAddress) {
  const windowMs = Number(process.env.JOBS_RATE_LIMIT_WINDOW_MS || 60_000);
  const maxRequests = Number(process.env.JOBS_RATE_LIMIT_MAX || 30);
  const key = ipAddress || 'anonymous';
  const now = Date.now();
  const current = externalJobsRateLimit.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }
  current.count += 1;
  externalJobsRateLimit.set(key, current);
  return { allowed: current.count <= maxRequests, remaining: Math.max(0, maxRequests - current.count), resetAt: current.resetAt };
}

async function readJobSearchDefaults() {
  const { rows } = await dbQuery("SELECT setting_value FROM site_settings WHERE setting_key = 'job_search_defaults' LIMIT 1");
  const value = rows && rows[0] ? rows[0].setting_value : null;
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
}

async function writeJobSearchDefaults(payload) {
  const normalized = {
    role: String(payload && payload.role ? payload.role : '').trim() || 'software developer',
    location: String(payload && payload.location ? payload.location : '').trim() || 'India',
    employment_type: String(payload && payload.employment_type ? payload.employment_type : '').trim() || 'All Types'
  };
  await dbQuery(`
    INSERT INTO site_settings (setting_key, setting_value, updated_at)
    VALUES ('job_search_defaults', ?, NOW())
    ON CONFLICT (setting_key)
    DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
  `, [JSON.stringify(normalized)]);
  return normalized;
}

async function getCachedExternalJobs(cacheKey) {
  const { rows } = await dbQuery(
    `SELECT results_json, fetched_at, expires_at
     FROM external_job_search_cache
     WHERE cache_key = ? AND expires_at > NOW()
     ORDER BY fetched_at DESC
     LIMIT 1`,
    [cacheKey]
  );
  if (!rows || !rows.length) return null;
  return rows[0];
}

async function saveExternalJobsCache(cacheKey, params, jobs) {
  const ttlMinutes = Number(process.env.JOBS_CACHE_TTL_MINUTES || 15);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  await dbQuery(
    `INSERT INTO external_job_search_cache (cache_key, role, location, employment_type, results_json, fetched_at, expires_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW())
     ON CONFLICT (cache_key)
     DO UPDATE SET role = EXCLUDED.role,
                   location = EXCLUDED.location,
                   employment_type = EXCLUDED.employment_type,
                   results_json = EXCLUDED.results_json,
                   fetched_at = NOW(),
                   expires_at = EXCLUDED.expires_at,
                   updated_at = NOW()`,
    [cacheKey, params.role || null, params.location || null, params.employmentType || null, JSON.stringify(jobs), expiresAt]
  );
}

async function saveExternalJobSnapshots(cacheKey, jobs) {
  if (!jobs || !jobs.length) return;
  for (const job of jobs) {
    await dbQuery(
      `INSERT INTO external_jobs_cache (
        job_id, title, company, location, apply_link, employment_type, salary, posted_at, logo_url, raw_data, search_key, last_seen_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (job_id)
      DO UPDATE SET title = EXCLUDED.title,
                    company = EXCLUDED.company,
                    location = EXCLUDED.location,
                    apply_link = EXCLUDED.apply_link,
                    employment_type = EXCLUDED.employment_type,
                    salary = EXCLUDED.salary,
                    posted_at = EXCLUDED.posted_at,
                    logo_url = EXCLUDED.logo_url,
                    raw_data = EXCLUDED.raw_data,
                    search_key = EXCLUDED.search_key,
                    last_seen_at = NOW(),
                    updated_at = NOW()`,
      [
        job.job_id,
        job.title,
        job.company,
        job.location,
        job.apply_link,
        job.employment_type,
        job.salary,
        job.posted_date ? new Date(job.posted_date) : null,
        job.logo_url || null,
        JSON.stringify(job),
        cacheKey
      ]
    );
  }
}

async function fetchExternalJobsFromRapidApi({ role, location, employmentType, page }) {
  const rapidApiKey = process.env.RAPIDAPI_JSEARCH_KEY || process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_JSEARCH_HOST || process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com';
  if (!rapidApiKey) {
    throw new Error('RAPIDAPI_JSEARCH_KEY is not configured');
  }

  const searchParts = [role, 'jobs'];
  if (location) searchParts.push(`in ${location}`);
  const url = new URL(`https://${rapidApiHost}/search`);
  url.searchParams.set('query', searchParts.join(' ').replace(/\s+/g, ' ').trim());
  url.searchParams.set('page', String(page || 1));
  url.searchParams.set('num_pages', '1');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-host': rapidApiHost,
      'x-rapidapi-key': rapidApiKey
    }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`RapidAPI JSearch request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.jobs) ? payload.jobs : [];
  return items.map(mapJSearchJob);
}

async function handleExternalJobsRequest(req, res) {
  try {
    const rate = allowExternalJobsRequest(req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous');
    res.setHeader('X-RateLimit-Limit', String(Number(process.env.JOBS_RATE_LIMIT_MAX || 30)));
    res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const defaults = await readJobSearchDefaults();
    const role = String(req.query.role || defaults.role || 'software developer').trim();
    const location = String(req.query.location || defaults.location || 'India').trim();
    const employmentType = String(req.query.employment_type || req.query.job_type || defaults.employment_type || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const refresh = String(req.query.refresh || req.query.force || '').toLowerCase() === 'true';

    const cacheKey = buildExternalJobCacheKey({ role, location, employmentType, page });
    if (!refresh) {
      const cached = await getCachedExternalJobs(cacheKey);
      if (cached && cached.results_json) {
        const cachedJobs = typeof cached.results_json === 'string' ? JSON.parse(cached.results_json) : cached.results_json;
        return res.json({
          jobs: cachedJobs || [],
          meta: {
            role,
            location,
            employment_type: employmentType || 'All Types',
            page,
            from_cache: true,
            fetched_at: cached.fetched_at
          }
        });
      }
    }

    const jobs = await fetchExternalJobsFromRapidApi({ role, location, employmentType, page });
    const filteredJobs = employmentType && employmentType !== 'All Types'
      ? jobs.filter(job => normalizeJobSearchText(job.employment_type).includes(normalizeJobSearchText(employmentType)))
      : jobs;

    await Promise.all([
      saveExternalJobsCache(cacheKey, { role, location, employmentType }, filteredJobs),
      saveExternalJobSnapshots(cacheKey, filteredJobs)
    ]);

    return res.json({
      jobs: filteredJobs,
      meta: {
        role,
        location,
        employment_type: employmentType || 'All Types',
        page,
        from_cache: false,
        fetched_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('External jobs request failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: error.message || 'Failed to load external jobs' });
  }
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

// Prevent unhandled pool errors from crashing the process; log and continue
try {
  db.on && db.on('error', (err) => {
    console.warn('Postgres pool error:', err && err.message ? err.message : err);
  });
} catch (e) { }

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
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(255)');
      // Student-specific columns
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50)');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(50)');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255)');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2)');
      await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS other_files JSONB DEFAULT '[]'::jsonb");
    } catch (e) { console.log('User schema migration note:', e.message); }

    await dbQuery('CREATE INDEX IF NOT EXISTS idx_auth0_id ON users(auth0_id)');
    await dbQuery('CREATE INDEX IF NOT EXISTS idx_email ON users(email)');
    await dbQuery('CREATE INDEX IF NOT EXISTS idx_user_type ON users(user_type)');
    // Ensure approval_status exists for alumni approval workflow
    await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'");
    await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_reason TEXT");
    // Initialize modularized schemas 
    await createMessagesSchema(dbQuery);
    await createDonationsSchema(dbQuery);
    await createRoadmapsSchema(dbQuery);
    await createConnectionsSchema(dbQuery);
    await createMentorshipSchema(dbQuery);
    await createResumeReviewsSchema(dbQuery);
    await createAcademicProgressSchema(dbQuery);
    await createMemoriesSchema(dbQuery);
    // Ensure jobs and applications schemas exist (these features are used by the API routes)
    try {
      await createJobsSchema(dbQuery);
      await createApplicationsSchema(dbQuery);
      await createExternalJobsSchema(dbQuery);
      await createSiteSettingsSchema(dbQuery);
    } catch (e) {
      console.warn('Jobs/Applications schema creation note:', e.message);
    }
    // Create events table (Postgres) if missing
    await dbQuery(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      user_auth0_id VARCHAR(255) NULL,
      title VARCHAR(1024) NOT NULL,
      description TEXT,
      event_date TIMESTAMPTZ,
      event_time VARCHAR(64),
      duration VARCHAR(64),
      location VARCHAR(512),
      event_type VARCHAR(128),
      is_virtual BOOLEAN DEFAULT FALSE,
      image_url TEXT,
      tags TEXT,
      organizer VARCHAR(255),
      max_attendees INT,
      current_attendees INT DEFAULT 0,
      price NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

    // Ensure columns exist (migration for existing tables)
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time VARCHAR(64)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS duration VARCHAR(64)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS location VARCHAR(512)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(128)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT FALSE`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer VARCHAR(255)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status VARCHAR(64) DEFAULT 'pending'`);
    // Auto-approve existing pending events to match new policy
    await dbQuery(`UPDATE events SET approval_status = 'approved' WHERE approval_status = 'pending'`);

    // Create event_registrations table
    await dbQuery(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id SERIAL PRIMARY KEY,
      event_id INT NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255),
      registered_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(event_id, user_email)
    )`);



    console.log('Tables are ready');
  } catch (e) {
    console.error('DB init error:', e.message);
  }
}

// Legacy MySQL-era migration helpers removed; schema is managed via modularized creators above.

// Auth0 JWT middleware - Strict (with audience validation)
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE || undefined,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
});

// Create JWKS client once (reused for all tokens)
const jwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

// Custom JWT validator with better error handling - more flexible for roadmap endpoints
const verifyAuth0Token = async (token) => {
  if (!token) return null;

  try {
    // Decode without verification first to get the kid
    const decoded = jsonwebtoken.decode(token, { complete: true });
    if (!decoded) return null;

    const key = await jwksClient.getSigningKey(decoded.header.kid);
    const signingKey = key.getPublicKey();

    // Verify the token
    const verified = jsonwebtoken.verify(token, signingKey, {
      algorithms: ['RS256'],
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    });

    return verified;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
};

// Flexible middleware for roadmap - validates JWT but skips audience
const checkJwtFlexible = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const verified = await verifyAuth0Token(token);

    if (!verified) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.auth = verified;
    next();
  } catch (error) {
    console.error('JWT middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

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

// GET all events for frontend
app.get('/api/events', async (req, res) => {
  try {
    const { user_email, all } = req.query || {};
    // By default return only approved events to public clients. Admin UI can pass
    // ?all=true to retrieve all events (pending/rejected/approved).
    let q = `SELECT id, title, description, event_date, event_time, duration, location, is_virtual, event_type, image_url, tags, organizer, max_attendees, current_attendees, price, approval_status FROM events`;
    const params = [];
    if (!all || String(all) !== 'true') {
      q += ` WHERE approval_status = 'approved'`;
    }
    q += ` ORDER BY created_at DESC`;

    const { rows } = await dbQuery(q, params);
    const mapped = (rows || []).map(r => ({
      id: r.id ? String(r.id) : '',
      title: r.title || '',
      description: r.description || '',
      event_date: r.event_date ? new Date(r.event_date).toISOString() : null,
      event_time: r.event_time || '',
      duration: r.duration || '',
      location: r.location || '',
      is_virtual: !!r.is_virtual,
      event_type: r.event_type || '',
      image_url: r.image_url || '',
      tags: r.tags ? (Array.isArray(r.tags) ? r.tags : String(r.tags).split(',').map(s => s.trim()).filter(Boolean)) : [],
      organizer: r.organizer || '',
      max_attendees: r.max_attendees || null,
      current_attendees: r.current_attendees || 0,
      price: r.price || 0,
      approval_status: r.approval_status || 'pending'
    }));

    // Attach registration flag if requested by client
    if (user_email) {
      const registrationsRes = await dbQuery('SELECT event_id FROM event_registrations WHERE user_email = ?', [user_email]);
      const registeredEventIds = new Set((registrationsRes.rows || []).map(r => Number(r.event_id)));
      mapped.forEach(ev => {
        ev.isRegistered = registeredEventIds.has(Number(ev.id));
      });
    }

    return res.json(mapped);
  } catch (e) {
    console.error('Events fetch error:', e.message || e);
    return res.status(500).json({ error: e.message || 'Failed to fetch events' });
  }
});

// PATCH update event (partial updates) - supports approval_status updates
app.patch('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const allowed = ['approval_status', 'title', 'description', 'event_date', 'event_time', 'duration', 'location', 'is_virtual', 'event_type', 'image_url', 'tags', 'organizer', 'max_attendees', 'current_attendees', 'price'];
    const fields = [];
    const params = [];
    Object.keys(updates).forEach(key => {
      if (allowed.includes(key)) {
        fields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });
    if (fields.length === 0) return res.status(400).json({ error: 'No updatable fields provided' });
    params.push(id);
    const q = `UPDATE events SET ${fields.join(', ')} WHERE id = ? RETURNING id`;
    const { rows } = await dbQuery(q, params);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    return res.json({ message: 'Event updated', id });
  } catch (e) {
    console.error('Event update error:', e.message || e);
    return res.status(500).json({ error: e.message || 'Failed to update event' });
  }
});

// DELETE all events (development/admin only)
app.delete('/api/events/clear-all/confirm', async (req, res) => {
  try {
    await dbQuery('DELETE FROM events');
    return res.json({ message: 'All events cleared successfully' });
  } catch (e) {
    console.error('Events clear error:', e.message || e);
    return res.status(500).json({ error: e.message || 'Failed to clear events' });
  }
});



// DELETE single event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const q = `DELETE FROM events WHERE id = ? RETURNING id`;
    const { rows } = await dbQuery(q, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.json({ message: 'Event deleted successfully', id });
  } catch (e) {
    console.error('Event deletion error:', e.message || e);
    return res.status(500).json({ error: e.message || 'Failed to delete event' });
  }
});

// Protected route example
app.get('/api/protected', checkJwt, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.auth });
});

// --- Centralized Cloudinary Uploads ---
const pdfOnlyTypes = new Set(['application/pdf']);
const allowedResumeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const allowedMessageTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const createMemoryUpload = ({ fileSize, mimeCheck, invalidMessage }) => multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (mimeCheck(file.mimetype || '')) return cb(null, true);
    return cb(new Error(invalidMessage));
  },
  limits: { fileSize },
});

const jobResumeUpload = createMemoryUpload({
  fileSize: 10 * 1024 * 1024,
  mimeCheck: (mime) => pdfOnlyTypes.has(mime),
  invalidMessage: 'Invalid file type. Only PDF resumes are allowed.',
});

const reviewResumeUpload = createMemoryUpload({
  fileSize: 10 * 1024 * 1024,
  mimeCheck: (mime) => pdfOnlyTypes.has(mime),
  invalidMessage: 'Invalid file type. Only PDF resumes are allowed.',
});

const legacyResumeUpload = createMemoryUpload({
  fileSize: 10 * 1024 * 1024,
  mimeCheck: (mime) => allowedResumeTypes.has(mime),
  invalidMessage: 'Invalid file type. Only PDF, DOC, and DOCX are allowed.',
});

const messageAttachmentUpload = createMemoryUpload({
  fileSize: 25 * 1024 * 1024,
  mimeCheck: (mime) => mime.startsWith('image/') || allowedMessageTypes.has(mime),
  invalidMessage: 'Invalid attachment type. Allowed: PDF, docs, sheets, slides, text, zip, and images.',
});

const otherFileUpload = createMemoryUpload({
  fileSize: 25 * 1024 * 1024,
  mimeCheck: (mime) => mime.startsWith('image/') || allowedMessageTypes.has(mime),
  invalidMessage: 'Invalid file type for general upload.',
});

async function buildUploadPayload(file, uploadResult) {
  const viewUrl = await resolveViewUrl(uploadResult, file.originalname);
  return {
    url: viewUrl,
    downloadUrl: getDownloadUrl(viewUrl, file.originalname),
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    publicId: uploadResult.public_id,
  };
}

function registerUploadRoutes(paths, middleware, handler) {
  paths.forEach((route) => app.post(route, middleware, handler));
}

const jobResumeUploadHandler = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Resume file is required' });
    const result = await uploadResume(req.file.buffer, req.file.originalname);
    return res.json(await buildUploadPayload(req.file, result));
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to upload resume' });
  }
};

const reviewResumeUploadHandler = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Resume file is required' });
    const result = await uploadReviewResume(req.file.buffer, req.file.originalname);
    return res.json(await buildUploadPayload(req.file, result));
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to upload review resume' });
  }
};

const eventImageUploadHandler = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    const result = await uploadEventImage(req.file.buffer, req.file.originalname);
    return res.json(await buildUploadPayload(req.file, result));
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to upload image' });
  }
};

const messageAttachmentUploadHandler = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Attachment file is required' });
    const result = await uploadMessageFile(req.file.buffer, req.file.originalname);
    return res.json(await buildUploadPayload(req.file, result));
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to upload attachment' });
  }
};

const otherFileUploadHandler = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const result = await uploadOtherFile(req.file.buffer, req.file.originalname);
    const payload = await buildUploadPayload(req.file, result);

    const userEmail = String(req.body && req.body.user_email ? req.body.user_email : '').trim().toLowerCase();
    if (userEmail) {
      const record = {
        url: payload.url,
        filename: payload.filename,
        mimetype: payload.mimetype,
        size: payload.size,
        publicId: payload.publicId,
        uploaded_at: new Date().toISOString(),
      };
      await dbQuery(
        `UPDATE users
         SET other_files = COALESCE(other_files, '[]'::jsonb) || $1::jsonb,
             updated_at = NOW()
         WHERE LOWER(email) = LOWER($2)`,
        [JSON.stringify([record]), userEmail]
      );
    }

    return res.json(payload);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to upload file' });
  }
};

registerUploadRoutes(['/api/upload/job-resume', '/upload/job-resume'], jobResumeUpload.single('file'), jobResumeUploadHandler);
registerUploadRoutes(['/api/upload/review-resume', '/upload/review-resume'], reviewResumeUpload.single('file'), reviewResumeUploadHandler);
registerUploadRoutes(['/api/upload/event-image', '/upload/event-image'], eventImageUpload.single('file'), eventImageUploadHandler);
registerUploadRoutes(['/api/upload/message-attachment', '/upload/message-attachment'], messageAttachmentUpload.single('file'), messageAttachmentUploadHandler);
registerUploadRoutes(['/api/upload/other', '/upload/other'], otherFileUpload.single('file'), otherFileUploadHandler);

// Legacy endpoint kept for compatibility with existing frontend screens.
app.post('/api/uploads/resume', legacyResumeUpload.single('resume'), jobResumeUploadHandler);

// Download a remote file as an attachment through the backend proxy
app.get('/api/files/download', async (req, res) => {
  try {
    const fileUrl = String(req.query.url || '').trim();
    const filename = String(req.query.filename || 'download').trim() || 'download';

    if (!fileUrl) {
      return res.status(400).json({ error: 'url is required' });
    }

    let parsed;
    try {
      parsed = new URL(fileUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid file url' });
    }

    if (!['res.cloudinary.com', 'localhost', '127.0.0.1'].includes(parsed.hostname)) {
      return res.status(400).json({ error: 'Unsupported download source' });
    }

    const upstream = await fetch(fileUrl);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Failed to fetch file (${upstream.status})` });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const contentBuffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
    res.setHeader('Content-Length', String(contentBuffer.length));
    return res.send(contentBuffer);
  } catch (error) {
    console.error('[FILE DOWNLOAD] Error:', error.message || error);
    return res.status(500).json({ error: error.message || 'Failed to download file' });
  }
});

// Preview a remote file inline through backend (helps raw Cloudinary files render in browser)
app.get('/api/files/preview', async (req, res) => {
  try {
    const fileUrl = String(req.query.url || '').trim();
    const filename = String(req.query.filename || 'preview').trim() || 'preview';

    if (!fileUrl) {
      return res.status(400).json({ error: 'url is required' });
    }

    let parsed;
    try {
      parsed = new URL(fileUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid file url' });
    }

    if (!['res.cloudinary.com', 'localhost', '127.0.0.1'].includes(parsed.hostname)) {
      return res.status(400).json({ error: 'Unsupported preview source' });
    }

    const upstream = await fetch(fileUrl);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Failed to fetch file (${upstream.status})` });
    }

    const upstreamType = upstream.headers.get('content-type') || 'application/octet-stream';
    const inferredType = inferContentTypeFromFilename(filename);
    const contentType = (!upstreamType || upstreamType.includes('application/octet-stream')) && inferredType
      ? inferredType
      : upstreamType;

    const contentBuffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${filename.replace(/"/g, '')}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Length', String(contentBuffer.length));
    return res.send(contentBuffer);
  } catch (error) {
    console.error('[FILE PREVIEW] Error:', error.message || error);
    return res.status(500).json({ error: error.message || 'Failed to preview file' });
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
    try {
      const normalizedEmail = String(u.email || email || '').trim().toLowerCase();
      if (normalizedEmail) {
        const [jobsRes, roadmapsRes, mentorshipRes] = await Promise.all([
          dbQuery('SELECT COUNT(*)::int AS count FROM jobs WHERE LOWER(posted_by) = LOWER(?)', [normalizedEmail]),
          dbQuery('SELECT COUNT(*)::int AS count FROM roadmaps WHERE LOWER(owner_email) = LOWER(?)', [normalizedEmail]),
          dbQuery("SELECT COUNT(*)::int AS count FROM mentorship_sessions WHERE LOWER(mentor_email) = LOWER(?) AND status = 'completed'", [normalizedEmail]),
        ]);

        const jobs = Number(jobsRes.rows && jobsRes.rows[0] ? jobsRes.rows[0].count || 0 : 0);
        const roadmaps = Number(roadmapsRes.rows && roadmapsRes.rows[0] ? roadmapsRes.rows[0].count || 0 : 0);
        const mentorships = Number(mentorshipRes.rows && mentorshipRes.rows[0] ? mentorshipRes.rows[0].count || 0 : 0);

        u.impact_score = jobs + roadmaps + mentorships;
        u.impact_breakdown = { jobs, roadmaps, mentorships, sessions_completed: mentorships };
      } else {
        u.impact_score = 0;
        u.impact_breakdown = { jobs: 0, roadmaps: 0, mentorships: 0, sessions_completed: 0 };
      }
    } catch (impactErr) {
      console.warn('Failed to compute profile impact score:', impactErr.message);
      u.impact_score = Number(u.impact_score || 0);
      u.impact_breakdown = u.impact_breakdown || { jobs: 0, roadmaps: 0, mentorships: 0, sessions_completed: 0 };
    }

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
    // If approval_status is not set, default to 'pending'
    if (!u.approval_status) u.approval_status = 'pending';
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
    picture,
    // Student-specific fields
    rollNumber,
    yearOfStudy,
    department,
    cgpa
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
    registration_completed: true,
    // Student-specific
    roll_number: rollNumber || null,
    year_of_study: yearOfStudy || null,
    department: department || course || null,
    cgpa: cgpa ? parseFloat(cgpa) : null,
  };

  const sql = `
    INSERT INTO users (auth0_id, email, name, phone, university, graduation_year, major, current_job, company, job_title, location, linkedin_url, github_url, website_url, bio, skills, is_mentor, picture, registration_completed, roll_number, year_of_study, department, cgpa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      approval_status = CASE WHEN users.approval_status = 'rejected' THEN 'pending' ELSE users.approval_status END,
      approval_reason = CASE WHEN users.approval_status = 'rejected' THEN NULL ELSE users.approval_reason END,
      registration_completed = EXCLUDED.registration_completed,
      roll_number = EXCLUDED.roll_number,
      year_of_study = EXCLUDED.year_of_study,
      department = EXCLUDED.department,
      cgpa = EXCLUDED.cgpa
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
    values.registration_completed,
    values.roll_number,
    values.year_of_study,
    values.department,
    values.cgpa
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
      modules_link,
      tags,
      is_published = false
    } = req.body || {};

    if (!owner_email || !title || !description || !category || !level || !duration || !phases) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { rows } = await dbQuery(`
      INSERT INTO roadmaps (owner_email, title, description, category, level, duration, phases, modules_link, tags, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [owner_email, title, description, category, level, duration, parseInt(phases, 10), modules_link || null, tags || null, !!is_published]);

    return res.status(201).json(rows && rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * AI Roadmap Generator (Admin Only)
 */

// Generate a roadmap using Gemini
app.post('/api/admin/roadmaps/generate', checkJwt, async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { domain, specialization, prompt: customPrompt } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const adminPrompt = customPrompt || `Generate a detailed learning roadmap for ${specialization} in the domain of ${domain || 'career development'}.`;

    const systemInstruction = `
You are an expert roadmap generator and career mentor.
Generate a structured, step-by-step learning roadmap.

Output Format (STRICT JSON ONLY — no extra text):
{
  "title": "Roadmap Title",
  "input_prompt": "${adminPrompt.replace(/"/g, '\\"')}",
  "description": "High level description",
  "category": "e.g. programming",
  "level": "Beginner/Intermediate/Advanced",
  "duration": "e.g. 6 months",
  "phases": 5,
  "tags": ["tag1", "tag2"],
  "milestones": [
    {
      "order": 1,
      "title": "Milestone Title",
      "description": "Clear and practical description",
      "subtopics": [
        { "title": "Subtopic Title", "description": "Quick summary", "level": "Beginner" }
      ],
      "learning_steps": ["Step 1", "Step 2"],
      "resources": {
        "youtube": [{ "label": "Video Title", "url": "https://youtube.com/..." }],
        "github": [{ "label": "Repo Name", "url": "https://github.com/..." }],
        "reading": [{ "label": "Article Title", "url": "https://..." }]
      }
    }
  ],
  "resources": {
    "youtube": [],
    "github": [],
    "reading": []
  }
}

Instructions:
1. Create a complete roadmap from beginner → advanced → real-world level.
2. Divide the roadmap into 5–7 milestones.
3. Each milestone must include title, description, subtopics (as objects with title/description/level), learning_steps (as strings), and resources (as objects with label/url).
4. Include real-world project suggestions in later milestones.
5. Attach useful resources: YouTube links, GitHub repositories, Articles/documentation.
6. Ensure logical progression between milestones.
7. Return ONLY the JSON object.
    `;

    const result = await model.generateContent(systemInstruction);
    const text = result.response.text();
    
    // Clean up potential markdown formatting from Gemini response
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const roadmap = JSON.parse(jsonStr);

    // Add generation metadata
    roadmap.generation_meta = {
      stage: 'final',
      generated_at: new Date().toISOString(),
      provider: 'Google Gemini',
      model: 'gemini-1.5-flash'
    };

    return res.json(roadmap);
  } catch (e) {
    console.error('Gemini generation error:', e);
    return res.status(500).json({ error: e.message || 'Failed to generate roadmap' });
  }
});

// Helper to normalize roadmap data for client responses
const normalizeRoadmap = (roadmap) => {
  if (!roadmap) return null;
  const r = { ...roadmap };
  if (typeof r.tags === 'string') {
    r.tags = r.tags.split(',').filter(Boolean);
  } else if (!r.tags) {
    r.tags = [];
  }
  
  // Use consistent keys between DB and Client for nested JSON
  if (r.milestones_json) {
    r.milestones = r.milestones_json;
    delete r.milestones_json;
  }
  if (r.resources_json) {
    r.resources = r.resources_json;
    delete r.resources_json;
  }
  if (r.generation_meta_json) {
    r.generation_meta = r.generation_meta_json;
    delete r.generation_meta_json;
  }
  
  r.is_published = !!r.is_published;
  return r;
};

// Admin Save Roadmap (with structured JSON columns)
app.post('/api/admin/roadmaps/save', checkJwt, async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const {
      owner_email,
      title,
      description,
      category,
      level,
      duration,
      phases,
      tags,
      domain,
      specialization,
      milestones,
      resources,
      generation_meta,
      is_published = false
    } = req.body || {};

    const { rows } = await dbQuery(`
      INSERT INTO roadmaps (
        owner_email, title, description, category, level, duration, phases, 
        tags, domain, specialization, milestones_json, resources_json, 
        generation_meta_json, is_published
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      owner_email, title, description, category, level, duration, phases,
      Array.isArray(tags) ? tags.join(',') : tags,
      domain, specialization,
      JSON.stringify(milestones),
      JSON.stringify(resources),
      JSON.stringify(generation_meta),
      !!is_published
    ]);

    return res.status(201).json(normalizeRoadmap(rows && rows[0]));
  } catch (e) {
    console.error('Roadmap save error:', e);
    return res.status(500).json({ error: e.message });
  }
});

// Admin Publish/Unpublish Roadmap
app.put('/api/admin/roadmaps/:id/publish', checkJwt, async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.params;
    const { is_published = true } = req.body;

    const { rows } = await dbQuery(`
      UPDATE roadmaps 
      SET is_published = ?, updated_at = NOW() 
      WHERE id = ? 
      RETURNING *
    `, [!!is_published, id]);

    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Roadmap not found' });
    return res.json(normalizeRoadmap(rows[0]));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List roadmaps (optionally filter by owner)
app.get('/api/roadmaps', async (req, res) => {
  try {
    const { owner_email, is_published, page = 1, limit = 20 } = req.query || {};
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const statsAll = await dbQuery('SELECT COUNT(*) as count FROM roadmaps');
    const statsPub = await dbQuery('SELECT COUNT(*) as count FROM roadmaps WHERE is_published = TRUE');
    const totalCount = parseInt(statsAll.rows[0]?.count || 0, 10);
    const publishedCount = parseInt(statsPub.rows[0]?.count || 0, 10);

    let query = 'SELECT * FROM roadmaps';
    const params = [];
    const conditions = [];

    if (owner_email) {
      conditions.push('owner_email = ?');
      params.push(owner_email);
    }

    if (is_published === 'true') {
      conditions.push('is_published = TRUE');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(l, offset);

    const { rows } = await dbQuery(query, params);
    
    return res.json({ 
      roadmaps: rows.map(normalizeRoadmap), 
      page: p, 
      limit: l, 
      totalCount, 
      publishedCount 
    });
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
    const allowed = ['title', 'description', 'category', 'level', 'duration', 'phases', 'modules_link', 'tags', 'is_published'];
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

async function generateMilestoneQuizWithGemini({ roadmap, milestone, questionCount = 5 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  const prompt = `
Generate a technical quiz for a student milestone.

Return STRICT JSON only in this shape:
{
  "pass_score": 70,
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_option_index": 0,
      "explanation": "why"
    }
  ]
}

Rules:
1. Create exactly ${Math.max(3, Math.min(8, Number(questionCount) || 5))} MCQ questions.
2. questions[].options must always contain exactly 4 options.
3. correct_option_index must be 0..3.
4. Questions must align to the milestone concepts and learning steps.
5. Difficulty should match milestone level and should test practical understanding.
6. Return only JSON, no markdown.

Roadmap title: ${roadmap.title}
Roadmap level: ${roadmap.level}
Milestone order: ${milestone.order || ''}
Milestone title: ${milestone.title || ''}
Milestone description: ${milestone.description || ''}
Subtopics: ${JSON.stringify((milestone.subtopics || []).map(s => s.title || s))}
Learning steps: ${JSON.stringify(milestone.learning_steps || [])}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = String(text || '').replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const normalizedQuestions = questions
    .map((q) => ({
      question: String(q?.question || '').trim(),
      options: Array.isArray(q?.options) ? q.options.slice(0, 4).map((o) => String(o || '').trim()) : [],
      correct_option_index: Number.isInteger(q?.correct_option_index) ? q.correct_option_index : -1,
      explanation: String(q?.explanation || '').trim(),
    }))
    .filter((q) => q.question && q.options.length === 4 && q.correct_option_index >= 0 && q.correct_option_index <= 3);

  if (!normalizedQuestions.length) {
    throw new Error('Gemini returned invalid quiz format');
  }

  return {
    pass_score: Number(parsed?.pass_score) > 0 ? Number(parsed.pass_score) : 70,
    questions: normalizedQuestions,
  };
}

function pickRoadmapMilestone(roadmap, milestoneOrder) {
  const milestones = Array.isArray(roadmap?.milestones_json)
    ? roadmap.milestones_json
    : (Array.isArray(roadmap?.milestones) ? roadmap.milestones : []);
  const target = Number(milestoneOrder);
  const direct = milestones.find((m) => Number(m?.order) === target);
  if (direct) return direct;
  return milestones[target - 1] || null;
}

async function getOrCreateRoadmapProgress(roadmapId, userEmail) {
  const lookup = await dbQuery('SELECT * FROM roadmap_student_progress WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?) LIMIT 1', [roadmapId, userEmail]);
  if (lookup.rows && lookup.rows[0]) return lookup.rows[0];
  const inserted = await dbQuery(`
    INSERT INTO roadmap_student_progress (roadmap_id, user_email, unlocked_milestone_order, completed_milestones_json)
    VALUES (?, ?, 1, '[]'::jsonb)
    RETURNING *
  `, [roadmapId, userEmail]);
  return inserted.rows && inserted.rows[0];
}

app.get('/api/roadmaps/:id/progress', checkJwtFlexible, async (req, res) => {
  try {
    const { id } = req.params;
    const identity = await getRequestIdentityWithAuth0Fallback(req);
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    const roadmapRes = await dbQuery('SELECT id, title, milestones_json FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    if (!roadmapRes.rows || !roadmapRes.rows[0]) return res.status(404).json({ error: 'Roadmap not found' });
    const roadmap = roadmapRes.rows[0];
    const progress = await getOrCreateRoadmapProgress(id, identity.email);

    const followRes = await dbQuery('SELECT id FROM roadmap_resource_follows WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?) LIMIT 1', [id, identity.email]);
    const followerCountRes = await dbQuery('SELECT COUNT(*)::int AS cnt FROM roadmap_resource_follows WHERE roadmap_id = ?', [id]);

    return res.json({
      roadmap_id: Number(id),
      total_milestones: Array.isArray(roadmap.milestones_json) ? roadmap.milestones_json.length : 0,
      unlocked_milestone_order: Number(progress.unlocked_milestone_order || 1),
      completed_milestones: Array.isArray(progress.completed_milestones_json) ? progress.completed_milestones_json : [],
      last_quiz_score: progress.last_quiz_score !== null ? Number(progress.last_quiz_score) : null,
      followed: !!(followRes.rows && followRes.rows[0]),
      followers: Number(followerCountRes.rows?.[0]?.cnt || 0),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/roadmaps/:id/milestones/:milestoneOrder/complete', checkJwtFlexible, async (req, res) => {
  try {
    const { id, milestoneOrder } = req.params;
    const identity = await getRequestIdentityWithAuth0Fallback(req);
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    const roadmapRes = await dbQuery('SELECT id, milestones_json FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    if (!roadmapRes.rows || !roadmapRes.rows[0]) return res.status(404).json({ error: 'Roadmap not found' });
    const roadmap = roadmapRes.rows[0];
    const targetOrder = Number(milestoneOrder);
    const milestone = pickRoadmapMilestone(roadmap, targetOrder);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const progress = await getOrCreateRoadmapProgress(id, identity.email);
    const completed = Array.isArray(progress.completed_milestones_json)
      ? progress.completed_milestones_json.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    if (!completed.includes(targetOrder)) completed.push(targetOrder);
    completed.sort((a, b) => a - b);

    const updated = await dbQuery(`
      UPDATE roadmap_student_progress
      SET completed_milestones_json = ?, updated_at = NOW()
      WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?)
      RETURNING *
    `, [JSON.stringify(completed), id, identity.email]);

    return res.json({
      completed_milestones: updated.rows?.[0]?.completed_milestones_json || completed,
      unlocked_milestone_order: Number(updated.rows?.[0]?.unlocked_milestone_order || 1),
      requires_quiz: true,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/roadmaps/:id/milestones/:milestoneOrder/quiz/generate', checkJwtFlexible, async (req, res) => {
  try {
    const { id, milestoneOrder } = req.params;
    const identity = await getRequestIdentityWithAuth0Fallback(req);
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    const roadmapRes = await dbQuery('SELECT id, title, level, milestones_json FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    if (!roadmapRes.rows || !roadmapRes.rows[0]) return res.status(404).json({ error: 'Roadmap not found' });
    const roadmap = roadmapRes.rows[0];
    const targetOrder = Number(milestoneOrder);
    const milestone = pickRoadmapMilestone(roadmap, targetOrder);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const progress = await getOrCreateRoadmapProgress(id, identity.email);
    if (targetOrder > Number(progress.unlocked_milestone_order || 1)) {
      return res.status(403).json({ error: 'Milestone is locked. Pass previous milestone quiz first.' });
    }

    const quiz = await generateMilestoneQuizWithGemini({ roadmap, milestone, questionCount: 5 });
    const answerKey = quiz.questions.map((q) => q.correct_option_index);
    const tokenPayload = {
      roadmap_id: Number(id),
      milestone_order: targetOrder,
      pass_score: Number(quiz.pass_score || 70),
      answer_key: answerKey,
      exp: Date.now() + 1000 * 60 * 20,
    };
    const quizToken = signQuizPayload(tokenPayload);

    const questionsForClient = quiz.questions.map((q) => ({
      question: q.question,
      options: q.options,
      explanation_hint: q.explanation,
    }));

    return res.json({
      roadmap_id: Number(id),
      milestone_order: targetOrder,
      pass_score: Number(quiz.pass_score || 70),
      quiz_token: quizToken,
      questions: questionsForClient,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/roadmaps/:id/milestones/:milestoneOrder/quiz/submit', checkJwtFlexible, async (req, res) => {
  try {
    const { id, milestoneOrder } = req.params;
    const identity = await getRequestIdentityWithAuth0Fallback(req);
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    const { quiz_token, answers } = req.body || {};
    if (!quiz_token || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'quiz_token and answers[] are required' });
    }

    const tokenPayload = verifyQuizPayload(quiz_token);
    if (!tokenPayload) return res.status(400).json({ error: 'Invalid or expired quiz token' });
    if (Number(tokenPayload.roadmap_id) !== Number(id) || Number(tokenPayload.milestone_order) !== Number(milestoneOrder)) {
      return res.status(400).json({ error: 'Quiz token does not match roadmap milestone' });
    }

    const answerKey = Array.isArray(tokenPayload.answer_key) ? tokenPayload.answer_key : [];
    const total = answerKey.length;
    if (!total) return res.status(400).json({ error: 'Quiz token has no answer key' });

    let correct = 0;
    for (let i = 0; i < total; i += 1) {
      if (Number(answers[i]) === Number(answerKey[i])) correct += 1;
    }
    const score = Number(((correct / total) * 100).toFixed(2));
    const passScore = Number(tokenPayload.pass_score || 70);
    const passed = score >= passScore;

    await dbQuery(`
      INSERT INTO roadmap_quiz_attempts (roadmap_id, milestone_order, user_email, score, question_count, passed)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, milestoneOrder, identity.email, score, total, passed]);

    const progress = await getOrCreateRoadmapProgress(id, identity.email);
    const completed = Array.isArray(progress.completed_milestones_json)
      ? progress.completed_milestones_json.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const currentOrder = Number(milestoneOrder);
    if (!completed.includes(currentOrder)) completed.push(currentOrder);
    completed.sort((a, b) => a - b);

    const nextUnlocked = passed
      ? Math.max(Number(progress.unlocked_milestone_order || 1), currentOrder + 1)
      : Number(progress.unlocked_milestone_order || 1);

    const updated = await dbQuery(`
      UPDATE roadmap_student_progress
      SET completed_milestones_json = ?, unlocked_milestone_order = ?, last_quiz_score = ?, updated_at = NOW()
      WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?)
      RETURNING *
    `, [JSON.stringify(completed), nextUnlocked, score, id, identity.email]);

    return res.json({
      score,
      pass_score: passScore,
      passed,
      unlocked_milestone_order: Number(updated.rows?.[0]?.unlocked_milestone_order || nextUnlocked),
      completed_milestones: updated.rows?.[0]?.completed_milestones_json || completed,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/roadmaps/:id/follow', checkJwtFlexible, async (req, res) => {
  try {
    const { id } = req.params;
    const { follow = true } = req.body || {};
    const identity = await getRequestIdentityWithAuth0Fallback(req);
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    if (follow) {
      await dbQuery(`
        INSERT INTO roadmap_resource_follows (roadmap_id, user_email)
        VALUES (?, ?)
        ON CONFLICT (roadmap_id, user_email) DO NOTHING
      `, [id, identity.email]);
    } else {
      await dbQuery('DELETE FROM roadmap_resource_follows WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?)', [id, identity.email]);
    }

    await dbQuery(`
      UPDATE roadmaps
      SET followers = (
        SELECT COUNT(*)::int FROM roadmap_resource_follows WHERE roadmap_id = ?
      )
      WHERE id = ?
    `, [id, id]);

    const countRes = await dbQuery('SELECT followers FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    return res.json({ followed: !!follow, followers: Number(countRes.rows?.[0]?.followers || 0) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/roadmaps/:id/follow-status', checkJwtFlexible, async (req, res) => {
  try {
    const { id } = req.params;
    const identity = await getRequestIdentityWithAuth0Fallback(req);
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    const followRes = await dbQuery('SELECT id FROM roadmap_resource_follows WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?) LIMIT 1', [id, identity.email]);
    const countRes = await dbQuery('SELECT COUNT(*)::int AS cnt FROM roadmap_resource_follows WHERE roadmap_id = ?', [id]);
    return res.json({ followed: !!(followRes.rows && followRes.rows[0]), followers: Number(countRes.rows?.[0]?.cnt || 0) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/leaderboard/students/resources', async (req, res) => {
  try {
    const sql = `
      SELECT
        u.id,
        u.email,
        COALESCE(NULLIF(u.name, ''), u.email) AS name,
        u.picture AS profile_pic,
        COALESCE(f.follow_count, 0) AS follow_count,
        COALESCE(q.passed_count, 0) AS passed_count,
        COALESCE(q.avg_score, 0) AS avg_quiz_score,
        (
          COALESCE(f.follow_count, 0) * 20 +
          COALESCE(q.passed_count, 0) * 15 +
          COALESCE(q.avg_score, 0) * 0.5
        )::numeric(10,2) AS total_points
      FROM users u
      LEFT JOIN (
        SELECT LOWER(user_email) AS email, COUNT(*)::int AS follow_count
        FROM roadmap_resource_follows
        GROUP BY LOWER(user_email)
      ) f ON LOWER(u.email) = f.email
      LEFT JOIN (
        SELECT
          LOWER(user_email) AS email,
          COUNT(*) FILTER (WHERE passed = TRUE)::int AS passed_count,
          AVG(score)::numeric(10,2) AS avg_score
        FROM roadmap_quiz_attempts
        GROUP BY LOWER(user_email)
      ) q ON LOWER(u.email) = q.email
      WHERE LOWER(COALESCE(u.user_type, '')) = 'student'
      ORDER BY total_points DESC, name ASC
      LIMIT 500
    `;

    const { rows } = await dbQuery(sql);
    return res.json({ leaders: rows || [] });
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
    const wantsExternalJobs = req.query && (
      req.query.source === 'external' ||
      req.query.external === 'true' ||
      req.query.role !== undefined ||
      req.query.employment_type !== undefined ||
      req.query.refresh !== undefined ||
      req.query.force !== undefined
    );
    if (wantsExternalJobs) {
      return handleExternalJobsRequest(req, res);
    }

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

    // If caller didn't explicitly request a status or posted_by (owner view), default to showing only approved jobs
    if ((!status || String(status).trim() === '') && !posted_by) {
      where.push('status = ?');
      params.push('Approved');
    }

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
    // Hide poster email for non-approved jobs unless the request explicitly filters by posted_by
    const jobs = (rows || []).map(r => ({
      ...r,
      posted_by: (String(r.status || '').toLowerCase() === 'approved' || posted_by) ? r.posted_by : null
    }));
    return res.json({ jobs, page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/jobs/external', async (req, res) => {
  return handleExternalJobsRequest(req, res);
});

app.post('/api/jobs/external/:jobId/view', async (req, res) => {
  try {
    const { jobId } = req.params;
    const snapshot = req.body && req.body.job ? req.body.job : req.body || {};
    const { rows } = await dbQuery(
      `INSERT INTO external_jobs_cache (
        job_id, title, company, location, apply_link, employment_type, salary, posted_at, logo_url, raw_data, view_count, apply_click_count, last_seen_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())
      ON CONFLICT (job_id)
      DO UPDATE SET title = COALESCE(EXCLUDED.title, external_jobs_cache.title),
                    company = COALESCE(EXCLUDED.company, external_jobs_cache.company),
                    location = COALESCE(EXCLUDED.location, external_jobs_cache.location),
                    apply_link = COALESCE(EXCLUDED.apply_link, external_jobs_cache.apply_link),
                    employment_type = COALESCE(EXCLUDED.employment_type, external_jobs_cache.employment_type),
                    salary = COALESCE(EXCLUDED.salary, external_jobs_cache.salary),
                    posted_at = COALESCE(EXCLUDED.posted_at, external_jobs_cache.posted_at),
                    logo_url = COALESCE(EXCLUDED.logo_url, external_jobs_cache.logo_url),
                    raw_data = COALESCE(EXCLUDED.raw_data, external_jobs_cache.raw_data),
                    view_count = COALESCE(external_jobs_cache.view_count, 0) + 1,
                    apply_click_count = COALESCE(external_jobs_cache.apply_click_count, 0) + 1,
                    last_seen_at = NOW(),
                    updated_at = NOW()
      RETURNING view_count, apply_click_count`,
      [
        jobId,
        snapshot.title || null,
        snapshot.company || null,
        snapshot.location || null,
        snapshot.apply_link || null,
        snapshot.employment_type || null,
        snapshot.salary || null,
        snapshot.posted_date ? new Date(snapshot.posted_date) : null,
        snapshot.logo_url || null,
        JSON.stringify(snapshot)
      ]
    );
    return res.json({
      job_id: jobId,
      view_count: rows && rows[0] ? rows[0].view_count : 1,
      apply_click_count: rows && rows[0] ? rows[0].apply_click_count : 1,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs/external/:jobId/application-feedback', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { applied, user_email, user_name, source_page } = req.body || {};
    const snapshot = req.body && req.body.job ? req.body.job : req.body || {};

    if (typeof applied !== 'boolean') {
      return res.status(400).json({ error: 'applied must be a boolean' });
    }
    if (!user_email || !String(user_email).trim()) {
      return res.status(400).json({ error: 'user_email is required' });
    }

    await dbQuery(
      `INSERT INTO external_jobs_cache (
        job_id, title, company, location, apply_link, employment_type, salary, posted_at, logo_url, raw_data, last_seen_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (job_id)
      DO UPDATE SET title = COALESCE(EXCLUDED.title, external_jobs_cache.title),
                    company = COALESCE(EXCLUDED.company, external_jobs_cache.company),
                    location = COALESCE(EXCLUDED.location, external_jobs_cache.location),
                    apply_link = COALESCE(EXCLUDED.apply_link, external_jobs_cache.apply_link),
                    employment_type = COALESCE(EXCLUDED.employment_type, external_jobs_cache.employment_type),
                    salary = COALESCE(EXCLUDED.salary, external_jobs_cache.salary),
                    posted_at = COALESCE(EXCLUDED.posted_at, external_jobs_cache.posted_at),
                    logo_url = COALESCE(EXCLUDED.logo_url, external_jobs_cache.logo_url),
                    raw_data = COALESCE(EXCLUDED.raw_data, external_jobs_cache.raw_data),
                    last_seen_at = NOW(),
                    updated_at = NOW()`,
      [
        jobId,
        snapshot.title || null,
        snapshot.company || null,
        snapshot.location || null,
        snapshot.apply_link || null,
        snapshot.employment_type || null,
        snapshot.salary || null,
        snapshot.posted_date ? new Date(snapshot.posted_date) : null,
        snapshot.logo_url || null,
        JSON.stringify(snapshot),
      ]
    );

    await dbQuery(
      `INSERT INTO external_job_application_feedback (
        job_id, user_email, user_name, applied, source_page, job_snapshot, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (job_id, user_email)
      DO UPDATE SET applied = EXCLUDED.applied,
                    user_name = COALESCE(EXCLUDED.user_name, external_job_application_feedback.user_name),
                    source_page = EXCLUDED.source_page,
                    job_snapshot = COALESCE(EXCLUDED.job_snapshot, external_job_application_feedback.job_snapshot),
                    updated_at = NOW()`,
      [
        jobId,
        String(user_email).trim().toLowerCase(),
        user_name ? String(user_name).trim() : null,
        applied,
        source_page || null,
        JSON.stringify(snapshot),
      ]
    );

    await dbQuery(
      `UPDATE external_jobs_cache
       SET applied_confirm_count = (
            SELECT COUNT(*)::INT FROM external_job_application_feedback f
            WHERE f.job_id = ? AND f.applied = TRUE
          ),
          application_response_count = (
            SELECT COUNT(*)::INT FROM external_job_application_feedback f
            WHERE f.job_id = ?
          ),
          updated_at = NOW()
       WHERE job_id = ?`,
      [jobId, jobId, jobId]
    );

    const { rows } = await dbQuery(
      `SELECT job_id, apply_click_count, applied_confirm_count, application_response_count
       FROM external_jobs_cache
       WHERE job_id = ?
       LIMIT 1`,
      [jobId]
    );

    const stats = rows && rows[0] ? rows[0] : null;
    return res.json({
      job_id: jobId,
      applied,
      apply_click_count: stats ? Number(stats.apply_click_count || 0) : 0,
      applied_confirm_count: stats ? Number(stats.applied_confirm_count || 0) : 0,
      application_response_count: stats ? Number(stats.application_response_count || 0) : 0,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/jobs/external/analytics/applications', async (req, res) => {
  try {
    const status = String(req.query.status || 'applied').toLowerCase();
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const where = [];
    const params = [];

    if (status === 'applied') {
      where.push('f.applied = TRUE');
    } else if (status === 'not-applied') {
      where.push('f.applied = FALSE');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await dbQuery(
      `SELECT f.id,
              f.job_id,
              f.user_email,
              COALESCE(NULLIF(f.user_name, ''), NULLIF(u.name, ''), f.user_email) AS user_name,
              f.applied,
              f.source_page,
              f.updated_at,
              c.title,
              c.company,
              c.location,
              c.apply_link
       FROM external_job_application_feedback f
       LEFT JOIN external_jobs_cache c ON c.job_id = f.job_id
       LEFT JOIN users u ON LOWER(u.email) = LOWER(f.user_email)
       ${whereSql}
       ORDER BY f.updated_at DESC
       LIMIT ?`,
      [...params, limit]
    );

    return res.json({ applications: rows || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/jobs/external/analytics/summary', async (req, res) => {
  try {
    const { rows } = await dbQuery(
      `SELECT job_id, title, company, location, apply_link, employment_type, salary, posted_at, logo_url,
              view_count, apply_click_count, bookmark_count, applied_confirm_count, application_response_count,
              CASE
                WHEN COALESCE(apply_click_count, 0) > 0
                THEN ROUND((COALESCE(applied_confirm_count, 0)::NUMERIC / COALESCE(apply_click_count, 0)::NUMERIC) * 100, 2)
                ELSE 0
              END AS apply_conversion_pct
       FROM external_jobs_cache
       ORDER BY COALESCE(applied_confirm_count, 0) DESC,
                COALESCE(apply_click_count, 0) DESC,
                COALESCE(view_count, 0) DESC,
                COALESCE(bookmark_count, 0) DESC,
                last_seen_at DESC NULLS LAST
       LIMIT 5`
    );
    return res.json({ jobs: rows || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get one job
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await dbQuery('SELECT * FROM jobs WHERE id = ? LIMIT 1', [id]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    const job = rows[0];
    // If job is not approved, do not expose it to general users; allow owner view when posted_by query matches
    const callerPostedBy = req.query && req.query.posted_by ? String(req.query.posted_by) : null;
    if (String(job.status || '').toLowerCase() !== 'approved' && callerPostedBy !== String(job.posted_by)) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json(job);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Admin job search defaults
app.get('/api/admin/settings/jobs', checkJwt, async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const defaults = await readJobSearchDefaults();
    return res.json({
      role: defaults.role || 'software developer',
      location: defaults.location || 'India',
      employment_type: defaults.employment_type || 'All Types'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/settings/jobs', checkJwt, async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const updated = await writeJobSearchDefaults(req.body || {});
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

// Admin: list alumni awaiting approval or all alumni
app.get('/api/admin/alumni', checkJwt, async (req, res) => {
  try {
    const email = req.auth && (req.auth['https://schemas.quickstart/email'] || req.auth.email);
    const sub = req.auth && (req.auth.sub || req.auth.sub);
    // Verify caller is an admin by checking users.user_type in DB
    let isAdmin = false;
    try {
      if (email) {
        const { rows } = await dbQuery('SELECT user_type FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
        if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
      }
      if (!isAdmin && sub) {
        const { rows } = await dbQuery('SELECT user_type FROM users WHERE auth0_id = ? LIMIT 1', [sub]);
        if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
      }
    } catch (innerErr) {
      console.warn('Failed to verify admin from DB:', innerErr && innerErr.message ? innerErr.message : innerErr);
    }
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { status } = req.query || {};
    const where = ['user_type = ?'];
    const params = ['alumni'];
    if (status && String(status).trim()) { where.push('approval_status = ?'); params.push(status); }
    const whereSql = where.length ? (' WHERE ' + where.join(' AND ')) : '';
    const { rows } = await dbQuery(`SELECT id, auth0_id, email, name, phone, university, graduation_year, major, company, job_title, location, linkedin_url, bio, skills, registration_completed, approval_status, approval_reason FROM users${whereSql} ORDER BY created_at DESC`, params);
    return res.json({ alumni: rows || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Admin: approve or reject an alumni profile
app.put('/api/admin/alumni/:auth0_id/approval', checkJwt, async (req, res) => {
  try {
    const email = req.auth && (req.auth['https://schemas.quickstart/email'] || req.auth.email);
    const sub = req.auth && (req.auth.sub || req.auth.sub);
    // Verify caller is an admin by checking users.user_type in DB
    let isAdmin = false;
    try {
      if (email) {
        const { rows } = await dbQuery('SELECT user_type FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
        if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
      }
      if (!isAdmin && sub) {
        const { rows } = await dbQuery('SELECT user_type FROM users WHERE auth0_id = ? LIMIT 1', [sub]);
        if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
      }
    } catch (innerErr) {
      console.warn('Failed to verify admin from DB:', innerErr && innerErr.message ? innerErr.message : innerErr);
    }
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { auth0_id } = req.params;
    const { status, reason } = req.body || {};
    if (!auth0_id || !status || !['approved', 'rejected', 'pending'].includes(String(status).toLowerCase())) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    await dbQuery('UPDATE users SET approval_status = ?, approval_reason = ? WHERE auth0_id = ?', [String(status).toLowerCase(), reason || null, auth0_id]);
    const { rows } = await dbQuery('SELECT id, auth0_id, email, name, registration_completed, approval_status, approval_reason FROM users WHERE auth0_id = ? LIMIT 1', [auth0_id]);
    const updatedUser = rows && rows[0] ? rows[0] : null;
    if (updatedUser) {
      sendAlumniApprovalEmail({
        to: updatedUser.email,
        name: updatedUser.name,
        status: updatedUser.approval_status,
        reason: updatedUser.approval_reason,
      }).catch((emailErr) => console.warn('Failed to send alumni approval email:', emailErr && emailErr.message ? emailErr.message : emailErr));
    }
    return res.json({ user: updatedUser });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Admin: approve or reject an alumni profile by numeric id
app.put('/api/admin/users/:id/approval', checkJwt, async (req, res) => {
  try {
    const email = req.auth && (req.auth['https://schemas.quickstart/email'] || req.auth.email);
    const sub = req.auth && (req.auth.sub || req.auth.sub);
    // Verify caller is an admin by checking users.user_type in DB
    let isAdmin = false;
    try {
      if (email) {
        const { rows } = await dbQuery('SELECT user_type FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
        if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
      }
      if (!isAdmin && sub) {
        const { rows } = await dbQuery('SELECT user_type FROM users WHERE auth0_id = ? LIMIT 1', [sub]);
        if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
      }
    } catch (innerErr) {
      console.warn('Failed to verify admin from DB:', innerErr && innerErr.message ? innerErr.message : innerErr);
    }
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.params;
    const { approval_status, reason } = req.body || {};
    if (!id || !approval_status || !['approved', 'rejected', 'pending'].includes(String(approval_status).toLowerCase())) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    await dbQuery('UPDATE users SET approval_status = ?, approval_reason = ? WHERE id = ?', [String(approval_status).toLowerCase(), reason || null, id]);
    const { rows } = await dbQuery('SELECT id, auth0_id, email, name, registration_completed, approval_status, approval_reason FROM users WHERE id = ? LIMIT 1', [id]);
    const updatedUser = rows && rows[0] ? rows[0] : null;
    if (updatedUser) {
      sendAlumniApprovalEmail({
        to: updatedUser.email,
        name: updatedUser.name,
        status: updatedUser.approval_status,
        reason: updatedUser.approval_reason,
      }).catch((emailErr) => console.warn('Failed to send alumni approval email:', emailErr && emailErr.message ? emailErr.message : emailErr));
    }
    return res.json({ user: updatedUser });
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

    // Ensure applicant is eligible to apply (students and alumni allowed)
    try {
      const { rows: userRows } = await dbQuery('SELECT user_type FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [applicant_email]);
      const dbType = userRows && userRows[0] ? String(userRows[0].user_type || '').toLowerCase() : '';
      const type = dbType || deriveRole(applicant_email);
      if (!(type === 'student' || type === 'alumni')) {
        return res.status(403).json({ error: 'forbidden', message: 'Only students and alumni can apply to jobs' });
      }
    } catch (roleErr) {
      const fallbackType = deriveRole(applicant_email);
      if (!(fallbackType === 'student' || fallbackType === 'alumni')) {
        return res.status(403).json({ error: 'forbidden', message: 'Only students and alumni can apply to jobs' });
      }
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
        return res.status(200).json({
          application: rows[0]
            ? {
                ...rows[0],
                resume_url: rows[0].resume_url ? await resolveViewUrl(rows[0].resume_url, rows[0].filename || '') : rows[0].resume_url,
              }
            : rows[0],
        });
      }
      return res.status(200).json({
        application: {
          ...existing[0],
          resume_url: existing[0].resume_url ? await resolveViewUrl(existing[0].resume_url, existing[0].filename || '') : existing[0].resume_url,
        },
      });
    }

    const { rows } = await dbQuery(`
      INSERT INTO applications (job_id, applicant_email, status, resume_url, cover_letter)
      VALUES (?, ?, 'applied', ?, ?)
      RETURNING *
    `, [id, applicant_email, resume_url || null, cover_letter || null]);
    await dbQuery('UPDATE jobs SET applied = COALESCE(applied,0) + 1 WHERE id = ?', [id]);
    return res.status(201).json({
      application: rows[0]
        ? {
            ...rows[0],
            resume_url: rows[0].resume_url ? await resolveViewUrl(rows[0].resume_url, rows[0].filename || '') : rows[0].resume_url,
          }
        : rows[0],
    });
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
    const applications = await Promise.all((rows || []).map(async (row) => ({
      ...row,
      resume_url: row.resume_url ? await resolveViewUrl(row.resume_url, row.filename || '') : row.resume_url,
    })));
    return res.json({ applications, page: p, limit: l });
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
    const applications = await Promise.all((rows || []).map(async (row) => ({
      ...row,
      resume_url: row.resume_url ? await resolveViewUrl(row.resume_url, row.filename || '') : row.resume_url,
    })));
    return res.json({ applications });
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
    return res.json({
      application: rows && rows[0]
        ? {
            ...rows[0],
            resume_url: rows[0].resume_url ? await resolveViewUrl(rows[0].resume_url, rows[0].filename || '') : rows[0].resume_url,
          }
        : rows && rows[0],
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;

// Academic progress API endpoints
// Public endpoints that accept `auth0_id` as a query parameter. These are
// intentionally lightweight. Authentication/authorization can be added later.
app.get('/api/academic/semesters', async (req, res) => {
  try {
    const { auth0_id } = req.query || {};
    if (!auth0_id) return res.status(400).json({ error: 'auth0_id required' });
    const { rows } = await dbQuery(
      'SELECT id, student_auth0_id, semester_key, name, gpa, total_credits, is_current FROM academic_semesters WHERE student_auth0_id = ? ORDER BY created_at DESC',
      [auth0_id]
    );
    // Normalize fields for clients
    const semesters = (rows || []).map(r => ({
      id: r.id ? String(r.id) : '',
      semester_key: r.semester_key || '',
      name: r.name || r.semester_key || '',
      gpa: r.gpa != null ? Number(r.gpa) : null,
      total_credits: r.total_credits != null ? Number(r.total_credits) : 0,
      is_current: !!r.is_current
    }));
    return res.json({ semesters });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/academic/courses', async (req, res) => {
  try {
    const { auth0_id, semester_key } = req.query || {};
    if (!auth0_id || !semester_key) return res.status(400).json({ error: 'auth0_id and semester_key required' });
    const { rows } = await dbQuery(
      'SELECT id, student_auth0_id, semester_key, course_key, name, code, credits, grade, status, progress FROM academic_courses WHERE student_auth0_id = ? AND semester_key = ? ORDER BY id',
      [auth0_id, semester_key]
    );
    const courses = (rows || []).map(r => ({
      id: r.id ? String(r.id) : '',
      course_key: r.course_key || '',
      name: r.name || '',
      code: r.code || '',
      credits: r.credits != null ? Number(r.credits) : 0,
      grade: r.grade || '-',
      status: r.status || 'upcoming',
      progress: r.progress != null ? Number(r.progress) : 0,
    }));
    return res.json({ courses });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Create or update a semester (upsert by student_auth0_id + semester_key)
app.post('/api/academic/semesters', async (req, res) => {
  try {
    const body = req.body || {};
    const { auth0_id, semester_key, name, gpa, total_credits, is_current } = body;
    if (!auth0_id || !semester_key) return res.status(400).json({ error: 'auth0_id and semester_key required' });

    const q = `
      INSERT INTO academic_semesters (student_auth0_id, semester_key, name, gpa, total_credits, is_current, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (student_auth0_id, semester_key)
      DO UPDATE SET name = EXCLUDED.name, gpa = EXCLUDED.gpa, total_credits = EXCLUDED.total_credits, is_current = EXCLUDED.is_current, updated_at = NOW()
      RETURNING *
    `;
    const params = [auth0_id, semester_key, name || semester_key, gpa != null ? gpa : null, total_credits != null ? total_credits : 0, !!is_current];
    const { rows } = await dbQuery(q, params);
    return res.json({ semester: rows && rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Create or update a course (upsert by student_auth0_id + course_key)
app.post('/api/academic/courses', async (req, res) => {
  try {
    const body = req.body || {};
    const { auth0_id, semester_key, course_key, name, code, credits, grade, status, progress } = body;
    if (!auth0_id || !course_key || !semester_key) return res.status(400).json({ error: 'auth0_id, semester_key and course_key required' });

    const q = `
      INSERT INTO academic_courses (student_auth0_id, semester_key, course_key, name, code, credits, grade, status, progress, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (student_auth0_id, course_key)
      DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, credits = EXCLUDED.credits, grade = EXCLUDED.grade, status = EXCLUDED.status, progress = EXCLUDED.progress, semester_key = EXCLUDED.semester_key, updated_at = NOW()
      RETURNING *
    `;
    const params = [auth0_id, semester_key, course_key, name || course_key, code || null, credits != null ? credits : 0, grade || null, status || 'upcoming', progress != null ? progress : 0];
    const { rows } = await dbQuery(q, params);
    return res.json({ course: rows && rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ===== ALUMNI EARNINGS ENDPOINTS =====

// Get earnings statistics for an alumni
app.get('/api/alumni/earnings/stats', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const emailLower = email.toLowerCase();

    // Get mentorship session earnings - only count as completed if session has actually finished
    const sessionsResult = await dbQuery(
      `SELECT 
        COALESCE(SUM(alumni_earnings), 0) as total_sessions,
        COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN alumni_earnings ELSE 0 END), 0) as pending_sessions,
        COUNT(CASE WHEN status = 'completed' OR (scheduled_at IS NOT NULL AND scheduled_at + (duration_minutes || ' minutes')::interval <= NOW()) THEN 1 END) as completed_count
      FROM mentorship_sessions 
      WHERE LOWER(mentor_email) = ? AND status IN ('paid', 'scheduled', 'completed')`,
      [emailLower]
    );

    // Get subscription earnings
    const subsResult = await dbQuery(
      `SELECT 
        COALESCE(SUM(alumni_earnings), 0) as total_subs,
        COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN alumni_earnings ELSE 0 END), 0) as pending_subs
      FROM mentorship_subscriptions 
      WHERE LOWER(mentor_email) = ? AND status IN ('active', 'expired')`,
      [emailLower]
    );

    const sessions = sessionsResult.rows?.[0] || {};
    const subs = subsResult.rows?.[0] || {};

    const totalEarned = (parseFloat(sessions.total_sessions || 0) + parseFloat(subs.total_subs || 0));
    const pendingAmount = (parseFloat(sessions.pending_sessions || 0) + parseFloat(subs.pending_subs || 0));
    const thisMonth = new Date();
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);

    const thisMonthResult = await dbQuery(
      `SELECT COALESCE(SUM(alumni_earnings), 0) as total
       FROM (
         SELECT alumni_earnings, created_at FROM mentorship_sessions WHERE LOWER(mentor_email) = ? AND created_at >= ? AND status IN ('paid', 'scheduled', 'completed')
         UNION ALL
         SELECT alumni_earnings, start_at FROM mentorship_subscriptions WHERE LOWER(mentor_email) = ? AND start_at >= ? AND status IN ('active', 'expired')
       ) combined`,
      [emailLower, monthStart, emailLower, monthStart]
    );

    const thisMonthEarned = parseFloat(thisMonthResult.rows?.[0]?.total || 0);

    const stats = {
      total_earned: totalEarned,
      pending_amount: pendingAmount,
      completed_reviews: 0, // Resume reviews not implemented yet
      completed_sessions: parseInt(sessions.completed_count || 0),
      this_month: thisMonthEarned
    };

    return res.json({ stats });
  } catch (e) {
    console.error('Error in earnings stats:', e);
    return res.status(500).json({ error: e.message });
  }
});

// Get earnings records for an alumni
app.get('/api/alumni/earnings', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const emailLower = email.toLowerCase();

    // Get mentorship session earnings with payment breakdown
    // Include all statuses since 'paid' sessions should show earnings immediately
    const sessionsResult = await dbQuery(
      `SELECT 
        CONCAT('session_', id) as id,
        id as record_id,
        'mentorship' as type,
        'session' as subtype,
        COALESCE(alumni_earnings, 0) as alumni_amount,
        COALESCE(amount, 0) as total_amount,
        CASE WHEN COALESCE(payout_status, 'pending') = 'paid' THEN 'completed' ELSE 'pending' END as status,
        COALESCE(payout_status, 'pending') as payment_status,
        created_at as started_at,
        created_at as date,
        CONCAT('Mentorship Session - ', COALESCE(duration_minutes, 60), ' minutes') as description,
        student_email as student_email,
        mentor_email,
        CONCAT(COALESCE(duration_minutes, 60), ' min') as duration,
        COALESCE(duration_minutes, 60) as duration_value,
        meeting_link,
        pair_key
      FROM mentorship_sessions 
      WHERE LOWER(mentor_email) = ? AND status IN ('paid', 'scheduled', 'completed') AND alumni_earnings > 0
      ORDER BY created_at DESC
      LIMIT 100`,
      [emailLower]
    );

    // Get subscription earnings with payment breakdown
    const subsResult = await dbQuery(
      `SELECT 
        CONCAT('sub_', id) as id,
        id as record_id,
        'mentorship' as type,
        'subscription' as subtype,
        COALESCE(alumni_earnings, 0) as alumni_amount,
        COALESCE(amount, 0) as total_amount,
        CASE WHEN COALESCE(payout_status, 'pending') = 'paid' THEN 'completed' ELSE 'pending' END as status,
        COALESCE(payout_status, 'pending') as payment_status,
        start_at as started_at,
        start_at as date,
        CONCAT('Mentorship Subscription - ', COALESCE(duration_days, 30), ' days') as description,
        student_email as student_email,
        mentor_email,
        CONCAT(COALESCE(duration_days, 30), ' days') as duration,
        COALESCE(duration_days, 30) as duration_value,
        start_at,
        end_at,
        pair_key
      FROM mentorship_subscriptions 
      WHERE LOWER(mentor_email) = ? AND status IN ('active', 'expired') AND alumni_earnings > 0
      ORDER BY start_at DESC
      LIMIT 100`,
      [emailLower]
    );

    // Combine and sort by date
    const allEarnings = [
      ...(sessionsResult.rows || []),
      ...(subsResult.rows || [])
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const earnings = allEarnings.map(e => {
      const alumniAmount = parseFloat(e.alumni_amount || 0);
      const totalAmount = parseFloat(e.total_amount || 0);
      const baseAmount = totalAmount > 0 ? totalAmount / 1.06 : 0;
      const commission = totalAmount - baseAmount;
      
      return {
        id: e.id,
        record_id: e.record_id,
        type: e.type,
        subtype: e.subtype,
        alumni_amount: alumniAmount,
        total_amount: totalAmount,
        base_amount: parseFloat(baseAmount.toFixed(2)),
        commission: parseFloat(commission.toFixed(2)),
        status: e.status,
        payment_status: e.payment_status,
        date: e.date,
        started_at: e.started_at,
        end_at: e.end_at || null,
        description: e.description,
        student_name: e.student_email?.split('@')[0] || 'Student',
        student_email: e.student_email,
        mentor_email: e.mentor_email,
        duration: e.duration,
        duration_value: e.duration_value,
        meeting_link: e.meeting_link || null,
        pair_key: e.pair_key
      };
    });

    return res.json({ earnings });
  } catch (e) {
    console.error('Error in earnings fetch:', e);
    return res.status(500).json({ error: e.message });
  }
});

// Get detailed earnings record (session or subscription)
app.get('/api/alumni/earnings/:recordId/:subtype', async (req, res) => {
  const { email } = req.query;
  const { recordId, subtype } = req.params;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  try {
    const emailLower = email.toLowerCase();
    let result;

    if (subtype === 'session') {
      result = await dbQuery(
        `SELECT 
          id, pair_key, student_email, mentor_email, status, amount, alumni_earnings,
          payout_status, created_at, duration_minutes, meeting_link, 
          ROUND(amount / 1.06, 2) as base_amount,
          ROUND(amount - (amount / 1.06), 2) as commission
        FROM mentorship_sessions
        WHERE id = ? AND LOWER(mentor_email) = ?`,
        [recordId, emailLower]
      );
    } else if (subtype === 'subscription') {
      result = await dbQuery(
        `SELECT 
          id, pair_key, student_email, mentor_email, status, amount, alumni_earnings,
          payout_status, start_at, end_at, duration_days, 
          ROUND(amount / 1.06, 2) as base_amount,
          ROUND(amount - (amount / 1.06), 2) as commission
        FROM mentorship_subscriptions
        WHERE id = ? AND LOWER(mentor_email) = ?`,
        [recordId, emailLower]
      );
    } else {
      return res.status(400).json({ error: 'Invalid subtype. Must be "session" or "subscription"' });
    }

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const record = result.rows[0];
    return res.json({
      detail: {
        id: record.id,
        subtype: subtype,
        pair_key: record.pair_key,
        student_email: record.student_email,
        mentor_email: record.mentor_email,
        status: record.status,
        payout_status: record.payout_status,
        total_amount: parseFloat(record.amount),
        alumni_earnings: parseFloat(record.alumni_earnings),
        base_amount: parseFloat(record.base_amount),
        commission: parseFloat(record.commission),
        duration: subtype === 'session' ? `${record.duration_minutes} minutes` : `${record.duration_days} days`,
        meeting_link: record.meeting_link || null,
        started_at: subtype === 'session' ? record.created_at : record.start_at,
        ended_at: subtype === 'subscription' ? record.end_at : null,
        student_name: record.student_email?.split('@')[0] || 'Student'
      }
    });
  } catch (e) {
    console.error('Error fetching earning detail:', e);
    return res.status(500).json({ error: e.message });
  }
});

// Mark earnings as withdrawn/processed
app.post('/api/alumni/earnings/withdraw', async (req, res) => {
  const { email, amount } = req.body;
  if (!email || !amount) return res.status(400).json({ error: 'Email and amount required' });
  try {
    // Mock withdrawal - in production, implement actual payment processing
    return res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      amount,
      status: 'pending_processing'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

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

// Legacy message upload endpoint kept for compatibility.
app.post('/api/uploads/message-file', messageAttachmentUpload.single('file'), messageAttachmentUploadHandler);

// Create/send a message
app.post('/api/messages', async (req, res) => {
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
        // Determine the other participant
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

    // Compute unread counts
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
    const { rows: subs } = await dbQuery("SELECT id FROM mentorship_subscriptions WHERE pair_key = ? AND status = 'active' AND end_at >= NOW() ORDER BY created_at DESC LIMIT 1", [pair_key]);
    if (subs && subs.length) return { allowed: true };
    const { rows: sess } = await dbQuery("SELECT id, status FROM mentorship_sessions WHERE pair_key = ? AND status IN ('paid','scheduled','completed') ORDER BY created_at DESC LIMIT 1", [pair_key]);
    if (sess && sess.length) return { allowed: true };
    return { allowed: false, reason: 'Free chat limit reached (20 messages). Please purchase a mentorship session or subscription.' };
  } catch (e) {
    return { allowed: true };
  }
}

// Protected messaging endpoint variant enforcing accepted connection (optional usage by frontend)
app.post('/api/messages/connected', async (req, res) => {
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
});

// Edit a recently sent message (sender only, time-limited)
app.put('/api/messages/:id', async (req, res) => {
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
});

// Delete a recently sent message (sender only, time-limited)
app.delete('/api/messages/:id', async (req, res) => {
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
    const normalizedType = String(type || '').trim().toLowerCase();
    if (normalizedType && ['student', 'alumni', 'admin'].includes(normalizedType)) {
      where.push('LOWER(COALESCE(user_type, \'\')) = ?');
      params.push(normalizedType);
    }
    if (q) {
      const tokens = String(q)
        .toLowerCase()
        .replace(/[^a-z0-9@._\-\s]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 8);

      const tokenClauses = [];
      tokens.forEach((token) => {
        const like = `%${token}%`;
        tokenClauses.push(`(
          LOWER(COALESCE(name, '')) LIKE ? OR
          LOWER(COALESCE(email, '')) LIKE ? OR
          LOWER(COALESCE(major, '')) LIKE ? OR
          LOWER(COALESCE(department, '')) LIKE ? OR
          LOWER(COALESCE(company, '')) LIKE ? OR
          LOWER(COALESCE(current_job, '')) LIKE ? OR
          LOWER(COALESCE(job_title, '')) LIKE ? OR
          LOWER(COALESCE(location, '')) LIKE ? OR
          LOWER(COALESCE(skills, '')) LIKE ? OR
          CAST(COALESCE(graduation_year, 0) AS TEXT) LIKE ?
        )`);
        params.push(like, like, like, like, like, like, like, like, like, like);
      });

      if (tokenClauses.length > 0) {
        where.push(`(${tokenClauses.join(' OR ')})`);
      }
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows: list } = await dbQuery(`SELECT id, auth0_id, email, name, picture, bio, phone, university, user_type, graduation_year, major, current_job, company, job_title, location, skills, linkedin_url, github_url, website_url, is_mentor, registration_completed, approval_status, approval_reason, created_at FROM users ${whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`, [...params, l, offset]);
    const { rows: countRows } = await dbQuery(`SELECT COUNT(*) as total FROM users ${whereSql}`, params);
    const total = countRows && countRows[0] ? parseInt(countRows[0].total, 10) : 0;
    return res.json({ users: list, page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Alumni leaderboard (cached aggregate scores)
app.get('/api/leaderboard/alumni', async (req, res) => {
  try {
    const force = String((req.query && req.query.force) || '').toLowerCase();
    const shouldForceRefresh = force === '1' || force === 'true';
    if (!shouldForceRefresh && alumniLeaderboardCache.data && alumniLeaderboardCache.expiresAt > Date.now()) {
      return res.json({ leaders: alumniLeaderboardCache.data, cached: true, ttl_ms: Math.max(0, alumniLeaderboardCache.expiresAt - Date.now()) });
    }

    const sql = `
      SELECT
        u.id,
        u.email,
        COALESCE(u.name, u.email) AS name,
        u.picture AS profile_pic,
        COALESCE(j.jobs, 0) AS jobs,
        COALESCE(r.roadmaps, 0) AS roadmaps,
        COALESCE(m.mentorships, 0) AS mentorships,
        0 AS memories,
        (COALESCE(j.jobs, 0) + COALESCE(r.roadmaps, 0) + COALESCE(m.mentorships, 0)) AS total_points
      FROM users u
      LEFT JOIN (
        SELECT LOWER(posted_by) AS email, COUNT(*)::int AS jobs
        FROM jobs
        GROUP BY LOWER(posted_by)
      ) j ON LOWER(u.email) = j.email
      LEFT JOIN (
        SELECT LOWER(owner_email) AS email, COUNT(*)::int AS roadmaps
        FROM roadmaps
        GROUP BY LOWER(owner_email)
      ) r ON LOWER(u.email) = r.email
      LEFT JOIN (
        SELECT LOWER(mentor_email) AS email, COUNT(*)::int AS mentorships
        FROM mentorship_sessions
        WHERE status = 'completed'
        GROUP BY LOWER(mentor_email)
      ) m ON LOWER(u.email) = m.email
      WHERE u.user_type = 'alumni'
      ORDER BY total_points DESC, name ASC
      LIMIT 500
    `;

    const { rows } = await dbQuery(sql);
    const leaders = rows || [];
    alumniLeaderboardCache = {
      data: leaders,
      expiresAt: Date.now() + LEADERBOARD_CACHE_TTL_MS,
    };

    return res.json({ leaders, cached: false, ttl_ms: LEADERBOARD_CACHE_TTL_MS });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Fetch user by email (public profile view)
app.get('/api/users/by-email', async (req, res) => {
  try {
    const { email } = req.query || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const { rows } = await dbQuery('SELECT id, auth0_id, email, name, picture, bio, phone, university, user_type, graduation_year, major, current_job, company, job_title, location, skills, linkedin_url, github_url, website_url, is_mentor, registration_completed, approval_status, approval_reason, created_at FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json({ user: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// --- Mentors API: list and profile ---
// List mentors with simple filters
app.get('/api/mentors', async (req, res) => {
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
});

// Mentor profile get/upsert
app.get('/api/mentors/profile', async (req, res) => {
  try {
    const { email } = req.query || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const { rows } = await dbQuery('SELECT * FROM mentors WHERE LOWER(mentor_email) = LOWER(?) LIMIT 1', [email]);
    const { rows: userRows } = await dbQuery('SELECT skills FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
    const registeredSkills = userRows && userRows[0] ? (userRows[0].skills || '') : '';

    // Calculate rating only for completed sessions
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

    // Fallback: return a default mentor profile seeded from registered user data
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
});

app.post('/api/mentors/profile', async (req, res) => {
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
});

// --- Events API ---




app.post('/api/events', async (req, res) => {
  try {
    const { title, description, event_date, event_time, duration, location, event_type, is_virtual, image_url, tags, organizer } = req.body;
    console.log("POST /api/events received:", { title, image_url, organizer });

    const user_auth0_id = req.auth?.sub || 'anonymous';

    // Convert array tags to string if needed, or keep as string
    const tagsVal = Array.isArray(tags) ? tags.join(',') : tags;

    const sqlHelper = `
      INSERT INTO events 
      (user_auth0_id, title, description, event_date, event_time, duration, location, event_type, is_virtual, image_url, tags, organizer, approval_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;

    const values = [
      user_auth0_id,
      title,
      description,
      event_date,
      event_time,
      duration,
      location,
      event_type,
      is_virtual,
      image_url,
      tagsVal,
      organizer,
      'pending' // New events start as pending approval
    ];

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const result = await dbQuery(sqlHelper, values);
    res.json({ message: "Success", id: result.rows[0].id });
  } catch (e) {
    console.error("Event Create Error:", e);
    res.status(500).json({ error: e.message });
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
    // Also ensure a connection record reflects this mentorship acceptance/rejection
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
        // When rejected, mark connection rejected if exists
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

// Admin: track mentorship payments
app.get('/api/admin/mentorship-payments', checkJwt, async (req, res) => {
  try {
    // Verify admin
    const email = req.auth && (req.auth['https://schemas.quickstart/email'] || req.auth.email);
    const sub = req.auth && (req.auth.sub || req.auth.sub);
    let isAdmin = false;
    if (email) {
      const { rows } = await dbQuery('SELECT user_type FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
      if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
    }
    if (!isAdmin && sub) {
      const { rows } = await dbQuery('SELECT user_type FROM users WHERE auth0_id = ? LIMIT 1', [sub]);
      if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
    }
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
});

// Admin: Get alumni payouts
app.get('/api/admin/mentorship-payouts', checkJwt, async (req, res) => {
  try {
    // Verify admin
    const email = req.auth && (req.auth['https://schemas.quickstart/email'] || req.auth.email);
    const sub = req.auth && (req.auth.sub || req.auth.sub);
    let isAdmin = false;
    if (email) {
      const { rows } = await dbQuery('SELECT user_type FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
      if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
    }
    if (!isAdmin && sub) {
      const { rows } = await dbQuery('SELECT user_type FROM users WHERE auth0_id = ? LIMIT 1', [sub]);
      if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
    }
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { limit } = req.query || {};
    const limitClause = limit ? `LIMIT ${Math.max(1, parseInt(limit, 10))}` : '';

    const { rows } = await dbQuery(`
      SELECT
        p.mentor_email,
        u.name AS mentor_name,
        m2.payment_upi_id,
        SUM(p.pending_amount) as pending_amount,
        SUM(p.paid_amount) as paid_amount,
        SUM(p.pending_sessions) as pending_sessions,
        SUM(p.pending_subscriptions) as pending_subscriptions,
        (SUM(p.pending_sessions) + SUM(p.pending_subscriptions)) as pending_transactions
      FROM (
        SELECT
          m.mentor_email,
          SUM(CASE WHEN COALESCE(m.payout_status, 'pending') = 'pending' THEN m.alumni_earnings ELSE 0 END) as pending_amount,
          SUM(CASE WHEN COALESCE(m.payout_status, 'pending') = 'paid' THEN m.alumni_earnings ELSE 0 END) as paid_amount,
          COUNT(CASE WHEN COALESCE(m.payout_status, 'pending') = 'pending' THEN 1 END) as pending_sessions,
          0::bigint as pending_subscriptions
        FROM mentorship_sessions m
        WHERE m.status IN ('paid', 'scheduled', 'completed')
        GROUP BY m.mentor_email

        UNION ALL

        SELECT
          s.mentor_email,
          SUM(CASE WHEN COALESCE(s.payout_status, 'pending') = 'pending' THEN s.alumni_earnings ELSE 0 END) as pending_amount,
          SUM(CASE WHEN COALESCE(s.payout_status, 'pending') = 'paid' THEN s.alumni_earnings ELSE 0 END) as paid_amount,
          0::bigint as pending_sessions,
          COUNT(CASE WHEN COALESCE(s.payout_status, 'pending') = 'pending' THEN 1 END) as pending_subscriptions
        FROM mentorship_subscriptions s
        WHERE s.status IN ('active', 'expired', 'cancelled')
        GROUP BY s.mentor_email
      ) p
      LEFT JOIN users u ON LOWER(u.email) = LOWER(p.mentor_email)
      LEFT JOIN mentors m2 ON LOWER(m2.mentor_email) = LOWER(p.mentor_email)
      GROUP BY p.mentor_email, u.name, m2.payment_upi_id
      ORDER BY pending_amount DESC
      ${limitClause}
    `);
    
    return res.json({ payouts: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Admin: Mark alumni payout as paid
app.post('/api/admin/mentorship-payouts/mark-paid', checkJwt, async (req, res) => {
  try {
    // Verify admin
    const email = req.auth && (req.auth['https://schemas.quickstart/email'] || req.auth.email);
    const sub = req.auth && (req.auth.sub || req.auth.sub);
    let isAdmin = false;
    if (email) {
      const { rows } = await dbQuery('SELECT user_type FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
      if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
    }
    if (!isAdmin && sub) {
      const { rows } = await dbQuery('SELECT user_type FROM users WHERE auth0_id = ? LIMIT 1', [sub]);
      if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') isAdmin = true;
    }
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { mentor_email } = req.body;
    if (!mentor_email) return res.status(400).json({ error: 'mentor_email required' });

    const { rows: sessionRows } = await dbQuery(`
      UPDATE mentorship_sessions 
      SET payout_status = 'paid' 
      WHERE LOWER(mentor_email) = LOWER(?) 
        AND payout_status = 'pending' 
        AND status IN ('paid', 'scheduled', 'completed')
      RETURNING id
    `, [mentor_email]);

    const { rows: subscriptionRows } = await dbQuery(`
      UPDATE mentorship_subscriptions
      SET payout_status = 'paid', updated_at = NOW()
      WHERE LOWER(mentor_email) = LOWER(?)
        AND COALESCE(payout_status, 'pending') = 'pending'
        AND status IN ('active', 'expired', 'cancelled')
      RETURNING id
    `, [mentor_email]);

    const updatedSessionCount = sessionRows ? sessionRows.length : 0;
    const updatedSubscriptionCount = subscriptionRows ? subscriptionRows.length : 0;

    return res.json({
      success: true,
      updated_count: updatedSessionCount + updatedSubscriptionCount,
      updated_session_count: updatedSessionCount,
      updated_subscription_count: updatedSubscriptionCount,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Record a paid session (after payment)
app.post('/api/mentorship/sessions/purchase', async (req, res) => {
  const { student_email, mentor_email, amount, currency = 'INR', payment_id, order_id } = req.body || {};
  if (!student_email || !mentor_email || !amount) return res.status(400).json({ error: 'student_email, mentor_email and amount required' });
  try {
    const totalPaid = Number(amount);
    // Calculations: Student pays Base * 1.06, so Base = totalPaid / 1.06
    const baseAmount = totalPaid / 1.06;
    // Alumni receives Base * 0.94
    const alumniEarnings = baseAmount * 0.94;
    // Platform fee is totalPaid - alumniEarnings (which equals 12% of Base)
    const platformFee = totalPaid - alumniEarnings;

    const pair_key = buildPairKey(student_email, mentor_email);
    const { rows } = await dbQuery(
      'INSERT INTO mentorship_sessions (pair_key, student_email, mentor_email, status, amount, currency, payment_id, order_id, platform_fee, alumni_earnings) VALUES (?, ?, ?, \'paid\', ?, ?, ?, ?, ?, ?) RETURNING *',
      [pair_key, student_email, mentor_email, totalPaid, currency || 'INR', payment_id || null, order_id || null, Number(platformFee.toFixed(2)), Number(alumniEarnings.toFixed(2))]
    );
    return res.status(201).json({ session: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Record a mentor subscription purchase
app.post('/api/mentorship/subscriptions/purchase', async (req, res) => {
  const { student_email, mentor_email, amount, currency = 'INR', duration_days = 30, payment_id, order_id } = req.body || {};
  if (!student_email || !mentor_email || !amount) {
    return res.status(400).json({ error: 'student_email, mentor_email and amount required' });
  }
  try {
    const totalPaid = Number(amount);
    const baseAmount = totalPaid / 1.06;
    const alumniEarnings = baseAmount * 0.94;
    const platformFee = totalPaid - alumniEarnings;
    const pair_key = buildPairKey(student_email, mentor_email);
    const days = Math.max(1, Number(duration_days) || 30);
    const endAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const { rows } = await dbQuery(
      `INSERT INTO mentorship_subscriptions
        (pair_key, student_email, mentor_email, status, amount, currency, duration_days, start_at, end_at, payment_id, order_id, platform_fee, alumni_earnings)
       VALUES (?, ?, ?, 'active', ?, ?, ?, NOW(), ?, ?, ?, ?, ?) RETURNING *`,
      [
        pair_key,
        student_email,
        mentor_email,
        totalPaid,
        currency || 'INR',
        days,
        endAt,
        payment_id || null,
        order_id || null,
        Number(platformFee.toFixed(2)),
        Number(alumniEarnings.toFixed(2)),
      ]
    );
    return res.status(201).json({ subscription: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List subscriptions for mentor or student
app.get('/api/mentorship/subscriptions', async (req, res) => {
  const { mentor_email, student_email, active_only } = req.query || {};
  if (!mentor_email && !student_email) return res.status(400).json({ error: 'mentor_email or student_email required' });
  try {
    let sql = 'SELECT * FROM mentorship_subscriptions WHERE 1=1';
    const params = [];
    if (mentor_email) { sql += ' AND mentor_email = ?'; params.push(mentor_email); }
    if (student_email) { sql += ' AND student_email = ?'; params.push(student_email); }
    if (active_only === '1' || active_only === 'true') {
      sql += " AND status = 'active' AND end_at >= NOW()";
    }
    sql += ' ORDER BY created_at DESC LIMIT 300';
    const { rows } = await dbQuery(sql, params);
    return res.json({ subscriptions: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Mentor creates daily recurring session plan for mentees
app.post('/api/mentorship/daily-sessions', async (req, res) => {
  const {
    mentor_email,
    title,
    description,
    daily_time,
    timezone = 'Asia/Kolkata',
    start_date,
    end_date,
    duration_minutes = 60,
    meeting_link,
    max_mentees = 50,
  } = req.body || {};

  if (!mentor_email || !title || !daily_time || !start_date || !end_date) {
    return res.status(400).json({ error: 'mentor_email, title, daily_time, start_date, end_date required' });
  }

  try {
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ error: 'Invalid start_date/end_date range' });
    }
    const { rows } = await dbQuery(
      `INSERT INTO mentor_daily_sessions
        (mentor_email, title, description, daily_time, timezone, start_date, end_date, duration_minutes, meeting_link, max_mentees, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
       RETURNING *`,
      [
        mentor_email,
        title,
        description || null,
        daily_time,
        timezone || 'Asia/Kolkata',
        start_date,
        end_date,
        Math.max(15, Number(duration_minutes) || 60),
        meeting_link || null,
        Math.max(1, Number(max_mentees) || 50),
      ]
    );
    return res.status(201).json({ daily_session: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List daily session plans (mentor view or student view)
app.get('/api/mentorship/daily-sessions', async (req, res) => {
  const { mentor_email, student_email, active_only } = req.query || {};
  if (!mentor_email && !student_email) {
    return res.status(400).json({ error: 'mentor_email or student_email required' });
  }
  try {
    if (mentor_email) {
      let sql = 'SELECT * FROM mentor_daily_sessions WHERE LOWER(mentor_email) = LOWER(?)';
      const params = [mentor_email];
      if (active_only === '1' || active_only === 'true') {
        sql += ' AND is_active = TRUE AND end_date >= CURRENT_DATE';
      }
      sql += ' ORDER BY created_at DESC LIMIT 300';
      const { rows } = await dbQuery(sql, params);
      return res.json({ daily_sessions: rows });
    }

    // Student can view active daily plans only from accepted mentors.
    const { rows } = await dbQuery(
      `SELECT ds.*
       FROM mentor_daily_sessions ds
       JOIN mentorship_requests mr
         ON mr.mentor_email = ds.mentor_email
       WHERE mr.student_email = ?
         AND mr.status = 'accepted'
         AND ds.is_active = TRUE
         AND ds.end_date >= CURRENT_DATE
       ORDER BY ds.daily_time ASC, ds.created_at DESC
       LIMIT 300`,
      [student_email]
    );
    return res.json({ daily_sessions: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Mentor delete/deactivate daily session plan
app.delete('/api/mentorship/daily-sessions/:id', async (req, res) => {
  const { id } = req.params;
  const mentor_email = (req.body && req.body.mentor_email) || (req.query && req.query.mentor_email);
  if (!id || !mentor_email) return res.status(400).json({ error: 'id and mentor_email required' });
  try {
    const { rows } = await dbQuery(
      'UPDATE mentor_daily_sessions SET is_active = FALSE, updated_at = NOW() WHERE id = ? AND LOWER(mentor_email) = LOWER(?) RETURNING *',
      [id, mentor_email]
    );
    if (!rows || !rows.length) return res.status(404).json({ error: 'Daily session not found' });
    return res.json({ daily_session: rows[0] });
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
    let sql = 'SELECT ms.*';
    const params = [];
    if (student_email) {
      sql += ', CASE WHEN EXISTS (SELECT 1 FROM mentor_ratings mr WHERE mr.session_id = ms.id AND LOWER(mr.student_email) = LOWER(?)) THEN TRUE ELSE FALSE END AS is_rated';
      params.push(student_email);
    }
    sql += ' FROM mentorship_sessions ms WHERE 1=1';
    if (mentor_email) { sql += ' AND ms.mentor_email = ?'; params.push(mentor_email); }
    if (student_email) { sql += ' AND ms.student_email = ?'; params.push(student_email); }
    if (status) { sql += ' AND ms.status = ?'; params.push(status); }
    // Order: scheduled sessions first (by scheduled_at ascending), then others by created_at descending
    sql += ' ORDER BY CASE WHEN ms.status = \'scheduled\' THEN 0 ELSE 1 END ASC, CASE WHEN ms.status = \'scheduled\' THEN ms.scheduled_at ELSE ms.created_at END ASC LIMIT 200';
    const { rows } = await dbQuery(sql, params);
    return res.json({ sessions: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Submit rating for a mentor after session
app.post('/api/mentorship/ratings', async (req, res) => {
  const { session_id, student_email, mentor_email, rating, feedback } = req.body || {};
  
  // Validate all required fields
  if (!session_id || !student_email || !mentor_email || !rating) {
    return res.status(400).json({ error: 'session_id, student_email, mentor_email and rating required' });
  }
  
  try {
    // Verify session exists and belongs to the correct mentor and student
    const { rows: sessions } = await dbQuery(
      'SELECT * FROM mentorship_sessions WHERE id = ? AND student_email = ? AND mentor_email = ?',
      [session_id, student_email, mentor_email]
    );
    
    if (!sessions || !sessions.length) {
      return res.status(404).json({ error: 'Session not found or does not match student/mentor pair' });
    }
    
    const session = sessions[0];
    
    // Check if session is completed or past time
    if (session.status !== 'completed' && session.scheduled_at) {
      const start = new Date(session.scheduled_at).getTime();
      const durationMs = (session.duration_minutes || 60) * 60 * 1000;
      if (Date.now() < start + durationMs) {
        return res.status(400).json({ error: 'Session must be completed before rating' });
      }
    }
    
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
    if (e.message && e.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'You have already submitted a rating for this session.' });
    }
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
const memoryImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (allowedImageTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Invalid image type. Only JPG, PNG, WEBP, GIF are allowed.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Memory image upload to Cloudinary
app.post('/api/uploads/memory-image', memoryImageUpload.single('image'), async (req, res) => {
  try {
    console.log('[MEMORY IMAGE UPLOAD] Received request');
    
    if (!req.file) {
      console.error('[MEMORY IMAGE UPLOAD] No file in request');
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    console.log('[MEMORY IMAGE UPLOAD] File details:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      bufferlength: req.file.buffer.length
    });
    
    const result = await uploadMemoryImage(req.file.buffer, req.file.originalname);
    const viewUrl = getViewUrl(result, req.file.originalname);
    const downloadUrl = getDownloadUrl(viewUrl, req.file.originalname);
    
    console.log('[MEMORY IMAGE UPLOAD] Success:', {
      url: viewUrl,
      publicId: result.public_id
    });
    
    return res.json({
      url: viewUrl,
      downloadUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      publicId: result.public_id,
    });
  } catch (e) {
    console.error('[MEMORY IMAGE UPLOAD] Error:', e.message || e);
    return res.status(500).json({ 
      error: e.message || 'Failed to upload image',
      details: process.env.NODE_ENV === 'development' ? e.toString() : undefined
    });
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
      type
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
    console.error("Memory Create Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// List memories with optional filters
app.get('/api/memories', async (req, res) => {
  try {
    const { page = 1, limit = 20, q, tag, author } = req.query || {};
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;
    const where = [];
    const params = [];
    if (q) { where.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)'); const like = `%${String(q).toLowerCase()}%`; params.push(like, like); }
    if (tag) { where.push('tags LIKE ?'); params.push(`%${String(tag)}%`); }
    if (author) { where.push('LOWER(author_name) = LOWER(?)'); params.push(author); }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows } = await dbQuery(`SELECT * FROM memories ${whereSql} ORDER BY COALESCE(date, created_at) DESC LIMIT ? OFFSET ?`, [...params, l, offset]);
    return res.json({ memories: rows, page: p, limit: l });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Get single memory by id
app.get('/api/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await dbQuery('SELECT * FROM memories WHERE id = ? LIMIT 1', [id]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json({ memory: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Register for event
app.post('/api/events/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_email, user_name } = req.body;

    if (!user_email) return res.status(400).json({ error: 'Email is required' });

    // Check if event exists
    const eventRes = await dbQuery('SELECT * FROM events WHERE id = ?', [id]);
    const event = eventRes.rows[0];
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check if already registered
    const check = await dbQuery('SELECT * FROM event_registrations WHERE event_id = ? AND user_email = ?', [id, user_email]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Already registered' });

    // Register
    await dbQuery('INSERT INTO event_registrations (event_id, user_email, user_name) VALUES (?, ?, ?)', [id, user_email, user_name]);

    // Update attendee count
    await dbQuery('UPDATE events SET current_attendees = current_attendees + 1 WHERE id = ?', [id]);

    // Send Email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mode = event.is_virtual ? 'Virtual (Online)' : 'Offline (In-person)';
      const locationLabel = event.is_virtual ? 'Meeting Link' : 'Venue';
      const locationValue = event.location || 'TBD';
      const organizer = event.organizer || 'Alumni Coordinator';

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user_email,
        subject: `Registration Confirmed: ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #4F46E5; padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Event Registration Confirmed</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
              <p style="font-size: 16px; color: #333;">Hi ${user_name || 'Student'},</p>
              <p style="font-size: 16px; color: #333;">You have successfully registered for <strong>${event.title}</strong>.</p>
              
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 8px 0; color: #555; font-style: italic;">"${event.description || 'Join us for this exciting event!'}"</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
                <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${new Date(event.event_date).toDateString()}</p>
                <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${event.event_time || 'TBD'}</p>
                <p style="margin: 8px 0;"><strong>📍 Mode:</strong> ${mode}</p>
                <p style="margin: 8px 0;"><strong>🔗 ${locationLabel}:</strong> ${event.is_virtual ? `<a href="${locationValue}" style="color: #4F46E5;">${locationValue}</a>` : locationValue}</p>
                <p style="margin: 8px 0;"><strong>👤 Posted By:</strong> ${organizer}</p>
              </div>

              <p style="font-size: 14px; color: #666;">We look forward to seeing you there!</p>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #999;">
              ConnectingFuture Alumni Portal
            </div>
          </div>
        `
      };

      try {
        await new Promise((resolve, reject) => {
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Email error:', error);
              reject(error);
            } else {
              console.log('Email sent:', info.response);
              resolve(info);
            }
          });
        });
      } catch (emailErr) {
        console.error("Failed to send email but registration recorded:", emailErr);
        // Decide if we want to fail the request or just warn. 
        // For now, let's keep registration as success but log heavily.
        // Or actually, let's return a warning in the JSON.
      }
    } else {
      console.log('Skipping email: EMAIL_USER/PASS not set');
    }

    res.json({ message: 'Registration successful' });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ error: e.message });
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
// === RESUME REVIEWS ENDPOINTS ===

// GET /api/resume-reviews/mentors - Get approved alumni mentors
app.get('/api/resume-reviews/mentors', async (req, res) => {
  try {
    const { student_email } = req.query || {};
    
    const { rows: allMentors } = await dbQuery(`
      SELECT id, email, name, picture, skills, graduation_year, major, 
             job_title, company, location, bio, is_mentor
      FROM users 
      WHERE user_type = 'alumni' 
        AND approval_status = 'approved' 
        AND is_mentor = true
      ORDER BY name ASC
    `);
    
    let mentors = (allMentors || []).map(m => ({
      email: m.email,
      name: m.name || m.email,
      picture: m.picture,
      skills: m.skills,
      graduation_year: m.graduation_year,
      major: m.major,
      job_title: m.job_title,
      company: m.company,
      location: m.location,
      bio: m.bio,
      isConnected: false,
      connectionStatus: 'none',
    }));
    
    if (student_email) {
      const decodedEmail = decodeURIComponent(student_email);
      const { rows: connections } = await dbQuery(`
        SELECT mentor_email, status FROM mentorship_requests 
        WHERE student_email = $1
      `, [decodedEmail]);
      
      const connectionMap = new Map();
      (connections || []).forEach(c => {
        connectionMap.set(c.mentor_email, c.status);
      });
      
      mentors = mentors.map(m => ({
        ...m,
        isConnected: connectionMap.has(m.email) && connectionMap.get(m.email) === 'accepted',
        connectionStatus: connectionMap.get(m.email) || 'none',
      }));
      
      mentors.sort((a, b) => {
        if (a.isConnected !== b.isConnected) {
          return a.isConnected ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    }
    
    return res.json({ mentors });
  } catch (e) {
    console.error('Error fetching mentors:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/resume-reviews/request - Student submits request
app.post('/api/resume-reviews/request', async (req, res) => {
  try {
    const { student_email, alumni_email, resume_url, filename, student_message } = req.body;
        
    if (!student_email || !alumni_email || !resume_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch student info from users table
    const { rows: studentCheck } = await dbQuery(`
      SELECT email, name FROM users
      WHERE email = $1 AND user_type = 'student'
    `, [student_email]);
    
    if (studentCheck.length === 0) {
      return res.status(400).json({ error: 'Student not found or invalid user type' });
    }

    const correctStudentEmail = studentCheck[0].email;
    const correctStudentName = studentCheck[0].name || 'Student';

    // Fetch alumni info from users table
    const { rows: alumniCheck } = await dbQuery(`
      SELECT email, name FROM users
      WHERE email = $1 AND user_type = 'alumni' AND approval_status = 'approved' AND is_mentor = true
    `, [alumni_email]);
    
    if (alumniCheck.length === 0) {
      return res.status(400).json({ error: 'Selected mentor not available' });
    }

    const correctAlumniEmail = alumniCheck[0].email;
    const correctAlumniName = alumniCheck[0].name || 'Alumni';
    const pair_key = `${correctStudentEmail}|${correctAlumniEmail}|resume`;
    
    const result = await dbQuery(`
      INSERT INTO resume_reviews (
        pair_key, student_email, student_name, alumni_email, alumni_name,
        resume_url, filename, student_message, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [pair_key, correctStudentEmail, correctStudentName, correctAlumniEmail, correctAlumniName, resume_url, filename, student_message, 'pending']);

    console.log('[RESUME REQUEST CREATED] ID:', result.rows[0].id, 'Student:', result.rows[0].student_name, 'Alumni:', result.rows[0].alumni_name);
    return res.status(201).json({ review: result.rows[0] });
  } catch (e) {
    console.error('[RESUME REQUEST ERROR]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/resume-reviews/student/:email - Student views their requests
app.get('/api/resume-reviews/student/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);
    
    const result = await dbQuery(`
      SELECT * FROM resume_reviews
      WHERE student_email = $1
      ORDER BY requested_at DESC
    `, [decodedEmail]);

    const normalizedReviews = (result.rows || []).map((row) => ({
      ...row,
      resume_url: row.resume_url ? getViewUrl(row.resume_url, row.filename || '') : row.resume_url,
      download_url: row.resume_url ? getProxyDownloadUrl(getViewUrl(row.resume_url, row.filename || ''), row.filename || '') : null,
    }));

    return res.json({ reviews: normalizedReviews });
  } catch (e) {
    console.error('Error fetching student reviews:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/resume-reviews/alumni/:email - Alumni views their requests
app.get('/api/resume-reviews/alumni/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);
    
    console.log('[ALUMNI FETCH] Email:', decodedEmail);
    
    const result = await dbQuery(`
      SELECT 
        id, pair_key, student_email, student_name, alumni_email, alumni_name,
        resume_url, filename, status, student_message, alumni_feedback,
        requested_at, accepted_at, completed_at, rejected_at, created_at, updated_at
      FROM resume_reviews
      WHERE LOWER(alumni_email) = LOWER($1)
      ORDER BY 
        CASE WHEN status = 'pending' THEN 0 
             WHEN status = 'accepted' THEN 1 
             WHEN status = 'completed' THEN 2
             ELSE 3 END,
        requested_at DESC
    `, [decodedEmail]);

    
    // Transform data to ensure clean response
    const transformedReviews = result.rows.map(row => ({
      ...row,
      resume_url: row.resume_url ? getViewUrl(row.resume_url, row.filename || '') : row.resume_url,
      download_url: row.resume_url ? getProxyDownloadUrl(getViewUrl(row.resume_url, row.filename || ''), row.filename || '') : null,
      student_name: row.student_name || null,
      alumini_feedback: row.alumni_feedback || null
    }));
    
    if (transformedReviews.length > 0) {    }
    
    return res.json({ reviews: transformedReviews });
  } catch (e) {
    console.error('Error fetching alumni reviews:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/resume-reviews/:id/accept - Alumni accepts request
app.post('/api/resume-reviews/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbQuery(`
      UPDATE resume_reviews
      SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('[RESUME ACCEPTED] ID:', id);
    return res.json({ review: result.rows[0] });
  } catch (e) {
    console.error('Error accepting request:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/resume-reviews/:id/reject - Alumni rejects request
app.post('/api/resume-reviews/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbQuery(`
      UPDATE resume_reviews
      SET status = 'rejected', rejected_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('[RESUME REJECTED] ID:', id);
    return res.json({ review: result.rows[0] });
  } catch (e) {
    console.error('Error rejecting request:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/resume-reviews/:id/submit-feedback - Alumni submits feedback
app.post('/api/resume-reviews/:id/submit-feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { alumni_feedback } = req.body;
    
    if (!alumni_feedback) {
      return res.status(400).json({ error: 'Feedback is required' });
    }

    const result = await dbQuery(`
      UPDATE resume_reviews
      SET status = 'completed', alumni_feedback = $1, completed_at = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [alumni_feedback, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('[FEEDBACK SUBMITTED] ID:', id);
    return res.json({ review: result.rows[0] });
  } catch (e) {
    console.error('Error submitting feedback:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// DEBUG: GET /api/resume-reviews/debug - Show all resume reviews
app.get('/api/resume-reviews/debug', async (req, res) => {
  try {
    const allReviews = await dbQuery(`
      SELECT id, pair_key, student_email, alumni_email, status, filename, requested_at 
      FROM resume_reviews 
      ORDER BY requested_at DESC
    `);
    
    const stats = {
      totalRecords: allReviews.rows.length,
      byStatus: {},
      byAlumniEmail: {},
      records: allReviews.rows
    };
    
    allReviews.rows.forEach(row => {
      stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + 1;
      stats.byAlumniEmail[row.alumni_email] = (stats.byAlumniEmail[row.alumni_email] || 0) + 1;
    });
    
    return res.json(stats);
  } catch (e) {
    console.error('Debug endpoint error:', e.message);
    return res.status(500).json({ error: e.message });
  }
});
