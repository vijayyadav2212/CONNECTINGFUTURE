/* Legacy MySQL server block disabled
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const mysql = require('mysql2');

require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mockapp_db',
  port: process.env.DB_PORT || 3306,
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    console.log('Please check your MySQL configuration in .env file');
    console.log('Current config:', {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'connectingfuture',
      port: process.env.DB_PORT || 3306,
      passwordSet: !!process.env.DB_PASSWORD
    });
  } else {
    console.log('Connected to MySQL database');
    // Initialize tables if they don't exist
    initializeTables();
  }
});

// Initialize database tables
function initializeTables() {
  // Check if the donations table has the right structure
  db.query('DESCRIBE donations', (err, results) => {
    if (err) {
      console.log('Donations table does not exist, creating new one...');
      createNewDonationsTable();
    } else {
      console.log('Existing donations table found with structure:', results.map(r => r.Field));
      
      // Check if it has the columns we need
      const existingColumns = results.map(r => r.Field);
      const requiredColumns = ['donor_name', 'donor_email'];
      const hasRequiredColumns = requiredColumns.every(col => existingColumns.includes(col));
      
      if (!hasRequiredColumns) {
        console.log('Existing table structure is different. Adding missing columns...');
        alterExistingTable();
      } else {
        console.log('Donations table structure is compatible');
      }
    }
  });
}

// Alter existing table to add missing columns
function alterExistingTable() {
  const alterQueries = [
    "ALTER TABLE donations ADD COLUMN donor_name VARCHAR(255) DEFAULT ''",
    "ALTER TABLE donations ADD COLUMN donor_email VARCHAR(255) DEFAULT ''", 
    "ALTER TABLE donations ADD COLUMN donor_phone VARCHAR(20)",
    "ALTER TABLE donations ADD COLUMN currency VARCHAR(3) DEFAULT 'INR'",
    "ALTER TABLE donations ADD COLUMN payment_method VARCHAR(50) DEFAULT 'razorpay'",
    "ALTER TABLE donations ADD COLUMN razorpay_order_id VARCHAR(255)",
    "ALTER TABLE donations ADD COLUMN razorpay_payment_id VARCHAR(255)",
    "ALTER TABLE donations ADD COLUMN razorpay_signature VARCHAR(255)",
    "ALTER TABLE donations ADD COLUMN transaction_status VARCHAR(20) DEFAULT 'completed'",
    "ALTER TABLE donations ADD COLUMN donation_type VARCHAR(20) DEFAULT 'one-time'",
    "ALTER TABLE donations ADD COLUMN cause_category VARCHAR(100)",
    "ALTER TABLE donations ADD COLUMN anonymous BOOLEAN DEFAULT FALSE",
    "ALTER TABLE donations ADD COLUMN message TEXT",
    "ALTER TABLE donations ADD COLUMN receipt_sent BOOLEAN DEFAULT FALSE"
  ];

  let completed = 0;
  alterQueries.forEach((query, index) => {
    db.query(query, (err) => {
      if (err && !err.message.includes('Duplicate column name')) {
        console.error(`Error in alter query ${index + 1}:`, err.message);
      } else if (!err) {
        console.log(`Added column ${index + 1} successfully`);
      }
      completed++;
      if (completed === alterQueries.length) {
        console.log('Table structure update completed');
        // Update existing records to have donor_email = user_email if empty
        updateExistingRecords();
      }
    });
  });
}

// Update existing records to map user_email to donor_email
function updateExistingRecords() {
  // First check if both columns exist
  db.query('DESCRIBE donations', (err, results) => {
    if (err) {
      console.error('Error checking table structure:', err.message);
      return;
    }
    
    const columns = results.map(r => r.Field);
    const hasUserEmail = columns.includes('user_email');
    const hasDonorEmail = columns.includes('donor_email');
    
    if (hasUserEmail && hasDonorEmail) {
      // Update donor_email from user_email where donor_email is empty
      db.query(`
        UPDATE donations 
        SET donor_email = user_email, 
            donor_name = COALESCE(NULLIF(donor_name, ''), 'Anonymous Donor'),
            transaction_status = CASE 
              WHEN status = 'completed' THEN 'completed'
              WHEN status = 'pending' THEN 'pending'
              WHEN status = 'failed' THEN 'failed'
              ELSE 'completed'
            END
        WHERE donor_email = '' OR donor_email IS NULL
      `, (err, result) => {
        if (err) {
          console.error('Error updating existing records:', err.message);
        } else {
          console.log(`Updated ${result.affectedRows} existing donation records`);
        }
      });
    } else {
      console.log('Table structure update complete - no existing records to migrate');
    }
  });
}

// Create new donations table (fallback)
function createNewDonationsTable() {
  const createDonationsTable = `
    CREATE TABLE IF NOT EXISTS donations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      donor_name VARCHAR(255) NOT NULL,
      donor_email VARCHAR(255) NOT NULL,
      donor_phone VARCHAR(20),
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'INR',
      payment_method VARCHAR(50) NOT NULL,
      payment_id VARCHAR(255) UNIQUE,
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255),
      razorpay_signature VARCHAR(255),
      transaction_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
      donation_type ENUM('one-time', 'monthly', 'yearly') DEFAULT 'one-time',
      cause_category VARCHAR(100),
      anonymous BOOLEAN DEFAULT FALSE,
      message TEXT,
      receipt_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_donor_email (donor_email),
      INDEX idx_payment_id (payment_id),
      INDEX idx_transaction_status (transaction_status),
      INDEX idx_created_at (created_at)
    )
  `;

  db.query(createDonationsTable, (err) => {
    if (err) {
      console.error('Error creating donations table:', err);
    } else {
      console.log('New donations table created successfully');
    }
  });
}

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
  const dbStatus = dbHelpers ? 'connected' : 'disconnected';
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    auth0: {
      domain: process.env.AUTH0_DOMAIN ? 'configured' : 'not configured',
      audience: process.env.AUTH0_AUDIENCE ? 'configured' : 'not configured'
    }
  });
});

// Protected route example
app.get('/api/protected', checkJwt, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.auth });
});

// Store user info after login (example endpoint)
app.post('/api/users', checkJwt, (req, res) => {
  const { sub, email } = req.body;
  if (!sub || !email) {
    return res.status(400).json({ error: 'Missing user info' });
  }
  db.query(
    'INSERT INTO users (auth0_id, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE email = VALUES(email)',
    [sub, email],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err });
      }
      res.json({ message: 'User stored/updated', results });
    }
  );
});

// Donation endpoints
app.get('/api/donations', (req, res) => {
  const { page = 1, limit = 10, status, donor_email } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM donations';
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
  db.query(countQuery, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const total = countResult[0].total;
    
    // Get paginated results
    db.query(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        donations: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    });
  });
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
  `;

  const values = [
    donor_name, donor_email, donor_email, donor_phone, amount, currency, payment_method,
    payment_id, razorpay_order_id || payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
    transaction_status, donation_type, cause_category, anonymous, message, message
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      id: result.insertId,
      donor_name,
      donor_email,
      amount,
      transaction_status,
      created_at: new Date().toISOString()
    });
  });
});

app.get('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('SELECT * FROM donations WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    res.json(results[0]);
  });
});

app.put('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Get current donation
  db.query('SELECT * FROM donations WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
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
    
    db.query(query, values, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ message: 'Donation updated successfully' });
    });
  });
});

app.delete('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM donations WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    res.json({ message: 'Donation deleted successfully' });
  });
});

// Analytics endpoint
app.get('/api/donations/analytics/summary', (req, res) => {
  const queries = {
    totalAmount: 'SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE transaction_status = "completed"',
    totalDonations: 'SELECT COUNT(*) as count FROM donations WHERE transaction_status = "completed"',
    monthlyAmount: `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM donations 
      WHERE transaction_status = "completed" 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    `,
    monthlyDonations: `
      SELECT COUNT(*) as count 
      FROM donations 
      WHERE transaction_status = "completed" 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.query(query, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      results[key] = result[0];
      completed++;
      
      if (completed === totalQueries) {
        res.json({
          totalDonationAmount: results.totalAmount.total,
          totalDonations: results.totalDonations.count,
          monthlyDonationAmount: results.monthlyAmount.total,
          monthlyDonations: results.monthlyDonations.count
        });
      }
    });
  });
});


// 1. GET ALL EVENTS
app.get('/api/events', (req, res) => {
  // matches your NEW database schema names
  const query = "SELECT * FROM events ORDER BY event_date DESC";
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ error: "Failed to fetch events" });
    }
    res.json(results);
  });
});

// 2. CREATE EVENT
app.post('/api/events', (req, res) => {
  // We use the NEW variable names from your schema
  const { title, description, event_date, location, event_type, is_virtual } = req.body;
  
  // Temporary: Use a fake Admin ID until login is finished
  const user_auth0_id = 'auth0|test_admin_123'; 

  const sql = `
    INSERT INTO events 
    (user_auth0_id, title, description, event_date, location, event_type, is_virtual)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [user_auth0_id, title, description, event_date, location, event_type, is_virtual];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Save Error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Success", id: result.insertId });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
}); 
*/

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
const fetchFn = (global.fetch ? global.fetch : ((...args) => import('node-fetch').then(({default: f}) => f(...args))));
const fetch = (...args) => fetchFn(...args);

// Modularized DB schema creators
const { createMessagesSchema } = require('./database/messages');
const { createDonationsSchema } = require('./database/donations');
const { createRoadmapsSchema } = require('./database/roadmaps');
const { createConnectionsSchema } = require('./database/connections');
const { createJobsSchema } = require('./database/jobs');
const { createApplicationsSchema } = require('./database/applications');
const { createMentorshipSchema } = require('./database/mentorship');

dotenv.config({ path: __dirname + '/.env' });

const app = express();
app.use(cors());
app.use(express.json());
// Serve uploaded files statically
const uploadsRoot = path.join(__dirname, 'uploads');
const resumesDir = path.join(uploadsRoot, 'resumes');
try {
  if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);
  if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir);
} catch {}
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
  // Initialize modularized schemas 
  await createMessagesSchema(dbQuery);
  await createDonationsSchema(dbQuery);
  await createRoadmapsSchema(dbQuery);
  await createConnectionsSchema(dbQuery);
  await createJobsSchema(dbQuery);
  await createApplicationsSchema(dbQuery);
  await createMentorshipSchema(dbQuery);

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
      const fname = `${Date.now()}_${Math.random().toString(36).slice(2,8)}_${base}${ext}`;
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
      is_published = false
    } = req.body || {};

    if (!owner_email || !title || !description || !category || !level || !duration || !phases) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { rows } = await dbQuery(`
      INSERT INTO roadmaps (owner_email, title, description, category, level, duration, phases, tags, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [owner_email, title, description, category, level, duration, parseInt(phases, 10), tags || null, !!is_published]);

    return res.status(201).json(rows && rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List roadmaps (optionally filter by owner)
app.get('/api/roadmaps', async (req, res) => {
  try {
    const { owner_email, page = 1, limit = 20 } = req.query || {};
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    if (owner_email) {
      const { rows } = await dbQuery('SELECT * FROM roadmaps WHERE owner_email = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?', [owner_email, l, offset]);
      return res.json({ roadmaps: rows, page: p, limit: l });
    }

    const { rows } = await dbQuery('SELECT * FROM roadmaps ORDER BY updated_at DESC LIMIT ? OFFSET ?', [l, offset]);
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
    const allowed = ['title','description','category','level','duration','phases','tags','is_published'];
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
      'title','company','location','description','responsibilities','requirements','benefits',
      'salary_min','salary_max','currency','tags','status','featured','logo','industry','job_type',
      'is_remote','application_deadline','contact_person','application_method','application_url'
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
    const allowed = ['applied','withdrawn','accepted','rejected'];
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
  if (!user_email || !other_email || !['accept','reject'].includes(action)) {
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
    if (!['pending','accepted','rejected'].includes(conn.status)) {
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
    if (type && ['student','alumni','admin'].includes(String(type))) {
      where.push('user_type = ?');
      params.push(type);
    }
    if (q) {
      where.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)');
      const like = `%${String(q).toLowerCase()}%`;
      params.push(like, like);
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows: list } = await dbQuery(`SELECT id, auth0_id, email, name, picture, bio, user_type, graduation_year, major, current_job, company, job_title, location, skills, is_mentor FROM users ${whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`, [...params, l, offset]);
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
    const { rows } = await dbQuery('SELECT id, auth0_id, email, name, picture, bio, user_type, graduation_year, major, current_job, company, job_title, location, skills, is_mentor FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json({ user: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * Mentorship: mentor profiles, discovery, requests, sessions, ratings
 */

// Create or update mentor profile (alumni)
app.post('/api/mentors/profile', checkJwt, async (req, res) => {
  try {
    const email = req.body.email || (req.auth && (req.auth["https://schemas.quickstart/email"] || req.auth.email));
    if (!email) return res.status(400).json({ error: 'email required' });
    const { skills, experience_years = 0, topics, availability, price = 0 } = req.body || {};
    const existing = await dbQuery('SELECT * FROM mentors WHERE mentor_email = ? LIMIT 1', [email]);
    if (existing.rows && existing.rows.length) {
      const { rows } = await dbQuery(
        'UPDATE mentors SET skills = ?, experience_years = ?, topics = ?, availability = ?, price = ?, updated_at = NOW() WHERE mentor_email = ? RETURNING *',
        [skills || null, Number(experience_years) || 0, topics || null, availability || null, Number(price) || 0, email]
      );
      return res.json({ mentor: rows[0] });
    }
    const { rows } = await dbQuery(
      'INSERT INTO mentors (mentor_email, skills, experience_years, topics, availability, price) VALUES (?, ?, ?, ?, ?, ?) RETURNING *',
      [email, skills || null, Number(experience_years) || 0, topics || null, availability || null, Number(price) || 0]
    );
    return res.status(201).json({ mentor: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Get mentor profile by email
app.get('/api/mentors/profile', async (req, res) => {
  try {
    const { email } = req.query || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const { rows } = await dbQuery('SELECT * FROM mentors WHERE mentor_email = ? LIMIT 1', [email]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json({ mentor: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Mentor discovery list with filters
app.get('/api/mentors', async (req, res) => {
  try {
    const { q, min_experience, max_price, min_rating, page = 1, limit = 20 } = req.query || {};
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (p - 1) * l;
    const conditions = [];
    const params = [];
    if (q) {
      conditions.push('(COALESCE(skills,\'\') ILIKE ? OR COALESCE(topics,\'\') ILIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (min_experience) { conditions.push('experience_years >= ?'); params.push(Number(min_experience)); }
    if (max_price) { conditions.push('price <= ?'); params.push(Number(max_price)); }
    if (min_rating) { conditions.push('rating_avg >= ?'); params.push(Number(min_rating)); }
    let sql = 'SELECT * FROM mentors';
    let countSql = 'SELECT COUNT(*) AS total FROM mentors';
    if (conditions.length) {
      const where = ' WHERE ' + conditions.join(' AND ');
      sql += where; countSql += where;
    }
    sql += ' ORDER BY rating_avg DESC NULLS LAST, price ASC NULLS LAST LIMIT ? OFFSET ?';
    params.push(l, offset);
    const countRes = await dbQuery(countSql, params.slice(0, -2));
    const total = countRes.rows && countRes.rows[0] ? Number(countRes.rows[0].total) : 0;
    const listRes = await dbQuery(sql, params);
    return res.json({ mentors: listRes.rows, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Mentorship request from student to mentor
app.post('/api/mentorship/request', async (req, res) => {
  try {
    const { student_email, mentor_email, message } = req.body || {};
    if (!student_email || !mentor_email) return res.status(400).json({ error: 'student_email and mentor_email required' });
    const pair_key = buildPairKey(student_email, mentor_email);
    const existing = await dbQuery('SELECT * FROM mentorship_requests WHERE pair_key = ? LIMIT 1', [pair_key]);
    if (existing.rows && existing.rows.length) {
      const row = existing.rows[0];
      if (row.status === 'pending') return res.json({ request: row });
      const { rows } = await dbQuery('UPDATE mentorship_requests SET status = ?, message = ?, updated_at = NOW() WHERE id = ? RETURNING *', ['pending', message || null, row.id]);
      return res.status(201).json({ request: rows[0] });
    }
    const { rows } = await dbQuery('INSERT INTO mentorship_requests (pair_key, student_email, mentor_email, status, message) VALUES (?, ?, ?, \'pending\', ?) RETURNING *', [pair_key, student_email, mentor_email, message || null]);
    return res.status(201).json({ request: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Mentor responds to mentorship request (accept/reject)
app.post('/api/mentorship/respond', async (req, res) => {
  try {
    const { mentor_email, student_email, action } = req.body || {};
    if (!mentor_email || !student_email || !['accept','reject'].includes(action)) return res.status(400).json({ error: 'mentor_email, student_email and action required' });
    const pair_key = buildPairKey(student_email, mentor_email);
    const { rows } = await dbQuery('SELECT * FROM mentorship_requests WHERE pair_key = ? LIMIT 1', [pair_key]);
    if (!rows || !rows.length) return res.status(404).json({ error: 'Request not found' });
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { rows: updated } = await dbQuery('UPDATE mentorship_requests SET status = ?, accepted_at = CASE WHEN ? = \'accepted\' THEN NOW() ELSE NULL END, updated_at = NOW() WHERE id = ? RETURNING *', [newStatus, newStatus, rows[0].id]);
    // On accept, upsert a general connection as well
    if (newStatus === 'accepted') {
      const conn = await dbQuery('SELECT * FROM connections WHERE pair_key = ? LIMIT 1', [pair_key]);
      if (conn.rows && conn.rows.length) {
        if (conn.rows[0].status !== 'accepted') {
          await dbQuery('UPDATE connections SET status = \'accepted\', accepted_at = NOW(), updated_at = NOW() WHERE id = ?', [conn.rows[0].id]);
        }
      } else {
        await dbQuery('INSERT INTO connections (pair_key, requester_email, target_email, status, accepted_at) VALUES (?, ?, ?, \'accepted\', NOW())', [pair_key, student_email, mentor_email]);
      }
    }
    return res.json({ request: updated[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List mentorship requests for a user
app.get('/api/mentorship/requests', async (req, res) => {
  try {
    const { user_email, role } = req.query || {};
    if (!user_email) return res.status(400).json({ error: 'user_email required' });
    let sql = 'SELECT * FROM mentorship_requests WHERE ';
    let params = [];
    if (role === 'mentor') { sql += 'mentor_email = ?'; params = [user_email]; }
    else if (role === 'student') { sql += 'student_email = ?'; params = [user_email]; }
    else { sql += 'mentor_email = ? OR student_email = ?'; params = [user_email, user_email]; }
    sql += ' ORDER BY updated_at DESC LIMIT 200';
    const { rows } = await dbQuery(sql, params);
    return res.json({ requests: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Purchase a mentorship session (unlock chat)
app.post('/api/mentorship/sessions/purchase', async (req, res) => {
  try {
    const { student_email, mentor_email, amount, currency = 'INR', payment_id, order_id } = req.body || {};
    if (!student_email || !mentor_email || !amount || !payment_id) return res.status(400).json({ error: 'student_email, mentor_email, amount, payment_id required' });
    const pair_key = buildPairKey(student_email, mentor_email);
    const { rows } = await dbQuery('INSERT INTO mentorship_sessions (pair_key, student_email, mentor_email, status, amount, currency, payment_id, order_id) VALUES (?, ?, ?, \'paid\', ?, ?, ?, ?) RETURNING *', [pair_key, student_email, mentor_email, Number(amount), currency, payment_id, order_id || payment_id]);
    return res.status(201).json({ session: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Schedule a mentorship session
app.post('/api/mentorship/sessions/schedule', async (req, res) => {
  try {
    const { session_id, scheduled_at, duration_minutes = 60, notes } = req.body || {};
    if (!session_id || !scheduled_at) return res.status(400).json({ error: 'session_id and scheduled_at required' });
    const { rows } = await dbQuery('UPDATE mentorship_sessions SET scheduled_at = ?, duration_minutes = ?, notes = ?, status = \'scheduled\', updated_at = NOW() WHERE id = ? RETURNING *', [scheduled_at, Number(duration_minutes) || 60, notes || null, session_id]);
    return res.json({ session: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List mentorship sessions for a user
app.get('/api/mentorship/sessions', async (req, res) => {
  try {
    const { user_email, role } = req.query || {};
    if (!user_email) return res.status(400).json({ error: 'user_email required' });
    let sql = 'SELECT * FROM mentorship_sessions WHERE ';
    let params = [];
    if (role === 'mentor') { sql += 'mentor_email = ?'; params = [user_email]; }
    else if (role === 'student') { sql += 'student_email = ?'; params = [user_email]; }
    else { sql += 'mentor_email = ? OR student_email = ?'; params = [user_email, user_email]; }
    sql += ' ORDER BY updated_at DESC LIMIT 200';
    const { rows } = await dbQuery(sql, params);
    return res.json({ sessions: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Submit rating/feedback for a mentor after session completion
app.post('/api/mentorship/ratings', async (req, res) => {
  try {
    const { session_id, student_email, mentor_email, rating, feedback } = req.body || {};
    if (!session_id || !student_email || !mentor_email || !rating) return res.status(400).json({ error: 'session_id, student_email, mentor_email, rating required' });
    const { rows } = await dbQuery('INSERT INTO mentor_ratings (session_id, student_email, mentor_email, rating, feedback) VALUES (?, ?, ?, ?, ?) RETURNING *', [session_id, student_email, mentor_email, Number(rating), feedback || null]);
    // Update mentor aggregate
    const agg = await dbQuery('SELECT COALESCE(AVG(rating),0) as avg, COUNT(*) as cnt FROM mentor_ratings WHERE mentor_email = ?', [mentor_email]);
    await dbQuery('UPDATE mentors SET rating_avg = ?, rating_count = ?, updated_at = NOW() WHERE mentor_email = ?', [Number(agg.rows[0].avg), Number(agg.rows[0].cnt), mentor_email]);
    return res.status(201).json({ rating: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});