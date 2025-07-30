"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AlumniNavigation from '../AluminaNavigation';

// Interfaces
interface AlumniStats {
  menteesHelped: number;
  jobsPosted: number;
  blogsWritten: number;
  points: number;
}

interface AlumniData {
  name: string;
  graduationYear: string;
  company: string;
  position: string;
  avatar: string | null;
  verifiedBadge: boolean;
  stats: AlumniStats;
}

interface DashboardSectionProps {
  alumniData: AlumniData;
}

export default function AlumniDashboard() {
  const router = useRouter();
  const [showPersonalizationModal, setShowPersonalizationModal] = useState<boolean>(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // Sample alumni data
  const alumniData: AlumniData = {
    name: "Vijay Yadav",
    graduationYear: "2019",
    company: "Google",
    position: "Senior Software Engineer",
    avatar: null,
    verifiedBadge: true,
    stats: {
      menteesHelped: 24,
      jobsPosted: 8,
      blogsWritten: 12,
      points: 1247
    }
  };

  return (
    <AlumniNavigation>
      <div className="p-8">
        <DashboardSection alumniData={alumniData} />
      </div>
    </AlumniNavigation>
  );
}

// Dashboard Section Component
function DashboardSection({ alumniData }: DashboardSectionProps) {
  const router = useRouter();
  
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {alumniData.name}! 🎓
              </h1>
              <p className="text-blue-100 text-lg">
                Ready to inspire and guide the next generation?
              </p>
              <div className="flex items-center mt-4 space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🏢</span>
                  <span className="font-medium">{alumniData.company}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💼</span>
                  <span className="font-medium">{alumniData.position}</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-4xl">👨‍💼</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <span className="text-white text-xl">👥</span>
            </div>
            <span className="text-green-500 text-sm font-medium">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{alumniData.stats.menteesHelped}</h3>
          <p className="text-slate-600 font-medium">Mentees Helped</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <span className="text-white text-xl">💼</span>
            </div>
            <span className="text-blue-500 text-sm font-medium">+3</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{alumniData.stats.jobsPosted}</h3>
          <p className="text-slate-600 font-medium">Jobs Posted</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <span className="text-white text-xl">✍️</span>
            </div>
            <span className="text-purple-500 text-sm font-medium">+2</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{alumniData.stats.blogsWritten}</h3>
          <p className="text-slate-600 font-medium">Blogs Written</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <span className="text-white text-xl">🏆</span>
            </div>
            <span className="text-orange-500 text-sm font-medium">+47</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{alumniData.stats.points}</h3>
          <p className="text-slate-600 font-medium">Impact Points</p>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <button 
            onClick={() => router.push('/alumni/profile')}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <span className="text-3xl mb-3">🔧</span>
            <span className="font-semibold text-slate-800">Update Profile</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/job-posting')}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl hover:from-green-100 hover:to-emerald-200 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <span className="text-3xl mb-3">📤</span>
            <span className="font-semibold text-slate-800">Post Job</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/ama')}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl hover:from-purple-100 hover:to-pink-200 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <span className="text-3xl mb-3">🎙️</span>
            <span className="font-semibold text-slate-800">Host AMA</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/roadmap')}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl hover:from-orange-100 hover:to-amber-200 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <span className="text-3xl mb-3">🧭</span>
            <span className="font-semibold text-slate-800">Create Roadmap</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/mentorship')}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl hover:from-teal-100 hover:to-cyan-200 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <span className="text-3xl mb-3">🧑‍🏫</span>
            <span className="font-semibold text-slate-800">Become Mentor</span>
          </button>
        </div>
      </div>

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">📈 Recent Impact</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white">🎯</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Rahul got placed at Microsoft!</p>
                <p className="text-sm text-slate-600">Your mentorship helped him crack the interview</p>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">2h ago</span>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white">💼</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">New applications on Frontend Developer role</p>
                <p className="text-sm text-slate-600">12 students applied in the last 24 hours</p>
              </div>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">1d ago</span>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white">📖</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Your "React Roadmap" is trending!</p>
                <p className="text-sm text-slate-600">127 students started following your roadmap</p>
              </div>
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">3d ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">📅 Upcoming Sessions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-semibold">RS</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Mentorship with Rohan</p>
                  <p className="text-sm text-slate-600">Today, 3:00 PM</p>
                </div>
              </div>
              <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors duration-200">
                Join Call
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-purple-300 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white">🎙️</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">AMA: Career in Tech</p>
                  <p className="text-sm text-slate-600">Tomorrow, 7:00 PM</p>
                </div>
              </div>
              <button className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors duration-200">
                Prepare
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
