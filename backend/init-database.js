const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create connection without database first
const initConnection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306
});

// Read SQL schema file
const schemaPath = path.join(__dirname, 'database_schema.sql');
const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Create database if it doesn't exist
    await initConnection.promise().query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'alumni_portal'}`
    );
    console.log('✅ Database created or already exists');
    
    // Use the database
    await initConnection.promise().query(
      `USE ${process.env.DB_NAME || 'alumni_portal'}`
    );
    
    // Execute schema SQL
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await initConnection.promise().query(statement);
      }
    }
    
    console.log('✅ Database schema initialized successfully');
    console.log('📋 Tables created: users, posts, events, job_postings, donations, messages, mentorship, career_timeline, event_attendees');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    initConnection.end();
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
