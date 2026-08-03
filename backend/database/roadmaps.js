// Roadmaps schema (Postgres)
// Exports a function to create the roadmaps table and indexes using the provided dbQuery helper

async function createRoadmapsSchema(dbQuery) {
  // Create table
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS roadmaps (
      id SERIAL PRIMARY KEY,
      owner_email VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      level VARCHAR(50) NOT NULL,
      duration VARCHAR(50) NOT NULL,
      phases INT NOT NULL,
      modules_link VARCHAR(500),
      tags TEXT,
      domain VARCHAR(150),
      specialization VARCHAR(255),
      milestones_json JSONB DEFAULT '[]'::jsonb,
      resources_json JSONB DEFAULT '{}'::jsonb,
      generation_meta_json JSONB DEFAULT '{}'::jsonb,
      followers INT DEFAULT 0,
      is_published BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Migration: Add modules_link if it doesn't exist
  try {
    await dbQuery('ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS modules_link VARCHAR(500)');
  } catch (e) {
    // Ignore error if column already exists (though IF NOT EXISTS should handle it in newer PG versions, safe fallback)
    console.log('Migration note: modules_link column might already exist');
  }

  try {
    await dbQuery('ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS domain VARCHAR(150)');
    await dbQuery('ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS specialization VARCHAR(255)');
    await dbQuery("ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS milestones_json JSONB DEFAULT '[]'::jsonb");
    await dbQuery("ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS resources_json JSONB DEFAULT '{}'::jsonb");
    await dbQuery("ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS generation_meta_json JSONB DEFAULT '{}'::jsonb");
  } catch (e) {
    console.log('Migration note: structured roadmap columns might already exist');
  }

  // Indexes
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_roadmaps_owner_email ON roadmaps(owner_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_roadmaps_owner_email_lower ON roadmaps(LOWER(owner_email))');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_roadmaps_created_at ON roadmaps(created_at)');

  // Per-student roadmap progress (milestone completion and unlock state)
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS roadmap_student_progress (
      id SERIAL PRIMARY KEY,
      roadmap_id INT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
      user_email VARCHAR(255) NOT NULL,
      unlocked_milestone_order INT DEFAULT 1,
      completed_milestones_json JSONB DEFAULT '[]'::jsonb,
      last_quiz_score NUMERIC(5,2),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(roadmap_id, user_email)
    )
  `);

  // Keep each milestone quiz attempt for analytics and leaderboard scoring
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS roadmap_quiz_attempts (
      id SERIAL PRIMARY KEY,
      roadmap_id INT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
      milestone_order INT NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      score NUMERIC(5,2) NOT NULL,
      question_count INT NOT NULL,
      passed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Track students following roadmap resources
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS roadmap_resource_follows (
      id SERIAL PRIMARY KEY,
      roadmap_id INT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
      user_email VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(roadmap_id, user_email)
    )
  `);

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_rsp_roadmap_email ON roadmap_student_progress(roadmap_id, user_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_rqa_roadmap_email ON roadmap_quiz_attempts(roadmap_id, user_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_rrf_email ON roadmap_resource_follows(user_email)');
}

module.exports = { createRoadmapsSchema };
