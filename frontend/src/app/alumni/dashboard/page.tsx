"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AlumniNavigation from '../AluminaNavigation';
import {
  Settings, User, Briefcase, Building2, 
  Calendar, MapPin, Linkedin, TrendingUp, Sparkles, XCircle,
  Users, Send, Route, UserPlus, Heart, CalendarDays, ArrowRight, Zap
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
    <AlumniNavigation>
        <div className="flex h-full min-h-[60vh] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500" />
        </div>
    </AlumniNavigation>
  );

  if (error) return (
    <AlumniNavigation>
      <div className="p-8 h-full">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-6 rounded-[20px] shadow-sm flex items-start gap-3">
          <XCircle className="text-red-500 mt-1 flex-shrink-0" />
          <div>
            <p className="font-bold text-lg mb-1">Error loading dashboard</p>
            <p className="text-sm font-medium opacity-90">{error}</p>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );

  return (
    <AlumniNavigation>
      <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col font-sans mb-8">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#e7eaff] to-[#eaddff] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[15px] mb-3">
              <Sparkles size={18} className="text-indigo-500" />
              <span>Welcome Back</span>
            </div>
            <h1 className="text-4xl md:text-[44px] font-extrabold text-[#1e293b] mb-4 tracking-tight leading-tight">
              Hello, {profile?.name || 'Vijay Yadav'}!
            </h1>
            <p className="text-slate-600 text-[17px] font-medium opacity-90">
              Your community is growing. Ready to make an impact today?
            </p>
          </div>
          
          {/* Settings Button */}
          <button 
            onClick={() => router.push('/alumni/settings')} 
            className="absolute top-1/2 right-8 md:right-12 -translate-y-1/2 bg-white/50 hover:bg-white text-indigo-500 p-4 rounded-2xl backdrop-blur-sm shadow-[0_8px_20px_rgb(0,0,0,0.03)] border border-white/60 transition-all duration-300 group"
            aria-label="Settings"
          >
            <Settings size={28} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" strokeWidth={1.5} />
          </button>
        </div>

        {/* Top Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Your Profile */}
          <div className="lg:col-span-2 bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white">
             {/* Header */}
             <div className="flex items-center gap-3 mb-8">
                <User className="text-[#4F46E5]" size={24} strokeWidth={2} />
                <h2 className="text-[22px] font-bold text-slate-800 tracking-tight">Your Profile</h2>
             </div>

             {/* Stat Grid */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <ProfileStat 
                  icon={<Briefcase size={20} className="text-blue-500" strokeWidth={1.5} />} 
                  bgColor="bg-blue-50" 
                  label="POSITION" 
                  value={profile?.job_title || profile?.position || 'SDE'} 
                />
                <ProfileStat 
                  icon={<Building2 size={20} className="text-[#a855f7]" strokeWidth={1.5} />} 
                  bgColor="bg-purple-50" 
                  label="COMPANY" 
                  value={profile?.company || 'Amazon'} 
                />
                <ProfileStat 
                  icon={<Calendar size={20} className="text-indigo-500" strokeWidth={1.5} />} 
                  bgColor="bg-indigo-50" 
                  label="CLASS OF" 
                  value={profile?.graduation_year || profile?.graduationYear || '2023'} 
                />
                <ProfileStat 
                  icon={<MapPin size={20} className="text-pink-500" strokeWidth={1.5} />} 
                  bgColor="bg-pink-50" 
                  label="LOCATION" 
                  value={profile?.location || 'Mumbai'} 
                />
             </div>

             {/* Links & Bio */}
             <div className="space-y-6">
                 <div className="flex items-center gap-2">
                    <Linkedin size={20} className="text-[#0a66c2]" strokeWidth={1.5} />
                    <a href={profile?.linkedin || '#'} target="_blank" rel="noopener noreferrer" className="text-[#0a66c2] font-semibold text-[15px] hover:underline">
                      View LinkedIn Profile
                    </a>
                 </div>

                 <div className="pt-2">
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">BIO</h3>
                    <p className="text-slate-700 text-[15px] leading-relaxed font-medium">
                      {profile?.bio || 'Passionate software engineer building scalable solutions at Amazon. Always happy to connect with alumni and mentor students. Let\'s build the future together!'}
                    </p>
                 </div>
             </div>
          </div>

          {/* Right Column: Total Impact */}
          <div className="bg-gradient-to-br from-[#6b52ff] to-[#9233ea] rounded-[32px] p-8 md:p-10 shadow-[0_10px_40px_rgba(107,82,255,0.25)] text-white flex flex-col relative overflow-hidden">
              {/* Subtle visual decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 blur-[50px] rounded-full -ml-10 -mb-10 pointer-events-none" />

              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-white/90 font-bold text-[13px] mb-8 tracking-[0.2em] uppercase">
                  <TrendingUp size={18} strokeWidth={2.5} />
                  <span>Total Impact</span>
                </div>
                
                <div className="flex-1 flex flex-col justify-center mb-8">
                   <div className="text-[100px] font-extrabold leading-none tracking-tighter mb-4 drop-shadow-sm">
                     {profile?.impact_score || '0'}
                   </div>
                   <p className="text-white/80 font-semibold text-[17px]">
                     Contributions this year
                   </p>
                </div>
              </div>
          </div>

        </div>

        {/* Bottom Section: Community & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Community Contribution */}
          <div className="lg:col-span-2 bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[22px] font-bold text-slate-800 tracking-tight">Community Contribution</h3>
              <button className="text-emerald-500 font-semibold text-[15px] flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                View Details <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ContributionTile 
                icon={<Send size={22} />} 
                title="Post a Job" 
                desc="Share opportunities with juniors" 
                color="text-[#3b82f6]" 
                bgColor="bg-[#eff6ff]" 
                path="/alumni/job-posting" 
              />
              <ContributionTile 
                icon={<CalendarDays size={22} />} 
                title="Upcoming Events" 
                desc="Browse and create alumni events" 
                color="text-[#a855f7]" 
                bgColor="bg-[#faf5ff]" 
                path="/alumni/events" 
              />
              <ContributionTile 
                icon={<Route size={22} />} 
                title="Create Roadmap" 
                desc="Guide students through a tech stack" 
                color="text-[#22c55e]" 
                bgColor="bg-[#f0fdf4]" 
                path="/alumni/roadmap" 
              />
              <ContributionTile 
                icon={<UserPlus size={22} />} 
                title="New Request" 
                desc="Mentorship request waiting" 
                color="text-[#f97316]" 
                bgColor="bg-[#fff7ed]" 
                path="/alumni/mentorship" 
                hasNotification 
              />
            </div>
          </div>

          {/* Connection Requests & Quick Actions */}
          <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <Users size={24} className="text-slate-700 mt-1" strokeWidth={1.5} />
                <h3 className="text-[20px] font-bold text-slate-800 leading-tight">Connection<br/>Requests</h3>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-slate-400 text-[13px] font-medium leading-[1.8] tracking-wide">Pending:</span>
                <span className="text-slate-700 font-medium">0</span>
              </div>
            </div>
            
            <p className="text-[14px] text-slate-500 font-medium mb-8">No pending connection requests.</p>

            <div className="mt-2 pt-8 border-t border-slate-100">
              <h4 className="font-bold text-[17px] text-slate-800 mb-6">Quick Actions</h4>
              <div className="space-y-6">
                <button onClick={() => router.push('/alumni/network')} className="w-full flex items-center gap-4 text-slate-700 text-[15px] font-semibold hover:text-slate-900 transition-colors group">
                  <Users size={20} className="text-emerald-500" strokeWidth={2} /> 
                  Browse Network
                </button>
                <button onClick={() => router.push('/alumni/job-posting')} className="w-full flex items-center gap-4 text-slate-700 text-[15px] font-semibold hover:text-slate-900 transition-colors group">
                  <Briefcase size={20} className="text-blue-500" strokeWidth={2} /> 
                  Post a Job
                </button>
                <button onClick={() => router.push('/alumni/mentorship')} className="w-full flex items-center gap-4 text-slate-700 text-[15px] font-semibold hover:text-slate-900 transition-colors group">
                  <Zap size={20} className="text-[#a855f7]" strokeWidth={2} /> 
                  Mentor Students
                </button>
                <button onClick={() => router.push('/alumni/donation')} className="w-full flex items-center gap-4 text-slate-700 text-[15px] font-semibold hover:text-slate-900 transition-colors group">
                  <Heart size={20} className="text-rose-500" strokeWidth={2} /> 
                  Donate
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </AlumniNavigation>
  );
}

function ProfileStat({ icon, bgColor, label, value }: any) {
  return (
    <div className="border border-slate-100 bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_10px_rgb(0,0,0,0.01)] hover:shadow-md hover:border-indigo-100 transition-all duration-300">
      <div className={`w-12 h-12 rounded-[14px] flex flex-shrink-0 items-center justify-center ${bgColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[16px] font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function ContributionTile({ icon, title, desc, color, bgColor, path, hasNotification }: any) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(path)}
      className="group relative p-6 rounded-[24px] bg-[#f8fafc] hover:bg-slate-50 hover:shadow-sm transition-all duration-300 cursor-pointer border border-transparent hover:border-slate-200"
    >
      {hasNotification && (
        <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-sm" />
      )}
      <div className={`w-12 h-12 ${bgColor} ${color} rounded-[16px] flex items-center justify-center mb-5`}>
        {React.cloneElement(icon, { strokeWidth: 1.5 })}
      </div>
      <h4 className="text-[17px] font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-slate-500 text-[14px] leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
