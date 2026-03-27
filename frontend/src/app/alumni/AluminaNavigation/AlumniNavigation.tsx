"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, Users, Building, MessageSquare,
  Trophy, Settings, Heart, Calendar, Map, Camera,
  Zap, ShieldCheck, Clock, XCircle, ChevronRight, LogOut
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

  const navigationItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutIcon />, route: "/alumni/dashboard" },
    { id: "network", label: "Network", icon: <Users size={20} />, route: "/alumni/network" },
    { id: "mentorship", label: "Mentorship", icon: <Zap size={20} />, route: "/alumni/mentorship" },
    { id: "jobs", label: "Jobs & Internship", icon: <Building size={20} />, route: "/alumni/job-posting", badge: jobNewBadge },
    { id: "events", label: "Events", icon: <Calendar size={20} />, route: "/alumni/events" },
    { id: "roadmaps", label: "Roadmaps", icon: <Map size={20} />, route: "/alumni/roadmap" },
    { id: "memories", label: "Memories", icon: <Camera size={20} />, route: "/alumni/memories" },
    { id: "leaderboard", label: "Hall of Fame", icon: <Trophy size={20} />, route: "/alumni/leaderboard" },
    { id: "messages", label: "Messages", icon: <MessageSquare size={20} />, route: "/alumni/messages", badge: messageUnread },
    { id: "donations", label: "Donations", icon: <Heart size={20} />, route: "/alumni/donation" },
    { id: "settings", label: "Settings", icon: <Settings size={20} />, route: "/alumni/settings" },
  ];

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Zap className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (approvalStatus === 'pending') {
    return <StatusOverlay icon={<Clock className="text-amber-500" size={48} />} title="Review in Progress" message="We're currently verifying your alumni status." color="amber" />;
  }

  if (approvalStatus === 'rejected') {
    return <StatusOverlay icon={<XCircle className="text-rose-500" size={48} />} title="Verification Failed" message="We couldn't verify your alumni record." color="rose" isError />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <aside className="fixed left-0 top-0 z-40 w-72 h-screen bg-white/95 backdrop-blur-sm shadow-[0_12px_40px_rgba(15,23,42,0.08)] border-r border-slate-200/70">
        <div className="h-full overflow-y-auto flex flex-col">
          {/* Logo & Branding */}
          <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden bg-white border border-slate-200 shadow-sm">
                <img src="/NEWCNLOGO.png" alt="Connecting Future" className="w-[84%] h-[84%] object-contain" />
              </div>
              <div>
                <h1 className="text-[18px] leading-5 font-extrabold tracking-tight text-slate-900">Connecting Future</h1>
                <p className="text-[12px] text-slate-500 font-medium">VPPCOE & VA</p>
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="p-4 border-b border-slate-200">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                  <img src={profile?.picture || user?.picture || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-full h-full object-cover" alt="" />
                </div>
                {approvalStatus === 'approved' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs leading-none">✓</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate leading-5">
                  {profile?.name || user?.name || 'Alumni'}
                </h3>
                <p className="text-sm text-slate-600">Class of {profile?.graduation_year || '2026'}</p>
                {(profile?.job_title || profile?.company) && (
                  <p className="text-xs text-slate-500 truncate">
                    {profile?.job_title || 'Alumni'}{profile?.company ? ` at ${profile.company}` : ''}
                  </p>
                )}
                {approvalStatus === 'approved' && (
                  <span className="inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
                    Verified Alumni
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => router.push('/alumni/network')} className="flex items-center justify-center p-2.5 bg-sky-50 rounded-xl border border-sky-100 hover:bg-sky-100 transition-colors">
                  <Users className="w-4 h-4 text-sky-600 mr-1" />
                  <span className="text-xs font-semibold text-sky-700">Network</span>
                </button>
                <button onClick={() => router.push('/alumni/mentorship')} className="flex items-center justify-center p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">
                  <Zap className="w-4 h-4 text-indigo-600 mr-1" />
                  <span className="text-xs font-semibold text-indigo-700">Mentor</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3.5 flex-1">
            <ul className="space-y-1.5">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.route}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${pathname === item.route
                      ? 'bg-gradient-to-r from-sky-50 to-indigo-50 text-sky-900 border border-sky-200 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100/80 border border-transparent'
                      }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className={`${pathname === item.route ? 'text-sky-600' : 'text-slate-500 group-hover:text-slate-700'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium text-[14px] truncate">{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="bg-rose-500 text-white text-[11px] font-bold min-w-5 h-5 px-1.5 rounded-full inline-flex items-center justify-center">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

        
        </div>
      </aside>

      <main className="ml-72 min-h-screen">
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function StatusOverlay({ icon, title, message, color, isError }: any) {
  const router = useRouter();
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 relative overflow-hidden font-sans`}>
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-${color}-200/40 rounded-full blur-[100px] opacity-50 mix-blend-multiply pointer-events-none`} />
      <div className={`absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-${isError ? 'rose' : 'emerald'}-200/30 rounded-full blur-[120px] opacity-50 mix-blend-multiply pointer-events-none`} />

      <div className="max-w-xl w-full bg-white/60 backdrop-blur-2xl rounded-[3rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white p-12 text-center relative z-10">
        <div className={`w-28 h-28 bg-gradient-to-tr from-${color}-400 to-${color}-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-${color}-500/20 transform hover:scale-105 transition-transform duration-300 text-white`}>
          {React.cloneElement(icon, { size: 56, className: 'text-white' })}
        </div>
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">{title}</h1>
        <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/alumni/settings" className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform duration-300">Update Profile</Link>
          {isError && <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 hover:shadow-sm transition-all duration-300">Support</button>}
        </div>
      </div>
    </div>
  );
}

function LayoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}