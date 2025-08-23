import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Check if webhook secret is configured
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Webhook not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle different payment events
    switch (event.event) {
      case 'payment.captured':
        // Payment was successful
        console.log('Payment captured:', event.payload.payment.entity);
        // Here you can update your database, send emails, etc.
        break;

      case 'payment.failed':
        // Payment failed
        console.log('Payment failed:', event.payload.payment.entity);
        // Handle failed payment
        break;

      case 'order.paid':
        // Order was paid
        console.log('Order paid:', event.payload.order.entity);
        // Handle successful order
        break;

      default:
        console.log('Unhandled event:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 