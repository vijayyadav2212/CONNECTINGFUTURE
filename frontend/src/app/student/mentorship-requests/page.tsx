"use client";

import { useEffect, useMemo, useState } from "react";

import { useUser } from "@auth0/nextjs-auth0/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/ui/star-rating";
import RazorpayPayment from "@/components/payment/RazorpayPayment";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Users, BadgeCheck, CalendarClock, Wallet } from "lucide-react";

type Mentor = {
  mentor_email: string;
  skills?: string | null;
  topics?: string | null;
  availability?: string | null;
  price?: number | null;
  subscription_price?: number | null;
  subscription_duration_days?: number | null;
  experience_years?: number | null;
  rating_avg?: number | null;
  rating_count?: number | null;
};

type UserProfile = {
  email: string;
  name?: string | null;
  picture?: string | null;
  job_title?: string | null;
  company?: string | null;
  location?: string | null;
  skills?: string | null;
};

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
  is_rated?: boolean;
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
};

type Subscription = {
  id: number;
  student_email: string;
  mentor_email: string;
  status: string;
  amount?: number;
  currency?: string;
  duration_days?: number;
  start_at?: string;
  end_at?: string;
  payment_id?: string | null;
  order_id?: string | null;
};

const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const API_BASE = rawApiBase.replace(/\/$/, '').replace(/\/api$/, '');

function normalizeExternalLink(link?: string) {
  if (!link) return '';
  const l = link.trim();
  if (/^https?:\/\//i.test(l)) return l;
  if (/^\/\//.test(l)) return window.location.protocol + l;
  if (/meet\.google\.com/i.test(l)) return 'https://' + l.replace(/^https?:\/\//i, '').replace(/^\/+/, '');
  return l.startsWith('/') ? l : 'https://' + l;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600 border-amber-200/60',
    accepted: 'bg-[#f6f3eb] text-teal-950 border-emerald-200/60',
    rejected: 'bg-teal-50 text-teal-950 border-rose-200/60',
    removed: 'bg-[#f6f3eb] text-slate-600 border-slate-200/80',
    paid: 'bg-teal-50 text-teal-700 border-teal-200/60',
    scheduled: 'bg-teal-50 text-teal-700 border-teal-200/60',
    completed: 'bg-[#f6f3eb] text-teal-950 border-emerald-200/60',
    active: 'bg-[#f6f3eb] text-teal-950 border-emerald-200/60',
    expired: 'bg-[#f6f3eb] text-slate-600 border-slate-200/80',
  };
  return `text-[11px] font-bold px-3 py-1 rounded-[8px] border ${map[status] || 'bg-[#f6f3eb] text-slate-600 border-slate-200/80'} uppercase tracking-wider`;
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

export default function MentorshipRequests() {
  const { user } = useUser();
  const [q, setQ] = useState("");
  const [minExp, setMinExp] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minRating, setMinRating] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [purchaseFor, setPurchaseFor] = useState<{ mentor_email: string; amount: number; type: 'session' | 'subscription'; duration_days?: number } | null>(null);
  const [dailySessions, setDailySessions] = useState<DailySessionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [scheduleForm, setScheduleForm] = useState<{ session_id: number; scheduled_at: string; duration_minutes: number; meeting_link: string } | null>(null);
  const { toast } = useToast();
  const [prevRequestStatuses, setPrevRequestStatuses] = useState<Record<number, string>>({});
  const [prevSessions, setPrevSessions] = useState<Record<number, string>>({});
  const [ratingForm, setRatingForm] = useState<{ session_id: number; rating: number; feedback: string } | null>(null);
  const [submittingSession, setSubmittingSession] = useState<number | null>(null);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (minExp !== "") p.set("min_experience", String(minExp));
    if (maxPrice !== "") p.set("max_price", String(maxPrice));
    if (minRating !== "") p.set("min_rating", String(minRating));
    return p.toString();
  }, [q, minExp, maxPrice, minRating]);

  const appliedFilters = useMemo(() => {
    const chips: { label: string; key: string }[] = [];
    if (q) chips.push({ label: `Search: ${q}`, key: "q" });
    if (minExp !== "") chips.push({ label: `Min Exp: ${minExp}y`, key: "minExp" });
    if (maxPrice !== "") chips.push({ label: `Max Price: ₹${maxPrice}`, key: "maxPrice" });
    if (minRating !== "") chips.push({ label: `Min Rating: ${minRating}+`, key: "minRating" });
    return chips;
  }, [q, minExp, maxPrice, minRating]);

  const activeSubscriptionsByMentor = useMemo(() => {
    const now = Date.now();
    const map: Record<string, Subscription> = {};
    subscriptions.forEach((sub) => {
      const end = sub.end_at ? new Date(sub.end_at).getTime() : 0;
      if (sub.status === 'active' && end >= now) {
        const current = map[sub.mentor_email];
        const currentEnd = current?.end_at ? new Date(current.end_at).getTime() : 0;
        if (!current || end > currentEnd) map[sub.mentor_email] = sub;
      }
    });
    return map;
  }, [subscriptions]);

  const connectedMentorsCount = useMemo(() => requests.filter((r) => r.status === 'accepted').length, [requests]);
  const pendingRequestsCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests]);
  const upcomingSessionsCount = useMemo(() => sessions.filter((s) => s.status === 'scheduled').length, [sessions]);
  const activeSubscriptionsCount = useMemo(() => Object.keys(activeSubscriptionsByMentor).length, [activeSubscriptionsByMentor]);

  function clearFilters() {
    setQ("");
    setMinExp("");
    setMaxPrice("");
    setMinRating("");
  }
  async function loadMentors() {
    setLoading(true);
    try {
      let res = await fetch(`${API_BASE}/api/mentors?${queryParams}`);
      if (!res.ok) {
        res = await fetch(`${API_BASE}/api/mentorship/mentors?${queryParams}`);
      }
      const data = await res.json();
      const list: Mentor[] = data.mentors || [];
      setMentors(list);
      // Hydrate mentor user profiles
      const entries = await Promise.all(
        list.map(async (m) => {
          try {
            const r = await fetch(`${API_BASE}/api/users/by-email?email=${encodeURIComponent(m.mentor_email)}`);
            const j = await r.json();
            return [m.mentor_email, j.user] as const;
          } catch {
            return [m.mentor_email, { email: m.mentor_email } as UserProfile] as const;
          }
        })
      );
      const map: Record<string, UserProfile> = {};
      entries.forEach(([email, prof]) => { if (email) map[email] = prof as UserProfile; });
      setProfiles(map);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  }

  async function loadRequestsAndSessions() {
    if (!user?.email) return;
    try {
      const rq = await fetch(`${API_BASE}/api/mentorship/requests?student_email=${encodeURIComponent(user.email)}&role=student`);
      const rj = await rq.json();
      setRequests(rj.requests || []);
    } catch { }
    try {
      const sq = await fetch(`${API_BASE}/api/mentorship/sessions?student_email=${encodeURIComponent(user.email)}&role=student`);
      const sj = await sq.json();
      setSessions(sj.sessions || []);
    } catch { }

    try {
      const dsq = await fetch(`${API_BASE}/api/mentorship/daily-sessions?student_email=${encodeURIComponent(user.email)}`);
      const dsj = await dsq.json();
      setDailySessions(dsj.daily_sessions || []);
    } catch { }

    try {
      const subq = await fetch(`${API_BASE}/api/mentorship/subscriptions?student_email=${encodeURIComponent(user.email)}`);
      const subj = await subq.json();
      setSubscriptions(subj.subscriptions || []);
    } catch { }
  }

  useEffect(() => {
    loadMentors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRequestsAndSessions();
  }, [user?.email]);

  // Poll for notifications: request status changes and upcoming sessions
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!user?.email) return;
      try {
        const rq = await fetch(`${API_BASE}/api/mentorship/requests?student_email=${encodeURIComponent(user.email)}&role=student`);
        const rj = await rq.json();
        const newRequests: Request[] = rj.requests || [];
        // Detect status changes
        newRequests.forEach((r) => {
          const prev = prevRequestStatuses[r.id];
          if (prev && prev !== r.status) {
            if (r.status === 'accepted') {
              toast({ title: 'Request Accepted', description: `Mentor ${r.mentor_email} accepted your request.` });
            } else if (r.status === 'rejected') {
              toast({ title: 'Request Declined', description: `Mentor ${r.mentor_email} declined your request.`, variant: 'destructive' });
            }
          }
        });
        const statusMap: Record<number, string> = {};
        newRequests.forEach((r) => { statusMap[r.id] = r.status; });
        setPrevRequestStatuses(statusMap);
        setRequests(newRequests);
      } catch { }

      try {
        const sq = await fetch(`${API_BASE}/api/mentorship/sessions?student_email=${encodeURIComponent(user.email)}&role=student`);
        const sj = await sq.json();
        const newSessions: Session[] = sj.sessions || [];
        // Reminders: first time we see a scheduled session in <24h
        newSessions.forEach((s) => {
          const prev = prevSessions[s.id];
          if ((prev || '') !== s.status && s.status === 'scheduled' && s.scheduled_at) {
            const when = new Date(s.scheduled_at);
            const diff = when.getTime() - Date.now();
            if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
              toast({ title: 'Upcoming Session', description: `${when.toLocaleString()} with ${s.mentor_email}` });
            }
          }
        });
        const sessMap: Record<number, string> = {};
        newSessions.forEach((s) => { sessMap[s.id] = s.status; });
        setPrevSessions(sessMap);
        setSessions(newSessions);
      } catch { }
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, prevRequestStatuses, prevSessions]);

  async function sendRequest(mentor_email: string) {
    if (!user?.email) return;
    setRequesting(mentor_email);
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ student_email: user.email, mentor_email })
      });
      if (!res.ok) throw new Error("Request failed");
      toast({ title: "Request Sent", description: `Mentorship request sent to ${mentor_email}.` });
      await loadRequestsAndSessions();
    } catch { }
    setRequesting(null);
  }

  async function recordPurchase(paymentId: string, orderId: string, mentor_email: string, amount: number) {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/sessions/purchase`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          student_email: user.email,
          mentor_email,
          amount,
          currency: "INR",
          payment_id: paymentId,
          order_id: orderId,
        })
      });
      if (!res.ok) throw new Error("Purchase record failed");
      toast({ title: "Payment Successful", description: "Session unlocked. You can schedule now." });
      await loadRequestsAndSessions();
    } catch (e) {
      toast({ title: "Payment Error", description: "Could not record session purchase.", variant: "destructive" });
    }
  }

  async function recordSubscriptionPurchase(paymentId: string, orderId: string, mentor_email: string, amount: number, duration_days?: number) {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/subscriptions/purchase`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          student_email: user.email,
          mentor_email,
          amount,
          currency: 'INR',
          payment_id: paymentId,
          order_id: orderId,
          duration_days: duration_days || 30,
        }),
      });
      if (!res.ok) throw new Error('Subscription purchase failed');
      toast({ title: 'Subscription Activated', description: `Subscription with ${mentor_email} is active.` });
      await loadRequestsAndSessions();
    } catch {
      toast({ title: 'Subscription Error', description: 'Could not activate subscription.', variant: 'destructive' });
    }
  }

  async function scheduleSession(session_id: number, scheduled_at: string, duration_minutes: number, meeting_link?: string) {
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/sessions/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id, scheduled_at, duration_minutes, meeting_link })
      });
      if (!res.ok) throw new Error("Schedule failed");
      toast({ title: "Session Scheduled", description: new Date(scheduled_at).toLocaleString() });
      setScheduleForm(null);
      await loadRequestsAndSessions();
    } catch (e) {
      toast({ title: "Scheduling Error", description: "Please try again.", variant: "destructive" });
    }
  }

  async function removeConnectionWithMentor(mentor_email: string) {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/connections/remove`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, other_email: mentor_email }),
      });
      if (!res.ok) throw new Error('Remove failed');
      toast({ title: 'Connection Removed', description: `You removed ${mentor_email}.` });
      await loadRequestsAndSessions();
    } catch (e) {
      toast({ title: 'Remove Failed', description: 'Please try again.', variant: 'destructive' });
    }
  }

  async function submitRating(session_id: number, mentor_email: string, rating: number, feedback: string) {
    if (!user?.email) return;
    setSubmittingSession(session_id);
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/ratings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session_id, student_email: user.email, mentor_email, rating, feedback }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 409 || errData.error?.includes('UNIQUE')) {
          toast({ title: 'Already Rated', description: 'You have already submitted a rating for this session.', variant: 'destructive' });
          setSessions((prev) => prev.map((s) => (s.id === session_id ? { ...s, is_rated: true } : s)));
          setRatingForm(null);
        } else {
          throw new Error('Rating failed');
        }
      } else {
        toast({ title: 'Thanks for your feedback', description: 'Your rating has been submitted.' });
        setSessions((prev) => prev.map((s) => (s.id === session_id ? { ...s, is_rated: true } : s)));
        setRatingForm(null);
        await loadRequestsAndSessions();
        await loadMentors();
      }
    } catch (e) {
      toast({ title: 'Rating Error', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmittingSession(null);
    }
  }

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f6f3eb]">

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Header */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
                            <div className="bg-teal-950 rounded-[32px] p-8 lg:p-12 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">Student Mentorship</h1>
                  <p className="text-lg text-gray-400 font-medium max-w-2xl mb-8">Find mentors, send requests, book sessions, and track your mentorship progress.</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="font-semibold">{connectedMentorsCount} Connected Mentors</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      <span className="font-semibold">{mentors.length} Mentors Found</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="font-semibold">{upcomingSessionsCount} Upcoming Sessions</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <Input placeholder="Search skills/topics" value={q} onChange={(e) => setQ(e.target.value)} className="h-12 rounded-[16px] border-slate-200 bg-[#f6f3eb] text-slate-900 placeholder:text-slate-400 caret-slate-900" />
                  <Input placeholder="Min experience (years)" type="number" value={minExp as any} onChange={(e) => setMinExp(e.target.value ? Number(e.target.value) : "")} className="h-12 rounded-[16px] border-slate-200 bg-[#f6f3eb] text-slate-900 placeholder:text-slate-400 caret-slate-900" />
                  <Input placeholder="Max price (INR)" type="number" value={maxPrice as any} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")} className="h-12 rounded-[16px] border-slate-200 bg-[#f6f3eb] text-slate-900 placeholder:text-slate-400 caret-slate-900" />
                  <Input placeholder="Min rating (1-5)" type="number" value={minRating as any} onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : "")} className="h-12 rounded-[16px] border-slate-200 bg-[#f6f3eb] text-slate-900 placeholder:text-slate-400 caret-slate-900" />
                  <div className="flex gap-2 justify-end md:justify-start lg:justify-end">
                    <Button variant="outline" onClick={clearFilters} disabled={loading} className="h-12 rounded-[16px] border-slate-200 bg-white text-slate-900 hover:bg-[#f6f3eb] hover:text-slate-950 shadow-sm">Clear</Button>
                    <Button onClick={loadMentors} disabled={loading} className="h-12 rounded-[16px] bg-teal-950 hover:bg-teal-900 text-white px-6">{loading ? "Searching..." : "Search"}</Button>
                  </div>
                </div>
                {appliedFilters.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {appliedFilters.map((f) => (
                      <Badge key={f.key} className="bg-orange-50 text-orange-700 border border-orange-200">{f.label}</Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.div>

            {purchaseFor ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
                <RazorpayPayment
                  paymentDetails={{ amount: purchaseFor.amount, currency: "INR", description: `${purchaseFor.type === 'subscription' ? 'Mentorship subscription' : 'Mentorship session'} with ${purchaseFor.mentor_email}`, email: user?.email || undefined, paymentType: 'mentorship' }}
                  onSuccess={(paymentId, orderId) => {
                    if (purchaseFor.type === 'subscription') {
                      recordSubscriptionPurchase(paymentId, orderId, purchaseFor.mentor_email, purchaseFor.amount, purchaseFor.duration_days);
                    } else {
                      recordPurchase(paymentId, orderId, purchaseFor.mentor_email, purchaseFor.amount);
                    }
                    setPurchaseFor(null);
                  }}
                  onFailure={() => {
                    toast({ title: "Payment Cancelled", description: "You can try purchasing again." });
                    setPurchaseFor(null);
                  }}
                />
              </div>
            ) : null}

            {/* Summary Cards */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-white rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Connected Mentors</p>
                    <p className="text-[36px] leading-none font-extrabold text-slate-800 mb-2">{connectedMentorsCount}</p>
                    <p className="text-[13px] font-bold text-teal-950">Accepted connections</p>
                  </div>
                  <div className="w-14 h-14 rounded-[16px] bg-[#f6f3eb] text-teal-950 flex items-center justify-center">
                    <Users size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Pending Requests</p>
                    <p className="text-[36px] leading-none font-extrabold text-slate-800 mb-2">{pendingRequestsCount}</p>
                    <p className="text-[13px] font-bold text-amber-600">Waiting for mentor action</p>
                  </div>
                  <div className="w-14 h-14 rounded-[16px] bg-amber-50 text-amber-600 flex items-center justify-center">
                    <BadgeCheck size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Upcoming Sessions</p>
                    <p className="text-[36px] leading-none font-extrabold text-slate-800 mb-2">{upcomingSessionsCount}</p>
                    <p className="text-[13px] font-bold text-[#16161c]">Scheduled mentorship calls</p>
                  </div>
                  <div className="w-14 h-14 rounded-[16px] bg-teal-50 text-[#16161c] flex items-center justify-center">
                    <CalendarClock size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Active Subscriptions</p>
                    <p className="text-[36px] leading-none font-extrabold text-slate-800 mb-2">{activeSubscriptionsCount}</p>
                    <p className="text-[13px] font-bold text-[#16161c]">Recurring mentor access</p>
                  </div>
                  <div className="w-14 h-14 rounded-[16px] bg-teal-50 text-[#16161c] flex items-center justify-center">
                    <Wallet size={24} />
                  </div>
                </div>
              </div>
            </motion.div>
 

            {/* My Mentors */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">My Mentors</h2>
            <div className="text-[13px] font-semibold text-slate-500">
              {requests.filter((r) => r.status === 'accepted').length} connected
            </div>
          </div>
          <div>
            {requests.filter((r) => r.status === 'accepted').length > 0 ? (
              <div className="space-y-4">
                {requests.filter((r) => r.status === 'accepted').map((r) => {
                  const prof = profiles[r.mentor_email];
                  const name = prof?.name || r.mentor_email;
                  return (
                    <div key={`conn-${r.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[24px] border border-gray-100 bg-white hover:bg-white hover:shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:border-gray-100 transition-all duration-300">
                      <div className="flex items-center space-x-6">
                        <div className="w-12 h-12 rounded-[16px] bg-teal-50 text-[#16161c] flex items-center justify-center font-bold text-[15px] shadow-sm shrink-0">
                          {String(name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-[15px] truncate">{name}</p>
                          <div className="mt-1.5 flex">
                            <span className={statusBadge(r.status)}>{r.status}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="destructive" onClick={() => removeConnectionWithMentor(r.mentor_email)} className="mt-3 sm:mt-0 px-4 py-2.5 text-[13px] font-bold rounded-xl bg-[#f6f3eb] text-slate-600 hover:bg-[#f6f3eb] border border-slate-200/80 transition-colors">Remove Mentor</Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-600">No connected mentors yet.</div>
            )}
          </div>
        </div>

        {/* Available Mentors */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[24px] font-black text-slate-900 tracking-tight">Available Mentors</h2>
            <div className="text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200">{mentors.length} found</div>
          </div>
        </motion.div>

        {/* Mentors Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
        >
          {mentors.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3">
              <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-4xl mb-2">🧭</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No mentors found</h3>
                <p className="text-slate-500">Try adjusting filters or searching different skills/topics.</p>
              </div>
            </div>
          ) : null}
          {mentors.map((m) => {
            const prof = profiles[m.mentor_email];
            const name = prof?.name || m.mentor_email;
            const initials = String(name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const available = true; // treat listed mentors as available
            const skillChips = (m.skills || '')
              .split(/[,\n]/)
              .map(s => s.trim())
              .filter(Boolean)
              .slice(0, 6);
            const reqsForMentor = requests.filter((r) => r.mentor_email && r.mentor_email.toLowerCase() === m.mentor_email.toLowerCase());
            const isAccepted = reqsForMentor.some((r) => r.status === 'accepted');
            const isPending = !isAccepted && reqsForMentor.some((r) => r.status === 'pending');
            const activeSubscription = activeSubscriptionsByMentor[m.mentor_email];
            const hasActiveSubscription = Boolean(activeSubscription);
            const btnDisabled = !user?.email || requesting === m.mentor_email || isPending || isAccepted;
            const btnText = requesting === m.mentor_email
              ? 'Requesting...'
              : isPending
                ? 'Request Sent'
                : isAccepted
                  ? 'Request Accepted'
                  : 'Request Mentorship';
            return (
              <motion.div
                key={m.mentor_email}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col min-h-[430px]"
              >
                {available && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-[#f6f3eb] text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                      Available
                    </div>
                  </div>
                )}
                <div className="p-7 flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="relative">
                      <div className="w-16 h-16 bg-teal-950 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                        {prof?.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={prof.picture} alt={name} className="w-full h-full object-cover" />
                        ) : initials}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#f6f3eb]0 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-slate-900 text-xl leading-tight group-hover:text-[#16161c] transition-colors duration-200 mb-1">
                        {name}
                      </h3>
                      {prof?.job_title || prof?.company ? (
                        <p className="text-slate-600 text-sm font-medium">{prof?.job_title} {prof?.company ? `• ${prof.company}` : ''}</p>
                      ) : null}
                      {m.experience_years ? <p className="text-xs text-slate-500 font-semibold mt-1">Experience: {m.experience_years}+ years</p> : null}
                      {m.availability ? <p className="text-xs text-slate-500 font-semibold">Availability: {m.availability}</p> : null}
                      {prof?.location ? (
                        <div className="mt-2"><Badge className="bg-[#f6f3eb] text-slate-700 border border-slate-200 rounded-lg">{prof.location}</Badge></div>
                      ) : null}
                    </div>
                  </div>
                  <div className="bg-[#f6f3eb] p-4 rounded-2xl mb-4 border border-gray-100">
                    {skillChips.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skillChips.map((s) => (
                          <Badge key={s} className="bg-white text-slate-700 border border-slate-200 rounded-lg">#{s}</Badge>
                        ))}
                      </div>
                    ) : (
                      m.skills ? <p className="text-sm"><span className="font-medium">Skills:</span> {m.skills}</p> : null
                    )}
                    {m.topics ? <p className="text-sm mt-2"><span className="font-medium">Topics:</span> {m.topics}</p> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating value={Number(m.rating_avg || 0)} readOnly size={16} />
                        <span className="font-black text-amber-800 text-sm">{m.rating_avg ?? '—'}</span>
                      </div>
                      <p className="text-xs text-amber-700 font-semibold">Avg Rating ({m.rating_count || 0})</p>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-2xl border border-teal-200">
                      <div className="mb-1">
                        <span className="font-black text-teal-800 text-sm">{m.price ? `₹${m.price}` : '—'}</span>
                      </div>
                      <p className="text-xs text-teal-700 font-semibold">Session Price</p>
                    </div>
                  </div>
                  {hasActiveSubscription ? (
                    <div className="mb-4 p-3 rounded-2xl bg-[#f6f3eb] border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Subscription Active</p>
                      <p className="text-[12px] text-emerald-700 mt-1">
                        Valid till {activeSubscription?.end_at ? new Date(activeSubscription.end_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 gap-2 mt-auto pt-4 border-t border-gray-100">
                    <Button className="w-full min-h-11 h-auto py-2.5 px-3 rounded-xl bg-teal-950 text-white hover:bg-teal-900 disabled:opacity-70 font-bold whitespace-normal break-words text-center leading-tight" onClick={() => sendRequest(m.mentor_email)} disabled={btnDisabled}>
                      {btnText}
                    </Button>
                    {(m.price || m.subscription_price) ? (
                      <div className="w-full text-center space-y-1.5">
                        {m.price ? (
                          <Button variant="outline" className="w-full min-h-11 h-auto py-2.5 px-3 rounded-xl border-slate-200 hover:border-teal-300 font-semibold whitespace-normal break-words text-center leading-tight" onClick={() => setPurchaseFor({ mentor_email: m.mentor_email, amount: Number((Number(m.price) * 1.06).toFixed(2)), type: 'session' })}>
                            Purchase Session (₹{Number((Number(m.price) * 1.06).toFixed(2))})
                          </Button>
                        ) : null}
                        {m.subscription_price ? (
                          <Button
                            variant="outline"
                            className="w-full min-h-11 h-auto py-2.5 px-3 rounded-xl border-slate-200 hover:border-emerald-300 disabled:opacity-70 font-semibold whitespace-normal break-words text-center leading-tight"
                            disabled={hasActiveSubscription}
                            onClick={() => setPurchaseFor({ mentor_email: m.mentor_email, amount: Number((Number(m.subscription_price) * 1.06).toFixed(2)), type: 'subscription', duration_days: Number(m.subscription_duration_days || 30) })}
                          >
                            {hasActiveSubscription
                              ? `Subscribed till ${activeSubscription?.end_at ? new Date(activeSubscription.end_at).toLocaleDateString() : ''}`
                              : `Subscribe ${m.subscription_duration_days || 30}d (₹${Number((Number(m.subscription_price) * 1.06).toFixed(2))})`}
                          </Button>
                        ) : null}
                        <p className="text-[10px] text-gray-500">Includes 6% platform fee</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Daily Mentor Sessions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-8"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">Daily Mentor Sessions</h2>
            <div className="text-[12px] font-semibold text-slate-500">From accepted mentors</div>
          </div>
          {dailySessions.length === 0 ? (
            <div className="text-slate-600">No daily mentor plans available yet.</div>
          ) : (
            <div className="space-y-3">
              {dailySessions.map((plan) => (
                <div key={plan.id} className="p-4 rounded-[24px] border border-gray-100 bg-white hover:bg-white hover:shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:border-gray-100 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 text-[15px]">{plan.title}</p>
                    <p className="text-xs text-slate-500 mt-1">Mentor: {plan.mentor_email}</p>
                    <p className="text-xs text-slate-500">{plan.daily_time} • {plan.start_date} to {plan.end_date} • {plan.duration_minutes || 60} mins</p>
                    {plan.description ? <p className="text-xs text-slate-600 mt-1">{plan.description}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={statusBadge('active')}>live plan</span>
                    {plan.meeting_link ? (
                      <a
                        href={normalizeExternalLink(plan.meeting_link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-teal-950 hover:bg-teal-900 text-white px-4 py-2 rounded-md text-sm font-semibold"
                      >
                        Join Daily Session
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Meeting link will be shared by mentor</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* My Subscriptions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">My Subscriptions</h2>
            <div className="text-[13px] font-semibold text-slate-500">
              {Object.keys(activeSubscriptionsByMentor).length} active
            </div>
          </div>
          {subscriptions.length === 0 ? (
            <div className="text-slate-600">No subscriptions yet.</div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => {
                const prof = profiles[sub.mentor_email];
                const mentorName = prof?.name || sub.mentor_email;
                const isActive = sub.status === 'active' && (!!sub.end_at ? new Date(sub.end_at).getTime() >= Date.now() : false);
                return (
                  <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[24px] border border-gray-100 bg-white hover:bg-white hover:shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:border-gray-100 transition-all duration-300">
                    <div>
                      <p className="font-bold text-slate-900 text-[15px]">{mentorName}</p>
                      <p className="text-[12px] text-slate-500 mt-1">
                        {sub.start_at ? new Date(sub.start_at).toLocaleDateString() : '—'} to {sub.end_at ? new Date(sub.end_at).toLocaleDateString() : '—'}
                      </p>
                      <p className="text-[12px] text-slate-600 mt-1">
                        {sub.amount ? `₹${sub.amount}` : '—'} {sub.currency || 'INR'} • {sub.duration_days || 30} days
                      </p>
                    </div>
                    <span className={statusBadge(isActive ? 'active' : 'expired')}>{isActive ? 'active' : 'expired'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>


        {/* My Mentorship Requests */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">My Mentorship Requests</h2>
          </div>
          <div>
            {requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((r) => {
                  const prof = profiles[r.mentor_email];
                  const name = prof?.name || r.mentor_email;
                  return (
                    <motion.div
                      key={r.id}
                      whileHover={{ scale: 1.01 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[24px] border border-gray-100 bg-white hover:bg-white hover:shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:border-gray-100 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[16px] bg-teal-50 text-[#16161c] flex items-center justify-center font-bold text-[15px] shadow-sm shrink-0">
                          {String(name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-[15px] truncate">{name}</p>
                          <div className="mt-1.5 flex">
                            <span className={statusBadge(r.status)}>{r.status}</span>
                          </div>
                          <div className="text-[12px] text-slate-500 mt-1">Updated: {r.updated_at ? new Date(r.updated_at).toLocaleString() : '—'}</div>
                          {r.message ? <div className="mt-2 text-[13px] text-slate-700">{r.message}</div> : null}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-600">No requests yet.</div>
            )}
          </div>
        </motion.div>

        {/* My Sessions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">My Sessions</h2>
          </div>
          <div>
            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions
                  .slice()
                  .sort((a, b) => {
                    // Prioritize scheduled sessions first (both have scheduled_at) - newest first
                    if (a.scheduled_at && b.scheduled_at) return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
                    // Sessions with scheduled_at come before sessions without
                    if (a.scheduled_at && !b.scheduled_at) return -1;
                    if (!a.scheduled_at && b.scheduled_at) return 1;
                    // For unscheduled sessions, sort by id descending (newest first)
                    return b.id - a.id;
                  })
                  .map((s) => {
                  const prof = profiles[s.mentor_email];
                  const name = prof?.name || s.mentor_email;
                  const displayStatus = getSessionDisplayStatus(s);
                  const canRateSession = getSessionDisplayStatus(s) === 'completed' && !s.is_rated;
                  return (
                    <motion.div
                      key={s.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-[24px] border border-gray-100 bg-white hover:bg-white hover:shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:border-gray-100 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[16px] bg-teal-50 text-[#16161c] flex items-center justify-center font-bold text-[15px] shadow-sm shrink-0">
                            {String(name).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-[15px]">Mentor: {name}</p>
                            <p className="text-[12px] text-slate-500 mt-1">Amount: {s.amount ? `₹${s.amount}` : '—'} {s.currency || ''}</p>
                          </div>
                        </div>
                        <span className={statusBadge(displayStatus)}>{displayStatus}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-[13px] text-slate-700">Scheduled: {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'} ({s.duration_minutes || 60} mins)</div>
                        {(() => {
                          if (!s.meeting_link || !s.scheduled_at || isSessionCompletedByTime(s)) return null;
                          const href = normalizeExternalLink(s.meeting_link || undefined);
                          return (
                            <div>
                              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-teal-950 hover:bg-teal-900 text-white px-4 py-2 rounded-md">Join</a>
                            </div>
                          );
                        })()}
                      </div>
                      {canRateSession ? (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2">
                            <StarRating
                              value={ratingForm && ratingForm.session_id === s.id ? ratingForm.rating : 0}
                              onChange={(val) => setRatingForm({ session_id: s.id, rating: val, feedback: ratingForm && ratingForm.session_id === s.id ? ratingForm.feedback : '' })}
                              size={18}
                            />
                            <span className="text-sm text-slate-700">{ratingForm && ratingForm.session_id === s.id ? ratingForm.rating : 0}/5</span>
                          </div>
                          <Input
                            className="h-12 bg-white border-slate-200 focus:border-teal-400"
                            placeholder="Optional feedback"
                            value={ratingForm && ratingForm.session_id === s.id ? ratingForm.feedback : ''}
                            onChange={(e) => setRatingForm({ session_id: s.id, rating: ratingForm && ratingForm.session_id === s.id ? ratingForm.rating : 0, feedback: e.target.value })}
                          />
                          <Button
                            className="h-12 px-6 font-semibold text-sm min-w-[120px] bg-teal-950 hover:bg-teal-900 text-white shadow-md hover:shadow-lg disabled:opacity-60"
                            onClick={() => {
                              if (!ratingForm || ratingForm.session_id !== s.id) return;
                              const r = ratingForm.rating;
                              if (r < 1 || r > 5) { toast({ title: 'Invalid rating', description: 'Pick 1-5 stars.', variant: 'destructive' }); return; }
                              submitRating(s.id, s.mentor_email, r, ratingForm.feedback);
                            }}
                            disabled={!ratingForm || ratingForm.session_id !== s.id || (ratingForm.rating < 1 || ratingForm.rating > 5) || submittingSession === s.id}
                          >
                            {submittingSession === s.id ? 'Submitting...' : 'Submit Rating'}
                          </Button>
                        </div>
                      ) : getSessionDisplayStatus(s) === 'completed' && s.is_rated ? (
                        <div className="mt-4 p-3 rounded-[12px] bg-[#f6f3eb] border border-emerald-200 text-emerald-700 text-[13px] font-semibold">
                          Rating already submitted for this session.
                        </div>
                      ) : null}
                      {s.status === 'paid' ? (
                        <div className="mt-4 p-4 rounded-[14px] bg-yellow-50 border border-yellow-100 text-slate-700">
                          <p className="font-medium">Session unlocked — waiting for mentor to schedule.</p>
                          <p className="text-sm mt-2">The mentor will provide a Google Meet link and schedule time. You will see the session details here and be able to join once scheduled.</p>
                        </div>
                      ) : null}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-600">No sessions yet.</div>
            )}
          </div>
        </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}