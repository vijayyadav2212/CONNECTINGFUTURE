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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const donationId = params.id;

    if (!donationId || isNaN(parseInt(donationId))) {
      return NextResponse.json(
        { success: false, error: 'Invalid donation ID' },
        { status: 400 }
      );
    }

    const connection = await createConnection();

    try {
      // Get donation details
      const [donation]: any = await connection.execute(`
        SELECT 
          id,
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
          message,
          receipt_sent,
          created_at,
          updated_at
        FROM donations 
        WHERE id = ?
      `, [donationId]);

      if (donation.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Donation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: donation[0],
      });

    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching donation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch donation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const donationId = params.id;
    const body = await request.json();

    if (!donationId || isNaN(parseInt(donationId))) {
      return NextResponse.json(
        { success: false, error: 'Invalid donation ID' },
        { status: 400 }
      );
    }

    const {
      transaction_status,
      razorpay_payment_id,
      razorpay_signature,
      receipt_sent,
      cause_category,
      message,
    } = body;

    const connection = await createConnection();

    try {
      // Check if donation exists
      const [existing]: any = await connection.execute(
        'SELECT * FROM donations WHERE id = ?',
        [donationId]
      );

      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Donation not found' },
          { status: 404 }
        );
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (transaction_status) {
        updateFields.push('transaction_status = ?');
        updateValues.push(transaction_status);
      }

      if (razorpay_payment_id) {
        updateFields.push('razorpay_payment_id = ?');
        updateValues.push(razorpay_payment_id);
      }

      if (razorpay_signature) {
        updateFields.push('razorpay_signature = ?');
        updateValues.push(razorpay_signature);
      }

      if (typeof receipt_sent === 'boolean') {
        updateFields.push('receipt_sent = ?');
        updateValues.push(receipt_sent);
      }

      if (cause_category) {
        updateFields.push('cause_category = ?');
        updateValues.push(cause_category);
      }

      if (message !== undefined) {
        updateFields.push('message = ?');
        updateValues.push(message);
      }

      if (updateFields.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No fields to update' },
          { status: 400 }
        );
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(donationId);

      // Execute update
      await connection.execute(
        `UPDATE donations SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Update analytics if status changed to completed
      if (transaction_status === 'completed' && existing[0].transaction_status !== 'completed') {
        await updateDonationAnalytics(connection, existing[0].amount);
      }

      // Fetch updated donation
      const [updatedDonation]: any = await connection.execute(
        'SELECT * FROM donations WHERE id = ?',
        [donationId]
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const donationId = params.id;

    if (!donationId || isNaN(parseInt(donationId))) {
      return NextResponse.json(
        { success: false, error: 'Invalid donation ID' },
        { status: 400 }
      );
    }

    const connection = await createConnection();

    try {
      // Check if donation exists
      const [existing]: any = await connection.execute(
        'SELECT * FROM donations WHERE id = ?',
        [donationId]
      );

      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Donation not found' },
          { status: 404 }
        );
      }

      // Only allow deletion of pending or failed donations
      if (existing[0].transaction_status === 'completed') {
        return NextResponse.json(
          { success: false, error: 'Cannot delete completed donations' },
          { status: 400 }
        );
      }

      // Delete the donation
      await connection.execute(
        'DELETE FROM donations WHERE id = ?',
        [donationId]
      );

      return NextResponse.json({
        success: true,
        message: 'Donation deleted successfully',
      });

    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error deleting donation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete donation',
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
