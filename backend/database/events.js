// Events schema creator
// Follows existing modular schema pattern

async function createEventsSchema(dbQuery) {
  // events table
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      location VARCHAR(255),
      is_virtual BOOLEAN DEFAULT FALSE,
      virtual_link TEXT,
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ,
      max_attendees INT,
      registration_url TEXT,
      image_url TEXT,
      tags TEXT,
      status VARCHAR(30) DEFAULT 'Pending Review',
      posted_by VARCHAR(255) NOT NULL,
      posted_date TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_events_posted_by ON events(posted_by)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date)');
}

module.exports = { createEventsSchema };
