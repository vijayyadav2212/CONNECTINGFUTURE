"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Building2, MessageSquare,
  Trophy, Settings, Heart, Calendar, Map, Camera,
  Zap, Clock, XCircle, LayoutDashboard, LogOut, FileText, TrendingUp, Menu, X
} from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  badge?: number | string;
}

interface AlumniNavigationProps {
  children: React.ReactNode;
}

export default function AlumniNavigation({ children }: AlumniNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  const [messageUnread, setMessageUnread] = useState<number>(0);
  const [jobNewBadge, setJobNewBadge] = useState<number>(0);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const prevJobIdsRef = useRef<Set<number>>(new Set());

  const API_ROOT = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '') + '/api';

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const resp = await fetch('/api/user/profile', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          setApprovalStatus(data?.user?.approval_status || 'pending');
          setProfile(data?.user || null);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    if (user) loadProfile();
  }, [user]);

  useEffect(() => {
    if (approvalStatus !== 'approved' || !user?.email) return;
    const poll = async () => {
      try {
        const msgResp = await fetch(`${API_ROOT}/messages/threads?user=${encodeURIComponent(user.email!)}`);
        if (msgResp.ok) {
          const data = await msgResp.json();
          const total = (data.threads || []).reduce((sum: number, t: any) => sum + Number(t.unread || 0), 0);
          setMessageUnread(total);
        }
        const jobResp = await fetch(`${API_ROOT}/jobs`);
        if (jobResp.ok) {
          const data = await jobResp.json();
          const jobs = data.jobs || [];
          if (prevJobIdsRef.current.size > 0) {
            const newOnes = jobs.filter((j: any) => !prevJobIdsRef.current.has(j.id)).length;
            setJobNewBadge(newOnes);
          }
          prevJobIdsRef.current = new Set(jobs.map((j: any) => j.id));
        }
      } catch (e) { }
    };
    poll();
    const timer = setInterval(poll, 60000);
    return () => clearInterval(timer);
  }, [approvalStatus, user?.email, API_ROOT]);

  useEffect(() => {
    if (pathname === '/alumni/job-posting') {
      setJobNewBadge(0);
    }
  }, [pathname]);

  const alumniData = {
    name: profileLoading ? 'Loading...' : (profile?.name || user?.name || 'Vijay Yadav'),
    graduationYear: profileLoading ? '' : String(profile?.graduation_year || profile?.graduationYear || '2023'),
    company: profileLoading ? 'Loading...' : (profile?.company || profile?.current_company || 'Amazon'),
    position: profileLoading ? 'Loading...' : (profile?.job_title || profile?.position || profile?.current_job || 'SDE'),
    avatar: profileLoading ? null : (profile?.picture || user?.picture || null),
    verifiedBadge: approvalStatus === 'approved'
  };

  const navigationItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} />, route: "/alumni/dashboard" },
    { id: "network", label: "Network", icon: <Users size={20} />, route: "/alumni/network" },
    { id: "mentorship", label: "Mentorship", icon: <Zap size={20} />, route: "/alumni/mentorship" },
    { id: "resume-reviews", label: "Resume Reviews", icon: <FileText size={20} />, route: "/alumni/resume-reviews" },
    { id: "jobs", label: "Jobs & Internship", icon: <Building2 size={20} />, route: "/alumni/job-posting", badge: jobNewBadge > 0 ? jobNewBadge : undefined },
    { id: "events", label: "Events", icon: <Calendar size={20} />, route: "/alumni/events" },
    { id: "roadmaps", label: "Roadmaps", icon: <Map size={20} />, route: "/alumni/roadmap" },
    { id: "memories", label: "Memories", icon: <Camera size={20} />, route: "/alumni/memories" },
    { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={20} />, route: "/alumni/leaderboard" },
    { id: "earnings", label: "Earnings", icon: <TrendingUp size={20} />, route: "/alumni/earnings" },
    { id: "messages", label: "Messages", icon: <MessageSquare size={20} />, route: "/alumni/messages", badge: messageUnread > 0 ? messageUnread : undefined },
    { id: "donations", label: "Donations", icon: <Heart size={20} />, route: "/alumni/donation" },
    { id: "settings", label: "Settings", icon: <Settings size={20} />, route: "/alumni/settings" },
  ];

  const isActiveRoute = (route: string): boolean => {
    return pathname === route || (pathname?.startsWith(route + "/") ?? false);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (approvalStatus === 'pending') {
    return <StatusOverlay icon={<Clock className="text-yellow-600" size={48} />} title="Application Under Review" message="Thank you for registering! Your alumni application is currently being reviewed by our admin team." color="yellow" />;
  }

  if (approvalStatus === 'rejected' && pathname !== '/alumni/settings') {
    return (
      <StatusOverlay
        icon={<XCircle className="text-red-600" size={48} />}
        title="Application Not Approved"
        message={profile?.approval_reason || 'Unfortunately, your alumni application was not approved at this time.'}
        color="red"
        isError
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden">
      <div className="lg:hidden sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg border border-[#e5e7eb] bg-white flex items-center justify-center shadow-sm overflow-hidden shrink-0">
            <img
              src="/NEWCNLOGO.png"
              className="w-8 h-8 object-contain"
              alt="CF Logo"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://ui-avatars.com/api/?name=CF&background=0284c7&color=fff";
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">Connecting Future</h1>
            <p className="text-[11px] text-gray-500 truncate">Alumni</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-700"
          aria-label="Open alumni menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <aside className="hidden lg:flex fixed left-0 top-0 z-40 w-[300px] h-screen bg-[#f4f5f7] shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] border-r border-[#e6e9ef] flex-col">
        {/* Logo & Branding */}
        <div className="px-6 py-5 bg-white border-b border-[#eaecf0] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg border border-[#e5e7eb] bg-white flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
              <img
                src="/NEWCNLOGO.png"
                className="w-8 h-8 object-contain"
                alt="CF Logo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://ui-avatars.com/api/?name=CF&background=0284c7&color=fff";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Connecting Future</h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">VPPCOE & VA</p>
            </div>
          </div>
        </div>

        {/* Alumni Profile Summary */}
        <div className="px-4 py-5 bg-white border-b border-[#eaecf0] shrink-0">
          <div className="rounded-[14px] border border-[#d8e0ea] bg-[#f6f8fb] p-4 shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
              <div className="flex items-start space-x-3.5">
              <div className="relative mt-0.5">
                {alumniData.avatar ? (
                  <img
                    src={alumniData.avatar}
                    alt={alumniData.name}
                    className="w-[56px] h-[56px] rounded-full object-cover shadow-sm bg-gray-50"
                  />
                ) : (
                  <div className="w-[56px] h-[56px] bg-[#F19B86] rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-medium text-lg tracking-wider">
                      {String(alumniData.name).split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-[22px] h-[22px] bg-[#2563eb] rounded-full flex items-center justify-center border-[2.5px] border-white shadow-sm">
                  <span className="text-white text-[10px] font-bold leading-none">✓</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-[16px] truncate">{alumniData.name}</h3>
                <p className="text-[14px] text-gray-600 mt-0.5">Class of {alumniData.graduationYear}</p>
                {!profileLoading && alumniData.position !== 'Not specified' ? (
                  <p className="text-[14px] text-gray-500 mt-0.5 truncate">{alumniData.position} {alumniData.company !== 'Not specified' && `at ${alumniData.company}`}</p>
                ) : (
                  <p className="text-[14px] text-gray-500 mt-0.5">Not specified</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <span className="text-[12px] bg-[#e9efff] text-[#2563eb] px-3.5 py-1.5 rounded-full font-semibold inline-block">
                Verified Alumni
              </span>
            </div>
            <div className="mt-4 flex gap-2.5">
              <Link
                href="/alumni/network"
                className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] bg-blue-50 text-blue-700 border border-blue-100 text-[12px] font-semibold hover:bg-blue-100 transition-colors"
              >
                <Users size={13} />
                <span>Network</span>
              </Link>
              <Link
                href="/alumni/mentorship"
                className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] bg-blue-50 text-blue-700 border border-blue-100 text-[12px] font-semibold hover:bg-blue-100 transition-colors"
              >
                <Zap size={13} />
                <span>Mentor</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5">
              <ul className="space-y-2.5">
                {navigationItems.map((item) => {
                  const isActive = isActiveRoute(item.route);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.route}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-200 group ${
                          isActive
                            ? 'bg-[#e8efff] text-[#1e3a8a] border-[#bfdbfe] shadow-[0_1px_3px_rgba(37,99,235,0.18)]'
                            : 'text-[#344054] border-transparent hover:bg-white hover:border-[#e5e7eb] hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className={`h-6 w-1.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <span className={`shrink-0 ${isActive ? 'text-blue-700' : 'text-[#667085] group-hover:text-gray-700'}`}>
                            {item.icon}
                          </span>
                          <span className={`text-[15px] truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                            {item.label}
                          </span>
                        </div>
                        {item.badge ? (
                          <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold bg-[#ef4444] text-white shadow-sm">
                            {item.badge}
                          </div>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
        </nav>
      </aside>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close alumni menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl border-r border-gray-200 overflow-y-auto">
            <div className="px-4 py-4 bg-[#f4f5f7] border-b border-[#e6e9ef] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg border border-[#e5e7eb] bg-white flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                  <img
                    src="/NEWCNLOGO.png"
                    className="w-8 h-8 object-contain"
                    alt="CF Logo"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://ui-avatars.com/api/?name=CF&background=0284c7&color=fff";
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-gray-900 truncate">Connecting Future</h1>
                  <p className="text-[11px] text-gray-500 truncate">VPPCOE & VA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-700"
                aria-label="Close alumni menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-4 bg-white border-b border-[#eaecf0]">
              <div className="rounded-[14px] border border-[#d8e0ea] bg-[#f6f8fb] p-4 shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
                <div className="flex items-start space-x-3.5">
                  <div className="relative mt-0.5">
                    {alumniData.avatar ? (
                      <img
                        src={alumniData.avatar}
                        alt={alumniData.name}
                        className="w-[56px] h-[56px] rounded-full object-cover shadow-sm bg-gray-50"
                      />
                    ) : (
                      <div className="w-[56px] h-[56px] bg-[#F19B86] rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white font-medium text-lg tracking-wider">
                          {String(alumniData.name).split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 w-[22px] h-[22px] bg-[#2563eb] rounded-full flex items-center justify-center border-[2.5px] border-white shadow-sm">
                      <span className="text-white text-[10px] font-bold leading-none">✓</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-[16px] truncate">{alumniData.name}</h3>
                    <p className="text-[14px] text-gray-600 mt-0.5">Class of {alumniData.graduationYear}</p>
                    {!profileLoading && alumniData.position !== 'Not specified' ? (
                      <p className="text-[14px] text-gray-500 mt-0.5 truncate">{alumniData.position} {alumniData.company !== 'Not specified' && `at ${alumniData.company}`}</p>
                    ) : (
                      <p className="text-[14px] text-gray-500 mt-0.5">Not specified</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <nav className="px-4 py-4">
              <ul className="space-y-2.5">
                {navigationItems.map((item) => {
                  const isActive = isActiveRoute(item.route);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.route}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-200 group ${
                          isActive
                            ? 'bg-[#e8efff] text-[#1e3a8a] border-[#bfdbfe] shadow-[0_1px_3px_rgba(37,99,235,0.18)]'
                            : 'text-[#344054] border-transparent hover:bg-gray-50 hover:border-[#e5e7eb] hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className={`h-6 w-1.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <span className={`shrink-0 ${isActive ? 'text-blue-700' : 'text-[#667085] group-hover:text-gray-700'}`}>
                            {item.icon}
                          </span>
                          <span className={`text-[15px] truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                            {item.label}
                          </span>
                        </div>
                        {item.badge ? (
                          <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold bg-[#ef4444] text-white shadow-sm">
                            {item.badge}
                          </div>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}

      <main className="lg:ml-[300px] min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: transparent; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }
      `}</style>
    </div>
  );
}

function StatusOverlay({ icon, title, message, color, isError }: any) {
  const router = useRouter();
  const bgClasses = color === 'yellow' ? 'bg-yellow-100' : 'bg-red-100';
  const textClasses = color === 'yellow' ? 'text-yellow-900' : 'text-red-900';
  const btnClasses = color === 'yellow' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 p-4`}>
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center border border-gray-100">
        <div className={`w-24 h-24 ${bgClasses} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {icon}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-lg text-gray-600 mb-6">{message}</p>
        {isError && (
          <div className="mb-8 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-700 mb-1">Profile update needed</p>
            <p className="text-sm text-red-900/90 leading-relaxed">Update the flagged fields in Settings, then resubmit your alumni profile for review.</p>
          </div>
        )}
        <div className={`bg-${color === 'yellow' ? 'blue' : 'red'}-50 border border-${color === 'yellow' ? 'blue' : 'red'}-100 rounded-xl p-6 mb-8 text-left`}>
           <h3 className={`font-semibold ${color === 'yellow' ? 'text-blue-900' : 'text-red-900'} mb-3`}>What happens next?</h3>
           <ul className={`${color === 'yellow' ? 'text-blue-800' : 'text-red-800'} space-y-2`}>
              <li className="flex items-center space-x-2"><span className="text-xl leading-none">•</span> <span>{isError ? 'Review and update your profile information' : 'Our admin team will verify your information'}</span></li>
              <li className="flex items-center space-x-2"><span className="text-xl leading-none">•</span> <span>{isError ? 'Contact our admin team for more details' : 'You\'ll receive an email notification once approved'}</span></li>
              <li className="flex items-center space-x-2"><span className="text-xl leading-none">•</span> <span>{isError ? 'You may reapply after updating your information' : 'Approval typically takes 1-2 business days'}</span></li>
           </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => router.push('/alumni/settings')} className={`px-8 py-3.5 text-white rounded-xl font-medium transition-colors ${btnClasses} shadow-sm`}>
            Update Profile
          </button>
          <button onClick={() => { if(isError) window.location.href='mailto:admin@vppcoe.ac.in'; else router.push('/api/auth/logout'); }} className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">
            {isError ? 'Contact Admin' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}