"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Interfaces
interface AlumniData {
  name: string;
  graduationYear: string;
  company: string;
  position: string;
  avatar: string | null;
  verifiedBadge: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  route: string;
}

interface AlumniSidebarProps {
  alumniData?: AlumniData;
  onPersonalize?: () => void;
}

export default function AlumniSidebar({ 
  alumniData = {
    name: "Vijay Yadav",
    graduationYear: "2019",
    company: "Google",
    position: "Senior Software Engineer",
    avatar: null,
    verifiedBadge: true,
  },
  onPersonalize
}: AlumniSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAvailableForMentorship, setIsAvailableForMentorship] = useState<boolean>(true);

  const navigationItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "🏠", route: "/alumni/dashboard" },
    { id: "mentorship", label: "Mentorship", icon: "🧑‍🏫", badge: "3", route: "/alumni/mentorship" },
    { id: "jobs", label: "Jobs & Internships", icon: "💼", route: "/alumni/job-posting" },
    { id: "ama", label: "AMA Sessions", icon: "🎙️", route: "/alumni/ama" },
    { id: "events", label: "Events", icon: "📅", route: "/alumni/events" },
    { id: "roadmaps", label: "Roadmaps", icon: "🧭", route: "/alumni/roadmap" },
    { id: "memories", label: "Memories", icon: "📸", route: "/alumni/memories" },
    { id: "blog", label: "Blog/Articles", icon: "✍️", route: "/alumni/blog" },
    { id: "leaderboard", label: "Leaderboard", icon: "🏆", route: "/alumni/leaderboard" },
    { id: "messages", label: "Messages", icon: "💬", badge: "5", route: "/alumni/messages" },
    { id: "settings", label: "Settings", icon: "⚙️", route: "/alumni/settings" },
  ];

  const isActiveRoute = (route: string) => {
    return pathname === route;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-white shadow-xl border-r border-slate-200">
      {/* Logo & Branding */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🎓</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Alumni Connect</h1>
            <p className="text-sm text-slate-500">Professional Network</p>
          </div>
        </div>
      </div>

      {/* Alumni Profile Summary */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {alumniData.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            {alumniData.verifiedBadge && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{alumniData.name}</h3>
            <p className="text-sm text-slate-600">Class of {alumniData.graduationYear}</p>
            <div className="flex items-center mt-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">🎓 Verified Alumni</span>
            </div>
          </div>
        </div>
        
        {/* Availability Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <span className="text-sm font-medium text-slate-700">Available for Mentorship</span>
          <button
            onClick={() => setIsAvailableForMentorship(!isAvailableForMentorship)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAvailableForMentorship ? 'bg-green-500' : 'bg-slate-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isAvailableForMentorship ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        {navigationItems.map((item: NavItem) => (
          <button
            key={item.id}
            onClick={() => router.push(item.route)}
            className={`w-full flex items-center justify-between px-4 py-3 mb-1 rounded-lg text-left transition-all duration-200 hover:bg-slate-50 group ${
              isActiveRoute(item.route) ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </div>
            {item.badge && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Action */}
      <div className="absolute bottom-6 left-4 right-4">
        <button
          onClick={onPersonalize}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          ✨ Personalize Experience
        </button>
      </div>
    </aside>
  );
}
