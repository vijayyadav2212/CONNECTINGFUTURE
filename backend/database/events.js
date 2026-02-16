// Events DB helpers
const db = require('./db');

async function getAllEvents() {
  const [rows] = await db.query('SELECT * FROM events ORDER BY created_at DESC');
  return rows;
}

async function createEvent(event) {
  const { user_auth0_id, title, description, event_date, location, event_type, is_virtual, image_url } = event;
  const [result] = await db.query(
    `INSERT INTO events (user_auth0_id, title, description, event_date, location, event_type, is_virtual, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_auth0_id, title, description, event_date, location, event_type, is_virtual, image_url]
  );
  return result.insertId;
}

module.exports = { getAllEvents, createEvent };