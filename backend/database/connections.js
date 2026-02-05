async function createConnectionsSchema(dbQuery) {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS connections (
      id SERIAL PRIMARY KEY,
      pair_key VARCHAR(600) NOT NULL,
      requester_email VARCHAR(255) NOT NULL,
      target_email VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | accepted | rejected | removed
      message TEXT,
      accepted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(pair_key)
    )
  `);
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_connections_target ON connections(target_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status)');
}

module.exports = { createConnectionsSchema };
