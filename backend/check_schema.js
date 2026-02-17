const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/.env' });

const db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mockapp_db',
    port: Number(process.env.DB_PORT) || 5432,
    ssl: /true|require/i.test(String(process.env.DB_SSL || 'false')) ? { rejectUnauthorized: false } : undefined,
});

async function run() {
    try {
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'events';
        `);
        console.table(res.rows);
    } catch (e) {
        console.error("Schema Check Error:", e);
    } finally {
        db.end();
    }
}

run();
