const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: __dirname + '/.env' });

const useConnectionString = !!process.env.DATABASE_URL;
const db = useConnectionString
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mockapp_db',
        port: Number(process.env.DB_PORT) || 5432,
        ssl: /true|require/i.test(String(process.env.DB_SSL || 'false')) ? { rejectUnauthorized: false } : undefined,
    });

async function run() {
    try {
        const res = await db.query('SELECT id, title, image_url FROM events ORDER BY id DESC LIMIT 5');
        console.log('Last 5 events:');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error("Query Error:", e);
    } finally {
        db.end();
    }
}

run();
