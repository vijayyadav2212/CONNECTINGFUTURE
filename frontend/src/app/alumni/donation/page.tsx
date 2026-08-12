"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

import RazorpayPayment from '@/components/payment/RazorpayPayment';
import PaymentSuccess from '@/components/payment/PaymentSuccess';
import { Heart, CheckCircle, Gift, Users, Award, Star, TrendingUp, Globe, BookOpen, GraduationCap, History, ArrowRight } from 'lucide-react';

interface DonationTier {
  id: string;
  name: string;
  amount: number;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
  accentColor: string;
  popular?: boolean;
}

const donationTiers: DonationTier[] = [
  { id: 'bronze', name: 'Bronze Supporter', amount: 500, description: 'Support our community initiatives', benefits: ['Recognition on our website', 'Monthly newsletter', 'Access to exclusive content'], icon: <Heart className="w-5 h-5 text-orange-600" />, accentColor: 'orange' },
  { id: 'silver', name: 'Silver Supporter', amount: 1000, description: 'Help us grow and expand our programs', benefits: ['All Bronze benefits', 'Priority mentorship matching', 'Exclusive networking events', 'Featured profile on platform'], icon: <Star className="w-5 h-5 text-gray-500" />, accentColor: 'gray' },
  { id: 'gold', name: 'Gold Supporter', amount: 2500, description: 'Make a significant impact on student success', benefits: ['All Silver benefits', 'Direct mentorship opportunities', 'VIP event invitations', 'Custom profile badge', 'Annual impact report'], icon: <Award className="w-5 h-5 text-amber-600" />, accentColor: 'amber', popular: true },
  { id: 'platinum', name: 'Platinum Supporter', amount: 5000, description: 'Transform the future of education', benefits: ['All Gold benefits', 'Named scholarship program', 'Board advisory role', 'Exclusive campus visits', 'Personal impact dashboard'], icon: <Gift className="w-5 h-5 text-teal-600" />, accentColor: 'purple' },
];

const QUICK_AMOUNTS = [100, 250, 500, 750, 1000, 2000];

export default function DonationPage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<DonationTier | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ paymentId: string; orderId: string; amount: number; description: string } | null>(null);
  const [userDonations, setUserDonations] = useState<{ totalAmount: number; totalDonations: number; lastDonation: string | null }>({ totalAmount: 0, totalDonations: 0, lastDonation: null });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchUserStats = async () => {
    if (!user?.email) { setLoadingStats(false); return; }
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/donations?donor_email=${encodeURIComponent(user.email)}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        const donations = data.donations || [];
        setUserDonations({
          totalAmount: donations.reduce((sum: number, d: any) => sum + parseFloat(d.amount || 0), 0),
          totalDonations: donations.length,
          lastDonation: donations.length > 0 ? donations[0].created_at : null,
        });
      }
    } catch {}
    finally { setLoadingStats(false); }
  };

  useEffect(() => { fetchUserStats(); }, [user?.email]);

  const getPaymentAmount = () => selectedTier ? selectedTier.amount : customAmount > 0 ? customAmount : 0;
  const getPaymentDescription = () => selectedTier ? `Donation: ${selectedTier.name}` : customAmount > 0 ? 'Custom Donation' : 'Donation to Alumnex';

  const handlePaymentSuccess = (paymentId: string, orderId: string) => {
    setPaymentDetails({ paymentId, orderId, amount: getPaymentAmount(), description: getPaymentDescription() });
    setPaymentSuccess(true);
    setTimeout(() => fetchUserStats(), 2000);
  };

  const handlePaymentFailure = (error: any) => { alert('Payment failed. Please try again.'); };

  const handleDownloadReceipt = async () => {
    if (!paymentDetails) return;
    try {
      const { generatePDFReceipt } = await import('@/components/payment/PDFReceipt');
      await generatePDFReceipt({ paymentId: paymentDetails.paymentId, orderId: paymentDetails.orderId, amount: paymentDetails.amount, description: paymentDetails.description, date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }), time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), customerName: user?.name || 'Anonymous Donor', customerEmail: user?.email || 'donor@example.com' });
    } catch { alert('Failed to generate PDF receipt.'); }
  };

  if (paymentSuccess && paymentDetails) {
    return <PaymentSuccess paymentId={paymentDetails.paymentId} orderId={paymentDetails.orderId} amount={paymentDetails.amount} description={paymentDetails.description} onContinue={() => router.push('/alumni/dashboard')} onDownloadReceipt={handleDownloadReceipt} />;
  }

  const paymentAmount = getPaymentAmount();

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-teal-950 rounded-[32px] border border-teal-900/20 px-6 py-8 md:px-10 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden text-white">
          <svg className="absolute right-0 bottom-0 w-[300px] h-full pointer-events-none opacity-40" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40,70 C60,70 70,30 90,30 C110,30 120,60 140,60 C160,60 170,20 190,20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-teal-800/30 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-teal-200 font-bold text-xs bg-white/10 w-fit px-3 py-1 rounded-full border border-white/15">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>Alumni Giving</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Support Our Mission
            </h1>
            <p className="text-gray-300 text-sm md:text-base font-medium max-w-xl">
              Help us connect alumni with students, fund scholarships, and create life-changing opportunities.
            </p>
          </div>
          <button onClick={() => router.push('/alumni/donation/history')} className="relative z-10 flex items-center gap-2 px-5 py-3 bg-white text-sm font-bold text-teal-950 rounded-2xl border border-teal-50 shadow-md hover:bg-[#f6f3eb] hover:scale-[1.02] transition-all shrink-0">
            <History className="w-4 h-4 text-teal-950" />Donation History<ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Personal Impact Stats */}
        {user && (
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Your Donation Impact, {user.name?.split(' ')[0] || 'Friend'}</h3>
              <button onClick={() => router.push('/alumni/donation/history')} className="text-xs text-teal-950 font-semibold hover:underline">View All →</button>
            </div>
            {loadingStats ? (
              <div className="flex items-center gap-2 py-4"><div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm text-slate-400">Loading…</span></div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Total Donated', value: `₹${userDonations.totalAmount.toLocaleString('en-IN')}`, icon: <Gift className="w-4 h-4 text-teal-950" />, bg: 'bg-[#f6f3eb]', color: 'text-teal-950' },
                    { label: 'Total Donations', value: String(userDonations.totalDonations), icon: <Award className="w-4 h-4 text-teal-600" />, bg: 'bg-teal-50', color: 'text-teal-600' },
                    { label: 'Last Donation', value: userDonations.lastDonation ? new Date(userDonations.lastDonation).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'None yet', icon: <History className="w-4 h-4 text-teal-600" />, bg: 'bg-teal-50', color: 'text-teal-600' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
                      <div><p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</p><p className={`text-sm font-bold ${s.color}`}>{s.value}</p></div>
                    </div>
                  ))}
                </div>
                {userDonations.totalDonations > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
                    <Star className="w-4 h-4 text-amber-500 shrink-0" />Thank you for your continued support! Your contributions have made a real difference.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Community Impact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: '500+', label: 'Students Helped', icon: <Users className="w-4 h-4 text-teal-600" />, bg: 'bg-teal-50' },
            { value: '200+', label: 'Jobs Created', icon: <TrendingUp className="w-4 h-4 text-green-600" />, bg: 'bg-green-50' },
            { value: '50+', label: 'Programs Launched', icon: <Globe className="w-4 h-4 text-teal-600" />, bg: 'bg-teal-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 text-center">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>{s.icon}</div>
              <p className="text-lg font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: Tier + Custom */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Choose Your Impact</h3>

            {/* Quick Amounts */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Custom Amount</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {QUICK_AMOUNTS.map(amt => (
                  <button key={amt} onClick={() => { setCustomAmount(amt); setSelectedTier(null); }} className={`py-2 text-sm font-bold rounded-xl border transition-all ${customAmount === amt && !selectedTier ? 'bg-teal-950 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:text-teal-700'}`}>₹{amt}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Enter custom amount" value={customAmount || ''} onChange={e => { setCustomAmount(Number(e.target.value)); setSelectedTier(null); }} className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400" />
                <button onClick={() => setCustomAmount(0)} className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-teal-50 hover:border-rose-200 hover:text-teal-950 transition-colors">Clear</button>
              </div>
            </div>

            {/* Donation Tiers */}
            <div className="space-y-3">
              {donationTiers.map(tier => (
                <div key={tier.id} onClick={() => { setSelectedTier(tier); setCustomAmount(0); }} className={`bg-white rounded-[24px] border shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-4 cursor-pointer transition-all hover:shadow-md ${selectedTier?.id === tier.id ? 'border-teal-400 ring-2 ring-teal-200' : 'border-slate-100 hover:border-teal-200'} relative`}>
                  {tier.popular && <span className="absolute -top-2.5 right-4 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-white">POPULAR</span>}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tier.accentColor === 'orange' ? 'bg-orange-50' : tier.accentColor === 'gray' ? 'bg-gray-100' : tier.accentColor === 'amber' ? 'bg-amber-50' : 'bg-teal-50'}`}>{tier.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 text-sm">{tier.name}</p>
                        <p className="font-black text-slate-900 text-base">₹{tier.amount.toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-slate-400">{tier.description}</p>
                    </div>
                    {selectedTier?.id === tier.id && <CheckCircle className="w-5 h-5 text-teal-950 shrink-0" />}
                  </div>
                  {selectedTier?.id === tier.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Benefits included</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {tier.benefits.map((b, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-950 shrink-0" />{b}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Payment */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Complete Your Donation</h3>

            {paymentAmount > 0 ? (
              <>
                <div className="bg-teal-50 border border-teal-200 rounded-[24px] p-4 text-center">
                  <p className="text-xs text-teal-950 font-semibold mb-1">You're donating</p>
                  <p className="text-3xl font-black text-teal-700">₹{paymentAmount.toLocaleString()}</p>
                  <p className="text-xs text-teal-950 mt-1">{getPaymentDescription()}</p>
                </div>
                <RazorpayPayment
                  paymentDetails={{
                    amount: paymentAmount, currency: 'INR', description: getPaymentDescription(),
                    name: user?.name || 'Anonymous Donor', email: user?.email || 'anonymous@example.com',
                    contact: (user?.phone_number as string) || '',
                    donorName: user?.name || 'Anonymous Donor', donorEmail: user?.email || 'anonymous@example.com',
                    donorPhone: typeof user?.phone_number === 'string' ? user.phone_number : undefined,
                    donationType: 'one-time',
                    causeCategory: selectedTier?.name.includes('Bronze') ? 'Community' : selectedTier?.name.includes('Silver') ? 'Education' : selectedTier?.name.includes('Gold') ? 'Scholarship' : selectedTier?.name.includes('Platinum') ? 'Infrastructure' : 'General',
                    anonymous: false,
                    message: selectedTier ? `Donation for ${selectedTier.name} - ${selectedTier.description}` : `Custom donation of ₹${customAmount}`
                  }}
                  onSuccess={handlePaymentSuccess}
                  onFailure={handlePaymentFailure}
                />
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-teal-950" />
                    <p className="text-xs font-bold text-slate-900">Secure Payment via Razorpay</p>
                  </div>
                  {['256-bit SSL encryption', 'PCI DSS compliant', 'Instant payment verification'].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle className="w-3 h-3 text-teal-950 shrink-0" />{s}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#f6f3eb] flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-slate-300" />
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">Choose your donation</p>
                <p className="text-xs text-slate-400">Select a tier or enter a custom amount to proceed</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}