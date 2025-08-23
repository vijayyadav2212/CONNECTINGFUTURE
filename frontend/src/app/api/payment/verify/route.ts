import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, orderId, signature, donationData } = await request.json();

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment verification parameters' },
        { status: 400 }
      );
    }

    // Check if Razorpay secret is configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature === signature) {
      // ✅ Valid payment - save to backend database
      console.log("Payment verified successfully:", { paymentId, orderId });
      
      try {
        // Save donation to backend database
        const donationRecord = {
          donor_name: donationData?.donor_name || 'Anonymous Donor',
          donor_email: donationData?.donor_email || 'anonymous@example.com',
          donor_phone: donationData?.donor_phone || null,
          amount: donationData?.amount || 0,
          currency: donationData?.currency || 'INR',
          payment_method: 'razorpay',
          payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          transaction_status: 'completed',
          donation_type: donationData?.donation_type || 'one-time',
          cause_category: donationData?.cause_category || 'General',
          anonymous: donationData?.anonymous || false,
          message: donationData?.message || null
        };

        // Save to backend API
        const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/donations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(donationRecord),
        });

        if (!backendResponse.ok) {
          const errorData = await backendResponse.json();
          console.error('Backend API error:', errorData);
          throw new Error(`Backend API error: ${errorData.error || 'Unknown error'}`);
        }

        const savedDonation = await backendResponse.json();
        console.log("Donation saved to backend successfully:", savedDonation);
        
        return NextResponse.json({ 
          valid: true,
          message: "Payment verified and donation saved successfully",
          paymentId,
          orderId,
          donationId: savedDonation.id
        });
        
      } catch (dbError) {
        console.error("Database/Backend error:", dbError);
        return NextResponse.json(
          { 
            valid: true, 
            message: "Payment verified but failed to save donation record",
            error: dbError instanceof Error ? dbError.message : 'Database error',
            paymentId,
            orderId
          },
          { status: 207 } // 207 Multi-Status: partial success
        );
      }
    } else {
      console.error("Payment verification failed - signature mismatch");
      return NextResponse.json({ 
        valid: false,
        error: "Invalid payment signature" 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

// Database integration function
async function savePaymentToDatabase(paymentData: {
  paymentId: string;
  orderId: string;
  amount: number;
  status: string;
  verifiedAt: string;
  signature: string;
}) {
  // Example database save - replace with your actual database connection
  // This is a placeholder for MySQL/PostgreSQL integration
  
  const query = `
    INSERT INTO payments (
      payment_id, 
      order_id, 
      amount, 
      status, 
      verified_at, 
      signature,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  
  const values = [
    paymentData.paymentId,
    paymentData.orderId,
    paymentData.amount,
    paymentData.status,
    paymentData.verifiedAt,
    paymentData.signature
  ];
  
  // Example using mysql2 (you'll need to set up your connection)
  // const connection = await mysql.createConnection(process.env.DATABASE_URL);
  // await connection.execute(query, values);
  // await connection.end();
  
  // For now, just log the data
  console.log("Would save to database:", paymentData);
} 