const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mockapp_db',
    port: Number(process.env.DB_PORT) || 5432,
    ssl: /true|require/i.test(String(process.env.DB_SSL || 'false')) ? { rejectUnauthorized: false } : undefined,
});

async function main() {
    const client = await pool.connect();
    try {
        console.log('Connected to DB');

        // 1. Check columns
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'events'
        `);
        const columns = res.rows.map(r => r.column_name);
        console.log('Current columns:', columns);

        const missing = [];
        if (!columns.includes('approval_status')) missing.push("ADD COLUMN approval_status VARCHAR(64) DEFAULT 'approved'"); // Default approved
        if (!columns.includes('image_url')) missing.push("ADD COLUMN image_url TEXT");
        if (!columns.includes('tags')) missing.push("ADD COLUMN tags TEXT");
        if (!columns.includes('organizer')) missing.push("ADD COLUMN organizer VARCHAR(255)");

        if (missing.length > 0) {
            console.log('Adding missing columns...');
            for (const cmd of missing) {
                await client.query(`ALTER TABLE events ${cmd}`);
                console.log(`Executed: ALTER TABLE events ${cmd}`);
            }
        } else {
            console.log('All columns present.');
        }

        // 2. Verify Uploads
        const uploadsEvents = path.join(__dirname, 'uploads', 'events');
        if (fs.existsSync(uploadsEvents)) {
            const files = fs.readdirSync(uploadsEvents);
            console.log(`Uploads folder exists (${uploadsEvents}). Files:`, files.length);
            if (files.length > 0) console.log('Last uploaded file:', files[files.length - 1]);
        } else {
            console.log('Uploads/events folder DOES NOT EXIST.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

main();
