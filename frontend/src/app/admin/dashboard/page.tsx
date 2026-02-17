"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '../AdminNavigation';
import { 
  Users, UserCheck, UserX, Briefcase, Calendar, 
  TrendingUp, AlertCircle, CheckCircle, Clock, 
  Eye, Activity, ArrowUpRight, Send, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../hooks/useAuth0Token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

// Interfaces
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
  raw_data?: any; // Store original data for API calls
}

interface ApiResponse {
  users?: any[];
  jobs?: any[];
  events?: any[];
  total?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useUser();
  const { token: accessToken } = useAuth0Token();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    activeJobs: 0,
    upcomingEvents: 0,
    newRegistrations: 0,
    approvedToday: 0
  });

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = async (isRefresh = false) => {
    if (!user || !accessToken) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch all data in parallel
      const [usersResponse, jobsResponse, eventsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/users?limit=1000`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }).catch(err => ({ ok: false, error: 'Users API failed', details: err })),
        fetch(`${API_BASE}/api/jobs?limit=1000`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }).catch(err => ({ ok: false, error: 'Jobs API failed', details: err })),
        fetch(`${API_BASE}/api/events?limit=1000`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }).catch(err => ({ ok: false, error: 'Events API failed', details: err }))
      ]);

      // Check for API errors
      const errors = [];
      let usersData = { users: [] };
      let jobsData = { jobs: [] };
      let eventsData = { events: [] };

      if (usersResponse.ok) {
        const contentType = usersResponse.headers?.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          usersData = await usersResponse.json();
        } else {
          errors.push('Users API returned invalid response');
        }
      } else {
        errors.push(`Users API failed: ${usersResponse.status || 'Network error'}`);
      }

      if (jobsResponse.ok) {
        const contentType = jobsResponse.headers?.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          jobsData = await jobsResponse.json();
        } else {
          errors.push('Jobs API returned invalid response');
        }
      } else {
        errors.push(`Jobs API failed: ${jobsResponse.status || 'Network error'}`);
      }

      if (eventsResponse.ok) {
        const contentType = eventsResponse.headers?.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          eventsData = await eventsResponse.json();
        } else {
          errors.push('Events API returned invalid response');
        }
      } else {
        errors.push(`Events API failed: ${eventsResponse.status || 'Network error'}`);
      }

      if (errors.length > 0) {
        console.warn('Dashboard API errors:', errors);
        setError(`Some data may be incomplete: ${errors.join(', ')}`);
      }

      const users = usersData.users || [];
      const jobs = jobsData.jobs || [];
      const events = eventsData.events || [];

      // Filter for alumni users specifically
      const alumniUsers = users.filter((u: any) => u.user_type === 'alumni');
      const allUsers = users; // Keep total for overall stats

      // Calculate stats
      const totalUsers = allUsers.length;
      const totalAlumni = alumniUsers.length;
      const activeJobs = jobs.filter((j: any) => {
        const status = String(j.status || '').toLowerCase();
        return status.includes('approved');
      }).length;
      const upcomingEvents = events.filter((e: any) => {
        try {
          const eventDate = new Date(e.start_date);
          const now = new Date();
          const status = String(e.status || '').toLowerCase();
          return eventDate > now && status.includes('approved');
        } catch {
          return false;
        }
      }).length;

      // Count pending approvals
      const pendingAlumni = alumniUsers.filter((u: any) => {
        const status = String(u.approval_status || 'pending').toLowerCase();
        return status === 'pending';
      }).length;
      const pendingJobs = jobs.filter((j: any) => {
        const status = String(j.status || '').toLowerCase();
        return status.includes('pending');
      }).length;
      const pendingEvents = events.filter((e: any) => {
        const status = String(e.status || '').toLowerCase();
        return status.includes('pending');
      }).length;
      const totalPending = pendingAlumni + pendingJobs + pendingEvents;

      // Count new registrations (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newRegistrations = allUsers.filter((u: any) => {
        try {
          const created = new Date(u.created_at);
          return created > weekAgo;
        } catch {
          return false;
        }
      }).length;

      // Count approvals today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const approvedToday = alumniUsers.filter((u: any) => {
        try {
          const approved = u.approved_at ? new Date(u.approved_at) : null;
          const status = String(u.approval_status || '').toLowerCase();
          return approved && approved >= today && status === 'approved';
        } catch {
          return false;
        }
      }).length;

      setStats({
        totalUsers,
        pendingApprovals: totalPending,
        activeJobs,
        upcomingEvents,
        newRegistrations,
        approvedToday
      });

      console.log('Dashboard Stats:', {
        totalUsers,
        totalAlumni,
        pendingApprovals: totalPending,
        activeJobs,
        upcomingEvents,
        newRegistrations,
        approvedToday,
        breakdown: {
          pendingAlumni,
          pendingJobs,
          pendingEvents
        }
      });

      // Create pending approvals list
      const pendingItems: PendingApproval[] = [];

      // Add pending alumni (limit to 3)
      alumniUsers
        .filter((u: any) => {
          const status = String(u.approval_status || 'pending').toLowerCase();
          return status === 'pending';
        })
        .slice(0, 3)
        .forEach((u: any) => {
          pendingItems.push({
            id: u.id,
            type: 'alumni',
            title: u.name || 'Unknown User',
            subtitle: `${u.major || 'Unknown'} • ${u.graduation_year || 'N/A'}`,
            date: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown',
            status: u.approval_status || 'pending',
            raw_data: u
          });
        });

      // Add pending jobs (limit to 2)
      jobs
        .filter((j: any) => {
          const status = String(j.status || '').toLowerCase();
          return status.includes('pending');
        })
        .slice(0, 2)
        .forEach((j: any) => {
          pendingItems.push({
            id: j.id,
            type: 'job',
            title: j.title,
            subtitle: `${j.company} • ${j.job_type || 'Unknown'}`,
            date: j.posted_date ? new Date(j.posted_date).toLocaleDateString() : 'Unknown',
            status: j.status,
            raw_data: j
          });
        });

      // Add pending events (limit to 2)
      events
        .filter((e: any) => {
          const status = String(e.status || '').toLowerCase();
          return status.includes('pending');
        })
        .slice(0, 2)
        .forEach((e: any) => {
          try {
            pendingItems.push({
              id: e.id,
              type: 'event',
              title: e.title,
              subtitle: `${e.is_virtual ? 'Virtual Event' : e.location || 'TBD'} • ${new Date(e.start_date).toLocaleDateString()}`,
              date: e.posted_date ? new Date(e.posted_date).toLocaleDateString() : 'Unknown',
              status: e.status,
              raw_data: e
            });
          } catch (dateError) {
            // Skip events with invalid dates
            console.warn('Invalid event date:', e.start_date);
          }
        });

      // Sort by most recent
      pendingItems.sort((a, b) => {
        const dateA = a.raw_data.created_at || a.raw_data.posted_date;
        const dateB = b.raw_data.created_at || b.raw_data.posted_date;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setPendingApprovals(pendingItems.slice(0, 5)); // Show max 5 items
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Quick approve function
  const quickApprove = async (approval: PendingApproval) => {
    if (!accessToken) return;
    
    try {
      let endpoint = '';
      let body = {};
      
      if (approval.type === 'alumni') {
        endpoint = `${API_BASE}/api/admin/users/${approval.id}/approval`;
        body = { approval_status: 'approved' };
      } else if (approval.type === 'job') {
        endpoint = `${API_BASE}/api/admin/jobs/${approval.id}/approval`;
        body = { status: 'Approved' };
      } else if (approval.type === 'event') {
        endpoint = `${API_BASE}/api/admin/events/${approval.id}/approval`;
        body = { status: 'Approved' };
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        // Remove from pending list and refresh stats
        setPendingApprovals(prev => prev.filter(p => p.id !== approval.id || p.type !== approval.type));
        fetchDashboardData(true);
      } else {
        throw new Error('Failed to approve');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve. Please try again.');
    }
  };

  // Quick reject function
  const quickReject = async (approval: PendingApproval) => {
    if (!accessToken) return;
    
    try {
      let endpoint = '';
      let body = {};
      
      if (approval.type === 'alumni') {
        endpoint = `${API_BASE}/api/admin/users/${approval.id}/approval`;
        body = { approval_status: 'rejected' };
      } else if (approval.type === 'job') {
        endpoint = `${API_BASE}/api/admin/jobs/${approval.id}/approval`;
        body = { status: 'Rejected' };
      } else if (approval.type === 'event') {
        endpoint = `${API_BASE}/api/admin/events/${approval.id}/approval`;
        body = { status: 'Rejected' };
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        // Remove from pending list and refresh stats
        setPendingApprovals(prev => prev.filter(p => p.id !== approval.id || p.type !== approval.type));
        fetchDashboardData(true);
      } else {
        throw new Error('Failed to reject');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject. Please try again.');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, accessToken]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        fetchDashboardData(true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [loading, user, accessToken]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alumni': return <UserCheck className="w-5 h-5" />;
      case 'job': return <Briefcase className="w-5 h-5" />;
      case 'event': return <Calendar className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alumni': return 'text-blue-600 bg-blue-50';
      case 'job': return 'text-purple-600 bg-purple-50';
      case 'event': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getApprovalRoute = (type: string) => {
    switch (type) {
      case 'alumni': return '/admin/approvals/alumni';
      case 'job': return '/admin/jobs';
      case 'event': return '/admin/events';
      default: return '/admin/dashboard';
    }
  };

  return (
    <AdminNavigation>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading dashboard...</div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, Admin!</h1>
                <p className="text-white/90">Here's what's happening with your platform today.</p>
              </div>
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Error Loading Dashboard</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Users */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</h3>
                  <div className="flex items-center mt-2 text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">+12% this month</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingApprovals}</h3>
                  <div className="flex items-center mt-2 text-orange-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Needs attention</span>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Active Jobs */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.activeJobs}</h3>
                  <div className="flex items-center mt-2 text-blue-600">
                    <Activity className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Live postings</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingEvents}</h3>
                  <div className="flex items-center mt-2 text-green-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">This month</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* New Registrations */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Registrations</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.newRegistrations}</h3>
                  <div className="flex items-center mt-2 text-blue-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">This week</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Approved Today */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved Today</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.approvedToday}</h3>
                  <div className="flex items-center mt-2 text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">All processed</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

            {/* Pending Approvals Section */}
          {pendingApprovals.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No pending approvals at the moment.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
                  <p className="text-sm text-gray-600 mt-1">Items requiring your review</p>
                </div>
                <Link 
                  href="/admin/approvals/alumni"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${getTypeColor(approval.type)}`}>
                        {getTypeIcon(approval.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{approval.title}</h3>
                        <p className="text-sm text-gray-600">{approval.subtitle}</p>
                        <p className="text-xs text-gray-500 mt-1">{approval.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(getApprovalRoute(approval.type))}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </button>
                      <button
                        onClick={() => quickApprove(approval)}
                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium text-sm flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button 
                        onClick={() => quickReject(approval)}
                        className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium text-sm flex items-center"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/admin/jobs/create" className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
              <Briefcase className="w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">Post a Job</h3>
              <p className="text-white/80 text-sm">Create new job posting or internship opportunity</p>
            </Link>

            <Link href="/admin/events/create" className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
              <Calendar className="w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">Host an Event</h3>
              <p className="text-white/80 text-sm">Schedule and manage alumni events</p>
            </Link>

            <Link href="/admin/notifications" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
              <Send className="w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">Send Notification</h3>
              <p className="text-white/80 text-sm">Broadcast messages to users</p>
            </Link>
          </div>
        </div>
      )}
    </AdminNavigation>
  );
}
