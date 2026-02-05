// Memories schema creation for Postgres
// Usage: require and call createMemoriesSchema(dbQuery)

async function createMemoriesSchema(dbQuery) {
  // memories table stores the primary memory posts
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS memories (
      id SERIAL PRIMARY KEY,
      author_name        VARCHAR(255),
      author_avatar      TEXT,
      author_batch       VARCHAR(50),
      author_department  VARCHAR(255),
      title              VARCHAR(255) NOT NULL,
      description        TEXT,
      image_url          TEXT,
      date               DATE DEFAULT CURRENT_DATE,
      location           VARCHAR(255),
      tags               TEXT,                -- comma-separated tags
      category           VARCHAR(50),         -- friendship, achievement, academic, sports, event, competition
      type               VARCHAR(20) DEFAULT 'photo', -- photo | video
      likes              INT DEFAULT 0,
      comments_count     INT DEFAULT 0,
      is_liked           BOOLEAN DEFAULT FALSE,
      share_count        INT DEFAULT 0,
      views              INT DEFAULT 0,
      saved              BOOLEAN DEFAULT FALSE,
      created_at         TIMESTAMPTZ DEFAULT NOW(),
      updated_at         TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Ensure share_count exists for already-created tables
  await dbQuery('ALTER TABLE memories ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0');

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(date)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at)');

  // memory_comments table stores comments for individual memories
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS memory_comments (
      id SERIAL PRIMARY KEY,
      memory_id      INT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      author_name    VARCHAR(255),
      author_email   VARCHAR(255),
      author_avatar  TEXT,
      text           TEXT NOT NULL,
      likes          INT DEFAULT 0,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_memory_comments_memory_id ON memory_comments(memory_id)');
}

module.exports = { createMemoriesSchema };
