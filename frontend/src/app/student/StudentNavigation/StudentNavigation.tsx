"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, User, Users, Building, MessageSquare, Trophy, Settings, Heart, Calendar, Map, Camera, FileText, BarChart3, Bell, BookOpen, Briefcase, Target, Award, AlertTriangle } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

// Interfaces
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  badge?: string;
}

interface StudentData {
  name: string;
  year: string;
  department: string;
  rollNumber: string;
  avatar: string | null;
  verified: boolean;
}

interface StudentNavigationProps {
  children: React.ReactNode;
}

export default function StudentNavigation({ children }: StudentNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const { user } = useUser();
  const [messageUnread, setMessageUnread] = useState<number>(0);
  const [jobNewBadge, setJobNewBadge] = useState<number>(0);
  const prevJobIdsRef = React.useRef<Set<number>>(new Set());
  const [imgError, setImgError] = useState<boolean>(false);

  // API root
  const API_ROOT = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '') + '/api';

  const [studentData, setStudentData] = useState<StudentData>({
    name: 'Student',
    year: '',
    department: '',
    rollNumber: '',
    avatar: (user?.picture as string) || null,
    verified: true
  });
  const [profileLoaded, setProfileLoaded] = useState(false);

  const profileFetched = useRef(false);

  // Re-fetch profile on every page navigation (pathname change) so that
  // saving on the profile page is reflected immediately in the sidebar
  useEffect(() => {
    profileFetched.current = false;
  }, [pathname]);

  useEffect(() => {
    if (profileFetched.current) return;
    profileFetched.current = true;
    fetch('/api/user/profile', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const u = data?.user;
        if (!u) return;
        const dbName = u.name && !String(u.name).includes('@') ? u.name : '';
        const rawAvatar = u.picture || (user?.picture as string) || null;
        // Filter out gravatar URLs — browsers block them via tracking prevention
        const safeAvatar = rawAvatar && !rawAvatar.includes('gravatar.com') ? rawAvatar : null;
        setStudentData({
          name: dbName || 'Student',
          year: u.year_of_study || '',
          department: u.department || u.major || '',
          rollNumber: u.roll_number || '',
          avatar: safeAvatar,
          verified: !!u.registration_completed,
        });
        setImgError(false); // reset on fresh fetch
      })
      .catch(() => { })
      .finally(() => setProfileLoaded(true));
  }, [pathname]);

  const navigationItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" />, route: "/student/dashboard" },
    { id: "academic", label: "Academic Progress", icon: <BookOpen className="w-5 h-5" />, route: "/student/academic-progress" },
    { id: "alumni", label: "Alumni Directory", icon: <Users className="w-5 h-5" />, route: "/student/alumni-directory" },
    { id: "mentorship", label: "Find Mentors", icon: <User className="w-5 h-5" />, route: "/student/mentorship-requests" },
    { id: "resume-review", label: "Resume Reviews", icon: <FileText className="w-5 h-5" />, route: "/student/resume-review" },
    { id: "career", label: "Career Resources", icon: <Target className="w-5 h-5" />, route: "/student/career-resources" },
    { id: "jobs", label: "Job Opportunities", icon: <Briefcase className="w-5 h-5" />, route: "/student/job-opportunities" },
    { id: "events", label: "Events", icon: <Calendar className="w-5 h-5" />, route: "/student/events" },
    { id: "messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, route: "/student/messages" },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/student/settings" },
  ];

  const isActiveRoute = (route: string): boolean => {
    return pathname === route;
  };

  // Poll threads for unread count
  useEffect(() => {
    let timer: any;
    const load = async () => {
      try {
        const email = String(user?.email || '');
        if (!email) return;
        const resp = await fetch(`${API_ROOT}/messages/threads?user=${encodeURIComponent(email)}`);
        const isJson = resp.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await resp.json() : await resp.text();
        if (!resp.ok || !isJson) return;
        const threads = (data.threads || []) as Array<{ unread: number }>;
        const total = threads.reduce((sum, t) => sum + Number(t.unread || 0), 0);
        setMessageUnread(total);
      } catch {
        // silent
      }
    };
    load();
    timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [API_ROOT, user?.email]);

  // Poll jobs for new postings count
  useEffect(() => {
    let timer: any;
    const load = async () => {
      try {
        const resp = await fetch(`${API_ROOT}/jobs`);
        const isJson = resp.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await resp.json() : await resp.text();
        if (!resp.ok || !isJson) return;
        const jobs = (data.jobs || []) as Array<{ id: number }>;
        const latestIds = new Set<number>(jobs.map(j => Number(j.id)));
        const prevIds = prevJobIdsRef.current;
        let newCount = 0;
        latestIds.forEach(id => { if (!prevIds.has(id)) newCount++; });
        // Do not count as new on first load; initialize snapshot
        if (prevIds.size === 0) {
          prevJobIdsRef.current = latestIds;
          setJobNewBadge(0);
        } else {
          setJobNewBadge(newCount);
          prevJobIdsRef.current = latestIds;
        }
      } catch {
        // silent
      }
    };
    load();
    timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [API_ROOT]);

  // Clear job badge when on jobs route
  useEffect(() => {
    if (isActiveRoute('/student/job-opportunities')) {
      setJobNewBadge(0);
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-white shadow-lg border-r border-gray-200">
        {/* Scrollable Container for entire sidebar */}
        <div className="h-full overflow-y-auto">
          {/* Logo & Branding */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-500">VPPCOE & VA, Mumbai</p>
              </div>
            </div>
          </div>

          {/* Student Profile Summary */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center overflow-hidden">
                  {studentData.avatar && !imgError ? (
                    <img
                      src={studentData.avatar}
                      alt={studentData.name}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span className="text-white font-semibold text-lg">
                      {studentData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S'}
                    </span>
                  )}
                </div>
                {studentData.verified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {studentData.name}
                </h3>
                {profileLoaded && studentData.name === 'Student' && (
                  <button
                    onClick={() => router.push('/student/settings')}
                    className="text-xs text-amber-600 hover:text-amber-700 underline"
                  >
                    ⚠ Set your name in Settings
                  </button>
                )}
                {studentData.name !== 'Student' && (
                  <>
                    <p className="text-sm text-gray-600">{studentData.year}</p>
                    <p className="text-xs text-gray-500">{studentData.department}</p>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <BookOpen className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-xs font-medium text-green-700">Study</span>
              </button>
              <button className="flex items-center justify-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Users className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-xs font-medium text-blue-700">Connect</span>
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.route}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isActiveRoute(item.route)
                      ? 'bg-green-100 text-green-900 border-l-4 border-green-500'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`${isActiveRoute(item.route) ? 'text-green-600' : 'text-gray-500'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {(item.id === 'messages' ? messageUnread : item.id === 'jobs' ? jobNewBadge : (item.badge ? Number(item.badge) : 0)) > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {item.id === 'messages' ? messageUnread : item.id === 'jobs' ? jobNewBadge : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 mt-auto">
            <div className="space-y-2">
              {/* <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center space-x-3 w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="font-medium">Notifications</span>
              </button> */}

              <Link
                href="/api/auth/logout"
                className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
              >
                <span className="text-gray-500">🚪</span>
                <span className="font-medium">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 min-h-screen">
        {/* Incomplete Profile Alert — hidden on the profile page itself */}
        {
          (() => {
            const profileIncomplete =
              studentData.name === 'Student' ||
              !studentData.department ||
              !studentData.year;
            if (!profileLoaded || !profileIncomplete || pathname === '/student/settings') return null;
            const missing = [
              studentData.name === 'Student' && 'Full name',
              !studentData.department && 'Department',
              !studentData.year && 'Year of study',
            ].filter(Boolean).join(', ');
            return (
              <div className="mx-4 mt-4 flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl shadow-sm">
                <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">Your profile is incomplete</p>
                  <p className="text-amber-800 mt-0.5">
                    Missing: <span className="font-medium">{missing}</span>
                  </p>
                  <button
                    onClick={() => router.push('/student/settings')}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Complete your profile →
                  </button>
                </div>
              </div>
            );
          })()
        }

        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>
      </main >

    </div >
  );
}