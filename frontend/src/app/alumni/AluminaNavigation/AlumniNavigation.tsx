"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, User, Users, Building, MessageSquare, Trophy, Settings, Heart, Calendar, Map, Camera, FileText, BarChart3, Bell } from 'lucide-react';

// Interfaces
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
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
    graduationYear: "2018",
    company: "Google",
    position: "Senior Software Engineer",
    avatar: null, 
    verifiedBadge: true
  };

  const navigationItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/alumni/dashboard" },
    { id: "directory", label: "Directory", icon: <Users className="w-5 h-5" />, route: "/alumni/directory" },
    { id: "network", label: "Network", icon: <Users className="w-5 h-5" />, route: "/alumni/network" },
    { id: "mentorship", label: "Mentorship", icon: <User className="w-5 h-5" />, badge: "3", route: "/alumni/mentorship" },
    { id: "jobs", label: "Jobs & Internships", icon: <Building className="w-5 h-5" />, route: "/alumni/job-posting" },
    { id: "ama", label: "AMA Sessions", icon: <MessageSquare className="w-5 h-5" />, route: "/alumni/ama" },
    { id: "events", label: "Events", icon: <Calendar className="w-5 h-5" />, route: "/alumni/events" },
    { id: "roadmaps", label: "Roadmaps", icon: <Map className="w-5 h-5" />, route: "/alumni/roadmap" },
    { id: "memories", label: "Memories", icon: <Camera className="w-5 h-5" />, route: "/alumni/memories" },
    { id: "blog", label: "Blog/Articles", icon: <FileText className="w-5 h-5" />, route: "/alumni/blog" },
    { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="w-5 h-5" />, route: "/alumni/leaderboard" },
    { id: "messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, badge: "5", route: "/alumni/messages" },
    { id: "donations", label: "Donations", icon: <Heart className="w-5 h-5" />, route: "/alumni/donation" },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/alumni/settings" },
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
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Alumni Connect</h1>
                <p className="text-sm text-gray-500">VPPCOE & VA</p>
              </div>
            </div>
          </div>

          {/* Alumni Profile Summary */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">AK</span>
                </div>
                {alumniData.verifiedBadge && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{alumniData.name}</h3>
                <p className="text-sm text-gray-600">Class of {alumniData.graduationYear}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Verified Alumni</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4">
            {navigationItems.map((item: NavItem) => (
              <Link
                key={item.id}
                href={item.route}
                className={`w-full flex items-center justify-between px-4 py-3 mb-1 rounded-lg text-left transition-all duration-200 hover:bg-gray-50 group ${
                  isActiveRoute(item.route) 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${isActiveRoute(item.route) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Mentorship Status */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Available</span>
              </div>
              <span className="text-xs text-green-600">Mentorship Status</span>
            </div>
          </div>
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
