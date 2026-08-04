"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Heart, Calendar, IndianRupee, Filter, Search, TrendingUp, Gift, Award, ArrowLeft, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import AlumniNavigation from '../../AluminaNavigation/AlumniNavigation';

interface Donation {
  id: number;
  donor_name: string;
  donor_email: string;
  amount: string;
  currency: string;
  payment_method: string;
  payment_id: string;
  transaction_status: string;
  donation_type: string;
  cause_category: string;
  message: string;
  created_at: string;
  updated_at: string;
}

interface DonationResponse {
  donations: Donation[];
  pagination: { page: number; totalPages: number; totalItems: number; limit: number };
}

interface Analytics {
  total_donated: string;
  total_donations: number;
  avg_donation: string;
  top_donor: string;
  recent_donations: number;
}

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const formatCurrency = (amount: string, currency: string = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(parseFloat(amount));

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

const statusStyle = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'completed': case 'success': return 'bg-green-50 text-green-700 border-green-200';
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'failed': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

export default function DonationHistory() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDonations = async (page = 1, email?: string, status?: string) => {
    try {
      setLoading(true);
      let url = `${backendUrl}/api/donations?page=${page}&limit=10`;
      if (email?.trim()) url += `&donor_email=${encodeURIComponent(email.trim())}`;
      if (status && status !== 'all') url += `&status=${status}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: DonationResponse = await response.json();
      setDonations(data.donations);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch donations');
      setDonations([]); setCurrentPage(1); setTotalPages(1);
    } finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try {
      const r = await fetch(`${backendUrl}/api/donations/analytics/summary`);
      if (r.ok) setAnalytics(await r.json());
    } catch {}
  };

  useEffect(() => { fetchDonations(); fetchAnalytics(); }, []);

  const handleMyDonations = () => {
    if (user?.email) { setSearchEmail(user.email); fetchDonations(1, user.email, statusFilter !== 'all' ? statusFilter : undefined); }
  };
  const handleSearch = () => fetchDonations(1, searchEmail, statusFilter !== 'all' ? statusFilter : undefined);
  const handleStatusChange = (s: string) => { setStatusFilter(s); fetchDonations(1, searchEmail, s !== 'all' ? s : undefined); };
  const handlePageChange = (p: number) => fetchDonations(p, searchEmail, statusFilter !== 'all' ? statusFilter : undefined);

  if (userLoading) return (
    <AlumniNavigation>
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    </AlumniNavigation>
  );

  return (
    <AlumniNavigation>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-[#1A1C23]  rounded-[32px] border border-indigo-100/60 px-6 py-7 md:px-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden text-white">
        <svg className="absolute right-0 bottom-0 w-[300px] h-full pointer-events-none opacity-50" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40,70 C60,70 70,30 90,30 C110,30 120,60 140,60 C160,60 170,20 190,20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
          <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-indigo-100/60 blur-2xl pointer-events-none" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <Heart className="w-6 h-6 text-red-500" />Donation History
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Track contributions and the collective impact of our community</p>
          </div>
          <button onClick={() => router.push('/alumni/donation')} className="relative z-10 flex items-center gap-2 px-4 py-2.5 bg-white text-sm font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Donation
          </button>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {[
              { label: 'Total Donated', value: formatCurrency(analytics.total_donated), icon: <TrendingUp className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50', color: 'text-blue-700' },
              { label: 'Total Donations', value: String(analytics.total_donations), icon: <Gift className="w-4 h-4 text-green-600" />, bg: 'bg-green-50', color: 'text-green-700' },
              { label: 'Avg Donation', value: formatCurrency(analytics.avg_donation), icon: <IndianRupee className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50', color: 'text-purple-700' },
              { label: 'Top Donor', value: analytics.top_donor || 'N/A', icon: <Award className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50', color: 'text-amber-700', small: true },
              { label: 'Recent (30d)', value: String(analytics.recent_donations), icon: <Calendar className="w-4 h-4 text-pink-600" />, bg: 'bg-pink-50', color: 'text-pink-700' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color} ${s.small ? 'truncate' : ''}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-[#1A1C23]" />
            <p className="text-sm font-bold text-slate-900">Filters</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input placeholder="Search by donor email…" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl border-slate-200 bg-white text-sm text-slate-900">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl text-slate-900 shadow-xl">
                <SelectItem className="text-slate-800 focus:text-slate-900 focus:bg-slate-100 cursor-pointer" value="all">All Status</SelectItem>
                <SelectItem className="text-slate-800 focus:text-slate-900 focus:bg-slate-100 cursor-pointer" value="completed">Completed</SelectItem>
                <SelectItem className="text-slate-800 focus:text-slate-900 focus:bg-slate-100 cursor-pointer" value="pending">Pending</SelectItem>
                <SelectItem className="text-slate-800 focus:text-slate-900 focus:bg-slate-100 cursor-pointer" value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={handleSearch} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#1A1C23] text-white hover:bg-black transition-colors shadow-sm">
              <Search className="w-4 h-4" />Search
            </button>
            {user?.email && (
              <button onClick={handleMyDonations} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors">
                <Heart className="w-4 h-4" />My Donations
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 text-sm text-red-600 font-medium">{error}</div>}

        {/* Donation Records */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <Gift className="w-4 h-4 text-[#1A1C23]" />
            <h3 className="font-bold text-slate-900 text-sm">Donation Records</h3>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
                <p className="text-sm text-slate-400">Loading donation history…</p>
              </div>
            ) : donations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3"><Heart className="w-6 h-6 text-slate-300" /></div>
                <p className="font-bold text-slate-900 text-sm mb-1">No donations found</p>
                <p className="text-xs text-slate-400">Try adjusting your search or make your first donation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {donations.map((d, i) => (
                  <div key={d.id} className="rounded-[18px] border border-slate-100 hover:shadow-md transition-all p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center shrink-0">
                          {d.donor_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-bold text-slate-900 text-sm">{d.donor_name}</p>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusStyle(d.transaction_status)}`}>{d.transaction_status}</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{d.donor_email}</p>
                          {d.message && (
                            <div className="bg-indigo-50 border-l-2 border-indigo-400 rounded-r-lg px-3 py-2 mb-2">
                              <p className="text-xs text-indigo-700 italic">"{d.message}"</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5"><Calendar className="w-3 h-3" />{formatDate(d.created_at)}</span>
                            <span className="bg-slate-100 rounded-full px-2 py-0.5">{d.payment_method}</span>
                            {d.cause_category && <span className="bg-slate-100 rounded-full px-2 py-0.5">{d.cause_category}</span>}
                            <span className="bg-slate-100 rounded-full px-2 py-0.5">{d.donation_type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-black text-emerald-700">{formatCurrency(d.amount, d.currency)}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{d.payment_id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-5 pt-4 border-t border-slate-100">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ArrowLeft className="w-4 h-4" />Previous
                </button>
                <span className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200">
                  {currentPage} / {totalPages}
                </span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next<ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}