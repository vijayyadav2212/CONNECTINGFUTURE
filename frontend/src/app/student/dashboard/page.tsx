"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import StudentNavigation from '../StudentNavigation';
import { User, BookOpen, Users, Trophy, Calendar, MessageSquare, Target, TrendingUp, Award, Clock, CheckCircle, AlertCircle, Briefcase, GraduationCap, UserPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function StudentDashboard() {
  const router = useRouter();
  const { user: authUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [connections, setConnections] = useState<Array<{ id: number; pair_key: string; requester_email: string; target_email: string; status: 'pending' | 'accepted' | 'rejected' | 'removed' }>>([]);
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

  const pendingReceived = useMemo(() => connections.filter(c => c.status === 'pending' && c.target_email?.toLowerCase() === myEmail.toLowerCase()), [connections, myEmail]);
  const pendingSent = useMemo(() => connections.filter(c => c.status === 'pending' && c.requester_email?.toLowerCase() === myEmail.toLowerCase()), [connections, myEmail]);
  const acceptedCount = useMemo(() => connections.filter(c => c.status === 'accepted').length, [connections]);

  async function respondTo(otherEmail: string, action: 'accept' | 'reject') {
    try {
      setConnLoading(true);
      const resp = await fetch(`${API_BASE}/connections/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: myEmail, other_email: otherEmail, action }) });
      if (resp.ok) {
        const data = await resp.json();
        setConnections(prev => prev.map(c => c.pair_key === data.connection.pair_key ? data.connection : c));
      }
    } finally { setConnLoading(false); }
  }

  if (loading) {
    return (
      <StudentNavigation>
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
          {/* Animated background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
          </div>

          <div className="p-8 relative">
            <div className="animate-pulse">
              <div className="h-8 bg-white/50 backdrop-blur-md rounded-xl w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/50 backdrop-blur-md h-32 rounded-2xl shadow-lg"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/50 backdrop-blur-md h-64 rounded-2xl shadow-lg"></div>
                <div className="bg-white/50 backdrop-blur-md h-64 rounded-2xl shadow-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </StudentNavigation>
    );
  }

  if (error) {
    return (
      <StudentNavigation>
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Error Loading Dashboard</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </StudentNavigation>
    );
  }

  return (
    <StudentNavigation>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          ></motion.div>
          <motion.div
            className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          ></motion.div>
          <motion.div
            className="absolute -bottom-8 left-20 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
            animate={{
              x: [0, 50, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          ></motion.div>
        </div>

        <div className="p-6 lg:p-8 relative">
          {/* Welcome Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="relative bg-gradient-to-br from-blue-100/60 via-green-100/50 to-orange-100/40 backdrop-blur-lg rounded-3xl p-8 lg:p-10 shadow-xl border border-white/30 overflow-hidden">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Welcome Back label */}
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-blue-700 font-semibold text-sm">Welcome Back</span>
                    </div>

                    {/* Main greeting */}
                    <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3">
                      Hello, {profile?.name || 'Student'}!
                    </h1>

                    {/* Subtitle */}
                    <p className="text-gray-700 text-base lg:text-lg max-w-2xl mb-4">
                      Your community is growing. Ready to make an impact today?
                    </p>

                    {/* Additional info */}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        <GraduationCap className="w-4 h-4" />
                        {profile?.year}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        <BookOpen className="w-4 h-4" />
                        {profile?.department}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        <User className="w-4 h-4" />
                        {profile?.rollNumber}
                      </span>
                    </div>
                  </div>

                  {/* Settings/Update Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/student/settings')}
                    className="hidden md:flex items-center gap-2 bg-white/70 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-white/40"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Update Interests</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-white/70 via-white/60 to-white/50 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/40"
            >
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
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-md">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-white/70 via-white/60 to-white/50 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Mentors</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{quickStats.mentorshipRequests}</p>
                  <p className="text-blue-600 text-sm mt-1">Connected</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-md">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-white/70 via-white/60 to-white/50 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Job Applications</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{quickStats.jobApplications}</p>
                  <p className="text-purple-600 text-sm mt-1">In Progress</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-md">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-white/70 via-white/60 to-white/50 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Network Size</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{acceptedCount}</p>
                  <p className="text-orange-600 text-sm mt-1">Connections</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl shadow-md">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Academic Overview */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="bg-gradient-to-br from-white/75 via-white/65 to-white/55 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/40">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Academic Overview</h2>
                  <button className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors">
                    View Details →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Current Semester</h3>
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{academicProgress.currentSemester}</p>
                    <p className="text-sm text-gray-600 mt-1">{academicProgress.coursesInProgress} courses in progress</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Upcoming Tasks</h3>
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{academicProgress.upcomingAssignments}</p>
                    <p className="text-sm text-gray-600 mt-1">assignments due soon</p>
                  </motion.div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Degree Progress</h3>
                    <span className="text-sm text-gray-600">
                      {Math.round((academicProgress.creditsCompleted / academicProgress.totalCredits) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(academicProgress.creditsCompleted / academicProgress.totalCredits) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>{academicProgress.creditsCompleted} credits earned</span>
                    <span>{academicProgress.totalCredits} total required</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/student/academic-progress')}
                    className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all duration-300 text-center shadow-md hover:shadow-lg"
                  >
                    <BookOpen className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                    <span className="text-xs font-medium text-gray-700">Courses</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/student/career-resources')}
                    className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all duration-300 text-center shadow-md hover:shadow-lg"
                  >
                    <Target className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                    <span className="text-xs font-medium text-gray-700">Career</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/student/mentorship-requests')}
                    className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all duration-300 text-center shadow-md hover:shadow-lg"
                  >
                    <Users className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                    <span className="text-xs font-medium text-gray-700">Mentors</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/student/events')}
                    className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all duration-300 text-center shadow-md hover:shadow-lg"
                  >
                    <Calendar className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                    <span className="text-xs font-medium text-gray-700">Events</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity & Notifications */}
            <div className="space-y-6">
              {/* Connection Requests */}
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-white/70 via-white/60 to-white/50 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/40"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5" /> Connection Requests
                  </h2>
                  <div className="text-sm text-gray-600">
                    Pending: <span className="font-semibold">{pendingReceived.length + pendingSent.length}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {pendingReceived.length === 0 && pendingSent.length === 0 && (
                    <p className="text-sm text-gray-600">No pending connection requests.</p>
                  )}
                  {pendingReceived.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Received</h3>
                      <ul className="space-y-2">
                        {pendingReceived.map((req, idx) => (
                          <motion.li
                            key={req.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm"
                          >
                            <div className="text-sm text-gray-800">{req.requester_email}</div>
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => respondTo(req.requester_email, 'accept')} disabled={connLoading}>Accept</Button>
                              <Button size="sm" variant="destructive" onClick={() => respondTo(req.requester_email, 'reject')} disabled={connLoading}>Decline</Button>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pendingSent.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Sent</h3>
                      <ul className="space-y-2">
                        {pendingSent.map((req, idx) => (
                          <motion.li
                            key={req.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm"
                          >
                            <div className="text-sm text-gray-800">To: {req.target_email}</div>
                            <div className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">Pending</div>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-gradient-to-br from-white/70 via-white/60 to-white/50 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/40"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/50 transition-colors"
                  >
                    <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Assignment Submitted</p>
                      <p className="text-xs text-gray-600">Data Structures Lab - 2 hours ago</p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/50 transition-colors"
                  >
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Mentor Match Found</p>
                      <p className="text-xs text-gray-600">Software Engineering - 1 day ago</p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/50 transition-colors"
                  >
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-sm">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Job Application</p>
                      <p className="text-xs text-gray-600">Google Internship - 3 days ago</p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/50 transition-colors"
                  >
                    <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl shadow-sm">
                      <Calendar className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Event Registered</p>
                      <p className="text-xs text-gray-600">Tech Talk Series - 1 week ago</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Upcoming Events */}
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gradient-to-br from-white/70 via-white/60 to-white/50 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/40"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-3 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-blue-50 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">Career Fair 2024</h3>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">Tomorrow</span>
                    </div>
                    <p className="text-sm text-gray-600">10:00 AM - 4:00 PM</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-3 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-green-50 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">Alumni Meet</h3>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg">This Week</span>
                    </div>
                    <p className="text-sm text-gray-600">Friday, 6:00 PM</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-3 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-purple-50 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">Tech Workshop</h3>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">Next Week</span>
                    </div>
                    <p className="text-sm text-gray-600">Machine Learning Basics</p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </StudentNavigation>
  );
}