"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AlumniNavigation from '../AluminaNavigation';
import {
  Settings, Users, Briefcase,
  Send, Route, UserPlus, Heart, CalendarDays,
  ArrowRight, Zap, GraduationCap,
  BriefcaseBusiness, Trophy,
} from 'lucide-react';

export default function AlumniDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await fetch('/api/user/profile', { cache: 'no-store' });
        if (!resp.ok) {
          if (resp.status === 401) {
            router.push('/api/auth/login?returnTo=/alumni/dashboard');
            return;
          }
          throw new Error(`Failed: ${resp.status}`);
        }
        const data = await resp.json();
        const p = data.user || data;
        setProfile(p);

        if (p && (p.user_type === 'alumni' || p.userType === 'alumni') && p.approval_status && p.approval_status !== 'approved') {
          setError('Your account is pending admin approval.');
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500" />
    </div>
  );

  if (error) return (
    <AlumniNavigation>
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    </AlumniNavigation>
  );

  return (
    <AlumniNavigation>
      <div className="space-y-6">

        {/* Welcome Banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-3">
              <Zap size={16} className="fill-current" />
              <span>Welcome Back</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Hello, {profile?.name || 'Alumni'}!
            </h1>
            <p className="text-gray-500 text-base mb-6">
              Your community is growing. Ready to make an impact today?
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg text-gray-600 text-sm font-semibold border border-white">
                <GraduationCap size={14} className="text-gray-400" />
                Class of {profile?.graduation_year || '2023'}
              </div>
              {profile?.job_title && (
                <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg text-gray-600 text-sm font-semibold border border-white">
                  <Briefcase size={14} className="text-gray-400" />
                  {profile.job_title}
                </div>
              )}
              {profile?.company && (
                <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg text-gray-600 text-sm font-semibold border border-white">
                  <Users size={14} className="text-gray-400" />
                  {profile.company}
                </div>
              )}
              <button
                onClick={() => router.push('/alumni/settings')}
                className="ml-auto bg-white hover:bg-gray-50 px-4 py-2 rounded-lg text-gray-700 font-semibold text-sm shadow-sm transition-all border border-gray-200 flex items-center gap-2"
              >
                <Settings size={14} />
                Update Interests
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Impact Points" value="47" sub="7.9 Score" icon={Trophy} color="text-emerald-600" bgColor="bg-emerald-50" />
          <StatCard label="Active Mentees" value="1" sub="1 request" icon={Users} color="text-blue-600" bgColor="bg-blue-50" />
          <StatCard label="Jobs Posted" value="0" sub="In Progress" icon={BriefcaseBusiness} color="text-purple-600" bgColor="bg-purple-50" />
          <StatCard label="Network Size" value="3" sub="Connections" icon={Zap} color="text-orange-500" bgColor="bg-orange-50" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Community Actions */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Community Contribution</h3>
              <button className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:underline">
                View Details <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ContributionTile icon={<Send size={20} />} title="Post a Job" desc="Share opportunities with juniors" color="text-blue-500" bgColor="bg-blue-50" path="/alumni/job-posting" />
              <ContributionTile icon={<CalendarDays size={20} />} title="Upcoming Events" desc="Browse and create alumni events" color="text-purple-500" bgColor="bg-purple-50" path="/alumni/events" />
              <ContributionTile icon={<Route size={20} />} title="Create Roadmap" desc="Guide students through a tech stack" color="text-green-600" bgColor="bg-green-50" path="/alumni/roadmap" />
              <ContributionTile icon={<UserPlus size={20} />} title="New Request" desc="Mentorship request waiting" color="text-orange-500" bgColor="bg-orange-50" path="/alumni/mentorship" hasNotification />
            </div>
          </div>

          {/* Connection Requests */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Users size={20} className="text-gray-700" />
              <h3 className="text-lg font-bold text-gray-900">Connection Requests</h3>
              <span className="ml-auto text-sm text-gray-500">Pending: 0</span>
            </div>
            <p className="text-sm text-gray-500 mt-4">No pending connection requests.</p>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4">Quick Actions</h4>
              <div className="space-y-2">
                <button onClick={() => router.push('/alumni/network')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors border border-transparent hover:border-gray-200">
                  <Users size={16} className="text-green-600" /> Browse Network
                </button>
                <button onClick={() => router.push('/alumni/job-posting')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors border border-transparent hover:border-gray-200">
                  <BriefcaseBusiness size={16} className="text-blue-600" /> Post a Job
                </button>
                <button onClick={() => router.push('/alumni/mentorship')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors border border-transparent hover:border-gray-200">
                  <Zap size={16} className="text-purple-600" /> Mentor Students
                </button>
                <button onClick={() => router.push('/alumni/donation')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors border border-transparent hover:border-gray-200">
                  <Heart size={16} className="text-rose-500" /> Donate
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AlumniNavigation>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className={`text-sm font-semibold ${color}`}>{sub}</p>
      </div>
      <div className={`p-3 rounded-xl ${bgColor} ${color}`}>
        <Icon size={22} />
      </div>
<<<<<<< HEAD

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
          label="Events Hosted"
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
            onClick={() => router.push('/alumni/events')}
            icon={Mic}
            label="Host Events"
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
=======
    </div>
>>>>>>> 77a6fd9 (Updated feature / fixed bug / added new changes)
  );
}

function ContributionTile({ icon, title, desc, color, bgColor, path, hasNotification }: any) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(path)}
      className="group relative p-5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all cursor-pointer"
    >
      {hasNotification && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full" />
      )}
      <div className={`w-10 h-10 ${bgColor} ${color} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <h4 className="text-base font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-gray-500 text-sm">{desc}</p>
    </div>
  );
}
