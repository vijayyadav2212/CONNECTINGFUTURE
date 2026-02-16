const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

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
        console.log("Clearing events...");

        // Delete registrations first due to FK constraint
        const regRes = await db.query('DELETE FROM event_registrations');
        console.log(`Deleted ${regRes.rowCount} registrations.`);

        // Delete events
        const eventRes = await db.query('DELETE FROM events');
        console.log(`Deleted ${eventRes.rowCount} events.`);

        console.log("All events cleared successfully.");
    } catch (e) {
        console.error("Error clearing events:", e);
    } finally {
        db.end();
    }
}

run();
