const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_demo',
  multipleStatements: true // Allow multiple SQL statements
});

console.log('🔄 Testing database connection...');

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection error:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 The database does not exist. Please create it first:');
      console.log('1. Login to MySQL: mysql -u root -p');
      console.log('2. Create database: CREATE DATABASE auth_demo;');
      console.log('3. Run this script again');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Access denied. Please check your credentials in .env file:');
      console.log('DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    }
    
    process.exit(1);
  } else {
    console.log('✅ Connected to MySQL database');
    
    // Test basic query
    db.query('SELECT 1 as test', (err, results) => {
      if (err) {
        console.error('❌ Error running test query:', err);
        process.exit(1);
      }
      
      console.log('✅ Basic query test passed');
      
      // Check if messages table exists
      db.query('SHOW TABLES LIKE "messages"', (err, results) => {
        if (err) {
          console.error('❌ Error checking tables:', err);
          process.exit(1);
        }
        
        if (results.length === 0) {
          console.log('⚠️  Messages table does not exist');
          console.log('🔄 Creating database schema...');
          
          // Read and execute schema file
          const schemaPath = path.join(__dirname, 'database_schema.sql');
          
          if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            db.query(schema, (err, results) => {
              if (err) {
                console.error('❌ Error creating schema:', err);
                process.exit(1);
              }
              
              console.log('✅ Database schema created successfully');
              testMessagesTable();
            });
          } else {
            console.error('❌ Schema file not found:', schemaPath);
            process.exit(1);
          }
        } else {
          console.log('✅ Messages table exists');
          testMessagesTable();
        }
      });
    });
  }
});

function testMessagesTable() {
  // Test inserting a message
  console.log('🔄 Testing message insertion...');
  
  // First, insert test users to satisfy foreign key constraints
  const testUsers = [
    { auth0_id: 'test_sender_123', email: 'sender@test.com' },
    { auth0_id: 'test_receiver_456', email: 'receiver@test.com' }
  ];
  
  console.log('🔄 Creating test users for foreign key constraints...');
  
  // Insert test users
  const insertUserQuery = 'INSERT INTO users (auth0_id, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE email = VALUES(email)';
  
  let usersInserted = 0;
  
  testUsers.forEach((user, index) => {
    db.query(insertUserQuery, [user.auth0_id, user.email], (err, result) => {
      if (err) {
        console.error(`❌ Error inserting test user ${user.email}:`, err);
        process.exit(1);
      }
      
      console.log(`✅ Test user ${user.email} inserted/updated`);
      usersInserted++;
      
      // Once both users are inserted, test message insertion
      if (usersInserted === testUsers.length) {
        insertTestMessage();
      }
    });
  });
}

function insertTestMessage() {
  const testMessage = {
    sender_id: 'test_sender_123',
    receiver_id: 'test_receiver_456',
    content: 'Test message from database setup script',
    status: 'sent'
  };
  
  const query = `
    INSERT INTO messages (sender_id, receiver_id, content, timestamp, status) 
    VALUES (?, ?, ?, NOW(), ?)
  `;
  
  db.query(query, [testMessage.sender_id, testMessage.receiver_id, testMessage.content, testMessage.status], (err, result) => {
    if (err) {
      console.error('❌ Error inserting test message:', err);
      console.error('SQL State:', err.sqlState);
      console.error('Error Number:', err.errno);
      
      // Clean up test users before exiting
      cleanupTestData(() => process.exit(1));
      return;
    }
    
    console.log('✅ Test message inserted successfully with ID:', result.insertId);
    
    // Clean up test data
    cleanupTestData(() => {
      console.log('\n🎉 Database setup and testing completed successfully!');
      console.log('✅ Your database is ready for the messaging system');
      console.log('\n💡 Note: The foreign key constraints are working correctly.');
      console.log('   Make sure users exist in the users table before sending messages.');
      
      db.end();
      process.exit(0);
    });
  });
}

function cleanupTestData(callback) {
  console.log('🔄 Cleaning up test data...');
  
  // First delete test messages, then test users (due to foreign key constraints)
  db.query('DELETE FROM messages WHERE sender_id IN (?, ?) OR receiver_id IN (?, ?)', 
    ['test_sender_123', 'test_receiver_456', 'test_sender_123', 'test_receiver_456'], (err) => {
    if (err) {
      console.warn('⚠️  Could not clean up test messages:', err.message);
    } else {
      console.log('✅ Test messages cleaned up');
    }
    
    // Delete test users
    db.query('DELETE FROM users WHERE auth0_id IN (?, ?)', 
      ['test_sender_123', 'test_receiver_456'], (err) => {
      if (err) {
        console.warn('⚠️  Could not clean up test users:', err.message);
      } else {
        console.log('✅ Test users cleaned up');
      }
      
      callback();
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🔄 Closing database connection...');
  db.end();
  process.exit(0);
});
