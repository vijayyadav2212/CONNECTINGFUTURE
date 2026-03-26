









































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
    { id: "jobs", label: "Careers", icon: <Building size={20} />, route: "/alumni/job-posting", badge: jobNewBadge },
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
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <aside className="fixed left-0 top-0 z-40 w-72 h-screen p-4">
        <div className="h-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col overflow-hidden">

          <div className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <GraduationCap className="text-white" size={24} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">Connecting</h1>
                <span className="text-sm font-bold text-blue-600 uppercase tracking-tighter">Future</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="bg-slate-50/50 rounded-3xl p-4 border border-slate-100 flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white shadow-md">
                  <img src={profile?.picture || user?.picture || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                  <ShieldCheck size={10} className="text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900 truncate">{profile?.name || user?.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class of {profile?.graduation_year || '2026'}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
            {navigationItems.map((item) => {
              const isActive = pathname === item.route;
              return (
                <Link key={item.id} href={item.route} className={`flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}>{item.icon}</div>
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>{item.badge}</div>
                  ) : isActive && <ChevronRight size={14} className="opacity-50" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 mt-auto">
            <button onClick={() => router.push('/api/auth/logout')} className="w-full flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-3xl font-bold text-sm hover:bg-rose-100 transition-all">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="pl-72 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8e0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function StatusOverlay({ icon, title, message, color, isError }: any) {
  const router = useRouter();
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-${color}-50 p-6`}>
      <div className="max-w-xl w-full bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white p-12 text-center">
        <div className={`w-24 h-24 bg-${color}-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner`}>{icon}</div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">{title}</h1>
        <p className="text-slate-500 font-medium text-lg mb-10">{message}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/alumni/settings" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl">Update Profile</Link>
          {isError && <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold">Support</button>}
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
