// Jobs & Internships schema creator
// Follows existing modular schema pattern used in roadmaps/connections

async function createJobsSchema(dbQuery) {
  // jobs table
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      company VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      responsibilities TEXT,
      requirements TEXT,
      benefits TEXT,
      salary_min NUMERIC,
      salary_max NUMERIC,
      currency VARCHAR(10),
      tags TEXT,
      status VARCHAR(30) DEFAULT 'Pending Review',
      featured BOOLEAN DEFAULT FALSE,
      logo TEXT,
      industry VARCHAR(100) NOT NULL,
      job_type VARCHAR(100) NOT NULL,
      is_remote BOOLEAN DEFAULT FALSE,
      application_deadline DATE,
      contact_person VARCHAR(255),
      application_method VARCHAR(50),
      application_url TEXT,
      views INT DEFAULT 0,
      applied INT DEFAULT 0,
      posted_by VARCHAR(255) NOT NULL,
      posted_date TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date)');
}

module.exports = { createJobsSchema };
