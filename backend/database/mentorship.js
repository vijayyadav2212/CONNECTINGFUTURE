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
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // mentor_ratings: student feedback post-session
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS mentor_ratings (
      id SERIAL PRIMARY KEY,
      session_id INT REFERENCES mentorship_sessions(id) ON DELETE SET NULL,
      student_email VARCHAR(255) NOT NULL,
      mentor_email VARCHAR(255) NOT NULL,
      rating INT CHECK (rating BETWEEN 1 AND 5),
      feedback TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

module.exports = { createMentorshipSchema };
