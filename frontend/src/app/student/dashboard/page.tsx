"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import StudentNavigation from '../StudentNavigation';
import { User, BookOpen, Users, Trophy, Calendar, MessageSquare, Target, TrendingUp, Award, Clock, CheckCircle, AlertCircle, Briefcase, GraduationCap, UserPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const { user: authUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [connections, setConnections] = useState<Array<{ id:number; pair_key:string; requester_email:string; target_email:string; status:'pending'|'accepted'|'rejected'|'removed' }>>([]);
  const [connLoading, setConnLoading] = useState(false);
  const API_BASE = useMemo(() => ((process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '') + '/api'), []);
  const myEmail = (authUser?.email as string) || 'student@example.com';

  // Mock data - replace with API calls
  const mockProfile: StudentProfile = {
    name: "Vinayak Gorivale",
    year: "3rd Year",
    department: "Information Technology",
    rollNumber: "VU4F2223050",
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

  useEffect(() => {
    if (!myEmail) return;
    let mounted = true;
    const loadConns = async () => {
      try {
        setConnLoading(true);
        const resp = await fetch(`${API_BASE}/connections?user_email=${encodeURIComponent(myEmail)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (mounted) setConnections(data.connections || []);
        }
      } finally { setConnLoading(false); }
    };
    loadConns();
    const id = setInterval(loadConns, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, [API_BASE, myEmail]);

  const pendingReceived = useMemo(() => connections.filter(c => c.status==='pending' && c.target_email?.toLowerCase()===myEmail.toLowerCase()), [connections, myEmail]);
  const pendingSent = useMemo(() => connections.filter(c => c.status==='pending' && c.requester_email?.toLowerCase()===myEmail.toLowerCase()), [connections, myEmail]);
  const acceptedCount = useMemo(() => connections.filter(c => c.status==='accepted').length, [connections]);

  async function respondTo(otherEmail:string, action:'accept'|'reject'){
    try {
      setConnLoading(true);
      const resp = await fetch(`${API_BASE}/connections/respond`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_email: myEmail, other_email: otherEmail, action }) });
      if (resp.ok) {
        const data = await resp.json();
        setConnections(prev => prev.map(c => c.pair_key===data.connection.pair_key ? data.connection : c));
      }
    } finally { setConnLoading(false); }
  }

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
                <p className="text-2xl font-bold text-gray-900 mt-1">{acceptedCount}</p>
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
            {/* Connection Requests */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><UserPlus className="w-5 h-5" /> Connection Requests</h2>
                <div className="text-sm text-gray-600">Pending: <span className="font-semibold">{pendingReceived.length + pendingSent.length}</span></div>
              </div>
              <div className="space-y-4">
                {pendingReceived.length===0 && pendingSent.length===0 && (
                  <p className="text-sm text-gray-600">No pending connection requests.</p>
                )}
                {pendingReceived.length>0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Received</h3>
                    <ul className="space-y-2">
                      {pendingReceived.map(req => (
                        <li key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm text-gray-800">{req.requester_email}</div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={()=>respondTo(req.requester_email,'accept')} disabled={connLoading}>Accept</Button>
                            <Button size="sm" variant="destructive" onClick={()=>respondTo(req.requester_email,'reject')} disabled={connLoading}>Decline</Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pendingSent.length>0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Sent</h3>
                    <ul className="space-y-2">
                      {pendingSent.map(req => (
                        <li key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm text-gray-800">To: {req.target_email}</div>
                          <div className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">Pending</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
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
