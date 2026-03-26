"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import AlumniNavigation from '../AluminaNavigation';
import {
  Users, CheckCircle, Star, Calendar, Clock, UserX, ChevronDown, ChevronUp, Video, Sparkles
} from 'lucide-react';

type Request = {
  id: number;
  student_email: string;
  mentor_email: string;
  status: string;
  message?: string | null;
  updated_at?: string;
};

type Session = {
  id: number;
  student_email: string;
  mentor_email: string;
  status: string;
  amount?: number;
  currency?: string;
  scheduled_at?: string | null;
  duration_minutes?: number;
  meeting_link?: string | null;
};

type UserProfile = {
  email: string;
  name?: string | null;
  picture?: string | null;
  job_title?: string | null;
  company?: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

function normalizeLink(link?: string) {
  if (!link) return '';
  const l = link.trim();
  if (/^https?:\/\//i.test(l)) return l;
  if (/^\/\//.test(l)) return 'https:' + l;
  return 'https://' + l;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600 border-amber-200/60',
    accepted: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
    rejected: 'bg-rose-50 text-rose-600 border-rose-200/60',
    scheduled: 'bg-indigo-50 text-[#4F46E5] border-indigo-200/60',
    paid: 'bg-purple-50 text-purple-600 border-purple-200/60',
    completed: 'bg-slate-100 text-slate-600 border-slate-200/80',
  };
  return `text-[11px] font-bold px-3 py-1 rounded-[8px] border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200/80'} uppercase tracking-wider`;
}

export default function MentorshipPage() {
  const { user } = useUser();
  const [skills, setSkills] = useState('');
  const [topics, setTopics] = useState('');
  const [availability, setAvailability] = useState('');
  const [experience, setExperience] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [paymentUpiId, setPaymentUpiId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [removing, setRemoving] = useState<string | null>(null);
  const [myRatingAvg, setMyRatingAvg] = useState<number | null>(null);
  const [myRatingCount, setMyRatingCount] = useState<number | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<{
    session_id: number; scheduled_at: string; duration_minutes: number; meeting_link: string;
  } | null>(null);
  const [meetingDialog, setMeetingDialog] = useState<Session | null>(null);
  const [alertedStart, setAlertedStart] = useState<Record<number, boolean>>({});

  const activeMenteesCount = useMemo(() => requests.filter(r => r.status === 'accepted').length, [requests]);
  const completedSessionsCount = useMemo(() => sessions.filter(s => s.status === 'completed').length, [sessions]);
  const upcomingSessions = useMemo(() =>
    sessions.filter(s => s.status === 'scheduled' && s.scheduled_at)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()),
    [sessions]);
  const sortedSessions = useMemo(() =>
    sessions.slice().sort((a, b) => {
      if (a.scheduled_at && b.scheduled_at) return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      if (a.scheduled_at) return -1;
      if (b.scheduled_at) return 1;
      return 0;
    }), [sessions]);

  async function reloadMentorData() {
    if (!user?.email) return;
    try {
      const [rq, sq] = await Promise.all([
        fetch(`${API_BASE}/api/mentorship/requests?mentor_email=${encodeURIComponent(user.email)}`),
        fetch(`${API_BASE}/api/mentorship/sessions?mentor_email=${encodeURIComponent(user.email)}`),
      ]);
      const rj = await rq.json();
      const sj = await sq.json();
      const newRequests: Request[] = rj.requests || [];
      const newSessions: Session[] = sj.sessions || [];
      setRequests(newRequests);
      setSessions(newSessions);

      // Check for sessions starting now
      newSessions.forEach(s => {
        if (s.status === 'scheduled' && s.scheduled_at && !alertedStart[s.id]) {
          const diff = new Date(s.scheduled_at).getTime() - Date.now();
          if (diff <= 0) {
            setMeetingDialog(s);
            setAlertedStart(prev => ({ ...prev, [s.id]: true }));
          }
        }
      });

      const emails = Array.from(new Set([...newRequests.map(r => r.student_email), ...newSessions.map(s => s.student_email)]));
      const entries = await Promise.all(emails.map(async email => {
        try {
          const r = await fetch(`${API_BASE}/api/users/by-email?email=${encodeURIComponent(email)}`);
          const j = await r.json();
          return [email, j.user] as const;
        } catch { return [email, { email }] as const; }
      }));
      const map: Record<string, UserProfile> = {};
      entries.forEach(([email, prof]) => { if (email) map[email] = prof as UserProfile; });
      setProfiles(map);
    } catch { }
  }

  useEffect(() => {
    async function loadProfile() {
      if (!user?.email) return;
      try {
        const res = await fetch(`${API_BASE}/api/mentors/profile?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) return;
        const { mentor } = await res.json();
        setSkills(mentor?.skills || '');
        setTopics(mentor?.topics || '');
        setAvailability(mentor?.availability || '');
        setExperience(mentor?.experience_years ?? '');
        setPrice(mentor?.price ?? '');
        setPaymentUpiId(mentor?.payment_upi_id || '');
        setMyRatingAvg(mentor?.rating_avg ?? null);
        setMyRatingCount(mentor?.rating_count ?? null);
      } catch { }
    }
    loadProfile();
    reloadMentorData();
  }, [user?.email]);

  async function respondRequest(request: Request, action: 'accept' | 'reject') {
    if (!user?.email) return;
    try {
      await fetch(`${API_BASE}/api/mentorship/respond`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mentor_email: user.email, student_email: request.student_email, action }),
      });
      await reloadMentorData();
    } catch { }
  }

  async function scheduleSession(session_id: number, scheduled_at: string, duration_minutes: number, meeting_link: string) {
    try {
      await fetch(`${API_BASE}/api/mentorship/sessions/schedule`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session_id, scheduled_at, duration_minutes, meeting_link }),
      });
      setScheduleForm(null);
      await reloadMentorData();
    } catch { }
  }

  async function removeConnectionWithMentee(student_email: string) {
    if (!user?.email) return;
    setRemoving(student_email);
    try {
      await fetch(`${API_BASE}/api/connections/remove`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, other_email: student_email }),
      });
      await reloadMentorData();
    } catch { }
    setRemoving(null);
  }

  async function saveProfile() {
    if (!user?.email) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/mentors/profile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          skills,
          topics,
          availability,
          experience_years: experience === '' ? 0 : Number(experience),
          price: price === '' ? 0 : Number(price),
          payment_upi_id: paymentUpiId
        }),
      });
      setSaveMsg('Saved successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch { setSaveMsg('Error saving profile'); }
    setSaving(false);
  }

  const displayedSessions = showAllSessions ? sortedSessions : sortedSessions.slice(0, 3);

  return (
    <AlumniNavigation>
      <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col font-sans mb-12">

        {/* Page Header Banner */}
        <div className="bg-gradient-to-r from-[#e7eaff] to-[#eaddff] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[15px] mb-3">
              <Sparkles size={18} className="text-indigo-500" />
              <span>Mentorship Hub</span>
            </div>
            <h1 className="text-4xl md:text-[44px] font-extrabold text-[#1e293b] mb-4 tracking-tight leading-tight">
              Mentor Dashboard
            </h1>
            <p className="text-slate-600 text-[17px] font-medium opacity-90">
              Manage your mentees, sessions, and mentor profile all in one place.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white flex items-start justify-between hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2">Active Mentees</p>
              <p className="text-[36px] font-extrabold text-slate-800 leading-none mb-2">{activeMenteesCount}</p>
              <p className="text-[13px] font-bold text-emerald-500">Accepted requests</p>
            </div>
            <div className="w-14 h-14 rounded-[16px] bg-emerald-50 text-emerald-600 flex flex-shrink-0 items-center justify-center shadow-sm">
              <Users size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white flex items-start justify-between hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2">Sessions Completed</p>
              <p className="text-[36px] font-extrabold text-slate-800 leading-none mb-2">{completedSessionsCount}</p>
              <p className="text-[13px] font-bold text-[#4F46E5]">Total this year</p>
            </div>
            <div className="w-14 h-14 rounded-[16px] bg-indigo-50 text-[#4F46E5] flex flex-shrink-0 items-center justify-center shadow-sm">
              <CheckCircle size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white flex items-start justify-between hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2">Average Rating</p>
              <p className="text-[36px] font-extrabold text-slate-800 leading-none mb-2">{myRatingAvg != null ? Number(myRatingAvg).toFixed(1) : '—'}</p>
              <p className="text-[13px] font-bold text-amber-500">{myRatingCount ?? 0} reviews</p>
            </div>
            <div className="w-14 h-14 rounded-[16px] bg-amber-50 text-amber-500 flex flex-shrink-0 items-center justify-center shadow-sm">
              <Star size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Mentor Profile Setup */}
          <div className="lg:col-span-1 bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white flex flex-col">
            <h3 className="text-[20px] font-bold text-slate-800 tracking-tight mb-6">Your Mentor Profile</h3>
            <div className="space-y-5 flex-1 flex flex-col">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Skills / Expertise</label>
                <textarea
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="e.g., React, Node.js, System Design"
                  rows={2}
                  className="w-full text-[14px] px-4 py-3.5 rounded-[20px] border border-slate-100 bg-[#f8fafc] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400/50 transition-all resize-none shadow-inner shadow-slate-100/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Mentorship Topics</label>
                <textarea
                  value={topics}
                  onChange={e => setTopics(e.target.value)}
                  placeholder="e.g., Interview Prep, Career Guidance"
                  rows={2}
                  className="w-full text-[14px] px-4 py-3.5 rounded-[20px] border border-slate-100 bg-[#f8fafc] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400/50 transition-all resize-none shadow-inner shadow-slate-100/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Availability</label>
                <input
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  placeholder="e.g., Weekends, 6–9 PM IST"
                  className="w-full text-[14px] px-4 py-3.5 rounded-[20px] border border-slate-100 bg-[#f8fafc] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400/50 transition-all shadow-inner shadow-slate-100/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Experience</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={experience as any}
                      onChange={e => setExperience(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Years"
                      className="w-full text-[14px] pr-8 pl-4 py-3.5 rounded-[20px] border border-slate-100 bg-[#f8fafc] text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400/50 transition-all shadow-inner shadow-slate-100/50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">Yrs</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black bg-white px-2 py-1 rounded mb-1">Session Price (₹)</label>
                  <Input className="bg-white text-black placeholder:text-gray-500 border border-gray-300 focus:border-blue-500 focus:ring-blue-500" type="number" value={price as any} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')} />
                </div>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-black bg-white px-2 py-1 rounded mb-1">Payment UPI ID (For Session Earnings)</label>
                <Input className="bg-white text-black placeholder:text-gray-500 border border-gray-300 focus:border-blue-500 focus:ring-blue-500" type="text" value={paymentUpiId} onChange={(e) => setPaymentUpiId(e.target.value)} placeholder="e.g., name@okbank" />
                <p className="text-xs text-gray-500 mt-1">Platform will transfer your session earnings to this UPI ID.</p>
              </div>
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating value={Number(myRatingAvg || 0)} readOnly size={16} />
                    <span className="font-bold text-yellow-800 text-sm">{myRatingAvg ?? '—'}</span>
                  </div>
                  <p className="text-xs text-yellow-700 font-medium">Avg Rating ({myRatingCount || 0})</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="mb-1">
                    <span className="font-bold text-blue-800 text-sm">{price ? `₹${price}` : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                {saveMsg && <p className="text-[13px] text-center font-bold text-emerald-500 mb-3">{saveMsg}</p>}
                <button
                  onClick={saveProfile}
                  disabled={saving || !user?.email}
                  className="w-full py-4 text-[15px] font-bold rounded-[20px] bg-[#4F46E5] text-white hover:bg-indigo-600 transition-all cursor-pointer shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                  {saving ? 'Saving Profile...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>

          {/* Right column: Requests + Upcoming Sessions */}
          <div className="lg:col-span-2 space-y-6">

            {/* Mentees & Requests */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white">
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <Users size={22} className="text-[#4F46E5]" strokeWidth={2} />
                <h3 className="text-[20px] font-bold text-slate-800 tracking-tight">
                  Mentees & Requests
                </h3>
                {requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-auto text-[12px] font-bold bg-rose-500 text-white shadow-md shadow-rose-500/20 px-3 py-1 rounded-full">
                    {requests.filter(r => r.status === 'pending').length} New
                  </span>
                )}
              </div>
              {requests.length === 0 ? (
                <p className="text-[14px] font-medium text-slate-400">No active mentees or incoming requests yet.</p>
              ) : (
                <div className="space-y-4">
                  {requests.map(r => {
                    const prof = profiles[r.student_email];
                    const name = prof?.name || r.student_email;
                    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[24px] border border-slate-100 bg-[#f8fafc] hover:bg-white hover:shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:border-indigo-50 transition-all duration-300">
                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                          <div className="w-12 h-12 rounded-[16px] bg-indigo-50 text-[#4F46E5] flex items-center justify-center font-bold text-[15px] shadow-sm shrink-0">{initials}</div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-[15px] truncate">{name}</p>
                            <div className="mt-1.5 flex">
                              <span className={statusBadge(r.status)}>{r.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => respondRequest(r, 'accept')} className="px-4 py-2.5 text-[13px] font-bold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all">Accept</button>
                              <button onClick={() => respondRequest(r, 'reject')} className="px-4 py-2.5 text-[13px] font-bold rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60 transition-colors">Decline</button>
                            </>
                          )}
                          {r.status === 'accepted' && (
                            <button
                              onClick={() => removeConnectionWithMentee(r.student_email)}
                              disabled={removing === r.student_email}
                              className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80 transition-colors disabled:opacity-50"
                            >
                              <UserX size={14} /> {removing === r.student_email ? 'Removing…' : 'Remove Mentee'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-sky-50/60 rounded-full blur-[40px] -mt-10 -mr-10 pointer-events-none" />
                <h3 className="text-[20px] font-bold text-slate-800 tracking-tight mb-6 flex items-center gap-3 relative z-10">
                  <Calendar size={22} className="text-sky-500" strokeWidth={2} />
                  Upcoming Sessions
                  <span className="ml-auto text-[13px] font-bold text-slate-400">{upcomingSessions.length} Scheduled</span>
                </h3>
                <div className="space-y-4 relative z-10">
                  {upcomingSessions.slice(0, 5).map(s => {
                    const prof = profiles[s.student_email];
                    const name = prof?.name || s.student_email;
                    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                    const link = normalizeLink(s.meeting_link || '');
                    return (
                      <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[24px] border border-sky-100/60 bg-sky-50/40 hover:bg-sky-50 hover:shadow-sm transition-all duration-300">
                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                          <div className="w-12 h-12 rounded-[16px] bg-white text-sky-600 flex items-center justify-center font-bold text-[15px] shadow-sm shrink-0 border border-sky-100">{initials}</div>
                          <div>
                            <p className="font-bold text-slate-900 text-[15px]">{name}</p>
                            <p className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                              <Clock size={12} className="text-sky-500" strokeWidth={2.5} />
                              {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'}
                              {s.duration_minutes && <><span className="text-slate-300">•</span> {s.duration_minutes} mins</>}
                            </p>
                          </div>
                        </div>
                        {link && (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-[13px] font-bold rounded-[14px] bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-md shadow-sky-500/20 shrink-0">
                            <Video size={16} /> Join Meeting
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* All Sessions */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[20px] font-bold text-slate-800 tracking-tight flex items-center gap-3">
                  <CheckCircle size={22} className="text-[#4F46E5]" strokeWidth={2} />
                  All Session History
                  <span className="text-[14px] text-slate-400 font-medium ml-2">{sessions.length} total records</span>
                </h3>
                {sortedSessions.length > 3 && (
                  <button onClick={() => setShowAllSessions(v => !v)} className="flex items-center gap-1 text-[13px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    {showAllSessions ? <><ChevronUp size={16} /> Show Less</> : <><ChevronDown size={16} /> View All</>}
                  </button>
                )}
              </div>

              {sortedSessions.length === 0 ? (
                <p className="text-[14px] font-medium text-slate-400">No session history yet.</p>
              ) : (
                <div className="space-y-4">
                  {displayedSessions.map(s => {
                    const prof = profiles[s.student_email];
                    const name = prof?.name || s.student_email;
                    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                    const link = normalizeLink(s.meeting_link || '');
                    const isActive = scheduleForm?.session_id === s.id;

                    return (
                      <div key={s.id} className={`rounded-[24px] border border-slate-100 transition-all duration-300 overflow-hidden ${isActive ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-indigo-100' : 'bg-[#f8fafc] hover:bg-white hover:shadow-sm'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5">
                          <div className="flex items-center gap-4 mb-4 sm:mb-0">
                            <div className="w-12 h-12 rounded-[16px] bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[15px] shrink-0 border border-slate-200/50">{initials}</div>
                            <div>
                              <p className="font-bold text-slate-900 text-[15px] mb-1.5">{name}</p>
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className={statusBadge(s.status)}>{s.status}</span>
                                {s.scheduled_at && (
                                  <span className="text-[12px] text-slate-500 font-medium flex items-center gap-1">
                                    <Clock size={12} className="text-slate-400" /> {new Date(s.scheduled_at).toLocaleString()}
                                  </span>
                                )}
                                {s.amount != null && (
                                  <span className="text-[12px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">₹{s.amount}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            {link && s.status === 'scheduled' && (
                              <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-[14px] bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-md shadow-sky-500/20">
                                <Video size={16} /> Join
                              </a>
                            )}
                            {s.status === 'paid' && (
                              <button
                                onClick={() => setScheduleForm(isActive ? null : { session_id: s.id, scheduled_at: '', duration_minutes: s.duration_minutes || 60, meeting_link: s.meeting_link || '' })}
                                className="px-5 py-2.5 text-[13px] font-bold rounded-[14px] bg-[#4F46E5] text-white hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/20"
                              >
                                {isActive ? 'Cancel Setup' : 'Schedule Meets'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline schedule form for paid sessions */}
                        {s.status === 'paid' && isActive && (
                          <div className="p-6 pt-0 border-t border-slate-100/80 bg-[#f8fafc] mt-2">
                            <h4 className="text-[13px] font-bold text-slate-800 mb-4 mt-6 uppercase tracking-wider">Finalize Schedule</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                              <input
                                type="datetime-local"
                                value={scheduleForm?.scheduled_at || ''}
                                onChange={e => setScheduleForm(f => f ? { ...f, scheduled_at: e.target.value } : f)}
                                className="col-span-2 text-[14px] px-4 py-3.5 rounded-[16px] border border-slate-100 bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400/50 shadow-inner shadow-slate-100/50 transition-all"
                              />
                              <input
                                placeholder="Add generic Meet link..."
                                value={scheduleForm?.meeting_link || ''}
                                onChange={e => setScheduleForm(f => f ? { ...f, meeting_link: e.target.value } : f)}
                                className="text-[14px] px-4 py-3.5 rounded-[16px] border border-slate-100 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400/50 shadow-inner shadow-slate-100/50 transition-all"
                              />
                              <button
                                disabled={!scheduleForm?.scheduled_at}
                                onClick={() => {
                                  if (!scheduleForm?.scheduled_at) return;
                                  scheduleSession(scheduleForm.session_id, scheduleForm.scheduled_at, scheduleForm.duration_minutes, scheduleForm.meeting_link);
                                }}
                                className="py-3.5 text-[14px] font-bold rounded-[16px] bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/20"
                              >
                                Save Details
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Start Modal */}
      {meetingDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setMeetingDialog(null)}>
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-[0_20px_60px_rgb(0,0,0,0.1)] border border-white relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-sky-50/80 rounded-full blur-[40px] -mt-10 -mr-10 pointer-events-none" />
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-5 shadow-sm border border-sky-200/50">
                <Video size={30} strokeWidth={2} />
              </div>
              <h2 className="text-[22px] font-extrabold text-slate-900 mb-2">Session Starting Now</h2>
              <p className="text-[15px] font-medium text-slate-600 mb-6 px-4">
                You have a scheduled mentoring session with <span className="font-bold text-slate-800">{profiles[meetingDialog.student_email]?.name || meetingDialog.student_email}</span>
                {meetingDialog.scheduled_at && <span className="block mt-1 text-slate-400 text-[13px]">{new Date(meetingDialog.scheduled_at).toLocaleString()}</span>}
              </p>

              <div className="flex flex-col gap-3">
                {meetingDialog.meeting_link ? (
                  <a href={normalizeLink(meetingDialog.meeting_link)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 text-[15px] font-bold rounded-[20px] bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/25">
                    Launch Meeting
                  </a>
                ) : <p className="text-[14px] font-medium text-slate-500 mb-2 bg-slate-50 py-3 rounded-[16px]">No meeting link provided.</p>}

                <button onClick={() => setMeetingDialog(null)} className="w-full py-4 text-[15px] font-bold rounded-[20px] bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200/60">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AlumniNavigation>
  );
}