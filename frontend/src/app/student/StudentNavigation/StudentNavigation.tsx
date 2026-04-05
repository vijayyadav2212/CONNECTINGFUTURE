"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Users, Building, MessageSquare, Trophy, Settings, Heart, Calendar, Map, Camera, FileText, BarChart3, Bell, BookOpen, Briefcase, Target, Award, AlertTriangle } from 'lucide-react';
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
      <aside className="fixed left-0 top-0 z-40 w-[300px] h-screen bg-[#f4f5f7] shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] border-r border-[#e6e9ef]">
        <div className="h-full flex flex-col">
          {/* Logo & Branding */}
          <div className="px-6 py-5 bg-white border-b border-[#eaecf0]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg border border-[#e5e7eb] bg-white flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                <img
                  src="/NEWCNLOGO.png"
                  className="w-8 h-8 object-contain"
                  alt="Connecting Future Logo"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://ui-avatars.com/api/?name=CF&background=0284c7&color=fff';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Connecting Future</h1>
                <p className="text-sm text-gray-500 font-medium mt-0.5">VPPCOE & VA</p>
              </div>
            </div>
          </div>

          {/* Student Profile Summary */}
          <div className="px-4 py-5 bg-white border-b border-[#eaecf0]">
            <div className="rounded-[14px] border border-[#d8e0ea] bg-[#f6f8fb] p-4 shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
              <div className="flex items-start gap-3.5">
                <div className="relative">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
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
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-[10px]">✓</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[16px] text-gray-900 truncate">
                    {studentData.name}
                  </h3>

                  {profileLoaded && studentData.name === 'Student' && (
                    <button
                      onClick={() => router.push('/student/settings')}
                      className="text-xs text-amber-600 hover:text-amber-700 underline mt-0.5"
                    >
                      ⚠ Set your name in Settings
                    </button>
                  )}

                  {studentData.name !== 'Student' && (
                    <>
                      <p className="text-sm text-gray-600 mt-0.5 truncate">{studentData.department || 'Department not set'}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {studentData.year || 'Year not set'}
                        {studentData.rollNumber ? ` • ${studentData.rollNumber}` : ''}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3.5 flex justify-center">
                <span className="text-[12px] bg-[#e9efff] text-[#2563eb] px-3.5 py-1.5 rounded-full font-semibold inline-block">
                  Verified Student
                </span>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-50 rounded-[10px] border border-green-100 hover:bg-green-100 transition-colors">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">Study</span>
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 rounded-[10px] border border-blue-100 hover:bg-blue-100 transition-colors">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">Connect</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto px-4 py-5">
            <ul className="space-y-2.5">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.route}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-200 ${isActiveRoute(item.route)
                      ? 'bg-[#e8f5ee] text-[#14532d] border-[#b7e4c7] shadow-[0_1px_3px_rgba(22,101,52,0.12)]'
                      : 'text-gray-700 border-transparent hover:bg-white hover:border-[#e5e7eb] hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={`h-6 w-1.5 rounded-full ${isActiveRoute(item.route) ? 'bg-green-500' : 'bg-transparent'}`} />
                      <span className={`${isActiveRoute(item.route) ? 'text-green-700' : 'text-gray-500'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium text-[15px] truncate">{item.label}</span>
                    </div>
                    {(item.id === 'messages' ? messageUnread : item.id === 'jobs' ? jobNewBadge : (item.badge ? Number(item.badge) : 0)) > 0 && (
                      <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-full min-w-[22px] text-center">
                        {item.id === 'messages' ? messageUnread : item.id === 'jobs' ? jobNewBadge : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="px-4 py-4 border-t border-[#e6e9ef] bg-white">
            <div className="pt-1">
              <Link
                href="/api/auth/logout"
                className="flex items-center gap-3.5 px-4 py-3.5 text-gray-700 border border-transparent hover:bg-red-50 hover:text-red-700 hover:border-red-100 rounded-xl transition-all duration-200"
              >
                <span className="text-gray-500">🚪</span>
                <span className="font-medium text-[15px]">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[300px] min-h-screen">
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