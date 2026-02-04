"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, LayoutDashboard, UserCheck, Briefcase, Calendar, Users, Bell, Settings, FileText, BarChart3, CheckCircle, XCircle } from 'lucide-react';

// Interfaces
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  badge?: string | number;
}

interface AdminNavigationProps {
  children: React.ReactNode;
}

export default function AdminNavigation({ children }: AdminNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingApprovals, setPendingApprovals] = useState<number>(12); // Mock data

  const navigationItems: NavItem[] = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: <LayoutDashboard className="w-5 h-5" />, 
      route: "/admin/dashboard" 
    },
    { 
      id: "alumni-approvals", 
      label: "Alumni Approvals", 
      icon: <UserCheck className="w-5 h-5" />, 
      badge: 8,
      route: "/admin/approvals/alumni" 
    },
    { 
      id: "job-management", 
      label: "Job Management", 
      icon: <Briefcase className="w-5 h-5" />, 
      badge: 3,
      route: "/admin/jobs" 
    },
    { 
      id: "event-management", 
      label: "Event Management", 
      icon: <Calendar className="w-5 h-5" />, 
      badge: 1,
      route: "/admin/events" 
    },
    { 
      id: "users", 
      label: "User Management", 
      icon: <Users className="w-5 h-5" />, 
      route: "/admin/users" 
    },
    { 
      id: "reports", 
      label: "Reports & Analytics", 
      icon: <BarChart3 className="w-5 h-5" />, 
      route: "/admin/reports" 
    },
    { 
      id: "notifications", 
      label: "Notifications", 
      icon: <Bell className="w-5 h-5" />, 
      route: "/admin/notifications" 
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: <Settings className="w-5 h-5" />, 
      route: "/admin/settings" 
    },
  ];

  const isActiveRoute = (route: string): boolean => {
    return pathname === route || pathname?.startsWith(route + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-white shadow-xl border-r border-gray-200">
        {/* Scrollable Container */}
        <div className="h-full overflow-y-auto">
          {/* Logo & Branding */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">VPPCOE & VA</p>
              </div>
            </div>
          </div>

          {/* Admin Profile Summary */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">AD</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Admin User</h3>
                <p className="text-sm text-gray-500">System Administrator</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-200 font-medium">Super Admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-gray-600 font-medium">Pending</span>
                </div>
                <p className="text-xl font-bold text-gray-900 mt-1">{pendingApprovals}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600 font-medium">Users</span>
                </div>
                <p className="text-xl font-bold text-gray-900 mt-1">1,234</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4">
            {navigationItems.map((item: NavItem) => (
              <Link
                key={item.id}
                href={item.route}
                className={`w-full flex items-center justify-between px-4 py-3 mb-1 rounded-lg text-left transition-all duration-200 group ${
                  isActiveRoute(item.route) 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${isActiveRoute(item.route) ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    {item.icon}
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* System Status */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
              <span className="text-xs text-gray-500">System Status</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 min-h-screen">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
              <p className="text-sm text-gray-500 mt-1">Manage and monitor your platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200">
                Quick Actions
              </button>
            </div>
          </div>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
