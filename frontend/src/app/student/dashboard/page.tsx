"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import StudentNavigation from '../StudentNavigation/StudentNavigation';
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
  auth0Id: string;
  email: string;
}

interface AcademicSemester {
  id: string;
  semester_key: string;
  name: string;
  gpa: number | null;
  total_credits: number;
  is_current: boolean;
  courses?: AcademicCourse[];
}

interface AcademicCourse {
  id: string;
  name: string;
  code: string;
  credits: number;
  backlog_count: number;
  grade: string;
  progress: number;
  status: string;
}

interface JobApplication {
  id: number;
  job_id: number;
  applicant_email: string;
  status: string;
  title: string;
  company: string;
  updated_at: string;
}

interface MentorshipRequest {
  id: number;
  student_email: string;
  mentor_email: string;
  status: string;
  updated_at: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string;
  location: string;
  is_virtual: boolean;
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return 'This Week';
  if (diffDays <= 14) return 'Next Week';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getEventDateColor(dateStr: string | null): string {
  if (!dateStr) return 'text-gray-600 bg-gray-100';
  const diffDays = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diffDays <= 1) return 'text-red-600 bg-red-100';
  if (diffDays <= 7) return 'text-blue-600 bg-blue-100';
  return 'text-green-600 bg-green-100';
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
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [mentorships, setMentorships] = useState<MentorshipRequest[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [connections, setConnections] = useState<Array<{ id: number; pair_key: string; requester_email: string; target_email: string; status: 'pending' | 'accepted' | 'rejected' | 'removed' }>>([]);
  const [connLoading, setConnLoading] = useState(false);
  const API_BASE = useMemo(() => ((process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '') + '/api'), []);
  const myEmail = (authUser?.email as string) || '';

  // ── Derived academic stats ──────────────────────────────────────────────
  const currentSemester = useMemo(() => semesters.find(s => s.is_current) || semesters[0] || null, [semesters]);
  const currentSemesterCourses = useMemo(() => currentSemester?.courses || [], [currentSemester]);
  const currentSemesterGpa = useMemo(() => currentSemester?.gpa ?? profile?.gpa ?? 0, [currentSemester, profile?.gpa]);
  const currentSemesterAverageMarks = useMemo(() => {
    if (!currentSemesterCourses.length) return 0;
    const totalMarks = currentSemesterCourses.reduce((sum, course) => sum + (Number(course.progress) || 0), 0);
    return Math.round(totalMarks / currentSemesterCourses.length);
  }, [currentSemesterCourses]);
  const currentSemesterBacklogs = useMemo(
    () => currentSemesterCourses.reduce((sum, course) => {
      const explicitBacklogs = Math.max(0, Number(course.backlog_count || 0));
      if (explicitBacklogs > 0) return sum + explicitBacklogs;
      return ['F', 'RA', 'BACKLOG'].includes(String(course.grade || '').toUpperCase()) ? sum + 1 : sum;
    }, 0),
    [currentSemesterCourses]
  );
  const activeApplications = useMemo(() => applications.filter(a => ['applied', 'screening', 'interview', 'offer'].includes(String(a.status || '').toLowerCase())).length, [applications]);
  const acceptedMentors = useMemo(() => mentorships.filter(m => m.status === 'accepted').length, [mentorships]);
  const recentActivity = useMemo(() => {
    const items: { type: string; title: string; subtitle: string; timestamp: Date }[] = [];
    applications.slice(0, 2).forEach(app => items.push({ type: 'job', title: 'Job Application', subtitle: `${app.title} at ${app.company}`, timestamp: new Date(app.updated_at) }));
    mentorships.slice(0, 1).forEach(m => items.push({ type: 'mentor', title: m.status === 'accepted' ? 'Mentor Connected' : 'Mentorship Request', subtitle: m.mentor_email, timestamp: new Date(m.updated_at) }));
    connections.filter(c => c.status === 'accepted').slice(0, 1).forEach(c => items.push({ type: 'connection', title: 'New Connection', subtitle: c.requester_email === myEmail ? c.target_email : c.requester_email, timestamp: new Date() }));
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4);
  }, [applications, mentorships, connections, myEmail]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch('/api/user/profile', { cache: 'no-store' });
        if (!resp.ok) {
          // Not authenticated or backend down — fall back to auth user name
          setProfile({
            name: authUser?.name || 'Student',
            year: '', department: '', rollNumber: '', gpa: 0,
            auth0Id: '', email: myEmail,
          });
          return;
        }
        const data = await resp.json();
        const u = data?.user || {};

        // If registration not yet completed, redirect to student registration
        if (u.registration_completed === false || !u.registration_completed) {
          router.push('/student-registration');
          return;
        }

        setProfile({
          name: u.name || authUser?.name || 'Student',
          year: u.year_of_study || '',
          department: u.department || u.major || '',
          rollNumber: u.roll_number || '',
          gpa: u.cgpa ? parseFloat(u.cgpa) : 0,
          auth0Id: u.auth0_id || '',
          email: u.email || myEmail,
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authUser, router, myEmail]);

  // ── Academic semesters ────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.auth0Id) return;

    let cancelled = false;

    const loadAcademicData = async () => {
      try {
        const semestersResp = await fetch(`${API_BASE}/academic/semesters?auth0_id=${encodeURIComponent(profile.auth0Id)}`, { cache: 'no-store' });
        if (!semestersResp.ok) return;

        const semestersData = await semestersResp.json();
        const mappedSemesters: AcademicSemester[] = Array.isArray(semestersData?.semesters)
          ? semestersData.semesters.map((semester: any) => ({
              id: semester.id || semester.semester_key || String(Math.random()),
              semester_key: semester.semester_key || (semester.id ? String(semester.id) : ''),
              name: semester.name || semester.semester_key || '',
              gpa: semester.gpa != null ? Number(semester.gpa) : null,
              total_credits: semester.total_credits != null ? Number(semester.total_credits) : 0,
              is_current: !!semester.is_current,
              courses: [],
            }))
          : [];

        if (cancelled) return;
        setSemesters(mappedSemesters);

        const semesterKeys = mappedSemesters.map(semester => semester.semester_key).filter(Boolean);
        if (!semesterKeys.length) return;

        const courseResults = await Promise.all(
          semesterKeys.map(async semesterKey => {
            const coursesResp = await fetch(`${API_BASE}/academic/courses?auth0_id=${encodeURIComponent(profile.auth0Id)}&semester_key=${encodeURIComponent(semesterKey)}`, { cache: 'no-store' });
            if (!coursesResp.ok) return { semesterKey, courses: [] as AcademicCourse[] };

            const coursesData = await coursesResp.json();
            return {
              semesterKey,
              courses: Array.isArray(coursesData?.courses)
                ? coursesData.courses.map((course: any) => ({
                    id: String(course.id),
                    name: course.name,
                    code: course.code,
                    credits: Number(course.credits || 0),
                    backlog_count: Number(course.backlog_count || 0),
                    grade: course.grade || '-',
                    progress: Number(course.progress || 0),
                    status: course.status || 'upcoming',
                  }))
                : [],
            };
          })
        );

        if (!cancelled) {
          setSemesters(prev => prev.map(semester => {
            const match = courseResults.find(result => result.semesterKey === semester.semester_key);
            return match ? { ...semester, courses: match.courses } : semester;
          }));
        }
      } catch {
        // Keep dashboard resilient if academic data is unavailable.
      }
    };

    loadAcademicData();
    const intervalId = window.setInterval(loadAcademicData, 30000);
    const handleFocus = () => { loadAcademicData(); };
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [API_BASE, profile?.auth0Id]);

  // ── Job applications ────────────────────────────────────────────────────
  useEffect(() => {
    const email = profile?.email || myEmail;
    if (!email) return;
    fetch(`${API_BASE}/applications?applicant_email=${encodeURIComponent(email)}&limit=10`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.applications) setApplications(data.applications); })
      .catch(() => { });
  }, [API_BASE, profile?.email, myEmail]);

  // ── Mentorship requests ─────────────────────────────────────────────────
  useEffect(() => {
    const email = profile?.email || myEmail;
    if (!email) return;
    fetch(`${API_BASE}/mentorship/requests?student_email=${encodeURIComponent(email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.requests) setMentorships(data.requests); })
      .catch(() => { });
  }, [API_BASE, profile?.email, myEmail]);

  // ── Upcoming events ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/events`)
      .then(r => r.ok ? r.json() : null)
      .then((data: UpcomingEvent[] | null) => {
        if (Array.isArray(data)) {
          const now = new Date();
          const future = data
            .filter(ev => !ev.event_date || new Date(ev.event_date) >= now)
            .sort((a, b) => !a.event_date ? 1 : !b.event_date ? -1 : new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
            .slice(0, 3);
          setUpcomingEvents(future);
        }
      })
      .catch(() => { });
  }, [API_BASE]);

  // ── Connections (real-time polling) ─────────────────────────────────────
  useEffect(() => {
    const email = profile?.email || myEmail;
    if (!email) return;
    let mounted = true;
    const loadConns = async () => {
      try {
        setConnLoading(true);
        const resp = await fetch(`${API_BASE}/connections?user_email=${encodeURIComponent(email)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (mounted) setConnections(data.connections || []);
        }
      } finally { if (mounted) setConnLoading(false); }
    };
    loadConns();
    const id = setInterval(loadConns, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, [API_BASE, profile?.email, myEmail]);

  const pendingReceived = useMemo(() => { const em = (profile?.email || myEmail).toLowerCase(); return connections.filter(c => c.status === 'pending' && c.target_email?.toLowerCase() === em); }, [connections, profile?.email, myEmail]);
  const pendingSent = useMemo(() => { const em = (profile?.email || myEmail).toLowerCase(); return connections.filter(c => c.status === 'pending' && c.requester_email?.toLowerCase() === em); }, [connections, profile?.email, myEmail]);
  const acceptedCount = useMemo(() => connections.filter(c => c.status === 'accepted').length, [connections]);

  async function respondTo(otherEmail: string, action: 'accept' | 'reject') {
    try {
      setConnLoading(true);
      const resp = await fetch(`${API_BASE}/connections/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: profile?.email || myEmail, other_email: otherEmail, action }) });
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
                  {/* <motion.button
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
                  </motion.button> */}
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
                    {currentSemester?.name || 'No semester selected'}
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    {currentSemesterGpa ? `${Number(currentSemesterGpa).toFixed(2)} CGPA` : 'No data yet'}
                  </p>
                  <p className={`text-xs mt-1 ${currentSemesterBacklogs > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {currentSemesterBacklogs > 0 ? `${currentSemesterBacklogs} backlog${currentSemesterBacklogs !== 1 ? 's' : ''}` : 'No backlogs'}
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{acceptedMentors}</p>
                  <p className="text-blue-600 text-sm mt-1">{mentorships.length > 0 ? `${mentorships.length} request${mentorships.length !== 1 ? 's' : ''}` : 'Connected'}</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{activeApplications}</p>
                  <p className="text-purple-600 text-sm mt-1">{applications.length > 0 ? `${applications.length} total applied` : 'In Progress'}</p>
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
                  <button className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors" onClick={() => router.push('/student/academic-progress')}>
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
                    <p className="text-2xl font-bold text-green-600">{currentSemester?.name || 'Not Set'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentSemesterCourses.length > 0
                        ? `${currentSemesterCourses.length} subjects updated from Academic Progress`
                        : 'Add subjects in Academic Progress'}
                    </p>
                    <p className={`text-xs mt-1 ${currentSemesterBacklogs > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {currentSemesterBacklogs > 0 ? `${currentSemesterBacklogs} backlog${currentSemesterBacklogs !== 1 ? 's' : ''} in this semester` : 'No backlogs in this semester'}
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Job Applications</h3>
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
                    <p className="text-sm text-gray-600 mt-1">{activeApplications} active, {applications.filter(a => a.status === 'withdrawn').length} withdrawn</p>
                  </motion.div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Semester Marks</h3>
                    <span className="text-sm text-gray-600">
                      {currentSemesterCourses.length > 0
                        ? `${currentSemesterCourses.length} subjects, ${currentSemesterAverageMarks}% average`
                        : 'No subject marks yet'}
                    </span>
                  </div>
                  {currentSemesterCourses.length > 0 ? (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, currentSemesterAverageMarks)}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{currentSemesterAverageMarks}% average</span>
                        <span>{currentSemesterCourses.length} subjects tracked</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">Add subjects in Academic Progress to track semester marks here</p>
                  )}
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
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity yet. Apply to jobs or connect with mentors!</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((item, idx) => (
                      <motion.div key={idx} whileHover={{ x: 5 }} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/50 transition-colors">
                        <div className={`p-2 rounded-xl shadow-sm ${item.type === 'job' ? 'bg-gradient-to-br from-purple-100 to-purple-200'
                            : item.type === 'mentor' ? 'bg-gradient-to-br from-blue-100 to-blue-200'
                              : 'bg-gradient-to-br from-green-100 to-green-200'
                          }`}>
                          {item.type === 'job' && <Briefcase className="w-4 h-4 text-purple-600" />}
                          {item.type === 'mentor' && <Users className="w-4 h-4 text-blue-600" />}
                          {item.type === 'connection' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-600 truncate">{item.subtitle}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {item.timestamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Upcoming Events */}
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gradient-to-br from-white/70 via-white/60 to-white/50 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/40"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium" onClick={() => router.push('/student/events')}>View all →</button>
                </div>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming events. Check back soon!</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event, idx) => (
                      <motion.div
                        key={event.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 border border-gray-200 rounded-xl shadow-sm bg-gradient-to-br ${idx === 0 ? 'from-white to-blue-50' : idx === 1 ? 'from-white to-green-50' : 'from-white to-purple-50'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 text-sm truncate pr-2">{event.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-lg whitespace-nowrap ${getEventDateColor(event.event_date)}`}>
                            {formatEventDate(event.event_date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {event.event_time || (event.event_date ? new Date(event.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Time TBD')}
                          {event.is_virtual ? ' · Online' : (event.location ? ` · ${event.location}` : '')}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </StudentNavigation>
  );
}