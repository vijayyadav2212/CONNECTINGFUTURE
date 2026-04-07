// Resume Review schema creation for Postgres

async function createResumeReviewsSchema(dbQuery) {
  // resume_reviews: student requests alumni to review their resume
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS resume_reviews (
      id SERIAL PRIMARY KEY,
      pair_key VARCHAR(600) NOT NULL,
      student_email VARCHAR(255) NOT NULL,
      student_name VARCHAR(255),
      alumni_email VARCHAR(255) NOT NULL,
      alumni_name VARCHAR(255),
      resume_url TEXT,
      filename VARCHAR(255),
      status VARCHAR(20) DEFAULT 'pending',
      student_message TEXT,
      alumni_feedback TEXT,
      requested_at TIMESTAMPTZ DEFAULT NOW(),
      accepted_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      rejected_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Remove UNIQUE constraint if it exists
  try {
    await dbQuery(`ALTER TABLE resume_reviews DROP CONSTRAINT IF EXISTS resume_reviews_pair_key_key`);
  } catch (e) {
    // Constraint might not exist - that's fine
  }

  // Add foreign key constraints if they don't exist
  try {
    await dbQuery(`
      ALTER TABLE resume_reviews
      ADD CONSTRAINT fk_resume_reviews_student FOREIGN KEY (student_email) REFERENCES users(email) ON DELETE CASCADE
    `);
  } catch (e) {
    console.log('Note: Student FK already exists or users table missing');
  }

  try {
    await dbQuery(`
      ALTER TABLE resume_reviews
      ADD CONSTRAINT fk_resume_reviews_alumni FOREIGN KEY (alumni_email) REFERENCES users(email) ON DELETE CASCADE
    `);
  } catch (e) {
    console.log('Note: Alumni FK already exists or users table missing');
  }

  // Create indexes for performance
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_resume_reviews_student ON resume_reviews(student_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_resume_reviews_alumni ON resume_reviews(alumni_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_resume_reviews_status ON resume_reviews(status)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_resume_reviews_pair ON resume_reviews(pair_key)');
}

module.exports = { createResumeReviewsSchema };
