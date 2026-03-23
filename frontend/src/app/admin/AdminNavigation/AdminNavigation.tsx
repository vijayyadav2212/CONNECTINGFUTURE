"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, LayoutDashboard, UserCheck, Briefcase, Calendar,
  Users, Bell, Settings, BarChart3, ChevronRight
} from 'lucide-react';

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

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, route: '/admin/dashboard' },
  { id: 'alumni-approvals', label: 'Alumni Approvals', icon: <UserCheck className="w-4 h-4" />, route: '/admin/approvals', badge: 8 },
  { id: 'job-management', label: 'Job Management', icon: <Briefcase className="w-4 h-4" />, route: '/admin/jobs', badge: 3 },
  { id: 'event-management', label: 'Event Management', icon: <Calendar className="w-4 h-4" />, route: '/admin/events', badge: 1 },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, route: '/admin/notifications' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, route: '/admin/settings' },
];

export default function AdminNavigation({ children }: AdminNavigationProps) {
  const pathname = usePathname();

  const isActive = (route: string) =>
    pathname === route || pathname?.startsWith(route + '/');

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 w-60 h-screen bg-white border-r border-gray-100 shadow-sm flex flex-col">

        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-none">Admin Panel</p>
              <p className="text-[10px] text-gray-400 mt-0.5">VPPCOE & VA</p>
            </div>
          </div>
        </div>

        {/* Admin Profile */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 text-sm font-black flex items-center justify-center">AD</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 leading-none">Admin User</p>
              <p className="text-[10px] text-gray-400 mt-0.5">System Administrator</p>
              <span className="inline-block mt-1 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Super Admin</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
              <p className="text-lg font-black text-amber-700">12</p>
              <p className="text-[10px] text-amber-600 font-semibold">Pending</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
              <p className="text-lg font-black text-blue-700">1,234</p>
              <p className="text-[10px] text-blue-600 font-semibold">Users</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2 mb-2">Navigation</p>
          <div className="space-y-0.5">
            {navigationItems.map(item => {
              const active = isActive(item.route);
              return (
                <Link
                  key={item.id}
                  href={item.route}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${active
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <span className={active ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white">{item.badge}</span>
                  ) : active ? (
                    <ChevronRight className="w-3.5 h-3.5 text-green-500" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* System Status */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-700">All Systems Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-60 flex-1 min-h-screen flex flex-col">

        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-7 py-3.5 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-lg font-black text-gray-900">Admin Dashboard</h2>
            <p className="text-xs text-gray-400">Manage and monitor your platform</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-[10px] font-black flex items-center justify-center">AD</div>
              <p className="text-xs font-bold text-green-700">Admin</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-7">
          {children}
        </div>
      </main>
    </div>
  );
}
