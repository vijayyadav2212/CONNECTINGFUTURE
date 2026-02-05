"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import AlumniNavigation from '../AluminaNavigation';
import RazorpayPayment from '@/components/payment/RazorpayPayment';
import PaymentSuccess from '@/components/payment/PaymentSuccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, CheckCircle, Gift, Users, Award, Star, Sparkles, TrendingUp, Globe, BookOpen, GraduationCap, Zap, History, ArrowRight } from 'lucide-react';

interface DonationTier {
  id: string;
  name: string;
  amount: number;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
  color: string;
  gradient: string;
  popular?: boolean;
}

const donationTiers: DonationTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Supporter',
    amount: 500,
    description: 'Support our community initiatives',
    benefits: [
      'Recognition on our website',
      'Monthly newsletter',
      'Access to exclusive content'
    ],
    icon: <Heart className="w-6 h-6 text-orange-500" />,
    color: 'orange',
    gradient: 'from-orange-400 to-red-500'
  },
  {
    id: 'silver',
    name: 'Silver Supporter',
    amount: 1000,
    description: 'Help us grow and expand our programs',
    benefits: [
      'All Bronze benefits',
      'Priority mentorship matching',
      'Exclusive networking events',
      'Featured profile on platform'
    ],
    icon: <Star className="w-6 h-6 text-gray-400" />,
    color: 'gray',
    gradient: 'from-gray-400 to-slate-500'
  },
  {
    id: 'gold',
    name: 'Gold Supporter',
    amount: 2500,
    description: 'Make a significant impact on student success',
    benefits: [
      'All Silver benefits',
      'Direct mentorship opportunities',
      'VIP event invitations',
      'Custom profile badge',
      'Annual impact report'
    ],
    icon: <Award className="w-6 h-6 text-yellow-500" />,
    color: 'yellow',
    gradient: 'from-yellow-400 to-orange-500',
    popular: true
  },
  {
    id: 'platinum',
    name: 'Platinum Supporter',
    amount: 5000,
    description: 'Transform the future of education',
    benefits: [
      'All Gold benefits',
      'Named scholarship program',
      'Board advisory role',
      'Exclusive campus visits',
      'Personal impact dashboard'
    ],
    icon: <Gift className="w-6 h-6 text-purple-500" />,
    color: 'purple',
    gradient: 'from-purple-400 to-pink-500'
  }
];

export default function DonationPage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<DonationTier | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentId: string;
    orderId: string;
    amount: number;
    description: string;
  } | null>(null);
  const [userDonations, setUserDonations] = useState<{
    totalAmount: number;
    totalDonations: number;
    lastDonation: string | null;
  }>({ totalAmount: 0, totalDonations: 0, lastDonation: null });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch user's donation statistics
  const fetchUserStats = async () => {
    if (!user?.email) {
      setLoadingStats(false);
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/donations?donor_email=${encodeURIComponent(user.email)}&limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        const donations = data.donations || [];
        
        const totalAmount = donations.reduce((sum: number, donation: any) => 
          sum + parseFloat(donation.amount || 0), 0
        );
        
        const lastDonation = donations.length > 0 ? donations[0].created_at : null;
        
        setUserDonations({
          totalAmount,
          totalDonations: donations.length,
          lastDonation
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch stats when user loads
  React.useEffect(() => {
    fetchUserStats();
  }, [user?.email]);

  const handleTierSelect = (tier: DonationTier) => {
    setSelectedTier(tier);
    setCustomAmount(0);
  };

  const handleCustomAmount = (amount: number) => {
    setCustomAmount(amount);
    setSelectedTier(null);
  };

  const handlePaymentSuccess = (paymentId: string, orderId: string) => {
    const amount = getPaymentAmount();
    const description = getPaymentDescription();
    
    setPaymentDetails({
      paymentId,
      orderId,
      amount,
      description
    });
    setPaymentSuccess(true);
    
    // Refresh user stats after successful payment
    setTimeout(() => {
      fetchUserStats();
    }, 2000);
  };

  const handlePaymentFailure = (error: any) => {
    console.error('Payment failed:', error);
    alert('Payment failed. Please try again.');
  };

  const getPaymentAmount = () => {
    if (selectedTier) return selectedTier.amount;
    if (customAmount > 0) return customAmount;
    return 0;
  };

  const getPaymentDescription = () => {
    if (selectedTier) return `Donation: ${selectedTier.name}`;
    if (customAmount > 0) return 'Custom Donation';
    return 'Donation to Connecting Future';
  };

  const handleContinueToDashboard = () => {
    router.push('/alumni/dashboard');
  };

  const handleDownloadReceipt = async () => {
    if (!paymentDetails) return;
    
    try {
      const { generatePDFReceipt } = await import('@/components/payment/PDFReceipt');
      await generatePDFReceipt({
        paymentId: paymentDetails.paymentId,
        orderId: paymentDetails.orderId,
        amount: paymentDetails.amount,
        description: paymentDetails.description,
        date: new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        customerName: user?.name || 'Anonymous Donor',
        customerEmail: user?.email || 'donor@example.com'
      });
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      alert('Failed to generate PDF receipt. Please try again.');
    }
  };

  if (paymentSuccess && paymentDetails) {
    return (
      <PaymentSuccess
        paymentId={paymentDetails.paymentId}
        orderId={paymentDetails.orderId}
        amount={paymentDetails.amount}
        description={paymentDetails.description}
        onContinue={handleContinueToDashboard}
        onDownloadReceipt={handleDownloadReceipt}
      />
    );
  }

  return (
    <AlumniNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* History Button - Top Left */}
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => router.push('/alumni/donation/history')}
                className="flex items-center gap-2 bg-white/80 hover:bg-white shadow-md border-purple-200 hover:border-purple-300 transition-all duration-300"
              >
                <History className="h-4 w-4 text-purple-600" />
                <span className="text-purple-700 font-medium">Donation History</span>
                <ArrowRight className="h-3 w-3 text-purple-500" />
              </Button>
            </div>

            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <Heart className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="flex items-center justify-center mb-6 space-x-4">
                <h1 className="text-5xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Support Our Mission
                </h1>
              </div>
              
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                Your donation helps us connect alumni with students, create opportunities, 
                and build a stronger community for future generations. Every contribution makes a difference.
              </p>
            </div>

            {/* Personal Donation Summary */}
            {user && (
              <Card className="mb-12 shadow-xl border-0 bg-gradient-to-r from-indigo-50 via-white to-purple-50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-gray-900">
                    <span className="flex items-center">
                      <Heart className="w-6 h-6 mr-3 text-pink-500" />
                      Your Donation Impact, {user.name?.split(' ')[0] || 'Friend'}
                    </span>
                    <Button
                      onClick={() => router.push('/alumni/donation/history')}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 bg-white/80 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                    >
                      <History className="w-4 h-4" />
                      <span>View All</span>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">Loading your donation history...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/70 rounded-xl p-6 shadow-lg border border-white/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Donated</p>
                            <p className="text-3xl font-bold text-green-600">
                              ₹{userDonations.totalAmount.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                            <Gift className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/70 rounded-xl p-6 shadow-lg border border-white/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Donations</p>
                            <p className="text-3xl font-bold text-blue-600">
                              {userDonations.totalDonations}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/70 rounded-xl p-6 shadow-lg border border-white/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Last Donation</p>
                            <p className="text-lg font-bold text-purple-600">
                              {userDonations.lastDonation 
                                ? new Date(userDonations.lastDonation).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'No donations yet'
                              }
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <History className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {userDonations.totalDonations > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-yellow-500 mr-2" />
                        <span className="text-yellow-800 font-medium">
                          Thank you for your continued support! Your contributions have made a real difference.
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Community Impact Stats */}
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Community Impact</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
                  <div className="text-gray-600 font-medium">Students Helped</div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">200+</div>
                  <div className="text-gray-600 font-medium">Jobs Created</div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
                  <div className="text-gray-600 font-medium">Programs Launched</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Donation Tiers */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Choose Your Impact</h2>
                  <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Most Popular</span>
                  </div>
                </div>
                
                {/* Custom Amount */}
                <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900">
                      <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                      Custom Amount
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {[100, 250, 500, 750, 1000, 2000].map((amount) => (
                          <Button
                            key={amount}
                            variant={customAmount === amount ? "default" : "outline"}
                            onClick={() => handleCustomAmount(amount)}
                            className={`${
                              customAmount === amount 
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg' 
                                : 'hover:shadow-md transition-all duration-200'
                            }`}
                          >
                            ₹{amount}
                          </Button>
                        ))}
                      </div>
                      <div className="flex space-x-3">
                        <input
                          type="number"
                          placeholder="Enter custom amount"
                          value={customAmount || ''}
                          onChange={(e) => handleCustomAmount(Number(e.target.value))}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white text-black placeholder-gray-500 font-medium"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleCustomAmount(0)}
                          className="px-6 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Donation Tiers */}
                <div className="space-y-6">
                  {donationTiers.map((tier) => (
                    <Card 
                      key={tier.id}
                      className={`cursor-pointer transition-all duration-300 shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:scale-105 ${
                        selectedTier?.id === tier.id 
                          ? 'ring-4 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' 
                          : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-white'
                      } ${tier.popular ? 'relative' : ''}`}
                      onClick={() => handleTierSelect(tier)}
                    >
                      {tier.popular && (
                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          POPULAR
                        </div>
                      )}
                      
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-16 h-16 bg-gradient-to-r ${tier.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                              {tier.icon}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                              <p className="text-gray-600 leading-relaxed">{tier.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">₹{tier.amount.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">one-time</div>
                          </div>
                        </div>
                        
                        {selectedTier?.id === tier.id && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                              Benefits Included:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {tier.benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center text-sm text-gray-700 bg-white/50 rounded-lg p-3">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                  <span>{benefit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Payment Section */}
              <div className="sticky top-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Donation</h2>
                
                {getPaymentAmount() > 0 ? (
                  <div className="space-y-6">
                    <RazorpayPayment
                      paymentDetails={{
                        amount: getPaymentAmount(),
                        currency: 'INR',
                        description: getPaymentDescription(),
                        name: user?.name || 'Anonymous Donor',
                        email: user?.email || 'anonymous@example.com',
                        contact: (user?.phone_number as string) || '',
                        donorName: user?.name || 'Anonymous Donor',
                        donorEmail: user?.email || 'anonymous@example.com',
                        donorPhone: (typeof user?.phone_number === 'string' ? user.phone_number : undefined),
                        donationType: 'one-time',
                        causeCategory: selectedTier?.name.includes('Bronze') ? 'Community' :
                                     selectedTier?.name.includes('Silver') ? 'Education' :
                                     selectedTier?.name.includes('Gold') ? 'Scholarship' :
                                     selectedTier?.name.includes('Platinum') ? 'Infrastructure' :
                                     selectedTier?.name.includes('Diamond') ? 'Research' :
                                     'General',
                        anonymous: false,
                        message: selectedTier ? 
                          `Donation for ${selectedTier.name} - ${selectedTier.description}` :
                          `Custom donation of ₹${customAmount}`
                      }}
                      onSuccess={handlePaymentSuccess}
                      onFailure={handlePaymentFailure}
                    />
                    
                    {/* Trust Indicators */}
                    <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Secure Payment</h4>
                            <p className="text-sm text-gray-600">Protected by Razorpay</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>256-bit SSL encryption</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>PCI DSS compliant</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Instant payment verification</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-10 h-10 text-gray-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Choose Your Donation
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Select a donation tier or enter a custom amount to proceed with your contribution. 
                        Every rupee makes a difference in someone's life.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Impact Stories */}
                <Card className="mt-8 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                      Success Stories
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white/70 rounded-xl p-4">
                      <p className="text-sm text-gray-700 italic">
                        "Thanks to alumni donations, I was able to complete my engineering degree. 
                        Now I'm working at a top tech company!"
                      </p>
                      <div className="flex items-center mt-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Priya S.</p>
                          <p className="text-xs text-gray-500">ECE 2024 Graduate</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/70 rounded-xl p-4">
                      <p className="text-sm text-gray-700 italic">
                        "The mentorship program funded by donations helped me land my dream job. 
                        I'm forever grateful to the alumni community."
                      </p>
                      <div className="flex items-center mt-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Arjun K.</p>
                          <p className="text-xs text-gray-500">CSE 2023 Graduate</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}
