// External Jobs cache schema creator
async function createExternalJobsSchema(dbQuery) {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS external_jobs_cache (
      id SERIAL PRIMARY KEY,
      job_id VARCHAR(255) UNIQUE NOT NULL,
      title VARCHAR(255),
      company VARCHAR(255),
      location VARCHAR(255),
      apply_link TEXT,
      employment_type VARCHAR(100),
      salary VARCHAR(100),
      posted_at TIMESTAMPTZ,
      logo_url TEXT,
      search_key TEXT,
      view_count INT DEFAULT 0,
      apply_click_count INT DEFAULT 0,
      bookmark_count INT DEFAULT 0,
      applied_confirm_count INT DEFAULT 0,
      application_response_count INT DEFAULT 0,
      last_seen_at TIMESTAMPTZ DEFAULT NOW(),
      raw_data JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await dbQuery('ALTER TABLE external_jobs_cache ADD COLUMN IF NOT EXISTS search_key TEXT');
  await dbQuery('ALTER TABLE external_jobs_cache ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0');
  await dbQuery('ALTER TABLE external_jobs_cache ADD COLUMN IF NOT EXISTS apply_click_count INT DEFAULT 0');
  await dbQuery('ALTER TABLE external_jobs_cache ADD COLUMN IF NOT EXISTS bookmark_count INT DEFAULT 0');
  await dbQuery('ALTER TABLE external_jobs_cache ADD COLUMN IF NOT EXISTS applied_confirm_count INT DEFAULT 0');
  await dbQuery('ALTER TABLE external_jobs_cache ADD COLUMN IF NOT EXISTS application_response_count INT DEFAULT 0');
  await dbQuery('ALTER TABLE external_jobs_cache ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW()');
  await dbQuery('ALTER TABLE external_jobs_cache ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()');

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS external_job_application_feedback (
      id SERIAL PRIMARY KEY,
      job_id VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255),
      applied BOOLEAN NOT NULL,
      source_page VARCHAR(64),
      job_snapshot JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(job_id, user_email)
    )
  `);
  await dbQuery('ALTER TABLE external_job_application_feedback ADD COLUMN IF NOT EXISTS user_name VARCHAR(255)');
  await dbQuery('ALTER TABLE external_job_application_feedback ADD COLUMN IF NOT EXISTS source_page VARCHAR(64)');
  await dbQuery('ALTER TABLE external_job_application_feedback ADD COLUMN IF NOT EXISTS job_snapshot JSONB');
  await dbQuery('ALTER TABLE external_job_application_feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()');

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS external_job_search_cache (
      id SERIAL PRIMARY KEY,
      cache_key TEXT UNIQUE NOT NULL,
      role VARCHAR(255),
      location VARCHAR(255),
      employment_type VARCHAR(100),
      results_json JSONB NOT NULL,
      fetched_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await dbQuery('ALTER TABLE external_job_search_cache ADD COLUMN IF NOT EXISTS role VARCHAR(255)');
  await dbQuery('ALTER TABLE external_job_search_cache ADD COLUMN IF NOT EXISTS location VARCHAR(255)');
  await dbQuery('ALTER TABLE external_job_search_cache ADD COLUMN IF NOT EXISTS employment_type VARCHAR(100)');
  await dbQuery('ALTER TABLE external_job_search_cache ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ DEFAULT NOW()');
  await dbQuery('ALTER TABLE external_job_search_cache ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ');
  await dbQuery('ALTER TABLE external_job_search_cache ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()');

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS external_job_bookmarks (
      id SERIAL PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      job_id VARCHAR(255) NOT NULL,
      job_snapshot JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_email, job_id)
    )
  `);
  await dbQuery('ALTER TABLE external_job_bookmarks ADD COLUMN IF NOT EXISTS job_snapshot JSONB');
  await dbQuery('ALTER TABLE external_job_bookmarks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()');

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_external_jobs_job_id ON external_jobs_cache(job_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_external_jobs_created_at ON external_jobs_cache(created_at)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_external_jobs_search_key ON external_jobs_cache(search_key)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_external_job_search_cache_key ON external_job_search_cache(cache_key)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_external_job_search_cache_expires_at ON external_job_search_cache(expires_at)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_external_job_bookmarks_user_email ON external_job_bookmarks(user_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_external_job_feedback_job_id ON external_job_application_feedback(job_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_external_job_feedback_user_email ON external_job_application_feedback(user_email)');
}

module.exports = { createExternalJobsSchema };
