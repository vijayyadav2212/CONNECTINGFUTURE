"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {Shield, LayoutDashboard, UserCheck, Briefcase, Calendar, Users, Bell, Settings, FileText, BarChart3, CheckCircle, XCircle, Search, Sparkles, Menu, X, LogOut} from 'lucide-react';

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
  const pathname = usePathname();
  const [pendingApprovals, setPendingApprovals] = useState<number>(12); // Mock data
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      route: "/admin/approvals"
    },
    {
      id: "job-management",
      label: "Job Management",
      icon: <Briefcase className="w-5 h-5" />,
      badge: 3,
      route: "/admin/jobs"
    },
    {
      id: "external-jobs",
      label: "Job Opportunities",
      icon: <Search className="w-5 h-5" />,
      route: "/admin/external-jobs"
    },
    {
      id: "event-management",
      label: "Event Management",
      icon: <Calendar className="w-5 h-5" />,
      badge: 1,
      route: "/admin/events"
    },
    {
      id: "mentorship-payments",
      label: "Mentorship Payments",
      icon: <FileText className="w-5 h-5" />,
      route: "/admin/mentorship-payments"
    },
    {
      id: "ai-roadmaps",
      label: "AI Roadmaps",
      icon: <Sparkles className="w-5 h-5" />,
      route: "/admin/roadmaps"
    },
    // { 
    //   id: "users", 
    //   label: "User Management", 
    //   icon: <Users className="w-5 h-5" />, 
    //   route: "/admin/users" 
    // },
    // { 
    //   id: "reports", 
    //   label: "Reports & Analytics", 
    //   icon: <BarChart3 className="w-5 h-5" />, 
    //   route: "/admin/reports" 
    // },
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

  const isActiveRoute = (route: string): any => {
    return pathname === route || pathname?.startsWith(route + '/');
  };

  const handleLogout = () => {
    // Use direct navigation so Auth0 can complete its redirect/cookie flow.
    window.location.href = '/api/auth/logout';
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#f6f3eb] overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-teal-900/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg border border-teal-900/10 bg-white flex items-center justify-center p-1 shadow-sm shrink-0 overflow-hidden">
            <img src="/NEWCNLOGO.png" alt="Alumnex Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-teal-950 truncate">Alumnex</h1>
            <p className="text-[11px] text-teal-700 truncate">Admin Panel</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#f6f3eb] text-teal-900"
          aria-label="Open admin menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 w-64 h-screen bg-white shadow-xl border-r border-teal-900/10 flex-col">
        {/* Scrollable Container */}
        <div className="h-full overflow-y-auto">
          {/* Logo & Branding */}
          <div className="p-6 border-b border-teal-900/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl border border-teal-900/10 bg-white flex items-center justify-center p-1 shadow-md shrink-0 overflow-hidden">
                <img src="/NEWCNLOGO.png" alt="Alumnex Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-teal-950">Alumnex</h1>
                <p className="text-xs text-teal-700 font-medium">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Admin Profile Summary */}
          <div className="p-6 border-b border-teal-900/10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-teal-950 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">AD</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-teal-950">Admin User</h3>
                <p className="text-sm text-teal-700">System Administrator</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full border border-teal-200 font-medium">Super Admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-b border-teal-900/10">
            <div className="grid grid-cols-2 gap-2">
              {/* <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-teal-800 font-medium">Pending</span>
                </div>
                <p className="text-xl font-bold text-teal-950 mt-1">{pendingApprovals}</p>
              </div> */}
              {/* <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-teal-900" />
                  <span className="text-xs text-teal-800 font-medium">Users</span>
                </div>
                <p className="text-xl font-bold text-teal-950 mt-1">1,234</p>
              </div> */}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4">
            {navigationItems.map((item: NavItem) => (
              <Link
                key={item.id}
                href={item.route}
                className={`w-full flex items-center justify-between px-4 py-3 mb-1 rounded-lg text-left transition-all duration-200 group ${isActiveRoute(item.route)
                  ? 'bg-teal-950 text-white shadow-md font-bold'
                  : 'text-teal-900 hover:bg-[#f6f3eb]'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${isActiveRoute(item.route) ? 'text-white' : 'text-teal-700 group-hover:text-teal-900'}`}>
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
          <div className="p-4 border-t border-teal-900/10">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
              <span className="text-xs text-teal-700">System Status</span>
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-teal-900/10 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-all duration-200 border border-red-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close admin menu"
            className="absolute inset-0 bg-teal-950/40"
            onClick={closeMobileMenu}
          />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl border-r border-teal-900/10 overflow-y-auto">
            <div className="p-4 border-b border-teal-900/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg border border-teal-900/10 bg-white flex items-center justify-center p-1 shadow-sm shrink-0 overflow-hidden">
                  <img src="/NEWCNLOGO.png" alt="Alumnex Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-teal-950 truncate">Alumnex</h1>
                  <p className="text-[11px] text-teal-700 truncate">Admin Panel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#f6f3eb] text-teal-900"
                aria-label="Close admin menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4">
              {navigationItems.map((item: NavItem) => (
                <Link
                  key={item.id}
                  href={item.route}
                  onClick={closeMobileMenu}
                  className={`w-full flex items-center justify-between px-4 py-3 mb-1 rounded-lg text-left transition-all duration-200 group ${isActiveRoute(item.route)
                    ? 'bg-teal-950 text-white shadow-md font-bold'
                    : 'text-teal-900 hover:bg-[#f6f3eb]'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${isActiveRoute(item.route) ? 'text-white' : 'text-teal-700 group-hover:text-teal-900'}`}>
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

            {/* Mobile Logout Button */}
            <div className="p-4 border-t border-teal-900/10">
              <button
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-all duration-200 border border-red-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen">
        <div className="sticky top-0 z-30 bg-white border-b border-teal-900/10 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-teal-950">Admin Dashboard</h2>
              <p className="text-xs sm:text-sm text-teal-700 mt-1">Manage and monitor your platform</p>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <button className="relative p-2 text-teal-800 hover:text-teal-950 hover:bg-[#f6f3eb] rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200">
                Quick Actions
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
