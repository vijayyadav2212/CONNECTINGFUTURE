import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'connectingfuture',
  port: parseInt(process.env.DB_PORT || '3306'),
};

// Create database connection
async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Database connection failed');
  }
}

// Initialize database tables
async function initializeTables() {
  const connection = await createConnection();
  
  try {
    // Create donations table if it doesn't exist
    await connection.execute(`
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
    `);

    // Create donation_analytics table for reporting
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS donation_analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        total_amount DECIMAL(12, 2) DEFAULT 0,
        total_donations INT DEFAULT 0,
        unique_donors INT DEFAULT 0,
        avg_donation_amount DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_date (date)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing tables:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const donorEmail = searchParams.get('donor_email');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const offset = (page - 1) * limit;

    const connection = await createConnection();

    try {
      // Build dynamic query based on filters
      let query = `
        SELECT 
          id,
          donor_name,
          donor_email,
          donor_phone,
          amount,
          currency,
          payment_method,
          payment_id,
          transaction_status,
          donation_type,
          cause_category,
          anonymous,
          message,
          receipt_sent,
          created_at,
          updated_at
        FROM donations
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];

      if (status) {
        query += ' AND transaction_status = ?';
        queryParams.push(status);
      }

      if (donorEmail) {
        query += ' AND donor_email = ?';
        queryParams.push(donorEmail);
      }

      if (dateFrom) {
        query += ' AND DATE(created_at) >= ?';
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        query += ' AND DATE(created_at) <= ?';
        queryParams.push(dateTo);
      }

      // Add ordering and pagination
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);

      // Execute the main query
      const [rows] = await connection.execute(query, queryParams);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM donations WHERE 1=1';
      const countParams: any[] = [];

      if (status) {
        countQuery += ' AND transaction_status = ?';
        countParams.push(status);
      }

      if (donorEmail) {
        countQuery += ' AND donor_email = ?';
        countParams.push(donorEmail);
      }

      if (dateFrom) {
        countQuery += ' AND DATE(created_at) >= ?';
        countParams.push(dateFrom);
      }

      if (dateTo) {
        countQuery += ' AND DATE(created_at) <= ?';
        countParams.push(dateTo);
      }

      const [countResult]: any = await connection.execute(countQuery, countParams);
      const totalRecords = countResult[0].total;

      // Get summary statistics
      const [summaryResult]: any = await connection.execute(`
        SELECT 
          COUNT(*) as total_donations,
          SUM(CASE WHEN transaction_status = 'completed' THEN amount ELSE 0 END) as total_amount,
          COUNT(DISTINCT donor_email) as unique_donors,
          AVG(CASE WHEN transaction_status = 'completed' THEN amount ELSE NULL END) as avg_amount
        FROM donations
        WHERE transaction_status = 'completed'
      `);

      return NextResponse.json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          recordsPerPage: limit,
        },
        summary: summaryResult[0],
      });

    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch donations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
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
      message,
    } = body;

    // Basic validation
    if (!donor_name || !donor_email || !amount || !payment_method) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          required: ['donor_name', 'donor_email', 'amount', 'payment_method']
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donor_email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const connection = await createConnection();

    try {
      // Insert donation record
      const [result]: any = await connection.execute(`
        INSERT INTO donations (
          donor_name,
          donor_email,
          donor_phone,
          amount,
          currency,
          payment_method,
          payment_id,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          transaction_status,
          donation_type,
          cause_category,
          anonymous,
          message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        donor_name,
        donor_email,
        donor_phone,
        parseFloat(amount),
        currency,
        payment_method,
        payment_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        transaction_status,
        donation_type,
        cause_category,
        anonymous,
        message,
      ]);

      const donationId = result.insertId;

      // Update analytics if transaction is completed
      if (transaction_status === 'completed') {
        await updateDonationAnalytics(connection, parseFloat(amount));
      }

      // Fetch the created donation
      const [createdDonation]: any = await connection.execute(
        'SELECT * FROM donations WHERE id = ?',
        [donationId]
      );

      return NextResponse.json({
        success: true,
        message: 'Donation recorded successfully',
        data: createdDonation[0],
      }, { status: 201 });

    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error processing donation:', error);
    
    // Handle duplicate payment_id error
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Donation with this payment ID already exists',
          code: 'DUPLICATE_PAYMENT'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process donation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT method for updating donation status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, transaction_status, razorpay_payment_id, razorpay_signature } = body;

    if (!id || !transaction_status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, transaction_status' },
        { status: 400 }
      );
    }

    const connection = await createConnection();

    try {
      // Check if donation exists
      const [existing]: any = await connection.execute(
        'SELECT * FROM donations WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Donation not found' },
          { status: 404 }
        );
      }

      // Update donation
      const [result]: any = await connection.execute(`
        UPDATE donations 
        SET 
          transaction_status = ?,
          razorpay_payment_id = COALESCE(?, razorpay_payment_id),
          razorpay_signature = COALESCE(?, razorpay_signature),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [transaction_status, razorpay_payment_id, razorpay_signature, id]);

      // Update analytics if status changed to completed
      if (transaction_status === 'completed' && existing[0].transaction_status !== 'completed') {
        await updateDonationAnalytics(connection, existing[0].amount);
      }

      // Fetch updated donation
      const [updatedDonation]: any = await connection.execute(
        'SELECT * FROM donations WHERE id = ?',
        [id]
      );

      return NextResponse.json({
        success: true,
        message: 'Donation updated successfully',
        data: updatedDonation[0],
      });

    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error updating donation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update donation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to update analytics
async function updateDonationAnalytics(connection: mysql.Connection, amount: number) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await connection.execute(`
      INSERT INTO donation_analytics (date, total_amount, total_donations, unique_donors, avg_donation_amount)
      VALUES (?, ?, 1, 1, ?)
      ON DUPLICATE KEY UPDATE
        total_amount = total_amount + VALUES(total_amount),
        total_donations = total_donations + 1,
        avg_donation_amount = total_amount / total_donations
    `, [today, amount, amount]);
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
}

// Initialize tables when the module loads (only in runtime)
if (process.env.NODE_ENV !== 'test' && typeof window === 'undefined') {
  // Only run in server environment and not during build
  initializeTables().catch((error) => {
    console.warn('Database initialization skipped during build:', error.message);
  });
}