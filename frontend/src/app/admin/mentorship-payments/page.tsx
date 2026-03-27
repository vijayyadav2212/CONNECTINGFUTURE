"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '../AdminNavigation';
import { 
  CreditCard, TrendingUp, AlertCircle, Shield, CheckCircle, Wallet, History, Users
} from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../hooks/useAuth0Token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

interface MentorshipSession {
  id: number;
  pair_key: string;
  student_email: string;
  mentor_email: string;
  student_name?: string;
  mentor_name?: string;
  status: string;
  amount: number;
  platform_fee: number;
  alumni_earnings: number;
  currency: string;
  payment_id: string;
  order_id: string;
  created_at: string;
  payout_status: string;
  transaction_type?: 'session' | 'subscription';
  duration_days?: number;
  start_at?: string;
  end_at?: string;
}

interface AlumniPayout {
  mentor_email: string;
  mentor_name: string;
  payment_upi_id: string | null;
  pending_amount: number;
  paid_amount: number;
  pending_sessions: number;
  pending_subscriptions?: number;
  pending_transactions?: number;
}

interface PaymentStats {
  total_volume: number;
  total_platform_fee: number;
}

export default function MentorshipPayments() {
  const router = useRouter();
  const { user } = useUser();
  const { token: accessToken } = useAuth0Token();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [payouts, setPayouts] = useState<AlumniPayout[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total_volume: 0,
    total_platform_fee: 0
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts'>('transactions');
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllPayouts, setShowAllPayouts] = useState(false);

  const fetchData = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);

      const [paymentsRes, payoutsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/mentorship-payments?limit=${showAllTransactions ? 100 : 5}`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        fetch(`${API_BASE}/api/admin/mentorship-payouts${showAllPayouts ? '' : '?limit=5'}`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
      ]);

      if (!paymentsRes.ok) throw new Error(`Payments API failed: ${paymentsRes.statusText}`);
      if (!payoutsRes.ok) throw new Error(`Payouts API failed: ${payoutsRes.statusText}`);

      const paymentsData = await paymentsRes.json();
      const payoutsData = await payoutsRes.json();

      setSessions(paymentsData.sessions || []);
      setStats(paymentsData.stats || { total_volume: 0, total_platform_fee: 0 });
      setPayouts(payoutsData.payouts || []);

    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Mentorship payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && accessToken) {
      fetchData();
    }
  }, [user, accessToken, showAllTransactions, showAllPayouts]);

  const handleMarkAsPaid = async (mentorEmail: string, upiId?: string | null) => {
    if (!upiId) {
      if (!confirm('Warning: No UPI ID is configured for this alumni.\n\nAre you sure you want to mark all pending earnings as transferred?')) return;
    } else {
      if (!confirm(`Please transfer the funds directly to this UPI ID from your banking app:\n\nUPI ID: ${upiId}\n\nClick OK ONLY if you have completed the transfer.`)) return;
    }
    
    setProcessingPayout(mentorEmail);
    try {
      const response = await fetch(`${API_BASE}/api/admin/mentorship-payouts/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ mentor_email: mentorEmail })
      });
      
      if (!response.ok) throw new Error('Failed to mark as paid');
      
      // Refresh data
      await fetchData();
      alert('Successfully marked earnings as transferred!');
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setProcessingPayout(null);
    }
  };

  return (
    <AdminNavigation>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading mentorship payments...</div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Mentorship Funds Tracking</h1>
                <p className="text-white/90">Monitor session and subscription revenue, platform fees, and alumni transfers.</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Error Loading Data</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Mentorship Volume */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Mentorship Volume</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{stats.total_volume.toLocaleString()}</h3>
                  <div className="flex items-center mt-2 text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Platform Total</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Platform Fees Collected */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Platform Fees Collected</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{stats.total_platform_fee.toLocaleString()}</h3>
                  <div className="flex items-center mt-2 text-purple-600">
                    <Shield className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Revenue</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Pending Payouts (Total across all alumni) */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pending Payouts</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">
                    ₹{payouts.reduce((sum, p) => sum + Number(p.pending_amount), 0).toLocaleString()}
                  </h3>
                  <div className="flex items-center mt-2 text-orange-600">
                    <Wallet className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">To be transferred</span>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Wallet className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Tabs */}
          <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-lg w-full max-w-md">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'transactions' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-4 h-4 mr-2" />
              Recent Transactions
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'payouts' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Alumni Payouts
            </button>
          </div>

          {/* Tab Content: Transactions */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                  <p className="text-sm text-gray-600 mt-1">Session and subscription payments generated via mentorship</p>
                </div>
                {!showAllTransactions && sessions.length === 5 && (
                  <button onClick={() => setShowAllTransactions(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    Show All
                  </button>
                )}
                {showAllTransactions && (
                  <button onClick={() => setShowAllTransactions(false)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    Show Less
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Type</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Alumni (Mentor)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Paid (₹)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Fee (₹)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Net Alumni (₹)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Transfer Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                          No mentorship payments found.
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(session.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.transaction_type === 'subscription' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}`}>
                              {session.transaction_type === 'subscription' ? 'Subscription' : 'Session'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{session.student_name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{session.student_email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{session.mentor_name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{session.mentor_email}</div>
                            {session.transaction_type === 'subscription' && session.end_at ? (
                              <div className="text-xs text-indigo-600 mt-1">
                                Ends: {new Date(session.end_at).toLocaleDateString()} ({session.duration_days || 30}d)
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-900">
                            {Number(session.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-purple-600">
                            {Number(session.platform_fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-green-600">
                            {Number(session.alumni_earnings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {session.payout_status === 'paid' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Transferred
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: Alumni Payouts */}
          {activeTab === 'payouts' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Alumni Payouts Pipeline</h2>
                  <p className="text-sm text-gray-600 mt-1">Track pending session and subscription earnings, then mark transfers to alumni accounts.</p>
                </div>
                {!showAllPayouts && payouts.length === 5 && (
                  <button onClick={() => setShowAllPayouts(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    Show All
                  </button>
                )}
                {showAllPayouts && (
                  <button onClick={() => setShowAllPayouts(false)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    Show Less
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Alumni Profile</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Lifetime Transferred (₹)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Pending Items</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Pending Earnings (₹)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payouts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No alumni earning records found.
                        </td>
                      </tr>
                    ) : (
                      payouts.map((p) => {
                        const hasPending = Number(p.pending_amount) > 0;
                        const pendingSessions = Number(p.pending_sessions || 0);
                        const pendingSubscriptions = Number(p.pending_subscriptions || 0);
                        const pendingItems = Number(p.pending_transactions || (pendingSessions + pendingSubscriptions));
                        return (
                          <tr key={p.mentor_email} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{p.mentor_name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{p.mentor_email}</div>
                              {p.payment_upi_id ? (
                                <div className="mt-1 inline-flex text-xs items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-medium">
                                  UPI: {p.payment_upi_id}
                                </div>
                              ) : (
                                <div className="mt-1 inline-flex text-xs items-center px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-medium">
                                  No UPI configured
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-600">
                              {Number(p.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {hasPending ? (
                                <span className="bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full text-xs">
                                  {pendingItems}
                                </span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                              {(pendingSessions > 0 || pendingSubscriptions > 0) ? (
                                <div className="text-[11px] text-gray-500 mt-1">
                                  S: {pendingSessions} | Sub: {pendingSubscriptions}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                              {hasPending ? (
                                <span className="text-orange-600">
                                  {Number(p.pending_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-gray-400">0.00</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {hasPending ? (
                                <button
                                  onClick={() => handleMarkAsPaid(p.mentor_email, p.payment_upi_id)}
                                  disabled={processingPayout === p.mentor_email}
                                  className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
                                    ${processingPayout === p.mentor_email 
                                      ? 'bg-gray-200 text-gray-600' 
                                      : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                >
                                  {processingPayout === p.mentor_email ? 'Processing...' : 'Process Transfer'}
                                </button>
                              ) : (
                                <span className="inline-flex items-center text-sm font-medium text-gray-500 px-4 py-2">
                                  <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" /> All clear
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminNavigation>
  );
}
