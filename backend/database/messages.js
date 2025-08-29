// Messages schema (Postgres)
// Exports a function to create the messages table and indexes using the provided dbQuery helper

/**
 * @param {(sql: string, params?: any[]) => Promise<any>} dbQuery
 */
async function createMessagesSchema(dbQuery) {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      thread_key VARCHAR(512) NOT NULL,
      sender_email VARCHAR(255) NOT NULL,
      receiver_email VARCHAR(255) NOT NULL,
      iv BYTEA NOT NULL,
      auth_tag BYTEA NOT NULL,
      ciphertext BYTEA NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      read_at TIMESTAMPTZ NULL
    )
  `);
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_thread_key ON messages(thread_key)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_sender_email ON messages(sender_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_receiver_email ON messages(receiver_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_created_at ON messages(created_at)');
}

module.exports = { createMessagesSchema };
