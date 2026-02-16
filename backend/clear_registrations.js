const { Pool } = require('pg');
require('dotenv').config();

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

async function clearRegistrations() {
    try {
        console.log('🔄 Clearing all event registrations...');

        // Get count before deletion
        const countResult = await db.query('SELECT COUNT(*) as count FROM event_registrations');
        const count = countResult.rows[0].count;
        console.log(`📊 Found ${count} registration(s) to delete`);

        // Delete all registrations
        await db.query('DELETE FROM event_registrations');

        // Reset current_attendees count in events table
        await db.query('UPDATE events SET current_attendees = 0');

        console.log('✅ All event registrations cleared successfully!');
        console.log('✅ Event attendee counts reset to 0');

    } catch (error) {
        console.error('❌ Error clearing registrations:', error.message);
    } finally {
        await db.end();
    }
}

clearRegistrations();
