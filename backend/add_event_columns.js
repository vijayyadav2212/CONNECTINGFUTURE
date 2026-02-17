const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mockapp_db',
    port: Number(process.env.DB_PORT) || 5432,
    ssl: /true|require/i.test(String(process.env.DB_SSL || 'false')) ? { rejectUnauthorized: false } : undefined,
});

if (process.env.DATABASE_URL) {
    // If connection string is used, overwrite pool config
    // (Simplified for this script, assuming env vars match server.js logic)
}

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('Connected to DB');

        const alterations = [
            "ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time VARCHAR(64)",
            "ALTER TABLE events ADD COLUMN IF NOT EXISTS duration VARCHAR(64)",
            "ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT",
            "ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer VARCHAR(255)",
            // Ensure these exist too just in case
            "ALTER TABLE events ADD COLUMN IF NOT EXISTS location VARCHAR(512)",
            "ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(128)",
            "ALTER TABLE events ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT FALSE",
            "ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT"
        ];

        for (const sql of alterations) {
            console.log(`Executing: ${sql}`);
            await client.query(sql);
        }

        console.log('Migration completed successfully');
        client.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

migrate();
