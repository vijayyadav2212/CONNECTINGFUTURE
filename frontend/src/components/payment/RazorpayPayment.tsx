"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, CheckCircle, XCircle, Loader2, Gift, FileText, Shield } from 'lucide-react';

interface PaymentDetails {
  amount: number;
  currency?: string;
  description?: string;
  email?: string;
  contact?: string;
  name?: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  donationType?: string;
  causeCategory?: string;
  anonymous?: boolean;
  message?: string;
  paymentType?: 'donation' | 'mentorship';
}

interface RazorpayPaymentProps {
  paymentDetails: PaymentDetails;
  onSuccess?: (paymentId: string, orderId: string) => void;
  onFailure?: (error: any) => void;
  className?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment({ 
  paymentDetails, 
  onSuccess, 
  onFailure, 
  className = "" 
}: RazorpayPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentDetails.amount,
          currency: paymentDetails.currency || 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            description: paymentDetails.description || 'Payment for Connecting Future',
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Connecting Future',
        description: paymentDetails.description || 'Payment for Connecting Future',
        order_id: orderData.order.id,

        handler: async function (response: any) {
          try {
            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

            // Prepare donation data for backend
            const donationData = {
              donor_name: paymentDetails.donorName || paymentDetails.name || 'Anonymous Donor',
              donor_email: paymentDetails.donorEmail || paymentDetails.email || 'anonymous@example.com',
              donor_phone: paymentDetails.donorPhone || paymentDetails.contact || null,
              amount: paymentDetails.amount,
              currency: paymentDetails.currency || 'INR',
              donation_type: paymentDetails.donationType || 'one-time',
              cause_category: paymentDetails.causeCategory || 'General',
              anonymous: paymentDetails.anonymous || false,
              message: paymentDetails.message || paymentDetails.description || null,
              paymentType: paymentDetails.paymentType || 'donation'
            };

            // Call backend to verify signature and save donation
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                signature: razorpay_signature,
                donationData: donationData
              }),
            });

            const result = await verifyRes.json();

            if (result.valid) {
              console.log("✅ Payment verified and donation saved successfully!");
              console.log("Donation ID:", result.donationId);
              onSuccess?.(razorpay_payment_id, razorpay_order_id);
            } else {
              console.error("❌ Payment verification failed!");
              onFailure?.(new Error('Payment verification failed'));
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onFailure?.(error);
          }
        },
        prefill: {
          name: paymentDetails.name || '',
          email: paymentDetails.email || '',
          contact: paymentDetails.contact || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
      onFailure?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`shadow-xl border-0 bg-white/90 backdrop-blur-sm ${className}`}>
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center text-gray-900 text-xl">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enhanced Payment Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Gift className="w-5 h-5 mr-2 text-blue-600" />
            Payment Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">₹</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Amount</span>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{paymentDetails.amount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Amount</div>
                <div className="text-xs text-green-600 font-medium">Including all fees</div>
              </div>
            </div>
            
            {paymentDetails.description && (
              <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Description</span>
                    <div className="text-sm text-gray-700 font-medium">{paymentDetails.description}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Secure Payment</h4>
              <p className="text-sm text-gray-600">Protected by Razorpay</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>UPI Enabled</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Bank Grade Security</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Supports GPay, PhonePe, Paytm, BHIM UPI & all major payment methods
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-red-900">Payment Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <Button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay ₹{paymentDetails.amount.toLocaleString()} - UPI/Cards/NetBanking
            </>
          )}
        </Button>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Shield className="w-3 h-3" />
            <span>Your payment is secured by Razorpay</span>
          </div>
          <div className="text-xs text-gray-400">
            By proceeding, you agree to our terms and conditions
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 