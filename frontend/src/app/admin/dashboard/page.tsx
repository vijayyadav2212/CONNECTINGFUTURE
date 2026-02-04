"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '../AdminNavigation';
import { 
  Users, UserCheck, UserX, Briefcase, Calendar, 
  TrendingUp, AlertCircle, CheckCircle, Clock, 
  Eye, Activity, ArrowUpRight, Send
} from 'lucide-react';
import Link from 'next/link';

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
  status: 'pending';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 1234,
    pendingApprovals: 12,
    activeJobs: 45,
    upcomingEvents: 8,
    newRegistrations: 23,
    approvedToday: 15
  });

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    { id: 1, type: 'alumni', title: 'John Doe', subtitle: 'Computer Science • 2020', date: '2 hours ago', status: 'pending' },
    { id: 2, type: 'alumni', title: 'Jane Smith', subtitle: 'Mechanical Engineering • 2019', date: '5 hours ago', status: 'pending' },
    { id: 3, type: 'job', title: 'Senior Software Engineer', subtitle: 'Google • Full-time', date: '1 day ago', status: 'pending' },
    { id: 4, type: 'event', title: 'Tech Talk: AI in Industry', subtitle: 'Virtual Event • Feb 15, 2026', date: '2 days ago', status: 'pending' },
  ]);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

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
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">Welcome back, Admin!</h1>
              <p className="text-white/90">Here's what's happening with your platform today.</p>
            </div>
          </div>

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
                      <button className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium text-sm flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium text-sm flex items-center">
                        <UserX className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
