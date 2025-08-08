const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mockapp_db',
  port: process.env.DB_PORT || 3306,
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    console.log('Please check your MySQL configuration in .env file');
    console.log('Current config:', {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'connectingfuture',
      port: process.env.DB_PORT || 3306,
      passwordSet: !!process.env.DB_PASSWORD
    });
  } else {
    console.log('Connected to MySQL database');
    // Initialize tables if they don't exist
    initializeTables();
  }
});

// Initialize database tables
function initializeTables() {
  // Check if the donations table has the right structure
  db.query('DESCRIBE donations', (err, results) => {
    if (err) {
      console.log('Donations table does not exist, creating new one...');
      createNewDonationsTable();
    } else {
      console.log('Existing donations table found with structure:', results.map(r => r.Field));
      
      // Check if it has the columns we need
      const existingColumns = results.map(r => r.Field);
      const requiredColumns = ['donor_name', 'donor_email'];
      const hasRequiredColumns = requiredColumns.every(col => existingColumns.includes(col));
      
      if (!hasRequiredColumns) {
        console.log('Existing table structure is different. Adding missing columns...');
        alterExistingTable();
      } else {
        console.log('Donations table structure is compatible');
      }
    }
  });
}

// Alter existing table to add missing columns
function alterExistingTable() {
  const alterQueries = [
    "ALTER TABLE donations ADD COLUMN donor_name VARCHAR(255) DEFAULT ''",
    "ALTER TABLE donations ADD COLUMN donor_email VARCHAR(255) DEFAULT ''", 
    "ALTER TABLE donations ADD COLUMN donor_phone VARCHAR(20)",
    "ALTER TABLE donations ADD COLUMN currency VARCHAR(3) DEFAULT 'INR'",
    "ALTER TABLE donations ADD COLUMN payment_method VARCHAR(50) DEFAULT 'razorpay'",
    "ALTER TABLE donations ADD COLUMN razorpay_order_id VARCHAR(255)",
    "ALTER TABLE donations ADD COLUMN razorpay_payment_id VARCHAR(255)",
    "ALTER TABLE donations ADD COLUMN razorpay_signature VARCHAR(255)",
    "ALTER TABLE donations ADD COLUMN transaction_status VARCHAR(20) DEFAULT 'completed'",
    "ALTER TABLE donations ADD COLUMN donation_type VARCHAR(20) DEFAULT 'one-time'",
    "ALTER TABLE donations ADD COLUMN cause_category VARCHAR(100)",
    "ALTER TABLE donations ADD COLUMN anonymous BOOLEAN DEFAULT FALSE",
    "ALTER TABLE donations ADD COLUMN message TEXT",
    "ALTER TABLE donations ADD COLUMN receipt_sent BOOLEAN DEFAULT FALSE"
  ];

  let completed = 0;
  alterQueries.forEach((query, index) => {
    db.query(query, (err) => {
      if (err && !err.message.includes('Duplicate column name')) {
        console.error(`Error in alter query ${index + 1}:`, err.message);
      } else if (!err) {
        console.log(`Added column ${index + 1} successfully`);
      }
      completed++;
      if (completed === alterQueries.length) {
        console.log('Table structure update completed');
        // Update existing records to have donor_email = user_email if empty
        updateExistingRecords();
      }
    });
  });
}

// Update existing records to map user_email to donor_email
function updateExistingRecords() {
  // First check if both columns exist
  db.query('DESCRIBE donations', (err, results) => {
    if (err) {
      console.error('Error checking table structure:', err.message);
      return;
    }
    
    const columns = results.map(r => r.Field);
    const hasUserEmail = columns.includes('user_email');
    const hasDonorEmail = columns.includes('donor_email');
    
    if (hasUserEmail && hasDonorEmail) {
      // Update donor_email from user_email where donor_email is empty
      db.query(`
        UPDATE donations 
        SET donor_email = user_email, 
            donor_name = COALESCE(NULLIF(donor_name, ''), 'Anonymous Donor'),
            transaction_status = CASE 
              WHEN status = 'completed' THEN 'completed'
              WHEN status = 'pending' THEN 'pending'
              WHEN status = 'failed' THEN 'failed'
              ELSE 'completed'
            END
        WHERE donor_email = '' OR donor_email IS NULL
      `, (err, result) => {
        if (err) {
          console.error('Error updating existing records:', err.message);
        } else {
          console.log(`Updated ${result.affectedRows} existing donation records`);
        }
      });
    } else {
      console.log('Table structure update complete - no existing records to migrate');
    }
  });
}

// Create new donations table (fallback)
function createNewDonationsTable() {
  const createDonationsTable = `
    CREATE TABLE IF NOT EXISTS donations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      donor_name VARCHAR(255) NOT NULL,
      donor_email VARCHAR(255) NOT NULL,
      donor_phone VARCHAR(20),
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'INR',
      payment_method VARCHAR(50) NOT NULL,
      payment_id VARCHAR(255) UNIQUE,
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255),
      razorpay_signature VARCHAR(255),
      transaction_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
      donation_type ENUM('one-time', 'monthly', 'yearly') DEFAULT 'one-time',
      cause_category VARCHAR(100),
      anonymous BOOLEAN DEFAULT FALSE,
      message TEXT,
      receipt_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_donor_email (donor_email),
      INDEX idx_payment_id (payment_id),
      INDEX idx_transaction_status (transaction_status),
      INDEX idx_created_at (created_at)
    )
  `;

  db.query(createDonationsTable, (err) => {
    if (err) {
      console.error('Error creating donations table:', err);
    } else {
      console.log('New donations table created successfully');
    }
  });
}

// Auth0 JWT middleware
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
});

// Public routes (no authentication required)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Alumni Portal API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      public: ['/api/health'],
      protected: ['/api/protected', '/api/users', '/api/users/profile', '/api/data/:table']
    }
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = dbHelpers ? 'connected' : 'disconnected';
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    auth0: {
      domain: process.env.AUTH0_DOMAIN ? 'configured' : 'not configured',
      audience: process.env.AUTH0_AUDIENCE ? 'configured' : 'not configured'
    }
  });
});

// Protected route example
app.get('/api/protected', checkJwt, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.auth });
});

// Store user info after login (example endpoint)
app.post('/api/users', checkJwt, (req, res) => {
  const { sub, email } = req.body;
  if (!sub || !email) {
    return res.status(400).json({ error: 'Missing user info' });
  }
  db.query(
    'INSERT INTO users (auth0_id, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE email = VALUES(email)',
    [sub, email],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err });
      }
      res.json({ message: 'User stored/updated', results });
    }
  );
});

// Donation endpoints
app.get('/api/donations', (req, res) => {
  const { page = 1, limit = 10, status, donor_email } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM donations';
  let countQuery = 'SELECT COUNT(*) as total FROM donations';
  let params = [];
  let countParams = [];
  
  const whereConditions = [];
  
  if (status) {
    whereConditions.push('transaction_status = ?');
    params.push(status);
    countParams.push(status);
  }
  
  if (donor_email) {
    whereConditions.push('donor_email = ?');
    params.push(donor_email);
    countParams.push(donor_email);
  }
  
  if (whereConditions.length > 0) {
    const whereClause = ' WHERE ' + whereConditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  // Get total count
  db.query(countQuery, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const total = countResult[0].total;
    
    // Get paginated results
    db.query(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        donations: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    });
  });
});

app.post('/api/donations', (req, res) => {
  const {
    donor_name,
    donor_email,
    donor_phone,
    amount,
    currency = 'INR',
    payment_method,
    payment_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    transaction_status = 'pending',
    donation_type = 'one-time',
    cause_category,
    anonymous = false,
    message
  } = req.body;

  // Validation
  if (!donor_name || !donor_email || !amount || !payment_method) {
    return res.status(400).json({ 
      error: 'Missing required fields: donor_name, donor_email, amount, payment_method' 
    });
  }

  const query = `
    INSERT INTO donations (
      donor_name, donor_email, user_email, donor_phone, amount, currency, payment_method,
      payment_id, order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
      transaction_status, donation_type, cause_category, anonymous, message, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    donor_name, donor_email, donor_email, donor_phone, amount, currency, payment_method,
    payment_id, razorpay_order_id || payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
    transaction_status, donation_type, cause_category, anonymous, message, message
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      id: result.insertId,
      donor_name,
      donor_email,
      amount,
      transaction_status,
      created_at: new Date().toISOString()
    });
  });
});

app.get('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('SELECT * FROM donations WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    res.json(results[0]);
  });
});

app.put('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Get current donation
  db.query('SELECT * FROM donations WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    // Build update query
    const allowedFields = [
      'donor_name', 'donor_email', 'donor_phone', 'transaction_status',
      'razorpay_payment_id', 'razorpay_signature', 'receipt_sent', 'message'
    ];
    
    const updateFields = [];
    const values = [];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(id);
    const query = `UPDATE donations SET ${updateFields.join(', ')} WHERE id = ?`;
    
    db.query(query, values, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ message: 'Donation updated successfully' });
    });
  });
});

app.delete('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM donations WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    res.json({ message: 'Donation deleted successfully' });
  });
});

// Analytics endpoint
app.get('/api/donations/analytics/summary', (req, res) => {
  const queries = {
    totalAmount: 'SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE transaction_status = "completed"',
    totalDonations: 'SELECT COUNT(*) as count FROM donations WHERE transaction_status = "completed"',
    monthlyAmount: `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM donations 
      WHERE transaction_status = "completed" 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    `,
    monthlyDonations: `
      SELECT COUNT(*) as count 
      FROM donations 
      WHERE transaction_status = "completed" 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.query(query, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      results[key] = result[0];
      completed++;
      
      if (completed === totalQueries) {
        res.json({
          totalDonationAmount: results.totalAmount.total,
          totalDonations: results.totalDonations.count,
          monthlyDonationAmount: results.monthlyAmount.total,
          monthlyDonations: results.monthlyDonations.count
        });
      }
    });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
}); 