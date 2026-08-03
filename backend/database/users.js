// Users schema (Postgres)
// Exports a function to create the users table and indexes using the provided dbQuery helper

/**
 * @param {(sql: string, params?: any[]) => Promise<any>} dbQuery
 */
async function createUsersSchema(dbQuery) {
  // Create table
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

  // Schema migrations / safety checks
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
    await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'");
    await dbQuery("ALTER TABLE users ALTER COLUMN approval_status SET DEFAULT 'pending'");
    await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_reason TEXT");
    await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL");
    await dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT DEFAULT NULL");
  } catch (e) {
    console.log('User schema migration note:', e.message);
  }

  // Optimized indexes for faster response times
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_user_type ON users(user_type)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email))');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_users_auth0_id_lower ON users(LOWER(auth0_id))');
}

module.exports = { createUsersSchema };
