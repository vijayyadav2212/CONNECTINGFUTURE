const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

console.log('🔍 Testing database connection...');
console.log('Database Config:');
console.log('- Host:', process.env.DB_HOST || 'localhost');
console.log('- User:', process.env.DB_USER || 'root');
console.log('- Database:', process.env.DB_NAME || 'connectingfuture_db');
console.log('- Password:', process.env.DB_PASSWORD ? '***' : 'Not set');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'connectingfuture_db',
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection FAILED:', err.message);
    console.error('Error Code:', err.code);
    console.error('Error Number:', err.errno);
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Solution: Check your username and password');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Solution: Create the database first');
      console.log('   Run: CREATE DATABASE connectingfuture_db;');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('💡 Solution: Make sure MySQL server is running');
    }
  } else {
    console.log('✅ Connected to MySQL database successfully!');
    
    // Test a simple query
    db.query('SELECT 1 + 1 AS result', (err, results) => {
      if (err) {
        console.error('❌ Query test failed:', err);
      } else {
        console.log('✅ Query test successful:', results[0]);
      }
      
      // Check if tables exist
      db.query('SHOW TABLES', (err, results) => {
        if (err) {
          console.error('❌ Failed to show tables:', err);
        } else {
          console.log('📋 Tables in database:', results.length);
          results.forEach(table => {
            console.log('  -', Object.values(table)[0]);
          });
        }
        
        db.end();
        console.log('🔌 Database connection closed');
      });
    });
  }
});
