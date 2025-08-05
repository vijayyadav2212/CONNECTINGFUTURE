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

async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Database connection failed');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const connection = await createConnection();

    try {
      // Build query based on filters
      let query = `
        SELECT 
          id,
          donor_name,
          donor_email,
          amount,
          currency,
          payment_method,
          payment_id,
          transaction_status,
          donation_type,
          cause_category,
          message,
          receipt_sent,
          created_at,
          updated_at
        FROM donations
        WHERE donor_email = ?
      `;
      
      const queryParams: any[] = [email];

      if (status) {
        query += ' AND transaction_status = ?';
        queryParams.push(status);
      }

      // Add ordering and pagination
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);

      // Execute the main query
      const [donations] = await connection.execute(query, queryParams);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM donations WHERE donor_email = ?';
      const countParams: any[] = [email];

      if (status) {
        countQuery += ' AND transaction_status = ?';
        countParams.push(status);
      }

      const [countResult]: any = await connection.execute(countQuery, countParams);
      const totalRecords = countResult[0].total;

      // Get donor summary statistics
      const [donorStats]: any = await connection.execute(`
        SELECT 
          donor_name,
          donor_email,
          COUNT(*) as total_donations,
          SUM(CASE WHEN transaction_status = 'completed' THEN amount ELSE 0 END) as total_donated,
          AVG(CASE WHEN transaction_status = 'completed' THEN amount ELSE NULL END) as avg_donation,
          MIN(created_at) as first_donation_date,
          MAX(created_at) as last_donation_date,
          SUM(CASE WHEN transaction_status = 'completed' THEN 1 ELSE 0 END) as successful_donations,
          SUM(CASE WHEN transaction_status = 'failed' THEN 1 ELSE 0 END) as failed_donations,
          SUM(CASE WHEN transaction_status = 'pending' THEN 1 ELSE 0 END) as pending_donations
        FROM donations
        WHERE donor_email = ?
        GROUP BY donor_name, donor_email
      `, [email]);

      // Get donation categories breakdown
      const [categoryBreakdown]: any = await connection.execute(`
        SELECT 
          COALESCE(cause_category, 'General') as category,
          COUNT(*) as donation_count,
          SUM(CASE WHEN transaction_status = 'completed' THEN amount ELSE 0 END) as total_amount
        FROM donations
        WHERE donor_email = ? AND transaction_status = 'completed'
        GROUP BY cause_category
        ORDER BY total_amount DESC
      `, [email]);

      // Get monthly donation trend
      const [monthlyTrend]: any = await connection.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as donation_count,
          SUM(CASE WHEN transaction_status = 'completed' THEN amount ELSE 0 END) as monthly_total
        FROM donations
        WHERE donor_email = ?
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
      `, [email]);

      return NextResponse.json({
        success: true,
        data: {
          donations: donations,
          donorProfile: donorStats[0] || {
            donor_name: '',
            donor_email: email,
            total_donations: 0,
            total_donated: 0,
            avg_donation: 0,
            first_donation_date: null,
            last_donation_date: null,
            successful_donations: 0,
            failed_donations: 0,
            pending_donations: 0,
          },
          categoryBreakdown: categoryBreakdown,
          monthlyTrend: monthlyTrend,
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          recordsPerPage: limit,
        },
      });

    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching donor history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch donor history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
