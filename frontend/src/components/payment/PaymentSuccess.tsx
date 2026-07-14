"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Heart, ArrowRight, Download, Share2, Sparkles, Gift, Users, Award, Globe, Calendar, Clock } from 'lucide-react';
import { generatePDFReceipt } from './PDFReceipt';

interface PaymentSuccessProps {
  paymentId: string;
  orderId: string;
  amount: number;
  description?: string;
  onContinue?: () => void;
  onDownloadReceipt?: () => void;
}

export default function PaymentSuccess({
  paymentId,
  orderId,
  amount,
  description,
  onContinue,
  onDownloadReceipt
}: PaymentSuccessProps) {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = currentDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const handleDownloadReceipt = async () => {
    if (!paymentId || !orderId) return;
    
    try {
      await generatePDFReceipt({
        paymentId,
        orderId,
        amount,
        description: description || 'Donation to Alumnex',
        date: formattedDate,
        time: formattedTime,
        customerName: 'Anonymous Donor', // You can pass actual user name here
        customerEmail: 'donor@example.com' // You can pass actual user email here
      });
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      alert('Failed to generate PDF receipt. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <CardTitle className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </CardTitle>
          
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Thank you for your generous contribution to Alumnex. 
            Your donation will make a real difference in students' lives.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Payment Details */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Gift className="w-5 h-5 mr-2 text-green-600" />
              Payment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Amount:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{amount.toLocaleString()}
                  </span>
                </div>
                {description && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Description:</span>
                    <span className="text-sm text-gray-700 font-medium">{description}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-sm text-gray-700">{formattedDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Time:</span>
                  <span className="text-sm text-gray-700">{formattedTime}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    {paymentId.substring(0, 12)}...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    {orderId.substring(0, 12)}...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                    ✅ Confirmed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Message */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Impact
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  This contribution will help support student scholarships, mentorship programs, 
                  and community initiatives. You're helping build a brighter future for the next generation.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">Opportunities</div>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">Community</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Continue to Dashboard
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={handleDownloadReceipt}
                className="w-full border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'I just donated to Alumnex!',
                      text: `I contributed ₹${amount.toLocaleString()} to support student scholarships and community programs. Join me in making a difference!`,
                      url: window.location.origin
                    });
                  } else {
                    // Fallback for browsers that don't support Web Share API
                    navigator.clipboard.writeText(`I just donated ₹${amount.toLocaleString()} to Alumnex! Join me in supporting students and building a stronger community.`);
                    alert('Share message copied to clipboard!');
                  }
                }}
                className="w-full border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Impact
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              A confirmation email has been sent to your registered email address.
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 