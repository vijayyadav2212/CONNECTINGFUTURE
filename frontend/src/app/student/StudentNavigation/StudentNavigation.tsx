"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Users, Building, MessageSquare, Trophy, Settings, Heart, Calendar, Map, Camera, FileText, BarChart3, Bell, BookOpen, Briefcase, Target, Award, AlertTriangle, X, LayoutGrid, Zap, LogOut } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    { id: "dashboard", label: "Dashboard", icon: <LayoutGrid className="w-5 h-5" />, route: "/student/dashboard" },
    { id: "network", label: "Network", icon: <Users className="w-5 h-5" />, route: "/student/alumni-directory" },
    { id: "mentorship", label: "Mentorship", icon: <Zap className="w-5 h-5" />, route: "/student/mentorship-requests" },
    { id: "resume-review", label: "Resume Reviews", icon: <FileText className="w-5 h-5" />, route: "/student/resume-review" },
    { id: "jobs", label: "Jobs & Internship", icon: <Building className="w-5 h-5" />, route: "/student/job-opportunities" },
    { id: "events", label: "Events", icon: <Calendar className="w-5 h-5" />, route: "/student/events" },
    { id: "roadmaps", label: "Roadmaps", icon: <Map className="w-5 h-5" />, route: "/student/career-resources" },
    { id: "memories", label: "Memories", icon: <Camera className="w-5 h-5" />, route: "/student/academic-progress" },
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f6f3eb] overflow-x-hidden font-sans">
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-teal-950 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/student/dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm shrink-0 overflow-hidden">
            <img src="/NEWCNLOGO.png" alt="Alumnex Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-base font-bold text-white">Alumnex</h1>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-white hover:bg-white/10 rounded-lg"
        >
          <BookOpen className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sidebar (Desktop) */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 w-[260px] h-screen bg-teal-950 flex-col justify-between rounded-r-[32px] py-8">
        <div className="flex flex-col w-full">
          {/* Logo */}
          <div className="px-8 mb-10 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/student/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-md shrink-0 overflow-hidden">
              <img src="/NEWCNLOGO.png" alt="Alumnex Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-white leading-none">Alumnex</h1>
              <span className="text-[10px] text-teal-200/80 font-medium tracking-wide mt-1">Connecting Future</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="w-full">
            <ul className="space-y-3 w-full relative">
              {navigationItems.map((item) => {
                const active = isActiveRoute(item.route);
                return (
                  <li key={item.id} className="relative w-full">
                    <Link href={item.route} prefetch={true}
                      className={`flex items-center w-full px-10 py-2.5 transition-all duration-200 ${
                        active ? 'text-white font-bold' : 'text-[#8c8d93] hover:text-white font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-5 w-full">
                        <span className={`flex items-center justify-center w-5 h-5 ${active ? 'text-white' : 'text-[#8c8d93]'}`}>
                          {item.icon}
                        </span>
                        <span className="text-[15px]">
                          {item.label}
                        </span>
                      </div>
                    </Link>
                    {/* Active Indicator Line on the right edge */}
                    {active && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white rounded-l-full shadow-[0_0_12px_rgba(255,255,255,0.6)]"></div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        
        {/* Bottom Actions */}
        <div className="flex flex-col gap-2 mt-8 w-full relative">
          <Link
            href="/student/settings"
            className="flex items-center gap-5 px-10 py-2 text-[#8c8d93] hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[15px] font-medium">Settings</span>
          </Link>
          <Link
            href="/student/support"
            className="flex items-center gap-5 px-10 py-2 text-[#8c8d93] hover:text-white transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[15px] font-medium">Support</span>
          </Link>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-5 px-10 py-2 text-[#8c8d93] hover:text-white transition-colors mb-8"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[15px] font-medium">Log Out</span>
          </a>

          {/* Profile Avatar */}
          <div className="px-10 flex items-center">
            <div className="w-10 h-10 rounded-full border border-gray-600 bg-teal-950 flex items-center justify-center overflow-hidden shadow-lg relative">
              {studentData.avatar && !imgError ? (
                <img
                  src={studentData.avatar}
                  alt={studentData.name}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-white font-bold text-[15px] z-10">
                  {studentData.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Modal */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-teal-950/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-teal-950 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col w-full">
              <div className="px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setIsMobileMenuOpen(false); router.push('/student/dashboard'); }}>
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm shrink-0 overflow-hidden">
                    <img src="/NEWCNLOGO.png" alt="Alumnex Logo" className="w-full h-full object-contain" />
                  </div>
                  <h1 className="text-[20px] font-bold text-white tracking-wide">Alumnex</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-6 mb-8 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
                  {studentData.avatar && !imgError ? (
                    <img
                      src={studentData.avatar}
                      alt={studentData.name}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                      {studentData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-white truncate">
                    {studentData.name}
                  </h3>
                  <p className="text-[12px] text-[#8c8d93]">Student</p>
                </div>
              </div>

              <nav className="px-4">
                <ul className="space-y-1">
                  {navigationItems.map((item) => {
                    const active = isActiveRoute(item.route);
                    return (
                      <li key={item.id}>
                        <Link href={item.route} prefetch={true}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 ${
                            active
                              ? 'text-white'
                              : 'text-[#8c8d93] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`flex items-center justify-center w-6 h-6 ${active ? 'text-white' : 'text-[#8c8d93]'}`}>
                              {item.icon}
                            </span>
                            <span className={`text-[15px] ${active ? 'font-semibold' : 'font-medium'}`}>
                              {item.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {(item.id === 'messages' ? messageUnread : item.id === 'jobs' ? jobNewBadge : (item.badge ? Number(item.badge) : 0)) > 0 && (
                              <span className="bg-white text-[#16161c] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {item.id === 'messages' ? messageUnread : item.id === 'jobs' ? jobNewBadge : item.badge}
                              </span>
                            )}
                            {active && (
                              <div className="w-1 h-5 bg-white rounded-full"></div>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
            
            <div className="p-4 mb-4">
              <Link
                href="/student/settings"
                className="flex items-center gap-4 px-8 py-3 text-[#8c8d93] hover:text-white transition-colors rounded-2xl"
              >
                <Settings className="w-5 h-5" />
                <span className="text-[15px] font-medium">Settings</span>
              </Link>
              <Link
                href="/student/support"
                className="flex items-center gap-4 px-8 py-3 text-[#8c8d93] hover:text-white transition-colors rounded-2xl"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-[15px] font-medium">Support</span>
              </Link>
              <a
                href="/api/auth/logout"
                className="flex items-center gap-4 px-8 py-3 text-[#8c8d93] hover:text-white transition-colors rounded-2xl"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-[15px] font-medium">Log Out</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="lg:ml-[260px] min-h-screen">
        {/* Incomplete Profile Alert */}
        {(() => {
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
            <div className="mx-8 mt-6 flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl shadow-sm">
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
        })()}

        {/* Page Content */}
        <div className="flex-1 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}