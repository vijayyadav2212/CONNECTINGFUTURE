const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/.env' });

const useConnectionString = !!process.env.DATABASE_URL;
const db = useConnectionString
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Common for Neon/Heroku
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
        console.log("Adding columns to events table...");

        // Add image_url
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='image_url') THEN 
                    ALTER TABLE events ADD COLUMN image_url TEXT; 
                    RAISE NOTICE 'Added image_url column';
                END IF;
            END $$;
        `);

        // Add organizer
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='organizer') THEN 
                    ALTER TABLE events ADD COLUMN organizer VARCHAR(255); 
                    RAISE NOTICE 'Added organizer column';
                END IF;
            END $$;
        `);

        console.log("Columns added successfully!");
    } catch (e) {
        console.error("Migration Error:", e);
    } finally {
        db.end();
    }
}

run();
