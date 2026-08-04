"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import StudentNavigation from '../StudentNavigation/StudentNavigation';
import { Search, Bell, User, BookOpen, Users, Trophy, Calendar, MessageSquare, Target, TrendingUp, Award, Clock, CheckCircle, AlertCircle, Briefcase, GraduationCap, UserPlus, Check, X, Mail, IdCard, Building2, ArrowDown, ArrowUp } from 'lucide-react';
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
  const [activeNotificationIndex, setActiveNotificationIndex] = useState(0);
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

  const timelineItems = useMemo(() => {
    const items: { id: string; type: 'event' | 'job' | 'mentor'; title: string; subtitle: string; date: Date }[] = [];
    
    upcomingEvents.forEach(ev => {
      items.push({
        id: `ev-${ev.id}`,
        type: 'event',
        title: ev.title,
        subtitle: ev.location || (ev.is_virtual ? 'Virtual' : 'In-person'),
        date: ev.event_date ? new Date(ev.event_date) : new Date()
      });
    });

    applications.forEach(app => {
      items.push({
        id: `job-${app.id}`,
        type: 'job',
        title: app.title,
        subtitle: `Applied at ${app.company}`,
        date: new Date(app.updated_at)
      });
    });

    mentorships.forEach(m => {
      items.push({
        id: `mentor-${m.id}`,
        type: 'mentor',
        title: m.status === 'accepted' ? 'Mentor Session' : 'Mentorship Pending',
        subtitle: m.mentor_email,
        date: new Date(m.updated_at)
      });
    });
    
    // Sort descending and take top 3
    let sorted = items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 3);
    
    // Fallback static data if empty so the UI doesn't look broken during development
    if (sorted.length === 0) {
      const today = new Date();
      sorted = [
        { id: 'static-1', type: 'event', title: 'Tech Career Fair', subtitle: 'Main Campus Hall', date: new Date(today.setHours(9, 0, 0, 0)) },
        { id: 'static-2', type: 'mentor', title: 'Mentorship Session', subtitle: 'With Jane Smith', date: new Date(today.setHours(11, 15, 0, 0)) },
        { id: 'static-3', type: 'job', title: 'Frontend Developer', subtitle: 'Google - Remote', date: new Date(today.setHours(14, 30, 0, 0)) }
      ];
    }
    return sorted;
  }, [upcomingEvents, applications, mentorships]);

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
        <div className="min-h-screen relative overflow-hidden bg-[#F5F6FA]">
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
        <div className="min-h-screen relative overflow-hidden bg-[#F5F6FA] p-8">
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
      <div className="p-8 bg-[#F5F6FA] min-h-screen">
        {/* Header Section (Black Rounded) */}
        <div className="bg-[#16161c] rounded-[24px] p-6 mb-8 flex flex-col md:flex-row justify-between items-center shadow-xl">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">Focus on learning, not chasing data.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-80">
              <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white text-sm font-medium rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
              />
            </div>
            <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors relative shrink-0">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#16161c]"></span>
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-700 bg-gray-800 flex items-center justify-center text-white font-bold text-sm">
              {profile?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column (Main Content) - Span 8 */}
          <div className="xl:col-span-8 flex flex-col gap-8">
            
            {/* Profile Card */}
            <div className="bg-[#1A1B23] rounded-[32px] p-8 flex flex-col shadow-2xl relative overflow-hidden border border-white/5">
              {/* Subtle background wave/gradient */}
              <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
              
              <div className="flex flex-col items-center mb-8 relative z-10 mt-4">
                <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center mb-4 bg-transparent">
                  <User className="w-10 h-10 text-white/80" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-3xl text-white mb-3">{profile?.name || 'Student Name'}</h3>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
                  <IdCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300 font-medium">Student ID: {profile?.rollNumber || '1234'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center gap-5 bg-[#17171a] p-5 rounded-2xl border border-white/5">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0 bg-[#1e1e24]">
                    <Mail className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-[0.15em] font-semibold mb-1.5">Email Address</p>
                    <p className="text-[15px] font-medium text-white/90">{profile?.email || 'student@university.edu'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-5 bg-[#17171a] p-5 rounded-2xl border border-white/5">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0 bg-[#1e1e24]">
                      <Building2 className="w-5 h-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase tracking-[0.15em] font-semibold mb-1.5">Department</p>
                      <p className="text-[15px] font-medium text-white/90">{profile?.department || 'Computer Science'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-5 bg-[#17171a] p-5 rounded-2xl border border-white/5">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0 bg-[#1e1e24]">
                      <GraduationCap className="w-5 h-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase tracking-[0.15em] font-semibold mb-1.5">Grad Year</p>
                      <p className="text-[15px] font-medium text-white/90">{profile?.year || '2026'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick-Action */}
            <div>
              <h2 className="font-bold text-lg text-[#16161c] mb-6">Quick-Action</h2>
              <div className="flex items-center justify-between w-full pr-8">
                <div className="flex flex-col items-start gap-2.5 cursor-pointer group">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:shadow-md transition-all">
                    <BookOpen className="w-7 h-7 text-gray-600 group-hover:text-[#16161c]" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-500">View Courses</span>
                </div>
                <div className="flex flex-col items-start gap-2.5 cursor-pointer group">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:shadow-md transition-all">
                    <Users className="w-7 h-7 text-gray-600 group-hover:text-[#16161c]" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-500">Find Mentor</span>
                </div>
                <div className="flex flex-col items-start gap-2.5 cursor-pointer group">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:shadow-md transition-all">
                    <Briefcase className="w-7 h-7 text-gray-600 group-hover:text-[#16161c]" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-500">Apply Job</span>
                </div>
                <div className="flex flex-col items-start gap-2.5 cursor-pointer group">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:shadow-md transition-all">
                    <Target className="w-7 h-7 text-gray-600 group-hover:text-[#16161c]" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-500">Network</span>
                </div>
              </div>
            </div>

            {/* Stats Boxes (Horizontal) */}
            <div className="grid grid-cols-3 gap-6">
              
              {/* Box 1: Active Courses */}
              <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 flex justify-between items-start transition-transform hover:-translate-y-1">
                <div className="flex flex-col">
                  <h3 className="text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em] mb-2">Active Courses</h3>
                  <p className="text-[32px] font-extrabold text-[#11233f] leading-none mb-3">{currentSemesterCourses?.length || 0}</p>
                  <p className="text-[13px] font-bold text-[#16161c]">Currently enrolled</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                  <BookOpen className="w-[22px] h-[22px] text-[#16161c]" strokeWidth={2.5} />
                </div>
              </div>

              {/* Box 2: Connected Mentors */}
              <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 flex justify-between items-start transition-transform hover:-translate-y-1">
                <div className="flex flex-col">
                  <h3 className="text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em] mb-2">Connected Mentors</h3>
                  <p className="text-[32px] font-extrabold text-[#11233f] leading-none mb-3">{acceptedMentors || 0}</p>
                  <p className="text-[13px] font-bold text-[#16161c]">Accepted connections</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Users className="w-[22px] h-[22px] text-[#16161c]" strokeWidth={2.5} />
                </div>
              </div>

              {/* Box 3: Job Applications */}
              <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 flex justify-between items-start transition-transform hover:-translate-y-1">
                <div className="flex flex-col">
                  <h3 className="text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em] mb-2">Job Applications</h3>
                  <p className="text-[32px] font-extrabold text-[#11233f] leading-none mb-3">{applications?.length || 0}</p>
                  <p className="text-[13px] font-bold text-[#16161c]">Pending & Reviewed</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Briefcase className="w-[22px] h-[22px] text-[#16161c]" strokeWidth={2.5} />
                </div>
              </div>

            </div>

          </div>
          
          {/* Right Column (Sidebar) - Span 4 */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            
            {/* Calendar */}
            <div className="mb-2 bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-4xl font-extrabold text-[#16161c] inline-block mr-2">18</h2>
                  <div className="inline-block align-top mt-1">
                    <p className="text-[10px] font-bold text-gray-500 leading-none">Friday</p>
                    <p className="text-xs font-bold text-[#16161c]">December</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#16161c] shadow-sm">&lt;</button>
                  <button className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#16161c] shadow-sm">&gt;</button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 text-center gap-y-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-[11px] font-bold text-[#16161c] mb-2">{day}</div>
                ))}
                
                {/* Dummy Dates */}
                <div className="text-sm font-medium text-gray-300">30</div>
                <div className="text-sm font-medium text-gray-300">31</div>
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(d => (
                  <div key={d} className="text-sm font-medium text-gray-600">{d}</div>
                ))}
                <div className="text-sm font-bold text-white bg-[#16161c] w-7 h-7 flex items-center justify-center rounded-full mx-auto shadow-md">18</div>
                {[19,20,21,22,23,24,25,26].map(d => (
                  <div key={d} className="text-sm font-medium text-gray-600">{d}</div>
                ))}
              </div>
            </div>

            {/* Notifications Stack */}
            <div className="mt-4 mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg text-[#16161c]">Notifications</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveNotificationIndex(prev => Math.max(0, prev - 1))}
                    disabled={activeNotificationIndex === 0}
                    className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:text-[#16161c] shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setActiveNotificationIndex(prev => Math.min(timelineItems.length - 1, prev + 1))}
                    disabled={activeNotificationIndex === timelineItems.length - 1}
                    className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:text-[#16161c] shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative h-[150px] w-full">
                {timelineItems.map((item, index) => {
                  const diff = index - activeNotificationIndex;
                  if (diff < 0 || diff > 2) return null;
                  
                  const isMiddle = diff === 1;
                  const isBottom = diff === 2;
                  
                  let transform = 'translateY(0) scale(1)';
                  let opacity = 1;
                  let zIndex = 30;
                  let bgColor = 'bg-white';
                  
                  if (isMiddle) {
                    transform = 'translateY(22px) scale(0.95)';
                    opacity = 0.95;
                    zIndex = 20;
                    bgColor = 'bg-[#f8f9fc]';
                  } else if (isBottom) {
                    transform = 'translateY(44px) scale(0.9)';
                    opacity = 0.85;
                    zIndex = 10;
                    bgColor = 'bg-[#f0f2f8]';
                  }

                  let hours = item.date.getHours();
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  hours = hours % 12;
                  hours = hours ? hours : 12;
                  const timeStr = diff === 0 && index === 0 ? '4 min ago' : `${hours}:${item.date.getMinutes().toString().padStart(2, '0')} ${ampm}`;

                  let Icon = Bell;
                  let iconBg = 'bg-indigo-50';
                  let iconColor = 'text-indigo-600';
                  let appName = 'Notification';
                  
                  if (item.type === 'event') {
                    Icon = Calendar;
                    iconBg = 'bg-rose-50';
                    iconColor = 'text-rose-600';
                    appName = 'Event';
                  } else if (item.type === 'job') {
                    Icon = Briefcase;
                    iconBg = 'bg-teal-50';
                    iconColor = 'text-teal-600';
                    appName = 'Job Portal';
                  } else if (item.type === 'mentor') {
                    Icon = User;
                    iconBg = 'bg-indigo-50';
                    iconColor = 'text-indigo-600';
                    appName = 'Mentorship';
                  }

                  return (
                    <div 
                      key={item.id} 
                      className={`absolute top-0 left-0 right-0 ${bgColor} rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 transition-all duration-500 ease-out`}
                      style={{ transform, opacity, zIndex, transformOrigin: 'top center' }}
                    >
                       <div className="flex gap-4 items-center">
                         <div className={`w-[60px] h-[60px] shrink-0 rounded-[20px] ${iconBg} flex items-center justify-center`}>
                           <Icon className={`w-8 h-8 ${iconColor}`} strokeWidth={2.5} />
                         </div>
                         
                         <div className="flex-1 min-w-0 pr-2">
                           <div className="flex justify-between items-start mb-0.5">
                             <h4 className="font-bold text-gray-900 text-[16px]">{appName}</h4>
                             <span className="text-[11px] font-medium text-gray-400 pt-1">{timeStr}</span>
                           </div>
                           <h3 className="font-semibold text-gray-800 text-[14px] leading-tight mb-0.5 truncate">{item.title}</h3>
                           <p className="text-[12px] text-gray-500 line-clamp-1">{item.subtitle}</p>
                         </div>
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </StudentNavigation>
  );
}
