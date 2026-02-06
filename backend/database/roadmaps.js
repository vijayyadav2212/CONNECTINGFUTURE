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

  // Indexes
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_roadmaps_owner_email ON roadmaps(owner_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_roadmaps_created_at ON roadmaps(created_at)');
}

module.exports = { createRoadmapsSchema };
