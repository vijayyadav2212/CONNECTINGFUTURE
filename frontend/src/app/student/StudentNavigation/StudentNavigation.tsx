"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, User, Users, Building, MessageSquare, Trophy, Settings, Heart, Calendar, Map, Camera, FileText, BarChart3, Bell, BookOpen, Briefcase, Target, Award } from 'lucide-react';

// Interfaces
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  badge?: string;
}

interface StudentData {
  name: string;
  year: string;
  department: string;
  rollNumber: string;
  avatar: string | null;
  verified: boolean;
}

interface StudentNavigationProps {
  children: React.ReactNode;
}

export default function StudentNavigation({ children }: StudentNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Sample student data
  const studentData: StudentData = {
    name: "Vinayak Gorivale",
    year: "3rd Year",
    department: "Information Technology",
    rollNumber: "VU4F2223050",
    avatar: null,
    verified: true
  };

  const navigationItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" />, route: "/student/dashboard" },
    { id: "academic", label: "Academic Progress", icon: <BookOpen className="w-5 h-5" />, route: "/student/academic-progress" },
    { id: "alumni", label: "Alumni Directory", icon: <Users className="w-5 h-5" />, route: "/student/alumni-directory" },
    { id: "mentorship", label: "Find Mentors", icon: <User className="w-5 h-5" />, badge: "2", route: "/student/mentorship-requests" },
    { id: "career", label: "Career Resources", icon: <Target className="w-5 h-5" />, route: "/student/career-resources" },
    { id: "jobs", label: "Job Opportunities", icon: <Briefcase className="w-5 h-5" />, badge: "12", route: "/student/job-opportunities" },
    { id: "events", label: "Events", icon: <Calendar className="w-5 h-5" />, route: "/student/events" },
    { id: "messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, badge: "3", route: "/student/messages" },
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" />, route: "/student/profile" },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/student/settings" },
  ];

  const isActiveRoute = (route: string): boolean => {
    return pathname === route;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-white shadow-lg border-r border-gray-200">
        {/* Scrollable Container for entire sidebar */}
        <div className="h-full overflow-y-auto">
          {/* Logo & Branding */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-500">Vppcoe</p>
              </div>
            </div>
          </div>

          {/* Student Profile Summary */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">SN</span>
                </div>
                {studentData.verified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{studentData.name}</h3>
                <p className="text-sm text-gray-600">{studentData.year}</p>
                <p className="text-xs text-gray-500">{studentData.department}</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <BookOpen className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-xs font-medium text-green-700">Study</span>
              </button>
              <button className="flex items-center justify-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Users className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-xs font-medium text-blue-700">Connect</span>
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.route}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isActiveRoute(item.route)
                        ? 'bg-green-100 text-green-900 border-l-4 border-green-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`${isActiveRoute(item.route) ? 'text-green-600' : 'text-gray-500'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 mt-auto">
            <div className="space-y-2">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center justify-between w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Notifications</span>
                </div>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  5
                </span>
              </button>
              
              <Link
                href="/api/auth/logout"
                className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
              >
                <span className="text-gray-500">🚪</span>
                <span className="font-medium">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => isActiveRoute(item.route))?.label || 'Student Portal'}
              </h2>
              <p className="text-sm text-gray-600">Welcome back, {studentData.name}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  5
                </span>
              </button>
              
              {/* Profile Picture */}
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">SN</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowNotifications(false)}>
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">New mentorship match available</p>
                <p className="text-xs text-blue-700 mt-1">2 minutes ago</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">Academic progress updated</p>
                <p className="text-xs text-green-700 mt-1">1 hour ago</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-900">New job opportunity posted</p>
                <p className="text-xs text-yellow-700 mt-1">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}