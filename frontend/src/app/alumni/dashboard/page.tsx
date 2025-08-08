"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AlumniNavigation from '../AluminaNavigation';
import { User, Building, FileText, Trophy, Calendar, MessageSquare, Map, Heart, Settings, Users, Briefcase, BookOpen, Award, Send, Mic, Route, UserPlus } from 'lucide-react';

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
    graduationYear: "2018",
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
      <div className="bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {alumniData.name}!
              </h1>
              <p className="text-blue-100 text-lg">
                Ready to make an impact today?
              </p>
            </div>
            <button className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white font-medium hover:bg-white/30 transition-all duration-200 flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Update Interests</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-green-500 text-sm font-medium">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{alumniData.stats.menteesHelped}</h3>
          <p className="text-slate-600 font-medium">Mentees Helped</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-blue-500 text-sm font-medium">+3</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{alumniData.stats.jobsPosted}</h3>
          <p className="text-slate-600 font-medium">Jobs Posted</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-purple-500 text-sm font-medium">+2</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{alumniData.stats.blogsWritten}</h3>
          <p className="text-slate-600 font-medium">Blogs Written</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span className="text-yellow-500 text-sm font-medium">+47</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{alumniData.stats.points}</h3>
          <p className="text-slate-600 font-medium">Impact Points</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button 
            onClick={() => router.push('/alumni/profile')}
            className="flex flex-col items-center p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
          >
            <Settings className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Update Profile</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/job-posting')}
            className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <Send className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-sm font-medium text-slate-700">Post Job</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/ama')}
            className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <Mic className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-sm font-medium text-slate-700">Host AMA</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/roadmap')}
            className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <Route className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-sm font-medium text-slate-700">Create Roadmap</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/mentorship')}
            className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <UserPlus className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-sm font-medium text-slate-700">Become Mentor</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/donation')}
            className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <Heart className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-sm font-medium text-slate-700">Make Donation</span>
          </button>
        </div>
      </div>

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Impact</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Rahul Singh got placed at Google through your referral</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Your 'Frontend Roadmap' has 127 new followers</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">5 students completed your React.js roadmap</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Upcoming Sessions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">SK</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Mentorship with Sneha</p>
                  <p className="text-sm text-slate-600">Today, 3:00 PM</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                Confirmed
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">AMA: Career in Tech</p>
                  <p className="text-sm text-slate-600">Tomorrow, 7:00 PM</p>
                </div>
              </div>
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                Hosting
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
