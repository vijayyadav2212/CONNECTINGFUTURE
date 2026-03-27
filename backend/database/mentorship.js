// Mentorship schema creation for Postgres

async function createMentorshipSchema(dbQuery) {
  // mentors: alumni mentor profiles
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS mentors (
      id SERIAL PRIMARY KEY,
      mentor_email VARCHAR(255) UNIQUE NOT NULL,
      skills TEXT,
      experience_years INT DEFAULT 0,
      topics TEXT,
      availability TEXT,
      price NUMERIC(10,2) DEFAULT 0,
      subscription_price NUMERIC(10,2) DEFAULT 0,
      subscription_duration_days INT DEFAULT 30,
      rating_avg NUMERIC(3,2) DEFAULT 0,
      rating_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // mentorship_requests: student -> mentor requests
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS mentorship_requests (
      id SERIAL PRIMARY KEY,
      pair_key VARCHAR(600) UNIQUE NOT NULL,
      student_email VARCHAR(255) NOT NULL,
      mentor_email VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending', -- pending|accepted|rejected
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      accepted_at TIMESTAMPTZ
    )
  `);

  // mentorship_sessions: paid/scheduled sessions
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS mentorship_sessions (
      id SERIAL PRIMARY KEY,
      pair_key VARCHAR(600) NOT NULL,
      student_email VARCHAR(255) NOT NULL,
      mentor_email VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending', -- pending|paid|scheduled|completed|cancelled
      amount NUMERIC(10,2),
      currency VARCHAR(10) DEFAULT 'INR',
      payment_id VARCHAR(255),
      order_id VARCHAR(255),
      scheduled_at TIMESTAMPTZ,
      duration_minutes INT DEFAULT 60,
      meeting_link TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Backfill column for existing deployments
  await dbQuery('ALTER TABLE mentorship_sessions ADD COLUMN IF NOT EXISTS meeting_link TEXT');
  await dbQuery('ALTER TABLE mentorship_sessions ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) DEFAULT 0');
  await dbQuery('ALTER TABLE mentorship_sessions ADD COLUMN IF NOT EXISTS alumni_earnings NUMERIC(10,2) DEFAULT 0');
  await dbQuery("ALTER TABLE mentorship_sessions ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'pending'");
  await dbQuery("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS payment_upi_id VARCHAR(255)");
  await dbQuery("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS subscription_price NUMERIC(10,2) DEFAULT 0");
  await dbQuery("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS subscription_duration_days INT DEFAULT 30");

  // Helpful indexes
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_pair ON mentorship_sessions(pair_key)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_status ON mentorship_sessions(status)');

  // mentorship_subscriptions: recurring plan purchase by student for a mentor
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS mentorship_subscriptions (
      id SERIAL PRIMARY KEY,
      pair_key VARCHAR(600) NOT NULL,
      student_email VARCHAR(255) NOT NULL,
      mentor_email VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'active', -- active|expired|cancelled
      amount NUMERIC(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      duration_days INT DEFAULT 30,
      start_at TIMESTAMPTZ DEFAULT NOW(),
      end_at TIMESTAMPTZ NOT NULL,
      payment_id VARCHAR(255),
      order_id VARCHAR(255),
      platform_fee NUMERIC(10,2) DEFAULT 0,
      alumni_earnings NUMERIC(10,2) DEFAULT 0,
      payout_status VARCHAR(50) DEFAULT 'pending', -- pending|paid
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await dbQuery("ALTER TABLE mentorship_subscriptions ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'pending'");

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_mentorship_subscriptions_pair ON mentorship_subscriptions(pair_key)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_mentorship_subscriptions_status ON mentorship_subscriptions(status)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_mentorship_subscriptions_end_at ON mentorship_subscriptions(end_at)');

  // mentor_daily_sessions: mentor-defined daily recurring sessions
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS mentor_daily_sessions (
      id SERIAL PRIMARY KEY,
      mentor_email VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      daily_time VARCHAR(20) NOT NULL, -- HH:mm in mentor local timezone
      timezone VARCHAR(80) DEFAULT 'Asia/Kolkata',
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      duration_minutes INT DEFAULT 60,
      meeting_link TEXT,
      max_mentees INT DEFAULT 50,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_mentor_daily_sessions_mentor ON mentor_daily_sessions(mentor_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_mentor_daily_sessions_period ON mentor_daily_sessions(start_date, end_date)');

  // mentor_ratings: student feedback post-session
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS mentor_ratings (
      id SERIAL PRIMARY KEY,
      session_id INT REFERENCES mentorship_sessions(id) ON DELETE SET NULL,
      student_email VARCHAR(255) NOT NULL,
      mentor_email VARCHAR(255) NOT NULL,
      rating INT CHECK (rating BETWEEN 1 AND 5),
      feedback TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(session_id, student_email)
    )
  `);

  // Add unique constraint to prevent duplicate ratings for existing tables (if table already exists without constraint)
  try {
    await dbQuery(`
      ALTER TABLE mentor_ratings 
      ADD CONSTRAINT unique_rating_per_session_student UNIQUE(session_id, student_email)
    `);
  } catch (e) {
    // Constraint might already exist, ignore error
  }
}

module.exports = { createMentorshipSchema };
