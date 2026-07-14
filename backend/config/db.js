const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const useConnectionString = !!process.env.DATABASE_URL;
const poolConfig = useConnectionString
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: process.env.DB_POOL_CONNECTION_TIMEOUT ? Number(process.env.DB_POOL_CONNECTION_TIMEOUT) : 10000,
  }
  : {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mockapp_db',
    port: Number(process.env.DB_PORT) || 5432,
    ssl: /true|require/i.test(String(process.env.DB_SSL || 'false')) ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: process.env.DB_POOL_CONNECTION_TIMEOUT ? Number(process.env.DB_POOL_CONNECTION_TIMEOUT) : 10000,
  };

const db = new Pool(poolConfig);

try {
  db.on && db.on('error', (err) => {
    console.warn('Postgres pool error:', err && err.message ? err.message : err);
  });
} catch (e) { }

try {
  db.on('connect', (client) => {
    client.query("SET TIME ZONE 'Asia/Kolkata'").catch(() => { });
  });
} catch { }

async function dbQuery(text, params = []) {
  const client = await db.connect();
  try {
    let idx = 0;
    const sql = text.replace(/\?/g, () => `$${++idx}`);
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}

module.exports = { db, dbQuery };
