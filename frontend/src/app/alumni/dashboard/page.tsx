"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AlumniNavigation from '../AluminaNavigation';
import { User, Building, FileText, Trophy, Calendar, MessageSquare, Map, Heart, Settings, Users, Briefcase, BookOpen, Award, Send, Mic, Route, UserPlus, MapPin, Linkedin } from 'lucide-react';

// Interfaces
interface DashboardSectionProps {
  profile: any;
}

export default function AlumniDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

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
        setProfile(data.user || data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  return (
    <AlumniNavigation>
      <div className="p-8">
        {loading && (
          <div className="text-slate-600">Loading your dashboard…</div>
        )}
        {error && (
          <div className="text-red-600">{error}</div>
        )}
        {!loading && !error && profile && (
          <DashboardSection profile={profile} />
        )}
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
  const skills: string[] = typeof profile?.skills === 'string' ? profile.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : Array.isArray(profile?.skills) ? profile.skills : [];
  const mentor = !!profile?.is_mentor || !!profile?.isOpenToMentoring;
  
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {name}!</h1>
              <p className="text-blue-100 text-lg">
                Ready to make an impact today?
              </p>
            </div>
            <button onClick={() => router.push('/registration?redirect=/alumni/dashboard')} className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white font-medium hover:bg-white/30 transition-all duration-200 flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Update Interests</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 lg:col-span-2">
          <h3 className="text-slate-900 font-semibold mb-4">Your profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
            <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-500" />{position || '—'}</div>
            <div className="flex items-center gap-2"><Building className="w-4 h-4 text-slate-500" />{company || '—'}</div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" />{graduationYear || '—'}</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" />{location || '—'}</div>
            {linkedin && (
              <a className="flex items-center gap-2 text-blue-600 hover:underline" href={linkedin} target="_blank" rel="noreferrer">
                <Linkedin className="w-4 h-4" />LinkedIn
              </a>
            )}
          </div>
          {bio && <p className="mt-4 text-slate-700">{bio}</p>}
          {skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">{s}</span>
              ))}
            </div>
          )}
          {mentor && (
            <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              <Users className="w-3.5 h-3.5" /> Open to mentoring
            </div>
          )}
        </div>

        {/* Impact points placeholder */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h3 className="text-slate-900 font-semibold mb-4">Impact</h3>
          <div className="text-3xl font-bold text-slate-900">—</div>
          <p className="text-slate-600">Your contributions will show here.</p>
        </div>
      </div>

      {/* Quick Stats Cards (placeholder data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-green-500 text-sm font-medium">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">—</h3>
          <p className="text-slate-600 font-medium">Mentees Helped</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-blue-500 text-sm font-medium">+3</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">—</h3>
          <p className="text-slate-600 font-medium">Jobs Posted</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-purple-500 text-sm font-medium">+2</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">—</h3>
          <p className="text-slate-600 font-medium">Blogs Written</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span className="text-yellow-500 text-sm font-medium">+47</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">—</h3>
          <p className="text-slate-600 font-medium">Impact Points</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button 
            onClick={() => router.push('/alumni/profile')}
            className="flex flex-col items-center p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
          >
            <Settings className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Update Profile</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/job-posting')}
            className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <Send className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-sm font-medium text-slate-700">Post Job</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/ama')}
            className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <Mic className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-sm font-medium text-slate-700">Host AMA</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/roadmap')}
            className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <Route className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-sm font-medium text-slate-700">Create Roadmap</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/mentorship')}
            className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <UserPlus className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-sm font-medium text-slate-700">Become Mentor</span>
          </button>
          
          <button 
            onClick={() => router.push('/alumni/donation')}
            className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <Heart className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-sm font-medium text-slate-700">Make Donation</span>
          </button>
        </div>
      </div>

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Impact</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Rahul Singh got placed at Google through your referral</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Your 'Frontend Roadmap' has 127 new followers</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">5 students completed your React.js roadmap</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Upcoming Sessions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">SK</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Mentorship with Sneha</p>
                  <p className="text-sm text-slate-600">Today, 3:00 PM</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                Confirmed
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">AMA: Career in Tech</p>
                  <p className="text-sm text-slate-600">Tomorrow, 7:00 PM</p>
                </div>
              </div>
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                Hosting
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
