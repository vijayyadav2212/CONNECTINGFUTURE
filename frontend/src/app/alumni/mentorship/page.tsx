"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import AlumniNavigation from '../AluminaNavigation';
import { useToast } from '@/hooks/use-toast';
import StarRating from '@/components/ui/star-rating';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export default function MentorshipPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [skills, setSkills] = useState('');
  const [topics, setTopics] = useState('');
  const [availability, setAvailability] = useState('');
  const [experience, setExperience] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [scheduleForm, setScheduleForm] = useState<{ session_id: number; scheduled_at: string; duration_minutes: number } | null>(null);
  const [prevRequests, setPrevRequests] = useState<Record<number, string>>({});
  const [prevSessions, setPrevSessions] = useState<Record<number, string>>({});
  const [removing, setRemoving] = useState<string | null>(null);
  const [myRatingAvg, setMyRatingAvg] = useState<number | null>(null);
  const [myRatingCount, setMyRatingCount] = useState<number | null>(null);
  const [meetingDialog, setMeetingDialog] = useState<Session | null>(null);
  const [alertedStart, setAlertedStart] = useState<Record<number, boolean>>({});

  // Dynamic stats derived from backend data
  const activeMenteesCount = useMemo(
    () => requests.filter((r) => r.status === 'accepted').length,
    [requests]
  );
  const completedSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === 'completed').length,
    [sessions]
  );
  const myRatingAvgDisplay = useMemo(
    () => (myRatingAvg == null ? '—' : Number(myRatingAvg).toFixed(1)),
    [myRatingAvg]
  );
  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'scheduled' && s.scheduled_at)
        .sort((a, b) => new Date(a.scheduled_at || '').getTime() - new Date(b.scheduled_at || '').getTime())
        .slice(0, 5),
    [sessions]
  );

  useEffect(() => {
    async function loadProfile() {
      if (!user?.email) return;
      try {
        const res = await fetch(`/api/mentors/profile?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) return;
        const { mentor } = await res.json();
        setSkills(mentor?.skills || '');
        setTopics(mentor?.topics || '');
        setAvailability(mentor?.availability || '');
        setExperience(mentor?.experience_years ?? '');
        setPrice(mentor?.price ?? '');
        setMyRatingAvg(mentor?.rating_avg ?? null);
        setMyRatingCount(mentor?.rating_count ?? null);
      } catch {}
    }
    loadProfile();
  }, [user?.email]);

  async function reloadMentorData() {
    if (!user?.email) return;
    try {
      const rq = await fetch(`${API_BASE}/api/mentorship/requests?user_email=${encodeURIComponent(user.email)}&role=mentor`);
      const rj = await rq.json();
      const newRequests: Request[] = rj.requests || [];
      setRequests(newRequests);

      const sq = await fetch(`${API_BASE}/api/mentorship/sessions?user_email=${encodeURIComponent(user.email)}&role=mentor`);
      const sj = await sq.json();
      const newSessions: Session[] = sj.sessions || [];
      setSessions(newSessions);

      // Hydrate student profiles from fresh results
      const emails = Array.from(new Set([
        ...newRequests.map((r) => r.student_email),
        ...newSessions.map((s) => s.student_email),
      ]));
      const entries = await Promise.all(
        emails.map(async (email) => {
          try {
            const r = await fetch(`${API_BASE}/api/users/by-email?email=${encodeURIComponent(email)}`);
            const j = await r.json();
            return [email, j.user] as const;
          } catch {
            return [email, { email } as UserProfile] as const;
          }
        })
      );
      const map: Record<string, UserProfile> = {};
      entries.forEach(([email, prof]) => { if (email) map[email] = prof as UserProfile; });
      setProfiles(map);
    } catch {}
  }

  useEffect(() => {
    reloadMentorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Poll for notifications: new/incoming requests and upcoming sessions
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!user?.email) return;
      try {
        const rq = await fetch(`${API_BASE}/api/mentorship/requests?user_email=${encodeURIComponent(user.email)}&role=mentor`);
        const rj = await rq.json();
        const newRequests: Request[] = rj.requests || [];
        // New pending requests detection
        newRequests.forEach((r) => {
          const prev = prevRequests[r.id];
          if (!prev && r.status === 'pending') {
            toast({ title: 'New Mentorship Request', description: `${r.student_email} requested mentorship.` });
          }
        });
        const map: Record<number, string> = {};
        newRequests.forEach((r) => { map[r.id] = r.status; });
        setPrevRequests(map);
        setRequests(newRequests);
      } catch {}

      try {
        const sq = await fetch(`${API_BASE}/api/mentorship/sessions?user_email=${encodeURIComponent(user.email)}&role=mentor`);
        const sj = await sq.json();
        const newSessions: Session[] = sj.sessions || [];
        // Upcoming session detection
        newSessions.forEach((s) => {
          const prev = prevSessions[s.id];
          if ((prev || '') !== s.status && s.status === 'scheduled' && s.scheduled_at) {
            const when = new Date(s.scheduled_at);
            const diff = when.getTime() - Date.now();
            if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
              toast({ title: 'Upcoming Session', description: `${when.toLocaleString()} with ${s.student_email}` });
            }
          }
          // Meeting start pop-up: when scheduled time is reached and not alerted yet
          if (s.status === 'scheduled' && s.scheduled_at && !alertedStart[s.id]) {
            const when = new Date(s.scheduled_at);
            const diffStart = when.getTime() - Date.now();
            if (diffStart <= 0) {
              setMeetingDialog(s);
              setAlertedStart((prev) => ({ ...prev, [s.id]: true }));
            }
          }
        });
        const sessMap: Record<number, string> = {};
        newSessions.forEach((s) => { sessMap[s.id] = s.status; });
        setPrevSessions(sessMap);
        setSessions(newSessions);
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, prevRequests, prevSessions]);

  async function respondRequest(request: Request, action: 'accept' | 'reject') {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/respond`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mentor_email: user.email, student_email: request.student_email, action }),
      });
      if (!res.ok) {
        const msg = `Respond failed (${res.status})`;
        throw new Error(msg);
      }
      toast({ title: action === 'accept' ? 'Request Accepted' : 'Request Declined' });
      await reloadMentorData();
    } catch (e) {
      toast({ title: 'Action Failed', description: e instanceof Error ? e.message : 'Please try again.', variant: 'destructive' });
    }
  }

  async function scheduleSession(session_id: number, scheduled_at: string, duration_minutes: number) {
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/sessions/schedule`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session_id, scheduled_at, duration_minutes }),
      });
      if (!res.ok) throw new Error('Schedule failed');
      toast({ title: 'Session Scheduled', description: new Date(scheduled_at).toLocaleString() });
      setScheduleForm(null);
      if (user?.email) {
        const sq = await fetch(`${API_BASE}/api/mentorship/sessions?user_email=${encodeURIComponent(user.email)}&role=mentor`);
        const sj = await sq.json();
        setSessions(sj.sessions || []);
      }
    } catch (e) {
      toast({ title: 'Scheduling Error', description: 'Please try again.', variant: 'destructive' });
    }
  }

  async function removeConnectionWithMentee(student_email: string) {
    if (!user?.email) return;
    setRemoving(student_email);
    try {
      const res = await fetch(`${API_BASE}/api/connections/remove`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, other_email: student_email }),
      });
      if (!res.ok) throw new Error('Remove failed');
      toast({ title: 'Connection Removed', description: `You removed ${student_email}.` });
      await reloadMentorData();
    } catch (e) {
      toast({ title: 'Remove Failed', description: 'Please try again.', variant: 'destructive' });
    }
    setRemoving(null);
  }

  async function saveProfile() {
    if (!user?.email) return;
    setSaving(true);
    try {
      const res = await fetch('/api/mentors/profile', {
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
      // No toast implementation here; rely on UI state
    } catch {}
    setSaving(false);
  }
  return (
    <AlumniNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-4xl">🧑‍🏫</span>
                    <h1 className="text-4xl font-black">Mentorship Hub</h1>
                  </div>
                  <p className="text-blue-100 text-xl">Shape the future through meaningful guidance</p>
                </div>
                <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/30 transition-all duration-300 shadow-lg border border-white/20">
                  Accept New Mentees
                </button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Mentorship Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 text-center group hover:scale-105 transition-all duration-500">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white text-3xl">👥</span>
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-3">{activeMenteesCount}</h3>
              <p className="text-slate-600 font-semibold text-lg">Active Mentees</p>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full w-4/5"></div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 text-center group hover:scale-105 transition-all duration-500">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white text-3xl">✅</span>
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-3">{completedSessionsCount}</h3>
              <p className="text-slate-600 font-semibold text-lg">Sessions Completed</p>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full w-full"></div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 text-center group hover:scale-105 transition-all duration-500">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white text-3xl">⭐</span>
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-3">{myRatingAvgDisplay}</h3>
              <p className="text-slate-600 font-semibold text-lg">Average Rating</p>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full w-5/6"></div>
              </div>
            </div>
          </div>
          
          {/* Mentor Profile Setup */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20">
            <h3 className="text-3xl font-black text-slate-900 mb-6">Your Mentor Profile</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skills / Expertise</label>
                <Textarea value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g., React, Node.js, System Design" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mentorship Topics</label>
                <Textarea value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="e.g., Interview Prep, Career Guidance" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
                <Input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="e.g., Weekends, 6-9 PM IST" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Experience (years)</label>
                  <Input type="number" value={experience as any} onChange={(e) => setExperience(e.target.value ? Number(e.target.value) : '')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Session Price (₹)</label>
                  <Input type="number" value={price as any} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')} />
                </div>
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
                  <p className="text-xs text-blue-700 font-medium">Session Price</p>
                </div>
              </div>
              <div className="lg:col-span-2 flex justify-end">
                <Button onClick={saveProfile} disabled={saving || !user?.email}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          </div>

          {/* Incoming Requests */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-black text-slate-900">Incoming Requests</h3>
            </div>
            <div className="space-y-6">
              {requests.length > 0 ? (
                requests.map((r) => {
                  const prof = profiles[r.student_email];
                  const name = prof?.name || r.student_email;
                  return (
                    <div key={r.id} className="flex items-center justify-between p-6 border-2 border-slate-200 rounded-2xl hover:border-blue-400 transition-all duration-300 bg-gradient-to-r from-white to-blue-50 group">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <span className="text-white font-bold text-xl">{String(name).charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xl">{name}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : r.status === 'accepted' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{r.status}</span>
                          </div>
                        </div>
                      </div>
                      {r.status === 'pending' ? (
                        <div className="flex space-x-4">
                          <button onClick={() => respondRequest(r, 'accept')} className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-500 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                            Accept
                          </button>
                          <button onClick={() => respondRequest(r, 'reject')} className="bg-gradient-to-r from-red-400 to-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:from-red-500 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                            Decline
                          </button>
                        </div>
                      ) : (
                        r.status === 'accepted' ? (
                          <div>
                            <button onClick={() => removeConnectionWithMentee(r.student_email)} className="bg-gradient-to-r from-red-400 to-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:from-red-500 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105" disabled={removing === r.student_email}>
                              {removing === r.student_email ? 'Removing...' : 'Remove Mentee'}
                            </button>
                          </div>
                        ) : null
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-600">No incoming requests.</div>
              )}
            </div>
          </div>

          {/* Current Mentees / Sessions */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-black text-slate-900">Your Sessions</h3>
            </div>
            <div className="space-y-6">
              {sessions.length > 0 ? (
                sessions.map((s) => {
                  const prof = profiles[s.student_email];
                  const name = prof?.name || s.student_email;
                  return (
                    <div key={s.id} className="p-6 border-2 border-slate-200 rounded-2xl hover:border-blue-400 transition-all duration-300 bg-gradient-to-r from-white to-blue-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold">{String(name).charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{name}</p>
                            <p className="text-slate-600 text-sm">Amount: {s.amount ? `₹${s.amount}` : '—'} {s.currency || ''}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : s.status === 'paid' ? 'bg-green-100 text-green-700' : s.status === 'completed' ? 'bg-slate-100 text-slate-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.status}</span>
                      </div>
                      <div className="text-slate-700">Scheduled: {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'} ({s.duration_minutes || 60} mins)</div>
                      {s.meeting_link ? (
                        <div className="mt-1 text-sm">
                          <a href={s.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Join Meeting</a>
                        </div>
                      ) : null}
                      {s.status === 'paid' ? (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Input
                            type="datetime-local"
                            value={scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.scheduled_at : ''}
                            onChange={(e) => setScheduleForm({
                              session_id: s.id,
                              scheduled_at: e.target.value,
                              duration_minutes: scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.duration_minutes : 60,
                            })}
                          />
                          <Input
                            type="number"
                            placeholder="Duration (mins)"
                            value={scheduleForm && scheduleForm.session_id === s.id ? (scheduleForm.duration_minutes as number) : (60 as number)}
                            onChange={(e) => setScheduleForm({
                              session_id: s.id,
                              scheduled_at: scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.scheduled_at : '',
                              duration_minutes: Number(e.target.value) || 60,
                            })}
                          />
                          <Button
                            onClick={() => {
                              if (!(scheduleForm && scheduleForm.session_id === s.id && scheduleForm.scheduled_at)) return;
                              const when = new Date(scheduleForm.scheduled_at);
                              const validFuture = when.getTime() > Date.now();
                              const dur = Number(scheduleForm.duration_minutes) || 60;
                              if (!validFuture) {
                                toast({ title: 'Invalid time', description: 'Pick a future date/time.', variant: 'destructive' });
                                return;
                              }
                              if (dur < 15 || dur > 240) {
                                toast({ title: 'Invalid duration', description: 'Duration must be 15-240 minutes.', variant: 'destructive' });
                                return;
                              }
                              scheduleSession(scheduleForm.session_id, scheduleForm.scheduled_at, dur);
                            }}
                            disabled={!(scheduleForm && scheduleForm.session_id === s.id && scheduleForm.scheduled_at)}
                          >
                            Schedule
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-600">No sessions yet.</div>
              )}
            </div>
          </div>

          {/* New Enhanced Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mentorship Analytics */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                <span className="mr-3">📊</span>
                Mentorship Analytics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Success Rate</span>
                  <span className="font-bold text-green-600">87%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full w-5/6"></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Response Time</span>
                  <span className="font-bold text-blue-600">2.4 hrs</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                <span className="mr-3">🗓️</span>
                Upcoming Sessions
              </h3>
              <div className="space-y-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((s) => {
                    const prof = profiles[s.student_email];
                    const name = prof?.name || s.student_email;
                    const initial = String(name || '').charAt(0).toUpperCase() || 'S';
                    const when = s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—';
                    return (
                      <div key={`up-${s.id}`} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold">{initial}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{name}</p>
                          <p className="text-slate-600 text-sm">{when}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-600">No upcoming sessions.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/* Meeting Start Dialog */}
    <Dialog open={!!meetingDialog} onOpenChange={(open) => { if (!open) setMeetingDialog(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session starting now</DialogTitle>
          <DialogDescription>
            {meetingDialog ? (
              <span>
                With {profiles[meetingDialog.student_email]?.name || meetingDialog.student_email}. Scheduled at {meetingDialog.scheduled_at ? new Date(meetingDialog.scheduled_at).toLocaleString() : '—'}.
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {meetingDialog?.meeting_link ? (
          <div className="mt-2">
            <a href={meetingDialog.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md hover:from-blue-700 hover:to-indigo-700">Open Google Meet</a>
          </div>
        ) : (
          <p className="text-sm text-slate-600">No meeting link provided.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setMeetingDialog(null)}>Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </AlumniNavigation>
  );
}
