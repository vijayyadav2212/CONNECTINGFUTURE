"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import AlumniNavigation from '../AluminaNavigation';
import {
  Users, CheckCircle, Star, Calendar, Clock, UserX, ChevronDown, ChevronUp, Video
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
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    paid: 'bg-purple-50 text-purple-700 border-purple-200',
    completed: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return `text-[11px] font-bold px-2 py-0.5 rounded-full border ${map[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`;
}

export default function MentorshipPage() {
  const { user } = useUser();
  const [skills, setSkills] = useState('');
  const [topics, setTopics] = useState('');
  const [availability, setAvailability] = useState('');
  const [experience, setExperience] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
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
        }),
      });
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch { setSaveMsg('Error saving'); }
    setSaving(false);
  }

  const displayedSessions = showAllSessions ? sortedSessions : sortedSessions.slice(0, 3);

  return (
    <AlumniNavigation>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Mentorship Hub</h1>
            <p className="text-gray-500 text-sm">Manage your mentees, sessions, and mentor profile all in one place.</p>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/30 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Active Mentees</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{activeMenteesCount}</p>
              <p className="text-sm font-semibold text-green-600">Accepted requests</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 text-green-600"><Users size={22} /></div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Sessions Completed</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{completedSessionsCount}</p>
              <p className="text-sm font-semibold text-blue-600">This year</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><CheckCircle size={22} /></div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{myRatingAvg != null ? Number(myRatingAvg).toFixed(1) : '—'}</p>
              <p className="text-sm font-semibold text-amber-600">{myRatingCount ?? 0} reviews</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-500"><Star size={22} /></div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Mentor Profile Setup */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-5">Your Mentor Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Skills / Expertise</label>
                <textarea
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="e.g., React, Node.js, System Design"
                  rows={2}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mentorship Topics</label>
                <textarea
                  value={topics}
                  onChange={e => setTopics(e.target.value)}
                  placeholder="e.g., Interview Prep, Career Guidance"
                  rows={2}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Availability</label>
                <input
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  placeholder="e.g., Weekends, 6–9 PM IST"
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Experience (yrs)</label>
                  <input
                    type="number"
                    value={experience as any}
                    onChange={e => setExperience(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Price (₹)</label>
                  <input
                    type="number"
                    value={price as any}
                    onChange={e => setPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                  />
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving || !user?.email}
                className="w-full py-2.5 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
              {saveMsg && <p className="text-xs text-center font-semibold text-green-600">{saveMsg}</p>}
            </div>
          </div>

          {/* Right column: Requests + Upcoming Sessions */}
          <div className="lg:col-span-2 space-y-5">

            {/* Incoming Requests */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={16} className="text-green-600" />
                Incoming Requests
                {requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-auto text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {requests.filter(r => r.status === 'pending').length} new
                  </span>
                )}
              </h3>
              {requests.length === 0 ? (
                <p className="text-sm text-gray-400">No incoming requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {requests.map(r => {
                    const prof = profiles[r.student_email];
                    const name = prof?.name || r.student_email;
                    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">{initials}</div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                            <span className={statusBadge(r.status)}>{r.status}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => respondRequest(r, 'accept')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">Accept</button>
                              <button onClick={() => respondRequest(r, 'reject')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors">Decline</button>
                            </>
                          )}
                          {r.status === 'accepted' && (
                            <button
                              onClick={() => removeConnectionWithMentee(r.student_email)}
                              disabled={removing === r.student_email}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-colors disabled:opacity-50"
                            >
                              <UserX size={12} /> {removing === r.student_email ? 'Removing…' : 'Remove'}
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  Upcoming Sessions
                  <span className="ml-auto text-xs text-gray-400">{upcomingSessions.length} scheduled</span>
                </h3>
                <div className="space-y-3">
                  {upcomingSessions.slice(0, 5).map(s => {
                    const prof = profiles[s.student_email];
                    const name = prof?.name || s.student_email;
                    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                    const link = normalizeLink(s.meeting_link || '');
                    return (
                      <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-blue-50 bg-blue-50/50 hover:bg-blue-50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">{initials}</div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock size={10} /> {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'}
                              {s.duration_minutes && <> · {s.duration_minutes} mins</>}
                            </p>
                          </div>
                        </div>
                        {link && (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0">
                            <Video size={12} /> Join
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* All Sessions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              All Sessions
              <span className="text-xs text-gray-400 font-normal">{sessions.length} total</span>
            </h3>
            {sortedSessions.length > 3 && (
              <button onClick={() => setShowAllSessions(v => !v)} className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:underline">
                {showAllSessions ? <><ChevronUp size={14} />Show less</> : <><ChevronDown size={14} />Show all</>}
              </button>
            )}
          </div>

          {sortedSessions.length === 0 ? (
            <p className="text-sm text-gray-400">No sessions yet.</p>
          ) : (
            <div className="space-y-3">
              {displayedSessions.map(s => {
                const prof = profiles[s.student_email];
                const name = prof?.name || s.student_email;
                const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                const link = normalizeLink(s.meeting_link || '');
                const isActive = scheduleForm?.session_id === s.id;
                return (
                  <div key={s.id} className="rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">{initials}</div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={statusBadge(s.status)}>{s.status}</span>
                            {s.scheduled_at && (
                              <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                                <Clock size={10} /> {new Date(s.scheduled_at).toLocaleString()}
                              </span>
                            )}
                            {s.amount != null && (
                              <span className="text-[11px] text-gray-500">₹{s.amount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {link && s.status === 'scheduled' && (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                            <Video size={12} /> Join
                          </a>
                        )}
                        {s.status === 'paid' && (
                          <button
                            onClick={() => setScheduleForm(isActive ? null : { session_id: s.id, scheduled_at: '', duration_minutes: s.duration_minutes || 60, meeting_link: s.meeting_link || '' })}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                          >
                            {isActive ? 'Cancel' : 'Schedule'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline schedule form for paid sessions */}
                    {s.status === 'paid' && isActive && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                          type="datetime-local"
                          value={scheduleForm?.scheduled_at || ''}
                          onChange={e => setScheduleForm(f => f ? { ...f, scheduled_at: e.target.value } : f)}
                          className="col-span-2 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                        />
                        <input
                          placeholder="Meet link (optional)"
                          value={scheduleForm?.meeting_link || ''}
                          onChange={e => setScheduleForm(f => f ? { ...f, meeting_link: e.target.value } : f)}
                          className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                        />
                        <button
                          disabled={!scheduleForm?.scheduled_at}
                          onClick={() => {
                            if (!scheduleForm?.scheduled_at) return;
                            scheduleSession(scheduleForm.session_id, scheduleForm.scheduled_at, scheduleForm.duration_minutes, scheduleForm.meeting_link);
                          }}
                          className="py-2 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Meeting Start Modal */}
      {meetingDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setMeetingDialog(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Session Starting Now</h2>
            <p className="text-sm text-gray-600 mb-5">
              With {profiles[meetingDialog.student_email]?.name || meetingDialog.student_email}
              {meetingDialog.scheduled_at && <> · {new Date(meetingDialog.scheduled_at).toLocaleString()}</>}
            </p>
            {meetingDialog.meeting_link ? (
              <a href={normalizeLink(meetingDialog.meeting_link)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors mb-3">
                <Video size={16} /> Open Meeting
              </a>
            ) : <p className="text-sm text-gray-500 mb-3">No meeting link provided.</p>}
            <button onClick={() => setMeetingDialog(null)} className="w-full py-2.5 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Dismiss</button>
          </div>
        </div>
      )}
    </AlumniNavigation>
  );
}