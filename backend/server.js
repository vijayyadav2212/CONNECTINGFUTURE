const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: __dirname + '/.env' });

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

const { db, dbQuery } = require('./config/db');

// Import v2 routes
const jobRoutes = require('./routes/jobRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const donationRoutes = require('./routes/donationRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const academicRoutes = require('./routes/academicRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const resumeReviewRoutes = require('./routes/resumeReviewRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

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

// Mount v2 routes
app.use('/api/v2/jobs', jobRoutes);
app.use('/api/v2/events', eventRoutes);
app.use('/api/v2/users', userRoutes);
app.use('/api/v2/donations', donationRoutes);
app.use('/api/v2/memories', memoryRoutes);
app.use('/api/v2/roadmaps', roadmapRoutes);
app.use('/api/v2/mentorship', mentorshipRoutes);
app.use('/api/v2/academic', academicRoutes);
app.use('/api/v2/connections', connectionRoutes);
app.use('/api/v2/messages', messageRoutes);
app.use('/api/v2/resume-reviews', resumeReviewRoutes);
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/admin', adminRoutes);

// Health check endpoint
let lastDbStatus = 'unknown';
let lastDbError = null;
function checkDb(callback) {
  db.query('SELECT 1')
    .then(() => { lastDbStatus = 'connected'; lastDbError = null; callback && callback(true); })
    .catch((err) => { lastDbStatus = 'disconnected'; lastDbError = err.message; callback && callback(false); });
}

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

// Initialize database tables
async function initializeTables() {
  try {
    // users table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        auth0_id VARCHAR(255) NULL UNIQUE,
        email VARCHAR(255) NULL UNIQUE,
        password_hash VARCHAR(255) NULL,
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
      await dbQuery('ALTER TABLE users ALTER COLUMN auth0_id DROP NOT NULL');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(255)');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50)');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(50)');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255)');
      await dbQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2)');
      await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS other_files JSONB DEFAULT '[]'::jsonb");
    } catch (e) { console.log('User schema migration note:', e.message); }

    await dbQuery('CREATE INDEX IF NOT EXISTS idx_auth0_id ON users(auth0_id)');
    await dbQuery('CREATE INDEX IF NOT EXISTS idx_email ON users(email)');
    await dbQuery('CREATE INDEX IF NOT EXISTS idx_user_type ON users(user_type)');
    await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'");
    await dbQuery("ALTER TABLE users ALTER COLUMN approval_status SET DEFAULT 'pending'");
    await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_reason TEXT");
    await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL");
    await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT DEFAULT NULL");

    // Initialize modularized schemas 
    await createMessagesSchema(dbQuery);
    await createDonationsSchema(dbQuery);
    await createRoadmapsSchema(dbQuery);
    await createConnectionsSchema(dbQuery);
    await createMentorshipSchema(dbQuery);
    await createResumeReviewsSchema(dbQuery);
    await createAcademicProgressSchema(dbQuery);
    await createMemoriesSchema(dbQuery);

    try {
      await createJobsSchema(dbQuery);
      await createApplicationsSchema(dbQuery);
      await createExternalJobsSchema(dbQuery);
      await createSiteSettingsSchema(dbQuery);
    } catch (e) {
      console.warn('Jobs/Applications schema creation note:', e.message);
    }

    // Create events table if missing
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

    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time VARCHAR(64)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS duration VARCHAR(64)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS location VARCHAR(512)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(128)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT FALSE`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer VARCHAR(255)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status VARCHAR(64) DEFAULT 'pending'`);
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
      )
    `);

    console.log('Tables are ready');
  } catch (e) {
    console.error('DB init error:', e.message);
  }
}

// Initial DB check and table initialization
checkDb((ok) => {
  if (ok) {
    console.log('Connected to Postgres database');
    initializeTables();
  } else {
    console.warn('Postgres not connected at startup. Will continue and serve limited features.');
    console.log('Please check your Postgres configuration in .env file');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});
