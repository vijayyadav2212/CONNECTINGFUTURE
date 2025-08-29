// Donations schema (Postgres)
// Exports a function to create the donations table and indexes using the provided dbQuery helper

/**
 * @param {(sql: string, params?: any[]) => Promise<any>} dbQuery
 */
async function createDonationsSchema(dbQuery) {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS donations (
      id SERIAL PRIMARY KEY,
      donor_name VARCHAR(255) NOT NULL,
      donor_email VARCHAR(255) NOT NULL,
      user_email VARCHAR(255),
      donor_phone VARCHAR(20),
      amount NUMERIC(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'INR',
      payment_method VARCHAR(50) NOT NULL,
      payment_id VARCHAR(255) UNIQUE,
      order_id VARCHAR(255),
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255),
      razorpay_signature VARCHAR(255),
      transaction_status VARCHAR(20) DEFAULT 'pending',
      donation_type VARCHAR(20) DEFAULT 'one-time',
      cause_category VARCHAR(100),
      anonymous BOOLEAN DEFAULT FALSE,
      message TEXT,
      description TEXT,
      receipt_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_donor_email ON donations(donor_email)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_payment_id ON donations(payment_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_transaction_status ON donations(transaction_status)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at)');
}

module.exports = { createDonationsSchema };
