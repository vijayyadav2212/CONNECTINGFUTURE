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
    const period = searchParams.get('period') || '30'; // days
    const groupBy = searchParams.get('group_by') || 'day'; // day, week, month

    const connection = await createConnection();

    try {
      // Get overall statistics
      const [overallStats]: any = await connection.execute(`
        SELECT 
          COUNT(*) as total_donations,
          SUM(CASE WHEN transaction_status = 'completed' THEN amount ELSE 0 END) as total_amount,
          COUNT(DISTINCT donor_email) as unique_donors,
          AVG(CASE WHEN transaction_status = 'completed' THEN amount ELSE NULL END) as avg_donation,
          SUM(CASE WHEN transaction_status = 'completed' THEN 1 ELSE 0 END) as successful_donations,
          SUM(CASE WHEN transaction_status = 'failed' THEN 1 ELSE 0 END) as failed_donations,
          SUM(CASE WHEN transaction_status = 'pending' THEN 1 ELSE 0 END) as pending_donations
        FROM donations
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [period]);

      // Get trend data based on groupBy parameter
      let dateFormat = '%Y-%m-%d';
      let dateInterval = 'DAY';
      
      if (groupBy === 'week') {
        dateFormat = '%Y-%u';
        dateInterval = 'WEEK';
      } else if (groupBy === 'month') {
        dateFormat = '%Y-%m';
        dateInterval = 'MONTH';
      }

      const [trendData]: any = await connection.execute(`
        SELECT 
          DATE_FORMAT(created_at, ?) as period,
          COUNT(*) as donations_count,
          SUM(CASE WHEN transaction_status = 'completed' THEN amount ELSE 0 END) as total_amount,
          COUNT(DISTINCT donor_email) as unique_donors
        FROM donations
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? ${dateInterval})
        GROUP BY DATE_FORMAT(created_at, ?)
        ORDER BY period ASC
      `, [dateFormat, period, dateFormat]);

      // Get top donors
      const [topDonors]: any = await connection.execute(`
        SELECT 
          donor_name,
          donor_email,
          SUM(amount) as total_donated,
          COUNT(*) as donation_count,
          anonymous
        FROM donations
        WHERE transaction_status = 'completed' 
          AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND anonymous = FALSE
        GROUP BY donor_email, donor_name, anonymous
        ORDER BY total_donated DESC
        LIMIT 10
      `, [period]);

      // Get donations by category
      const [categoryStats]: any = await connection.execute(`
        SELECT 
          COALESCE(cause_category, 'General') as category,
          COUNT(*) as donation_count,
          SUM(CASE WHEN transaction_status = 'completed' THEN amount ELSE 0 END) as total_amount,
          AVG(CASE WHEN transaction_status = 'completed' THEN amount ELSE NULL END) as avg_amount
        FROM donations
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY cause_category
        ORDER BY total_amount DESC
      `, [period]);

      // Get payment method statistics
      const [paymentStats]: any = await connection.execute(`
        SELECT 
          payment_method,
          COUNT(*) as usage_count,
          SUM(CASE WHEN transaction_status = 'completed' THEN amount ELSE 0 END) as total_amount,
          ROUND(AVG(CASE WHEN transaction_status = 'completed' THEN amount ELSE NULL END), 2) as avg_amount,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM donations WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY))), 2) as percentage
        FROM donations
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY payment_method
        ORDER BY usage_count DESC
      `, [period, period]);

      // Get recent large donations
      const [largeDonations]: any = await connection.execute(`
        SELECT 
          donor_name,
          amount,
          currency,
          cause_category,
          created_at,
          anonymous
        FROM donations
        WHERE transaction_status = 'completed' 
          AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND amount >= 1000
        ORDER BY amount DESC
        LIMIT 10
      `, [period]);

      return NextResponse.json({
        success: true,
        data: {
          overview: overallStats[0],
          trends: trendData,
          topDonors: topDonors,
          categories: categoryStats,
          paymentMethods: paymentStats,
          largeDonations: largeDonations,
          period: `${period} days`,
          groupBy: groupBy,
        },
      });

    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching donation analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
