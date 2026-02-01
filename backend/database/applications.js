// Applications schema for job applications by students

async function createApplicationsSchema(dbQuery) {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      applicant_email VARCHAR(255) NOT NULL,
      status VARCHAR(30) DEFAULT 'applied',
      resume_url TEXT,
      cover_letter TEXT,
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(job_id, applicant_email)
    )
  `);
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)');
}

module.exports = { createApplicationsSchema };
