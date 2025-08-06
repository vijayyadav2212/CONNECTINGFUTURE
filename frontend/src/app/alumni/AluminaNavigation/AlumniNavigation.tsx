"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// Interfaces
interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

interface AlumniData {
  name: string;
  graduationYear: string;
  company: string;
  position: string;
  avatar: string | null;
  verifiedBadge: boolean;
}

interface AlumniNavigationProps {
  children: React.ReactNode;
}

export default function AlumniNavigation({ children }: AlumniNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showPersonalizationModal, setShowPersonalizationModal] = useState<boolean>(false);
  const [isAvailableForMentorship, setIsAvailableForMentorship] = useState<boolean>(true);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // Sample alumni data
  const alumniData: AlumniData = {
    name: "Vijay Yadav",
    graduationYear: "2019",
    company: "Google",
    position: "Senior Software Engineer",
    avatar: null,
    verifiedBadge: true
  };

  const navigationItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "🏠", route: "/alumni/dashboard" },
    { id: "mentorship", label: "Mentorship", icon: "🧑‍🏫", badge: "3", route: "/alumni/mentorship" },
    { id: "jobs", label: "Jobs & Internships", icon: "💼", route: "/alumni/job-posting" },
    { id: "ama", label: "AMA Sessions", icon: "🎙️", route: "/alumni/ama" },
    { id: "events", label: "Events", icon: "📅", route: "/alumni/events" },
    { id: "roadmaps", label: "Roadmaps", icon: "🧭", route: "/alumni/roadmap" },
    { id: "directory", label: "Alumni Directory", icon: "📇", route: "/alumni/Directory" },
    { id: "connections", label: "My Connections", icon: "🤝", route: "/alumni/connections" },
    { id: "memories", label: "Memories", icon: "📸", route: "/alumni/memories" },
    { id: "blog", label: "Blog/Articles", icon: "✍️", route: "/alumni/blog" },
    { id: "leaderboard", label: "Leaderboard", icon: "🏆", route: "/alumni/leaderboard" },
    { id: "messages", label: "Messages", icon: "💬", badge: "5", route: "/alumni/messages" },
    { id: "donations", label: "Donations", icon: "💝", route: "/alumni/donation" },
    { id: "career-timeline", label: "Career Timeline", icon: "📈", route: "/alumni/career-timeline" },
    { id: "profile", label: "Profile", icon: "👤", route: "/alumni/profile" },
    { id: "settings", label: "Settings", icon: "⚙️", route: "/alumni/settings" },
  ];

  const isActiveRoute = (route: string): boolean => {
    return pathname === route;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation Sidebar */}
      <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-white shadow-xl border-r border-slate-200 flex flex-col">
        {/* Logo & Branding */}
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
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
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">VY</span>
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

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4">
            {navigationItems.map((item: NavItem) => (
              <Link
                key={item.id}
                href={item.route}
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
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Action */}
        <div className="p-4 flex-shrink-0 border-t border-slate-200">
          <button
            onClick={() => setShowPersonalizationModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            ✨ Personalize Experience
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 min-h-screen">
        {children}
      </main>

      {/* Personalization Modal */}
      {showPersonalizationModal && (
        <PersonalizationModal
          onClose={() => setShowPersonalizationModal(false)}
          selectedDomains={selectedDomains}
          setSelectedDomains={setSelectedDomains}
          selectedActivities={selectedActivities}
          setSelectedActivities={setSelectedActivities}
        />
      )}
    </div>
  );
}

// Personalization Modal Component
interface PersonalizationModalProps {
  onClose: () => void;
  selectedDomains: string[];
  setSelectedDomains: React.Dispatch<React.SetStateAction<string[]>>;
  selectedActivities: string[];
  setSelectedActivities: React.Dispatch<React.SetStateAction<string[]>>;
}

function PersonalizationModal({ onClose, selectedDomains, setSelectedDomains, selectedActivities, setSelectedActivities }: PersonalizationModalProps) {
  const domains: string[] = [
    "Frontend Development", "Backend Development", "Mobile Development", 
    "Data Science", "Machine Learning", "Cybersecurity", "DevOps", 
    "Product Management", "UI/UX Design", "Digital Marketing"
  ];

  const activities: string[] = [
    "1-on-1 Mentorship", "Group Sessions", "Resume Reviews", "Mock Interviews", 
    "Career Guidance", "Technical Workshops", "Industry Insights", 
    "Networking Events", "Skill Development", "Job Referrals"
  ];

  const toggleDomain = (domain: string): void => {
    setSelectedDomains(prev => 
      prev.includes(domain) 
        ? prev.filter((d: string) => d !== domain)
        : [...prev, domain]
    );
  };

  const toggleActivity = (activity: string): void => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter((a: string) => a !== activity)
        : [...prev, activity]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">🎯 Personalize Your Impact</h2>
            <p className="text-slate-600 mt-2">Help us match you with the right opportunities</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-8">
          {/* Expertise Domains */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">🚀 Your Expertise Domains</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {domains.map((domain: string) => (
                <button
                  key={domain}
                  onClick={() => toggleDomain(domain)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 ${
                    selectedDomains.includes(domain)
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span className="font-medium">{domain}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Activities */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">🎯 Activities You'd Love to Do</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activities.map((activity: string) => (
                <button
                  key={activity}
                  onClick={() => toggleActivity(activity)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 ${
                    selectedActivities.includes(activity)
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span className="font-medium">{activity}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors duration-200"
            >
              Skip for now
            </button>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Save Preferences 🎉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
