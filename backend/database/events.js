// Events schema (Postgres)
// Exports a function to create the events and event_registrations tables and indexes using the provided dbQuery helper

/**
 * @param {(sql: string, params?: any[]) => Promise<any>} dbQuery
 */
async function createEventsSchema(dbQuery) {
  // Create events table
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      user_auth0_id VARCHAR(255) NULL,
      title VARCHAR(1024) NOT NULL,
      description TEXT,
      event_date TIMESTAMPTZ,
      event_time VARCHAR(64),
      duration VARCHAR(64),
      location VARCHAR(512),
      event_type VARCHAR(128),
      is_virtual BOOLEAN DEFAULT FALSE,
      image_url TEXT,
      tags TEXT,
      organizer VARCHAR(255),
      max_attendees INT,
      current_attendees INT DEFAULT 0,
      price NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Run migrations/alterations to keep existing tables up-to-date
  try {
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time VARCHAR(64)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS duration VARCHAR(64)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS location VARCHAR(512)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(128)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT FALSE`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer VARCHAR(255)`);
    await dbQuery(`ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status VARCHAR(64) DEFAULT 'pending'`);
    await dbQuery(`UPDATE events SET approval_status = 'approved' WHERE approval_status = 'pending'`);
  } catch (e) {
    console.log('Events migration note:', e.message);
  }

  // Optimized indexes for events
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_events_approval_status ON events(approval_status)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_events_user_auth0_id ON events(user_auth0_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date)');

  // Create event_registrations table
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id SERIAL PRIMARY KEY,
      event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255),
      registered_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(event_id, user_email)
    )
  `);

  // Optimized indexes for event registrations
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_event_reg_event ON event_registrations(event_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_event_reg_email_lower ON event_registrations(LOWER(user_email))');
}

module.exports = { createEventsSchema };
