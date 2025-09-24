"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentNavigation from '../StudentNavigation';
import { User, BookOpen, Users, Trophy, Calendar, MessageSquare, Target, TrendingUp, Award, Clock, CheckCircle, AlertCircle, Briefcase, GraduationCap } from 'lucide-react';

// Interfaces
interface StudentProfile {
  name: string;
  year: string;
  department: string;
  rollNumber: string;
  gpa: number;
  creditsCompleted: number;
  totalCredits: number;
}

interface AcademicProgress {
  currentSemester: string;
  gpa: number;
  creditsCompleted: number;
  totalCredits: number;
  coursesInProgress: number;
  upcomingAssignments: number;
}

interface QuickStats {
  mentorshipRequests: number;
  jobApplications: number;
  eventsAttended: number;
  networkingConnections: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Mock data - replace with API calls
  const mockProfile: StudentProfile = {
    name: "Student Name",
    year: "3rd Year",
    department: "Computer Science Engineering",
    rollNumber: "2022CS001",
    gpa: 8.5,
    creditsCompleted: 120,
    totalCredits: 160
  };

  const academicProgress: AcademicProgress = {
    currentSemester: "Semester 6",
    gpa: 8.5,
    creditsCompleted: 120,
    totalCredits: 160,
    coursesInProgress: 6,
    upcomingAssignments: 4
  };

  const quickStats: QuickStats = {
    mentorshipRequests: 2,
    jobApplications: 8,
    eventsAttended: 12,
    networkingConnections: 45
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProfile(mockProfile);
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  if (loading) {
    return (
      <StudentNavigation>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-gray-200 h-64 rounded-lg"></div>
              <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
          </div>
        </div>
      </StudentNavigation>
    );
  }

  if (error) {
    return (
      <StudentNavigation>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Error Loading Dashboard</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </StudentNavigation>
    );
  }

  return (
    <StudentNavigation>
      <div className="p-6 lg:p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                  Welcome back, {profile?.name || 'Student'}! 👋
                </h1>
                <p className="text-green-100 text-lg">
                  {profile?.year} • {profile?.department}
                </p>
                <p className="text-green-200 text-sm mt-1">
                  Roll No: {profile?.rollNumber}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="text-right">
                  <div className="text-3xl font-bold">{academicProgress.gpa}</div>
                  <div className="text-green-200">Current GPA</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Academic Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {Math.round((academicProgress.creditsCompleted / academicProgress.totalCredits) * 100)}%
                </p>
                <p className="text-green-600 text-sm mt-1">
                  {academicProgress.creditsCompleted}/{academicProgress.totalCredits} Credits
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Mentors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{quickStats.mentorshipRequests}</p>
                <p className="text-blue-600 text-sm mt-1">Connected</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Job Applications</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{quickStats.jobApplications}</p>
                <p className="text-purple-600 text-sm mt-1">In Progress</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Network Size</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{quickStats.networkingConnections}</p>
                <p className="text-orange-600 text-sm mt-1">Connections</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Academic Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Academic Overview</h2>
                <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                  View Details →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Current Semester</h3>
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{academicProgress.currentSemester}</p>
                  <p className="text-sm text-gray-600 mt-1">{academicProgress.coursesInProgress} courses in progress</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Upcoming Tasks</h3>
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{academicProgress.upcomingAssignments}</p>
                  <p className="text-sm text-gray-600 mt-1">assignments due soon</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Degree Progress</h3>
                  <span className="text-sm text-gray-600">
                    {Math.round((academicProgress.creditsCompleted / academicProgress.totalCredits) * 100)}% Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(academicProgress.creditsCompleted / academicProgress.totalCredits) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{academicProgress.creditsCompleted} credits earned</span>
                  <span>{academicProgress.totalCredits} total required</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => router.push('/student/academic-progress')}
                  className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center"
                >
                  <BookOpen className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-gray-700">Courses</span>
                </button>
                <button 
                  onClick={() => router.push('/student/career-resources')}
                  className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center"
                >
                  <Target className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-gray-700">Career</span>
                </button>
                <button 
                  onClick={() => router.push('/student/mentorship-requests')}
                  className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center"
                >
                  <Users className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-gray-700">Mentors</span>
                </button>
                <button 
                  onClick={() => router.push('/student/events')}
                  className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center"
                >
                  <Calendar className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-gray-700">Events</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity & Notifications */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Assignment Submitted</p>
                    <p className="text-xs text-gray-600">Data Structures Lab - 2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Mentor Match Found</p>
                    <p className="text-xs text-gray-600">Software Engineering - 1 day ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Job Application</p>
                    <p className="text-xs text-gray-600">Google Internship - 3 days ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Event Registered</p>
                    <p className="text-xs text-gray-600">Tech Talk Series - 1 week ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">Career Fair 2024</h3>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Tomorrow</span>
                  </div>
                  <p className="text-sm text-gray-600">10:00 AM - 4:00 PM</p>
                </div>

                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">Alumni Meet</h3>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">This Week</span>
                  </div>
                  <p className="text-sm text-gray-600">Friday, 6:00 PM</p>
                </div>

                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">Tech Workshop</h3>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">Next Week</span>
                  </div>
                  <p className="text-sm text-gray-600">Machine Learning Basics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentNavigation>
  );
}
