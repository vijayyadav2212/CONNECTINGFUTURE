"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import {
  TrendingUp, DollarSign, Clock, CheckCircle,
  AlertCircle, Download, Zap, Users, Star, Calendar,
  ArrowUpRight, Filter, Search, Eye, MoreHorizontal, X,
  BarChart3, TrendingDown, Percent
} from 'lucide-react';

interface EarningRecord {
  id: string;
  record_id: string;
  type: 'mentorship' | 'resume_review';
  subtype: 'session' | 'subscription';
  alumni_amount: number;
  total_amount: number;
  base_amount: number;
  commission: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_status: string;
  date: string;
  started_at: string;
  end_at?: string;
  description: string;
  student_name?: string;
  student_email?: string;
  mentor_email?: string;
  duration?: string;
  duration_value?: number;
  meeting_link?: string;
  pair_key?: string;
}

interface EarningStats {
  total_earned: number;
  pending_amount: number;
  completed_reviews: number;
  completed_sessions: number;
  this_month: number;
}

interface DetailViewState {
  open: boolean;
  record: EarningRecord | null;
}

export default function EarningsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EarningStats>({
    total_earned: 0,
    pending_amount: 0,
    completed_reviews: 0,
    completed_sessions: 0,
    this_month: 0,
  });
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [filteredEarnings, setFilteredEarnings] = useState<EarningRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mentorship' | 'resume_review'>('all');
  const [error, setError] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<DetailViewState>({ open: false, record: null });

  const API_ROOT = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '') + '/api';

  useEffect(() => {
    const fetchEarningsData = async () => {
      if (!user?.email) return;
      try {
        setLoading(true);

        // Fetch earnings stats
        const statsResp = await fetch(`${API_ROOT}/alumni/earnings/stats?email=${encodeURIComponent(user.email)}`);
        if (statsResp.ok) {
          const statsData = await statsResp.json();
          setStats(statsData.stats || {});
        }

        // Fetch earnings records
        const earningsResp = await fetch(`${API_ROOT}/alumni/earnings?email=${encodeURIComponent(user.email)}`);
        if (earningsResp.ok) {
          const earningsData = await earningsResp.json();
          const records = earningsData.earnings || [];
          setEarnings(records);
          setFilteredEarnings(records);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };

    fetchEarningsData();
  }, [user?.email]);

  useEffect(() => {
    let filtered = [...earnings];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.type === typeFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.description.toLowerCase().includes(query) ||
        e.student_name?.toLowerCase().includes(query)
      );
    }

    setFilteredEarnings(filtered);
  }, [earnings, statusFilter, typeFilter, searchQuery]);

  const handleDownloadStatement = () => {
    const csv = [
      ['Date', 'Type', 'Description', 'Alumni Earnings', 'Total Amount', 'Status'].join(','),
      ...earnings.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.type.replace(/_/g, ' ').toUpperCase(),
        e.description,
        `₹${e.alumni_amount ?? 0}`,
        `₹${e.total_amount ?? 0}`,
        e.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Calculate analytics
  const analytics = {
    sessions: earnings.filter(e => e.subtype === 'session').length,
    subscriptions: earnings.filter(e => e.subtype === 'subscription').length,
    avgEarningPerSession: earnings.filter(e => e.subtype === 'session').length > 0
      ? earnings.filter(e => e.subtype === 'session').reduce((sum, e) => sum + (e.alumni_amount ?? 0), 0) /
        earnings.filter(e => e.subtype === 'session').length
      : 0,
    completedCount: earnings.filter(e => e.status === 'completed').length,
  };

  if (loading) {
    return (
      <AlumniNavigation>
        <div className="flex h-full min-h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500" />
        </div>
      </AlumniNavigation>
    );
  }

  return (
    <AlumniNavigation>
      <div className="space-y-6 max-w-7xl mx-auto mb-8">

        {/* Header Banner */}
        <div className="bg-[#1A1C23]  rounded-[32px] border border-emerald-100/40 px-6 py-7 md:px-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden text-white">
        <svg className="absolute right-0 bottom-0 w-[300px] h-full pointer-events-none opacity-50" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40,70 C60,70 70,30 90,30 C110,30 120,60 140,60 C160,60 170,20 190,20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
          <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-emerald-100/40 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              Earnings Dashboard
            </h1>
            <p className="text-gray-300 text-sm mt-1 font-medium">Track your mentorship earnings with detailed breakdown</p>
          </div>
          <button
            onClick={handleDownloadStatement}
            className="relative z-10 flex items-center gap-2 px-4 py-2.5 bg-white text-sm font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Download Statement
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Earned */}
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-[20px] border border-emerald-100 shadow-sm p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium mb-3">Total Earned</p>
                <p className="text-5xl font-bold text-emerald-600">₹{stats.total_earned?.toLocaleString()}</p>
              </div>
              <DollarSign className="w-12 h-12 text-emerald-200" />
            </div>
          </div>

          {/* Pending Amount */}
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-[20px] border border-amber-100 shadow-sm p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium mb-3">Pending</p>
                <p className="text-5xl font-bold text-amber-600">₹{stats.pending_amount?.toLocaleString()}</p>
              </div>
              <Clock className="w-12 h-12 text-amber-200" />
            </div>
          </div>

          {/* Completed Sessions */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-[20px] border border-blue-100 shadow-sm p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium mb-3">Completed</p>
                <p className="text-5xl font-bold text-blue-600">{analytics.completedCount}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sessions Count */}
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-600">Total Sessions</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-slate-900">{analytics.sessions}</p>
              <p className="text-xs text-slate-500">One-time mentorship sessions</p>
            </div>
          </div>

          {/* Subscriptions Count */}
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-600">Subscriptions</h3>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-slate-900">{analytics.subscriptions}</p>
              <p className="text-xs text-slate-500">Ongoing subscription periods</p>
            </div>
          </div>

          {/* Avg per Session */}
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-600">Avg per Session</h3>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-slate-900">₹{Math.round(analytics.avgEarningPerSession)}</p>
              <p className="text-xs text-slate-500">Average alumni earnings</p>
            </div>
          </div>
        </div>

        {/* This Month Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[24px] border border-indigo-100/40 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-xl p-3">
                <Calendar className="w-6 h-6 text-[#1A1C23]" />
              </div>
              <div>
                <p className="text-slate-600 text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-slate-900">₹{stats.this_month?.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-sm">Year to Date</p>
              <p className="text-lg font-semibold text-[#1A1C23]">₹{stats.total_earned?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Earnings Records */}
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Earnings History</h2>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All Types</option>
                <option value="mentorship">Mentorship</option>
                <option value="resume_review">Resume Review</option>
              </select>
            </div>
          </div>

          {/* Earnings List */}
          <div className="divide-y divide-slate-200">
            {filteredEarnings.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No earnings records found</p>
                <p className="text-slate-500 text-sm mt-1">Your earnings will appear here</p>
              </div>
            ) : (
              filteredEarnings.map((earning, idx) => (
                <div key={earning.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Type Icon */}
                      <div className={`rounded-xl p-3 ${
                        earning.type === 'resume_review' ? 'bg-blue-50' :
                        'bg-purple-50'
                      }`}>
                        {earning.type === 'resume_review' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                        {earning.type === 'mentorship' && <Users className="w-5 h-5 text-purple-600" />}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-semibold text-sm">{earning.description}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {earning.student_name && `Student: ${earning.student_name}`}
                          {earning.duration && earning.student_name && ' • '}
                          {earning.duration && `Duration: ${earning.duration}`}
                        </p>
                        <p className="text-slate-400 text-xs mt-1">{new Date(earning.date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Amount and Status */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-semibold text-emerald-600">
                            ₹{(earning.alumni_amount ?? 0)?.toLocaleString()}
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            earning.status === 'completed' ? 'bg-green-50 text-green-700' :
                            earning.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setDetailView({ open: true, record: earning })}
                        className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>


                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      {detailView.open && detailView.record && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Transaction Details</h3>
              <button
                onClick={() => setDetailView({ open: false, record: null })}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Type and Status */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Transaction Type</p>
                  <p className="text-xl font-bold text-slate-900 capitalize">{detailView.record.subtype}</p>
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  detailView.record.status === 'completed' ? 'bg-green-50 text-green-700' :
                  detailView.record.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {detailView.record.status.charAt(0).toUpperCase() + detailView.record.status.slice(1)}
                </span>
              </div>



              {/* Timeline */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm">Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Started</span>
                    <span className="font-medium text-slate-900">{detailView.record.started_at ? new Date(detailView.record.started_at).toLocaleString() : 'N/A'}</span>
                  </div>
                  {detailView.record.end_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Ended</span>
                      <span className="font-medium text-slate-900">{new Date(detailView.record.end_at).toLocaleString()}</span>
                    </div>
                  )}
                  {detailView.record.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Duration</span>
                      <span className="font-medium text-slate-900">{detailView.record.duration}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Participant Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm">Participant</h4>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Student Email</p>
                  <p className="font-medium text-slate-900">{detailView.record.student_email}</p>
                </div>
              </div>

              {/* Meeting Link */}
              {detailView.record.meeting_link && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 text-sm">Meeting</h4>
                  <a
                    href={detailView.record.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                  >
                    Open Meeting Link
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AlumniNavigation>
  );
}
