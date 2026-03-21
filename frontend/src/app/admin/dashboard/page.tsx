"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavigation from '../AdminNavigation/AdminNavigation';
import {
  Users, UserCheck, UserX, Briefcase, Calendar,
  TrendingUp, AlertCircle, CheckCircle, Clock,
  Eye, Activity, Send, RefreshCw
} from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../hooks/useAuth0Token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

interface DashboardStats {
  totalUsers: number;
  pendingApprovals: number;
  activeJobs: number;
  upcomingEvents: number;
  newRegistrations: number;
  approvedToday: number;
}

interface PendingApproval {
  id: number;
  type: 'alumni' | 'job' | 'event';
  title: string;
  subtitle: string;
  date: string;
  status: string;
  raw_data?: any;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useUser();
  const { token: accessToken } = useAuth0Token();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, pendingApprovals: 0, activeJobs: 0, upcomingEvents: 0, newRegistrations: 0, approvedToday: 0 });
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (!user || !accessToken) return;
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const [usersResponse, jobsResponse, eventsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/users?limit=1000`, { headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/api/jobs?limit=1000`, { headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/api/events?limit=1000`, { headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => ({ ok: false })),
      ]);

      const errors: string[] = [];
      let usersData = { users: [] }, jobsData = { jobs: [] }, eventsData = { events: [] };

      if ((usersResponse as Response).ok) { try { usersData = await (usersResponse as Response).json(); } catch { errors.push('Users parse error'); } }
      else errors.push('Users API failed');
      if ((jobsResponse as Response).ok) { try { jobsData = await (jobsResponse as Response).json(); } catch { errors.push('Jobs parse error'); } }
      else errors.push('Jobs API failed');
      if ((eventsResponse as Response).ok) { try { eventsData = await (eventsResponse as Response).json(); } catch { errors.push('Events parse error'); } }
      else errors.push('Events API failed');

      if (errors.length) setError(`Some data may be incomplete: ${errors.join(', ')}`);

      const users = usersData.users || [];
      const jobs = jobsData.jobs || [];
      const events = eventsData.events || [];
      const alumniUsers = users.filter((u: any) => u.user_type === 'alumni');

      const activeJobs = jobs.filter((j: any) => String(j.status || '').toLowerCase().includes('approved')).length;
      const upcomingEvents = events.filter((e: any) => { try { return new Date(e.start_date) > new Date() && String(e.status || '').toLowerCase().includes('approved'); } catch { return false; } }).length;
      const pendingAlumni = alumniUsers.filter((u: any) => String(u.approval_status || 'pending').toLowerCase() === 'pending').length;
      const pendingJobs = jobs.filter((j: any) => String(j.status || '').toLowerCase().includes('pending')).length;
      const pendingEvents = events.filter((e: any) => String(e.status || '').toLowerCase().includes('pending')).length;
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const newRegistrations = users.filter((u: any) => { try { return new Date(u.created_at) > weekAgo; } catch { return false; } }).length;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const approvedToday = alumniUsers.filter((u: any) => { try { const d = u.approved_at ? new Date(u.approved_at) : null; return d && d >= today && String(u.approval_status || '').toLowerCase() === 'approved'; } catch { return false; } }).length;

      setStats({ totalUsers: users.length, pendingApprovals: pendingAlumni + pendingJobs + pendingEvents, activeJobs, upcomingEvents, newRegistrations, approvedToday });

      const pendingItems: PendingApproval[] = [];
      alumniUsers.filter((u: any) => String(u.approval_status || 'pending').toLowerCase() === 'pending').slice(0, 3).forEach((u: any) => {
        pendingItems.push({ id: u.id, type: 'alumni', title: u.name || 'Unknown User', subtitle: `${u.major || 'Unknown'} • ${u.graduation_year || 'N/A'}`, date: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown', status: u.approval_status || 'pending', raw_data: u });
      });
      jobs.filter((j: any) => String(j.status || '').toLowerCase().includes('pending')).slice(0, 2).forEach((j: any) => {
        pendingItems.push({ id: j.id, type: 'job', title: j.title, subtitle: `${j.company} • ${j.job_type || 'Unknown'}`, date: j.posted_date ? new Date(j.posted_date).toLocaleDateString() : 'Unknown', status: j.status, raw_data: j });
      });
      events.filter((e: any) => String(e.status || '').toLowerCase().includes('pending')).slice(0, 2).forEach((e: any) => {
        try { pendingItems.push({ id: e.id, type: 'event', title: e.title, subtitle: `${e.is_virtual ? 'Virtual' : e.location || 'TBD'} • ${new Date(e.start_date).toLocaleDateString()}`, date: e.posted_date ? new Date(e.posted_date).toLocaleDateString() : 'Unknown', status: e.status, raw_data: e }); } catch {}
      });
      pendingItems.sort((a, b) => new Date(b.raw_data.created_at || b.raw_data.posted_date).getTime() - new Date(a.raw_data.created_at || a.raw_data.posted_date).getTime());
      setPendingApprovals(pendingItems.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  const quickApprove = async (approval: PendingApproval) => {
    if (!accessToken) return;
    try {
      let endpoint = '', body: any = {};
      if (approval.type === 'alumni') { endpoint = '/api/admin/users'; body = { approval_status: 'approved' }; const auth0 = approval.raw_data?.auth0_id || approval.raw_data?.auth0Id; if (auth0) body.auth0_id = auth0; else body.id = approval.id; }
      else if (approval.type === 'job') { endpoint = `${API_BASE}/api/admin/jobs/${approval.id}/approval`; body = { status: 'Approved' }; }
      else if (approval.type === 'event') { endpoint = `${API_BASE}/api/admin/events/${approval.id}/approval`; body = { status: 'Approved' }; }
      const options: any = { method: approval.type === 'alumni' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
      if (approval.type !== 'alumni') options.headers['Authorization'] = `Bearer ${accessToken}`;
      const res = await fetch(endpoint, options);
      if (res.ok) { setPendingApprovals(p => p.filter(x => x.id !== approval.id || x.type !== approval.type)); fetchDashboardData(true); }
      else { let d = 'unknown error'; try { const j = await res.json(); d = j?.details || j?.error || JSON.stringify(j); } catch { try { d = await res.text(); } catch {} } alert('Approve failed: ' + d); }
    } catch { alert('Failed to approve. Please try again.'); }
  };

  const quickReject = async (approval: PendingApproval) => {
    if (!accessToken) return;
    try {
      let endpoint = '', body: any = {};
      if (approval.type === 'alumni') { endpoint = '/api/admin/users'; body = { approval_status: 'rejected' }; const auth0 = approval.raw_data?.auth0_id || approval.raw_data?.auth0Id; if (auth0) body.auth0_id = auth0; else body.id = approval.id; }
      else if (approval.type === 'job') { endpoint = `${API_BASE}/api/admin/jobs/${approval.id}/approval`; body = { status: 'Rejected' }; }
      else if (approval.type === 'event') { endpoint = `${API_BASE}/api/admin/events/${approval.id}/approval`; body = { status: 'Rejected' }; }
      const options: any = { method: approval.type === 'alumni' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
      if (approval.type !== 'alumni') options.headers['Authorization'] = `Bearer ${accessToken}`;
      const res = await fetch(endpoint, options);
      if (res.ok) { setPendingApprovals(p => p.filter(x => x.id !== approval.id || x.type !== approval.type)); fetchDashboardData(true); }
      else { let d = 'unknown error'; try { const j = await res.json(); d = j?.details || j?.error || JSON.stringify(j); } catch { try { d = await res.text(); } catch {} } alert('Reject failed: ' + d); }
    } catch { alert('Failed to reject. Please try again.'); }
  };

  useEffect(() => { fetchDashboardData(); }, [user, accessToken]);
  useEffect(() => {
    if (!loading) { const t = setInterval(() => fetchDashboardData(true), 30000); return () => clearInterval(t); }
  }, [loading, user, accessToken]);

  const typeIcon = (t: string) => ({ alumni: <UserCheck className="w-4 h-4" />, job: <Briefcase className="w-4 h-4" />, event: <Calendar className="w-4 h-4" /> }[t] || <AlertCircle className="w-4 h-4" />);
  const typeStyle = (t: string) => ({ alumni: 'bg-blue-50 text-blue-600', job: 'bg-purple-50 text-purple-600', event: 'bg-green-50 text-green-600' }[t] || 'bg-gray-50 text-gray-600');
  const typeRoute = (t: string) => ({ alumni: '/admin/approvals/alumni', job: '/admin/jobs', event: '/admin/events' }[t] || '/admin/dashboard');

  const statCards = [
    { label: 'Total Users',        value: stats.totalUsers,        sub: '+12% this month',  icon: <Users className="w-4 h-4" />,     bg: 'bg-blue-50',   color: 'text-blue-600' },
    { label: 'Pending Approvals',   value: stats.pendingApprovals,  sub: 'Needs attention',  icon: <AlertCircle className="w-4 h-4" />, bg: 'bg-amber-50',  color: 'text-amber-600' },
    { label: 'Active Jobs',         value: stats.activeJobs,        sub: 'Live postings',    icon: <Briefcase className="w-4 h-4" />,  bg: 'bg-purple-50', color: 'text-purple-600' },
    { label: 'Upcoming Events',     value: stats.upcomingEvents,    sub: 'This month',       icon: <Calendar className="w-4 h-4" />,   bg: 'bg-green-50',  color: 'text-green-600' },
    { label: 'New Registrations',   value: stats.newRegistrations,  sub: 'This week',        icon: <TrendingUp className="w-4 h-4" />, bg: 'bg-teal-50',   color: 'text-teal-600' },
    { label: 'Approved Today',      value: stats.approvedToday,     sub: 'All processed',    icon: <CheckCircle className="w-4 h-4" />, bg: 'bg-green-50', color: 'text-green-600' },
  ];

  return (
    <AdminNavigation>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-60 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500" />
          <p className="text-sm text-gray-400">Loading dashboard…</p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, Admin!</h1>
              <p className="text-gray-500 text-sm mt-1">Here's what's happening with your platform today.</p>
            </div>
            <button onClick={() => fetchDashboardData(true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors shadow-sm">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {statCards.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-black text-gray-900 leading-none mt-0.5">{s.value}</p>
                  <p className={`text-[11px] font-semibold mt-0.5 ${s.color}`}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Pending Approvals</h3>
                <p className="text-xs text-gray-400 mt-0.5">Items requiring your review</p>
              </div>
              <Link href="/admin/approvals/alumni" className="text-xs font-bold text-green-600 hover:underline">View All →</Link>
            </div>
            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3"><CheckCircle className="w-6 h-6 text-green-500" /></div>
                <p className="font-bold text-gray-900 text-sm">All caught up!</p>
                <p className="text-xs text-gray-400 mt-0.5">No pending approvals at the moment.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingApprovals.map(a => (
                  <div key={`${a.type}-${a.id}`} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeStyle(a.type)}`}>{typeIcon(a.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{a.title}</p>
                        <p className="text-xs text-gray-400">{a.subtitle}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 shrink-0 mr-2">{a.date}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => router.push(typeRoute(a.type))} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                          <Eye className="w-3 h-3" />Review
                        </button>
                        <button onClick={() => quickApprove(a)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                          <CheckCircle className="w-3 h-3" />Approve
                        </button>
                        <button onClick={() => quickReject(a)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">
                          <UserX className="w-3 h-3" />Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: '/admin/jobs/create', icon: <Briefcase className="w-5 h-5" />, title: 'Post a Job', desc: 'Create new job postings', bg: 'bg-purple-50', color: 'text-purple-600', border: 'border-purple-100' },
              { href: '/admin/events/create', icon: <Calendar className="w-5 h-5" />, title: 'Host an Event', desc: 'Schedule alumni events', bg: 'bg-green-50', color: 'text-green-600', border: 'border-green-100' },
              { href: '/admin/notifications', icon: <Send className="w-5 h-5" />, title: 'Send Notification', desc: 'Broadcast to users', bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-100' },
            ].map((q, i) => (
              <Link key={i} href={q.href} className={`bg-white rounded-2xl border ${q.border} shadow-sm p-4 hover:shadow-md transition-all flex items-center gap-3`}>
                <div className={`w-10 h-10 rounded-xl ${q.bg} ${q.color} flex items-center justify-center shrink-0`}>{q.icon}</div>
                <div><p className={`text-sm font-bold ${q.color}`}>{q.title}</p><p className="text-xs text-gray-400">{q.desc}</p></div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AdminNavigation>
  );
}
