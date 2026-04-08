require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query(
  'SELECT id, resume_url, filename, created_at FROM resume_reviews ORDER BY created_at DESC LIMIT 5',
  (err, res) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('=== Latest Resume URLs ===\n');
      res.rows.forEach((r, i) => {
        console.log(`${i + 1}. ID: ${r.id}`);
        console.log(`   Filename: ${r.filename}`);
        console.log(`   URL: ${r.resume_url}`);
        console.log(`   Created: ${r.created_at}\n`);
      });
    }
    pool.end();
  }
);
