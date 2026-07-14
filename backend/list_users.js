const { dbQuery } = require('./config/db');

async function run() {
  const { rows: users } = await dbQuery('SELECT id, email, user_type, approval_status, registration_completed FROM users');
  console.log('Current Users in DB:', users);
  process.exit(0);
}

run();
