# Razorpay Payment Gateway Integration (Simplified Flow)

This document explains how to set up and use the Razorpay payment gateway integration in the Connecting Future application using a simplified client-side verification approach.

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install razorpay@^2.9.2
```

### 2. Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret

# Public Razorpay Key (for frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_test_key_id
```

### 3. Get Razorpay Credentials

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Generate a new key pair
4. Copy the Key ID and Key Secret to your environment variables

## 📁 File Structure

```
frontend/src/
├── app/api/payment/
│   ├── create-order/route.ts      # Create payment order
│   └── verify/route.ts            # Verify payment signature
├── components/payment/
│   ├── RazorpayPayment.tsx       # React payment component
│   └── PaymentSuccess.tsx         # Success page component
└── app/alumni/donation/
    └── page.tsx                   # Donation page
```

## 🔧 API Endpoints

### 1. Create Order
- **POST** `/api/payment/create-order`
- **Body**: `{ amount, currency, receipt, notes }`
- **Response**: `{ success, order: { id, amount, currency, receipt } }`

### 2. Verify Payment
- **POST** `/api/payment/verify`
- **Body**: `{ paymentId, orderId, signature }`
- **Response**: `{ valid: true/false, message, paymentId, orderId }`

## 🎯 Simplified Payment Flow

### ✅ Updated Flow (Without Webhooks)

**🔁 Flow:**
1. Frontend calls Razorpay Checkout
2. Razorpay returns `payment_id`, `order_id`, and `signature`
3. You send those values to your API route to verify the signature on your server
4. If verified, mark the payment successful

### 1. Razorpay Checkout Handler (Frontend)

In your `RazorpayPayment.tsx`:

```typescript
handler: async function (response) {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

  // Call backend to verify signature
  const verifyRes = await fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
    }),
  });

  const result = await verifyRes.json();

  if (result.valid) {
    console.log("✅ Payment verified successfully!");
    onSuccess?.(razorpay_payment_id, razorpay_order_id);
  } else {
    console.error("❌ Payment verification failed!");
    onFailure?.(new Error('Payment verification failed'));
  }
}
```

### 2. Server-side Signature Verification

The `/api/payment/verify` route:

```typescript
const body = orderId + "|" + paymentId;
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
  .update(body)
  .digest("hex");

if (expectedSignature === signature) {
  // ✅ Valid payment, you can save to DB
  return NextResponse.json({ valid: true });
} else {
  return NextResponse.json({ valid: false });
}
```

## 🎯 Usage Examples

### Basic Payment Component

```tsx
<RazorpayPayment
  paymentDetails={{
    amount: 1000,
    description: 'Donation to Connecting Future',
    name: 'John Doe',
    email: 'john@example.com',
  }}
  onSuccess={(paymentId, orderId) => {
    console.log('Payment successful:', { paymentId, orderId });
  }}
  onFailure={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

### Payment Success Page

```tsx
<PaymentSuccess
  paymentId="pay_1234567890"
  orderId="order_1234567890"
  amount={1000}
  description="Donation: Gold Supporter"
  onContinue={() => router.push('/dashboard')}
  onDownloadReceipt={() => downloadReceipt()}
/>
```

## 🔒 Security Features

1. **Payment Verification**: All payments are verified using HMAC SHA256 signatures
2. **Environment Variables**: Sensitive keys are stored securely
3. **Error Handling**: Comprehensive error handling for all payment scenarios
4. **Database Integration**: Optional database storage for payment records

## 🧪 Testing

### Test Cards (Razorpay Test Mode)

- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test UPI IDs

- **Success**: success@razorpay
- **Failure**: failure@razorpay

## 📊 Payment Flow

1. **User selects donation amount**
2. **Frontend calls `/api/payment/create-order`**
3. **Razorpay order is created**
4. **Payment modal opens**
5. **User completes payment**
6. **Frontend calls `/api/payment/verify`**
7. **Payment is verified and processed**
8. **Success/failure callback is triggered**
9. **User sees success page with receipt download**

## 🚨 Error Handling

The integration includes comprehensive error handling for:
- Network failures
- Invalid payment signatures
- Razorpay API errors
- User cancellation

## 📝 Database Integration

The verification route includes optional database integration:

```typescript
// Save payment record to database
await savePaymentToDatabase({
  paymentId,
  orderId,
  amount: 1000,
  status: 'completed',
  verifiedAt: new Date().toISOString(),
  signature: signature
});
```

## 📝 Notes

- All amounts are in INR (Indian Rupees)
- Razorpay expects amounts in paise (multiply by 100)
- Test mode is used for development
- Production requires live mode credentials
- No webhooks needed - all verification happens client-side

## 🆘 Troubleshooting

### Common Issues

1. **Payment verification fails**
   - Check if Razorpay secret is correct
   - Verify signature calculation

2. **Order creation fails**
   - Ensure Razorpay credentials are correct
   - Check if amount is valid

3. **Script loading issues**
   - Check if Razorpay script loads properly
   - Verify network connectivity

### Debug Mode

Enable debug logging by adding to your environment:
```env
DEBUG=razorpay:*
```

## 📞 Support

For Razorpay-specific issues, contact:
- [Razorpay Support](https://razorpay.com/support/)
- [Razorpay Documentation](https://razorpay.com/docs/)

For application-specific issues, check the application logs and error handling.

## ✅ Summary (No Webhooks Needed)

| Step | Description |
|------|-------------|
| Checkout Complete | You get `payment_id`, `order_id`, `signature` |
| Verify Signature | Server compares HMAC hash using `RAZORPAY_KEY_SECRET` |
| Save to DB | If valid, store payment or mark order as paid |
| Show Success | Display success page with receipt download | 