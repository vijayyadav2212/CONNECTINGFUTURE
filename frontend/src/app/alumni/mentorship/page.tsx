"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import StarRating from '@/components/ui/star-rating';
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

type DailySessionPlan = {
  id: number;
  mentor_email: string;
  title: string;
  description?: string | null;
  daily_time: string;
  timezone?: string | null;
  start_date: string;
  end_date: string;
  duration_minutes?: number;
  meeting_link?: string | null;
  max_mentees?: number;
  is_active?: boolean;
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

function parseAvailabilityRange(value?: string) {
  if (!value) return { from: '', to: '' };
  const m = String(value).match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
  if (!m) return { from: '', to: '' };
  return { from: m[1], to: m[2] };
}

function minutesBetweenTimes(from: string, to: string) {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  if ([fh, fm, th, tm].some(Number.isNaN)) return 60;
  let start = fh * 60 + fm;
  let end = th * 60 + tm;
  if (end <= start) end += 24 * 60;
  return Math.max(15, end - start);
}

function addMinutesToTime(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number);
  if ([h, m].some(Number.isNaN)) return time;
  const total = h * 60 + m + (minutes || 0);
  const hh = Math.floor((total % (24 * 60)) / 60).toString().padStart(2, '0');
  const mm = (total % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function isSessionCompletedByTime(session: Session) {
  if (!session.scheduled_at) return false;
  const start = new Date(session.scheduled_at).getTime();
  const durationMs = (session.duration_minutes || 60) * 60 * 1000;
  return Date.now() >= start + durationMs;
}

function getSessionDisplayStatus(session: Session) {
  if (session.status === 'completed' || isSessionCompletedByTime(session)) return 'completed';
  return session.status;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-500 border-gray-200',
    accepted: 'bg-[#1A1C23] text-white border-black',
    rejected: 'bg-gray-50 text-gray-400 border-gray-100',
    removed: 'bg-gray-50 text-gray-400 border-gray-100',
    scheduled: 'bg-[#F4F6FB] text-gray-700 border-gray-200',
    paid: 'bg-[#1A1C23] text-white border-black',
    completed: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return `text-[11px] font-bold px-3 py-1 rounded-[8px] border ${map[status] || 'bg-gray-100 text-gray-500 border-gray-200'} uppercase tracking-wider`;
}

export default function MentorshipPage() {
  const { user } = useUser();
  const [skills, setSkills] = useState('');
  const [topics, setTopics] = useState('');
  const [availability, setAvailability] = useState('');
  const [availabilityFrom, setAvailabilityFrom] = useState('');
  const [availabilityTo, setAvailabilityTo] = useState('');
  const [experience, setExperience] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | ''>('');
  const [subscriptionDurationDays, setSubscriptionDurationDays] = useState<number | ''>(30);
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
  const [paidSessionAlert, setPaidSessionAlert] = useState<Session | null>(null);
  const [dismissedSessions, setDismissedSessions] = useState<Record<number, boolean>>({});
  const [dailySessions, setDailySessions] = useState<DailySessionPlan[]>([]);
  const [savingDailyPlan, setSavingDailyPlan] = useState(false);
  const [deactivatingPlanId, setDeactivatingPlanId] = useState<number | null>(null);
  const [dailyPlanMsg, setDailyPlanMsg] = useState('');
  const [dailyPlanForm, setDailyPlanForm] = useState({
    title: '',
    description: '',
    session_from_time: '18:00',
    session_to_time: '19:00',
    timezone: 'Asia/Kolkata',
    start_date: '',
    end_date: '',
    meeting_link: '',
    max_mentees: 50,
  });

  const activeMenteesCount = useMemo(() => requests.filter(r => r.status === 'accepted').length, [requests]);
  const completedSessionsCount = useMemo(() => sessions.filter(s => getSessionDisplayStatus(s) === 'completed').length, [sessions]);
  const upcomingSessions = useMemo(() =>
    sessions.filter(s => s.status === 'scheduled' && s.scheduled_at && !isSessionCompletedByTime(s))
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()),
    [sessions]);
  const sortedSessions = useMemo(() =>
    sessions.slice().sort((a, b) => {
      const aIsPaid = a.status === 'paid';
      const bIsPaid = b.status === 'paid';
      if (aIsPaid && !bIsPaid) return -1;
      if (!aIsPaid && bIsPaid) return 1;
      if (aIsPaid && bIsPaid) return b.id - a.id;
      
      if (a.scheduled_at && b.scheduled_at) return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      if (a.scheduled_at && !b.scheduled_at) return -1;
      if (!a.scheduled_at && b.scheduled_at) return 1;
      
      return b.id - a.id;
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

      const paidSessions = newSessions.filter(s => s.status === 'paid' && !dismissedSessions[s.id]);
      if (paidSessions.length > 0 && !paidSessionAlert) {
        setPaidSessionAlert(paidSessions[0]);
      }

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

  async function loadDailySessionPlans() {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/daily-sessions?mentor_email=${encodeURIComponent(user.email)}&active_only=1`);
      if (!res.ok) throw new Error('Failed to fetch daily plans');
      const data = await res.json();
      setDailySessions(data.daily_sessions || []);
    } catch {
      setDailyPlanMsg('Unable to load daily plans right now.');
    }
  }

  async function createDailySessionPlan() {
    if (!user?.email || !dailyPlanForm.title || !dailyPlanForm.start_date || !dailyPlanForm.end_date || !dailyPlanForm.session_from_time || !dailyPlanForm.session_to_time) return;
    if (new Date(dailyPlanForm.end_date) < new Date(dailyPlanForm.start_date)) {
      setDailyPlanMsg('End date cannot be before start date.');
      return;
    }
    setSavingDailyPlan(true);
    setDailyPlanMsg('');
    try {
      const duration = minutesBetweenTimes(dailyPlanForm.session_from_time, dailyPlanForm.session_to_time);
      const res = await fetch(`${API_BASE}/api/mentorship/daily-sessions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mentor_email: user.email,
          title: dailyPlanForm.title,
          description: dailyPlanForm.description,
          daily_time: dailyPlanForm.session_from_time,
          timezone: dailyPlanForm.timezone,
          start_date: dailyPlanForm.start_date,
          end_date: dailyPlanForm.end_date,
          duration_minutes: duration,
          meeting_link: dailyPlanForm.meeting_link,
          max_mentees: dailyPlanForm.max_mentees,
        }),
      });
      if (!res.ok) throw new Error('Failed to create daily session plan');
      setDailyPlanForm({
        title: '',
        description: '',
        session_from_time: '18:00',
        session_to_time: '19:00',
        timezone: 'Asia/Kolkata',
        start_date: '',
        end_date: '',
        meeting_link: '',
        max_mentees: 50,
      });
      await loadDailySessionPlans();
      setDailyPlanMsg('Daily plan created successfully.');
    } catch {
      setDailyPlanMsg('Could not create daily plan. Please try again.');
    }
    setSavingDailyPlan(false);
  }

  async function deactivateDailySessionPlan(id: number) {
    if (!user?.email) return;
    setDeactivatingPlanId(id);
    setDailyPlanMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/daily-sessions/${id}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mentor_email: user.email }),
      });
      if (!res.ok) throw new Error('Failed to deactivate plan');
      await loadDailySessionPlans();
      setDailyPlanMsg('Daily plan deactivated.');
    } catch {
      setDailyPlanMsg('Could not deactivate this plan. Please retry.');
    }
    setDeactivatingPlanId(null);
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
        const av = mentor?.availability || '';
        setAvailability(av);
        const parsed = parseAvailabilityRange(av);
        setAvailabilityFrom(parsed.from);
        setAvailabilityTo(parsed.to);
        setExperience(mentor?.experience_years ?? '');
        setPrice(mentor?.price ?? '');
        setSubscriptionPrice(mentor?.subscription_price ?? '');
        setSubscriptionDurationDays(mentor?.subscription_duration_days ?? 30);
        setPaymentUpiId(mentor?.payment_upi_id || '');
        setMyRatingAvg(mentor?.rating_avg ?? null);
        setMyRatingCount(mentor?.rating_count ?? null);
      } catch { }
    }
    loadProfile();
    reloadMentorData();
    loadDailySessionPlans();
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
      const res = await fetch(`${API_BASE}/api/connections/remove`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, other_email: student_email }),
      });
      if (!res.ok) throw new Error('Failed to remove connection');
      await reloadMentorData();
    } catch { }
    setRemoving(null);
  }

  async function saveProfile() {
    if (!user?.email) return;
    setSaving(true);
    try {
      const availabilityRange = availabilityFrom && availabilityTo ? `${availabilityFrom} - ${availabilityTo}` : availability;
      await fetch(`${API_BASE}/api/mentors/profile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          skills,
          topics,
          availability: availabilityRange,
          experience_years: experience === '' ? 0 : Number(experience),
          price: price === '' ? 0 : Number(price),
          subscription_price: subscriptionPrice === '' ? 0 : Number(subscriptionPrice),
          subscription_duration_days: subscriptionDurationDays === '' ? 30 : Number(subscriptionDurationDays),
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
      <div className="space-y-8 max-w-[1400px] mx-auto h-full flex flex-col font-sans text-[#111111] mb-12">
        
        {/* Page Header Banner */}
        <div className="bg-[#1A1C23] rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="relative z-10 max-w-2xl">
             <h1 className="text-[32px] md:text-[38px] font-bold mb-2 tracking-tight">Mentorship Hub</h1>
             <p className="text-[#8F93A3] text-[14px] font-medium leading-[1.6]">
               Manage your mentees, daily sessions, and mentor profile seamlessly.
             </p>
           </div>
           {/* Abstract line art */}
           <svg className="absolute right-0 bottom-0 w-[300px] h-full pointer-events-none opacity-50" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40,70 C60,70 70,30 90,30 C110,30 120,60 140,60 C160,60 170,20 190,20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
           </svg>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-50 flex items-start justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">Active Mentees</p>
              <p className="text-[32px] font-extrabold text-[#111111] tracking-tight">{activeMenteesCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center shrink-0">
              <Users size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-50 flex items-start justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">Sessions Done</p>
              <p className="text-[32px] font-extrabold text-[#111111] tracking-tight">{completedSessionsCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center shrink-0">
              <CheckCircle size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-50 flex items-start justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">Avg Rating</p>
              <p className="text-[32px] font-extrabold text-[#111111] tracking-tight">{myRatingAvg != null ? Number(myRatingAvg).toFixed(1) : '—'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F4F6FB] text-[#1A1C23] flex items-center justify-center shrink-0">
              <Star size={20} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left Column: Mentor Profile Setup */}
          <div className="xl:col-span-1 bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 flex flex-col">
            <h3 className="text-[22px] font-bold tracking-tight mb-6">Your Profile</h3>
            <div className="space-y-5 flex-1 flex flex-col">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Skills / Expertise</label>
                <textarea
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="e.g., React, Node.js, System Design"
                  rows={2}
                  className="w-full text-[14px] font-medium px-4 py-3.5 rounded-[16px] bg-gray-50 border border-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Mentorship Topics</label>
                <textarea
                  value={topics}
                  onChange={e => setTopics(e.target.value)}
                  placeholder="e.g., Interview Prep, Career Guidance"
                  rows={2}
                  className="w-full text-[14px] font-medium px-4 py-3.5 rounded-[16px] bg-gray-50 border border-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Availability</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    value={availabilityFrom}
                    onChange={e => setAvailabilityFrom(e.target.value)}
                    className="w-full text-[14px] font-bold px-4 py-3 rounded-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-gray-300 transition-all"
                  />
                  <input
                    type="time"
                    value={availabilityTo}
                    onChange={e => setAvailabilityTo(e.target.value)}
                    className="w-full text-[14px] font-bold px-4 py-3 rounded-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-gray-300 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Experience</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={experience as any}
                      onChange={e => setExperience(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Years"
                      className="w-full text-[14px] font-medium pr-8 pl-4 py-3.5 rounded-[16px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-gray-300 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-gray-400">Yrs</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Session (₹)</label>
                  <input className="w-full text-[14px] font-medium px-4 py-3.5 rounded-[16px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-gray-300 transition-all" type="number" value={price as any} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Sub Price (₹)</label>
                  <input className="w-full text-[14px] font-medium px-4 py-3.5 rounded-[16px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-gray-300 transition-all" type="number" value={subscriptionPrice as any} onChange={(e) => setSubscriptionPrice(e.target.value ? Number(e.target.value) : '')} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Sub Duration (Days)</label>
                  <input className="w-full text-[14px] font-medium px-4 py-3.5 rounded-[16px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-gray-300 transition-all" type="number" min={1} value={subscriptionDurationDays as any} onChange={(e) => setSubscriptionDurationDays(e.target.value ? Number(e.target.value) : '')} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Payment UPI ID</label>
                <input className="w-full text-[14px] font-medium px-4 py-3.5 rounded-[16px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-gray-300 transition-all" type="text" value={paymentUpiId} onChange={(e) => setPaymentUpiId(e.target.value)} placeholder="e.g., name@okbank" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-gray-50 p-4 rounded-[16px] border border-gray-100 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating value={Number(myRatingAvg || 0)} readOnly size={16} />
                    <span className="font-bold text-[14px]">{myRatingAvg ?? '—'}</span>
                  </div>
                  <p className="text-[12px] font-bold text-gray-400">({myRatingCount || 0} reviews)</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-[16px] border border-gray-100">
                  <p className="font-extrabold text-[16px]">{price ? `₹${price}` : '—'}</p>
                  <p className="text-[12px] font-bold text-gray-400">Per Session</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-1">Sub: {subscriptionPrice ? `₹${subscriptionPrice}` : '—'} / {subscriptionDurationDays || 30}d</p>
                </div>
              </div>

              <div className="mt-auto pt-6">
                {saveMsg && <p className="text-[13px] text-center font-bold text-[#1A1C23] mb-3">{saveMsg}</p>}
                <button
                  onClick={saveProfile}
                  disabled={saving || !user?.email}
                  className="w-full py-4 text-[15px] font-bold rounded-[20px] bg-[#1A1C23] text-white hover:bg-black transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Requests + Upcoming Sessions */}
          <div className="xl:col-span-2 space-y-6">

            {/* Mentees & Requests */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[22px] font-bold tracking-tight">
                  Mentees & Requests
                </h3>
                {requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="text-[12px] font-bold bg-[#1A1C23] text-white px-3 py-1 rounded-full">
                    {requests.filter(r => r.status === 'pending').length} New
                  </span>
                )}
              </div>
              {requests.length === 0 ? (
                <p className="text-[14px] font-bold text-gray-400">No active mentees or requests.</p>
              ) : (
                <div className="space-y-4">
                  {requests.map(r => {
                    const prof = profiles[r.student_email];
                    const name = prof?.name || r.student_email;
                    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-[20px] shadow-sm border border-gray-50 gap-4 hover:border-gray-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center font-bold text-[15px] shrink-0">{initials}</div>
                          <div>
                            <p className="font-bold text-[16px] tracking-tight">{name}</p>
                            <div className="mt-1.5 flex">
                              <span className={statusBadge(r.status)}>{r.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => respondRequest(r, 'accept')} className="px-5 py-2.5 text-[13px] font-bold rounded-[14px] bg-[#1A1C23] text-white hover:bg-black transition-colors">Accept</button>
                              <button onClick={() => respondRequest(r, 'reject')} className="px-5 py-2.5 text-[13px] font-bold rounded-[14px] bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Decline</button>
                            </>
                          )}
                          {r.status === 'accepted' && (
                            <button
                              onClick={() => removeConnectionWithMentee(r.student_email)}
                              disabled={removing === r.student_email}
                              className="px-5 py-2.5 text-[13px] font-bold rounded-[14px] bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
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

            {/* Daily Session Plans */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
              <h3 className="text-[22px] font-bold tracking-tight mb-6 flex items-center gap-3">
                Daily Session Plans
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Title</label>
                  <input
                    value={dailyPlanForm.title}
                    onChange={e => setDailyPlanForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full text-[14px] font-medium px-4 py-3 rounded-[12px] bg-white border border-gray-200 focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                     <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">From</label>
                     <input type="time" value={dailyPlanForm.session_from_time} onChange={e => setDailyPlanForm(f => ({ ...f, session_from_time: e.target.value }))} className="w-full text-[14px] font-medium px-4 py-3 rounded-[12px] bg-white border border-gray-200 focus:outline-none" />
                  </div>
                  <div>
                     <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">To</label>
                     <input type="time" value={dailyPlanForm.session_to_time} onChange={e => setDailyPlanForm(f => ({ ...f, session_to_time: e.target.value }))} className="w-full text-[14px] font-medium px-4 py-3 rounded-[12px] bg-white border border-gray-200 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                     <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Start Date</label>
                     <input type="date" value={dailyPlanForm.start_date} onChange={e => setDailyPlanForm(f => ({ ...f, start_date: e.target.value }))} className="w-full text-[14px] font-medium px-3 py-3 rounded-[12px] bg-white border border-gray-200 focus:outline-none" />
                  </div>
                  <div>
                     <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">End Date</label>
                     <input type="date" value={dailyPlanForm.end_date} onChange={e => setDailyPlanForm(f => ({ ...f, end_date: e.target.value }))} className="w-full text-[14px] font-medium px-3 py-3 rounded-[12px] bg-white border border-gray-200 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Meeting Link</label>
                  <input
                    value={dailyPlanForm.meeting_link}
                    onChange={e => setDailyPlanForm(f => ({ ...f, meeting_link: e.target.value }))}
                    className="w-full text-[14px] font-medium px-4 py-3 rounded-[12px] bg-white border border-gray-200 focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Description</label>
                  <input
                    value={dailyPlanForm.description}
                    onChange={e => setDailyPlanForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full text-[14px] font-medium px-4 py-3 rounded-[12px] bg-white border border-gray-200 focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end mt-2">
                  <button
                    onClick={createDailySessionPlan}
                    disabled={savingDailyPlan || !dailyPlanForm.title || !dailyPlanForm.start_date || !dailyPlanForm.end_date}
                    className="px-6 py-3 text-[14px] font-bold rounded-[16px] bg-[#1A1C23] text-white hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {savingDailyPlan ? 'Saving...' : 'Create Plan'}
                  </button>
                </div>
                {dailyPlanMsg && <p className="md:col-span-2 text-[12px] font-bold text-[#1A1C23] mt-2">{dailyPlanMsg}</p>}
              </div>

              <div className="mt-6 space-y-3">
                {dailySessions.length === 0 ? (
                  <p className="text-[13px] font-bold text-gray-400">No active daily plans.</p>
                ) : dailySessions.map(plan => (
                  <div key={plan.id} className="p-4 rounded-[20px] bg-white border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-gray-200">
                    <div>
                      <p className="font-bold text-[15px] tracking-tight mb-1">{plan.title}</p>
                      <p className="text-[12px] font-bold text-gray-400">{plan.daily_time} • {plan.start_date} to {plan.end_date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.meeting_link && <a href={normalizeLink(plan.meeting_link)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-[12px] rounded-xl bg-[#F4F6FB] text-[#1A1C23] font-bold">Open Link</a>}
                      <button
                        onClick={() => deactivateDailySessionPlan(plan.id)}
                        disabled={deactivatingPlanId === plan.id}
                        className="px-4 py-2 text-[12px] rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 disabled:opacity-50"
                      >
                        {deactivatingPlanId === plan.id ? 'Removing...' : 'Deactivate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
                <h3 className="text-[22px] font-bold tracking-tight mb-6 flex items-center justify-between">
                  Upcoming Sessions
                  <span className="text-[12px] font-bold text-gray-400">{upcomingSessions.length} Scheduled</span>
                </h3>
                <div className="space-y-4">
                  {upcomingSessions.slice(0, 5).map(s => {
                    const prof = profiles[s.student_email];
                    const name = prof?.name || s.student_email;
                    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                    const link = normalizeLink(s.meeting_link || '');
                    return (
                      <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[20px] border border-gray-100 bg-white shadow-sm hover:border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center font-bold text-[15px] shrink-0">{initials}</div>
                          <div>
                            <p className="font-bold text-[16px] tracking-tight">{name}</p>
                            <p className="text-[13px] font-bold text-gray-400 flex items-center gap-1.5 mt-1">
                              {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'}
                              {s.duration_minutes && <><span className="text-gray-300">•</span> {s.duration_minutes}m</>}
                            </p>
                          </div>
                        </div>
                        {link && (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-5 py-2.5 mt-3 sm:mt-0 text-[13px] font-bold rounded-[14px] bg-[#1A1C23] text-white hover:bg-black transition-colors shrink-0">
                            <Video size={16} /> Join
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Sessions */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[22px] font-bold tracking-tight">
                  Session History
                </h3>
                {sortedSessions.length > 3 && (
                  <button onClick={() => setShowAllSessions(v => !v)} className="text-[13px] font-bold text-gray-500 hover:text-[#1A1C23] transition-colors">
                    {showAllSessions ? 'Show Less' : 'View All'}
                  </button>
                )}
              </div>

              {sortedSessions.length === 0 ? (
                <p className="text-[14px] font-bold text-gray-400">No session history yet.</p>
              ) : (
                <div className="space-y-4">
                  {displayedSessions.map(s => {
                    const prof = profiles[s.student_email];
                    const name = prof?.name || s.student_email;
                    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                    const link = normalizeLink(s.meeting_link || '');
                    const isActive = scheduleForm?.session_id === s.id;
                    const displayStatus = getSessionDisplayStatus(s);

                    return (
                      <div key={s.id} className={`rounded-[20px] border transition-all overflow-hidden ${isActive ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center font-bold text-[15px] shrink-0">{initials}</div>
                            <div>
                              <p className="font-bold text-[16px] tracking-tight mb-1.5">{name}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={statusBadge(displayStatus)}>{displayStatus}</span>
                                {s.scheduled_at && (
                                  <span className="text-[12px] font-bold text-gray-400">
                                    {new Date(s.scheduled_at).toLocaleString()}
                                  </span>
                                )}
                                {s.amount != null && (
                                  <span className="text-[12px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">₹{s.amount}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0 mt-3 sm:mt-0">
                            {link && s.status === 'scheduled' && !isSessionCompletedByTime(s) && (
                              <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-[14px] bg-[#1A1C23] text-white hover:bg-black transition-colors">
                                <Video size={16} /> Join
                              </a>
                            )}
                            {s.status === 'paid' && (
                              <button
                                onClick={() => {
                                  if (isActive) {
                                    setScheduleForm(null);
                                  } else {
                                    const now = new Date();
                                    now.setHours(now.getHours() + 1);
                                    const defaultDateTime = now.toISOString().slice(0, 16);
                                    setScheduleForm({ 
                                      session_id: s.id, 
                                      scheduled_at: defaultDateTime, 
                                      duration_minutes: s.duration_minutes || 60, 
                                      meeting_link: s.meeting_link || '' 
                                    });
                                  }
                                }}
                                className="px-5 py-2.5 text-[13px] font-bold rounded-[14px] bg-[#1A1C23] text-white hover:bg-black transition-colors"
                              >
                                {isActive ? 'Cancel Setup' : 'Schedule Meets'}
                              </button>
                            )}
                          </div>
                        </div>

                        {s.status === 'paid' && isActive && (
                          <div className="p-5 border-t border-gray-200 bg-gray-50">
                            <h4 className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-widest">Finalize Schedule</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                              <input
                                type="datetime-local"
                                value={scheduleForm?.scheduled_at || ''}
                                onChange={e => setScheduleForm(f => f ? { ...f, scheduled_at: e.target.value } : f)}
                                className="col-span-2 text-[14px] font-medium px-4 py-3 rounded-[12px] border border-gray-200 bg-white focus:outline-none"
                                required
                              />
                              <input
                                type="number"
                                min="5"
                                max="480"
                                value={scheduleForm?.duration_minutes || 60}
                                onChange={e => setScheduleForm(f => f ? { ...f, duration_minutes: parseInt(e.target.value) || 60 } : f)}
                                placeholder="Duration (min)"
                                className="text-[14px] font-medium px-4 py-3 rounded-[12px] border border-gray-200 bg-white focus:outline-none"
                              />
                              <input
                                placeholder="Meet link..."
                                value={scheduleForm?.meeting_link || ''}
                                onChange={e => setScheduleForm(f => f ? { ...f, meeting_link: e.target.value } : f)}
                                className="text-[14px] font-medium px-4 py-3 rounded-[12px] border border-gray-200 bg-white focus:outline-none"
                              />
                              <button
                                disabled={!scheduleForm?.scheduled_at}
                                onClick={() => {
                                  if (!scheduleForm?.scheduled_at) return;
                                  scheduleSession(scheduleForm.session_id, scheduleForm.scheduled_at, scheduleForm.duration_minutes, scheduleForm.meeting_link);
                                }}
                                className="py-3 text-[13px] font-bold rounded-[12px] bg-[#1A1C23] text-white hover:bg-black transition-colors disabled:opacity-50"
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

      {/* Paid Session Scheduling Alert Modal */}
      {paidSessionAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111]/40 backdrop-blur-sm p-4" onClick={() => setPaidSessionAlert(null)}>
          <div className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl relative overflow-hidden text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-gray-100 text-[#1A1C23] flex items-center justify-center mx-auto mb-5">
              <Calendar size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-[22px] font-bold tracking-tight mb-2">Schedule Session</h2>
            <p className="text-[14px] font-medium text-gray-500 mb-6">
              <span className="font-bold text-[#1A1C23]">{profiles[paidSessionAlert.student_email]?.name || paidSessionAlert.student_email}</span> has purchased a session.
              {paidSessionAlert.amount && <span className="block mt-2 font-bold text-[#1A1C23]">₹{paidSessionAlert.amount}</span>}
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const now = new Date();
                  now.setHours(now.getHours() + 1);
                  const defaultDateTime = now.toISOString().slice(0, 16);
                  setScheduleForm({
                    session_id: paidSessionAlert.id,
                    scheduled_at: defaultDateTime,
                    duration_minutes: paidSessionAlert.duration_minutes || 60,
                    meeting_link: paidSessionAlert.meeting_link || ''
                  });
                  setPaidSessionAlert(null);
                }}
                className="w-full py-3.5 text-[14px] font-bold rounded-[16px] bg-[#1A1C23] text-white hover:bg-black transition-colors"
              >
                Schedule Now
              </button>
              
              <button
                onClick={() => {
                  setDismissedSessions(prev => ({ ...prev, [paidSessionAlert.id]: true }));
                  setPaidSessionAlert(null);
                }}
                className="w-full py-3.5 text-[14px] font-bold rounded-[16px] bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Start Modal */}
      {meetingDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111]/40 backdrop-blur-sm p-4" onClick={() => setMeetingDialog(null)}>
          <div className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl relative overflow-hidden text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-gray-100 text-[#1A1C23] flex items-center justify-center mx-auto mb-5">
              <Video size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-[22px] font-bold tracking-tight mb-2">Session Starting</h2>
            <p className="text-[14px] font-medium text-gray-500 mb-6">
              You have a mentoring session with <span className="font-bold text-[#1A1C23]">{profiles[meetingDialog.student_email]?.name || meetingDialog.student_email}</span>
              {meetingDialog.scheduled_at && <span className="block mt-1 font-bold text-gray-400">{new Date(meetingDialog.scheduled_at).toLocaleString()}</span>}
            </p>

            <div className="flex flex-col gap-3">
              {meetingDialog.meeting_link ? (
                <a href={normalizeLink(meetingDialog.meeting_link)} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3.5 text-[14px] font-bold rounded-[16px] bg-[#1A1C23] text-white hover:bg-black transition-colors">
                  Launch Meeting
                </a>
              ) : <p className="text-[14px] font-medium text-gray-500 mb-2 bg-gray-50 py-3 rounded-[16px]">No link provided.</p>}

              <button onClick={() => setMeetingDialog(null)} className="w-full py-3.5 text-[14px] font-bold rounded-[16px] bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </AlumniNavigation>
  );
}