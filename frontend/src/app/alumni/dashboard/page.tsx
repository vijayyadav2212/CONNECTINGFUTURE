"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AlumniNavigation from '../AluminaNavigation';
import {
  Building, Calendar, MapPin, Linkedin, Settings, Users, Briefcase,
  BookOpen, Award, Send, Mic, Route, UserPlus, Heart, MessageSquare,
  ArrowRight, Sparkles, TrendingUp
} from 'lucide-react';
import JobManagementPage from '@/app/admin/jobs/page';

// Interfaces
interface DashboardSectionProps {
  profile: any;
}

// Custom Hooks for Animations
const useIntersectionObserver = <T extends Element>(elementRef: React.RefObject<T | null>, threshold = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [elementRef, threshold]);

  return isIntersecting;
};

const useAnimatedCounter = (end: number, duration = 2000, trigger = true) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, trigger]);

  return count;
};

export default function AlumniDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // Ensure token exists, then call frontend proxy which forwards cookies
        const resp = await fetch('/api/user/profile', { cache: 'no-store' });
        if (!resp.ok) {
          if (resp.status === 401) {
            router.push('/api/auth/login?returnTo=/alumni/dashboard');
            return;
          }
          const txt = await resp.text();
          throw new Error(txt || `Failed: ${resp.status}`);
        }
        const data = await resp.json();
        const p = data.user || data;
        setProfile(p);
        // If user exists and is alumni but not approved, show a message instead of dashboard
        if (p && (p.user_type === 'alumni' || p.userType === 'alumni') && p.approval_status && p.approval_status !== 'approved') {
          setError('Your account is pending admin approval. You will get access once an admin approves your account.');
          setLoading(false);
          return;
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  // Mouse move effect for background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <AlumniNavigation>
      {/* Global Styles for Animations */}
      <style jsx global>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            @keyframes fade-in-up {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-float {
              animation: float 3s ease-in-out infinite;
            }
            .animate-fade-in-up {
              animation: fade-in-up 0.6s ease-out forwards;
            }
          `}</style>

      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 md:p-8 overflow-hidden">

        {/* Animated Background Blobs */}
        <div
          className="absolute top-10 left-10 w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse pointer-events-none"
          style={{ transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)` }}
        />
        <div
          className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse pointer-events-none"
          style={{ transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.02}px)` }}
        />

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          {loading && (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
              <p className="font-medium">Error loading dashboard</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && profile && (
            <DashboardSection profile={profile} />
          )}
        </div>
      </div>
    </AlumniNavigation>
  );
}

// Dashboard Section Component
function DashboardSection({ profile }: DashboardSectionProps) {
  const router = useRouter();
  const name = profile?.name || 'Alumni';
  const graduationYear = profile?.graduation_year || profile?.graduationYear || '';
  const company = profile?.company || profile?.currentCompany || '';
  const position = profile?.job_title || profile?.current_job || profile?.jobTitle || '';
  const location = profile?.location || '';
  const linkedin = profile?.linkedin_url || profile?.linkedIn || '';
  const bio = profile?.bio || '';
  const skills: string[] = typeof profile?.skills === 'string'
    ? profile.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(profile?.skills) ? profile.skills : [];
  const mentor = !!profile?.is_mentor || !!profile?.isOpenToMentoring;

  // Refs for animation
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const profileRef = useRef(null);
  const actionsRef = useRef(null);
  const combinedRef = useRef(null);

  const isHeaderVisible = useIntersectionObserver(headerRef);
  const isStatsVisible = useIntersectionObserver(statsRef);
  const isProfileVisible = useIntersectionObserver(profileRef);
  const isActionsVisible = useIntersectionObserver(actionsRef);
  const isCombinedVisible = useIntersectionObserver(combinedRef);

  return (
    <>
      {/* Welcome Header */}
      <div
        ref={headerRef}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-md border border-white/20 shadow-xl transition-all duration-700 ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-50" />

        {/* Decorative Circles */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl" />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-600 font-medium">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>Welcome Back</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Hello, {name}!
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
              Your community is growing. Ready to make an impact today?
            </p>
          </div>
          <button
            onClick={() => router.push('/alumni/settings')}
            className="group relative px-6 py-3 bg-white/50 hover:bg-white/80 backdrop-blur border border-white/60 rounded-xl text-slate-700 font-semibold shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Settings className="w-5 h-5 text-slate-500 group-hover:rotate-45 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* Profile & Impact Summary */}
      <div
        ref={profileRef}
        className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 delay-100 ${isProfileVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-white/40">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Your Profile
            </h3>
            {mentor && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100/80 text-green-700 text-xs font-bold border border-green-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Open to Mentoring
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-slate-700 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/20 hover:bg-blue-50/50 transition-colors shadow-sm">
              <div className="p-2 bg-blue-100/80 text-blue-600 rounded-lg backdrop-blur-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Position</span>
                <span className="font-medium">{position || '—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/20 hover:bg-purple-50/50 transition-colors shadow-sm">
              <div className="p-2 bg-purple-100/80 text-purple-600 rounded-lg backdrop-blur-sm">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Company</span>
                <span className="font-medium">{company || '—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/20 hover:bg-indigo-50/50 transition-colors shadow-sm">
              <div className="p-2 bg-indigo-100/80 text-indigo-600 rounded-lg backdrop-blur-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Class of</span>
                <span className="font-medium">{graduationYear || '—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/20 hover:bg-pink-50/50 transition-colors shadow-sm">
              <div className="p-2 bg-pink-100/80 text-pink-600 rounded-lg backdrop-blur-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Location</span>
                <span className="font-medium">{location || '—'}</span>
              </div>
            </div>
          </div>

          {linkedin && (
            <a href={linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium hover:underline decoration-blue-300 underline-offset-4 mb-6">
              <Linkedin className="w-4 h-4" />
              View LinkedIn Profile
            </a>
          )}

          {bio && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Bio</h4>
              <p className="text-slate-700 leading-relaxed bg-white/40 border border-white/20 p-4 rounded-xl shadow-sm backdrop-blur-sm">{bio}</p>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-lg text-sm bg-white/50 border border-white/30 text-slate-600 shadow-sm hover:shadow hover:text-blue-600 hover:border-blue-200 transition-all cursor-default backdrop-blur-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Impact Placeholder */}
        <div className="bg-gradient-to-br from-indigo-600/90 to-violet-600/90 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden flex flex-col justify-between group border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500 -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

          <div>
            <div className="flex items-center gap-2 mb-6 text-indigo-100">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold uppercase tracking-wider text-sm">Total Impact</span>
            </div>
            <div className="text-5xl font-bold mb-2">0</div>
            <p className="text-indigo-200 text-sm">Contributions this year</p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-indigo-100 text-sm leading-relaxed">
              Your contributions make a difference. Start engaging to see your impact grow!
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        ref={statsRef}
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 delay-200 ${isStatsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <StatCard
          icon={Users}
          value="12%"
          label="Mentees Helped"
          fullValue={12}
          color="green"
          isVisible={isStatsVisible}
          delay={0}
        />
        <StatCard
          icon={Briefcase}
          value="+3"
          label="Jobs Posted"
          fullValue={3}
          color="blue"
          isVisible={isStatsVisible}
          delay={100}
        />
        <StatCard
          icon={BookOpen}
          value="+2"
          label="Blogs Written"
          fullValue={2}
          color="purple"
          isVisible={isStatsVisible}
          delay={200}
        />
        <StatCard
          icon={Award}
          value="47"
          label="Impact Points"
          fullValue={47}
          color="yellow"
          isVisible={isStatsVisible}
          delay={300}
        />
      </div>

      {/* Quick Actions */}
      <div
        ref={actionsRef}
        className={`bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50 transition-all duration-700 delay-300 ${isActionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <QuickActionButton
            onClick={() => router.push('/alumni/settings')}
            icon={Settings}
            label="Update Profile"
            primary
          />
          <QuickActionButton
            onClick={() => router.push('/alumni/job-posting')}
            icon={Send}
            label="Post Job"
          />
          <QuickActionButton
            onClick={() => router.push('/alumni/ama')}
            icon={Mic}
            label="Host AMA"
          />
          <QuickActionButton
            onClick={() => router.push('/alumni/roadmap')}
            icon={Route}
            label="Create Roadmap"
          />
          <QuickActionButton
            onClick={() => router.push('/alumni/mentorship')}
            icon={UserPlus}
            label="Become Mentor"
          />
          <QuickActionButton
            onClick={() => router.push('/alumni/donation')}
            icon={Heart}
            label="Make Donation"
          />
        </div>
      </div>

      {/* Recent Activity & Insights */}
      <div
        ref={combinedRef}
        className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-700 delay-400 ${isCombinedVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-lg border border-white/50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Impact</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700 hover:underline">View All</button>
          </div>

          <div className="space-y-4">
            <ActivityItem
              color="green"
              text="Rahul Singh got placed at Google through your referral"
            />
            <ActivityItem
              color="blue"
              text="Your 'Frontend Roadmap' has 127 new followers"
            />
            <ActivityItem
              color="purple"
              text="5 students completed your React.js roadmap"
            />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-lg border border-white/50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Upcoming Sessions</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700 hover:underline">Calendar</button>
          </div>

          <div className="space-y-4">
            <SessionItem
              initials="SK"
              title="Mentorship with Sneha"
              time="Today, 3:00 PM"
              status="Confirmed"
              statusColor="green"
            />
            <SessionItem
              icon={MessageSquare}
              title="AMA: Career in Tech"
              time="Tomorrow, 7:00 PM"
              status="Hosting"
              statusColor="purple"
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ---- Sub Components ----

function StatCard({ icon: Icon, value, label, fullValue, color, isVisible, delay }: any) {
  const numericValue = parseInt(value) || fullValue || 0;
  const animatedCount = useAnimatedCounter(numericValue, 2000, isVisible);
  const displayValue = value.includes('%') ? `${animatedCount}%` : value.includes('+') ? `+${animatedCount}` : animatedCount;

  // Map colors to classes
  const colors: any = {
    green: { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-100', ring: 'group-hover:ring-emerald-200' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-100', ring: 'group-hover:ring-blue-200' },
    purple: { bg: 'bg-violet-500', text: 'text-violet-500', light: 'bg-violet-100', ring: 'group-hover:ring-violet-200' },
    yellow: { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-100', ring: 'group-hover:ring-amber-200' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div
      className="group bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-white/40 hover:-translate-y-1 relative overflow-hidden"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 ${c.light} opacity-20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500`} />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`w-12 h-12 ${c.bg} rounded-xl shadow-lg flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className={`${c.text} text-sm font-bold bg-white/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20`}>
          {value}
        </span>
      </div>

      <h3 className="text-3xl font-bold text-slate-900 mb-1 relative z-10">{displayValue}</h3>
      <p className="text-slate-500 font-medium relative z-10">{label}</p>
    </div>
  )
}


function QuickActionButton({ onClick, icon: Icon, label, primary }: any) {
  return (
    <button
      onClick={onClick}
      className={`
                group flex flex-col items-center p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm
                ${primary
          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-105'
          : 'bg-white/50 border border-slate-200/60 text-slate-600 hover:border-blue-300/50 hover:bg-white/80 hover:shadow-md hover:-translate-y-1'
        }
            `}
    >
      <div className={`p-3 rounded-xl mb-3 ${primary ? 'bg-white/20' : 'bg-white/60 group-hover:bg-white group-hover:shadow-sm'} transition-colors backdrop-blur-md`}>
        <Icon className={`w-6 h-6 ${primary ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'}`} />
      </div>
      <span className={`text-sm font-semibold ${primary ? 'text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>
        {label}
      </span>
    </button>
  )
}

function ActivityItem({ color, text }: any) {
  const colors: any = {
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-violet-500',
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/40 hover:bg-white/60 border border-white/20 hover:border-white/40 shadow-sm hover:shadow-md backdrop-blur-sm transition-all duration-300 cursor-default">
      <div className={`mt-1.5 w-2.5 h-2.5 ${c} rounded-full ring-4 ring-white/60 shadow-sm shrink-0`} />
      <p className="text-slate-700 font-medium leading-relaxed">{text}</p>
    </div>
  )
}


function SessionItem({ initials, icon: Icon, title, time, status, statusColor }: any) {
  const colors: any = {
    green: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    purple: { bg: 'bg-violet-100', text: 'text-violet-700' },
  };
  const c = colors[statusColor] || colors.green;

  return (
    <div className="group flex items-center justify-between p-4 bg-white/40 border border-white/20 rounded-2xl hover:bg-white/70 hover:border-blue-200/50 hover:shadow-md backdrop-blur-sm transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/50 flex items-center justify-center text-slate-600 font-bold shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 backdrop-blur-md">
          {Icon ? <Icon className="w-6 h-6" /> : initials}
        </div>
        <div>
          <p className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{title}</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            {time}
          </div>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${c.bg} ${c.text} backdrop-blur-sm`}>
        {status}
      </span>
    </div>
  )
}
