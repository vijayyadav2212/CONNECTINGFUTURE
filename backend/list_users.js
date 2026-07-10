const { dbQuery } = require('./config/db');

async function run() {
  const { rows } = await dbQuery('SELECT id, email, user_type, password_hash FROM users');
  console.log('Current Users in DB:', rows);
  process.exit(0);
}

run();
