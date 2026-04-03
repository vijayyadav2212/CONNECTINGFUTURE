"use client";

import { useEffect, useMemo, useState } from "react";
import StudentNavigation from "../StudentNavigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/ui/star-rating";
import RazorpayPayment from "@/components/payment/RazorpayPayment";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Users, BadgeCheck, CalendarClock, Wallet, Sparkles, Filter, Search, Star, Clock, ArrowRight, X, TrendingUp } from "lucide-react";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

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
    accepted: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
    rejected: 'bg-rose-50 text-rose-600 border-rose-200/60',
    removed: 'bg-slate-100 text-slate-600 border-slate-200/80',
    paid: 'bg-blue-50 text-blue-700 border-blue-200/60',
    scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    completed: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
    active: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
    expired: 'bg-slate-100 text-slate-600 border-slate-200/80',
  };
  return `text-[11px] font-bold px-3 py-1 rounded-[8px] border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200/80'} uppercase tracking-wider`;
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
      const res = await fetch(`${API_BASE}/api/mentors?${queryParams}`);
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
        } else {
          throw new Error('Rating failed');
        }
      } else {
        toast({ title: 'Thanks for your feedback', description: 'Your rating has been submitted.' });
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
    <StudentNavigation>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-white p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-emerald-50/50 via-white to-white rounded-[40px] p-10 lg:p-12 border border-emerald-100/20 shadow-[0_20px_50px_rgba(0,0,0,0.03)] mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl opacity-60" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-emerald-600 font-black text-[11px] mb-4 uppercase tracking-[0.2em]">
                  <Sparkles size={16} className="text-emerald-500 animate-pulse" />
                  <span>Expert Guidance</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight uppercase">
                  Find Your Mentor
                </h1>
                
                <p className="text-slate-600 text-lg font-medium max-w-[600px] leading-relaxed mb-8">
                  Discover mentors, request guidance, schedule sessions, and achieve your career goals with alumni support.
                </p>
                
                <div className="flex flex-wrap gap-3">
                   <div className="bg-white/90 px-5 py-2.5 rounded-full text-[12px] font-black text-slate-500 border border-slate-50 shadow-sm flex items-center gap-2.5 uppercase tracking-widest">
                     <Users size={16} className="text-emerald-500" />
                     {mentors.length} Mentors
                   </div>
                   <div className="bg-white/90 px-5 py-2.5 rounded-full text-[12px] font-black text-slate-500 border border-slate-50 shadow-sm flex items-center gap-2.5 uppercase tracking-widest">
                     <BadgeCheck size={16} className="text-blue-500" />
                     Verified Experts
                   </div>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner border border-white">
                  <BadgeCheck size={48} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>

            {/* Filters Section */}
            <div className="bg-white rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 mb-10">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-[2] relative group">
                  <Search className="w-5 h-5 text-slate-400 absolute left-5 top-1/2 transform -translate-y-1/2 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search skills, topics, or names..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 border border-slate-200 rounded-[28px] bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 font-medium text-slate-900 placeholder-slate-400 transition-all shadow-inner"
                  />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input
                    type="number"
                    placeholder="Min Exp"
                    value={minExp as any}
                    onChange={(e) => setMinExp(e.target.value ? Number(e.target.value) : "")}
                    className="px-6 py-4 border border-slate-200 rounded-[28px] bg-white focus:outline-none focus:border-emerald-500/30 font-bold text-slate-700 transition-all shadow-inner text-center"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={maxPrice as any}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                    className="px-6 py-4 border border-slate-200 rounded-[28px] bg-white focus:outline-none focus:border-emerald-500/30 font-bold text-slate-700 transition-all shadow-inner text-center"
                  />
                  <div className="col-span-2 md:col-span-1 flex gap-2">
                    <Button onClick={loadMentors} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[28px] font-black text-[12px] uppercase tracking-widest h-auto py-4 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                      {loading ? "..." : "Search"}
                    </Button>
                    <Button variant="outline" onClick={clearFilters} className="p-4 border border-slate-200 rounded-[28px] hover:bg-slate-50 transition-all h-auto">
                      <X size={20} className="text-slate-400" />
                    </Button>
                  </div>
                </div>
              </div>
              {appliedFilters.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {appliedFilters.map((f) => (
                    <Badge key={f.key} className="bg-emerald-50 text-emerald-700 border-emerald-100/50 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {f.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {purchaseFor && (
              <div className="bg-white rounded-[40px] p-8 shadow-xl border border-emerald-100/20 mb-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
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
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-white rounded-[40px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Connected</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{connectedMentorsCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                    <Users size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Pending</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{pendingRequestsCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                    <BadgeCheck size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Sessions</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{upcomingSessionsCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                    <CalendarClock size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Active Subs</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{activeSubscriptionsCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                    <Wallet size={20} />
                  </div>
                </div>
              </div>
            </div>

        {/* Connections Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-start">
          {/* My Mentors */}
          <div className="lg:col-span-2 bg-white rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black">
                   <Users size={20} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">My Mentors</h2>
              </div>
              <span className="bg-slate-50 px-4 py-2 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{requests.filter((r) => r.status === 'accepted').length} Connected</span>
            </div>

            {requests.filter((r) => r.status === 'accepted').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.filter((r) => r.status === 'accepted').map((r) => {
                  const prof = profiles[r.mentor_email];
                  const name = prof?.name || r.mentor_email;
                  return (
                    <div key={`conn-${r.id}`} className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black shadow-inner">
                          {String(name).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{name}</p>
                          <span className={statusBadge(r.status)}>{r.status}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeConnectionWithMentor(r.mentor_email)}
                        className="w-full py-2.5 rounded-2xl border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
                      >
                        Remove Connection
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium text-sm">No connected mentors yet</p>
              </div>
            )}
          </div>

          {/* Daily Sessions Side Card */}
          <div className="bg-white rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100/50">
             <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                   <CalendarClock size={20} />
                 </div>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Daily Plans</h2>
              </div>
              
              <div className="space-y-4">
                {dailySessions.length > 0 ? (
                  dailySessions.slice(0, 3).map((plan) => (
                    <div key={plan.id} className="p-5 rounded-[28px] bg-slate-50/80 border border-slate-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                      <p className="font-black text-slate-900 text-xs uppercase tracking-tight mb-2 truncate">{plan.title}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plan.daily_time}</span>
                      </div>
                      {plan.meeting_link && (
                        <a 
                          href={normalizeExternalLink(plan.meeting_link)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                        >
                          Join Now
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs text-center py-8">No live plans available</p>
                )}
              </div>
          </div>
        </div>

        {/* Mentors Explorer */}
        <div className="bg-white rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 mb-12">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                   <BadgeCheck size={20} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Available Mentors</h2>
              </div>
              <div className="hidden sm:flex bg-slate-50 px-4 py-2 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                Sorted by expertise
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mentors.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border border-slate-100">
                   <p className="text-slate-400 font-medium">No mentors found matching your filters</p>
                </div>
              ) : mentors.map((m) => {
                  const prof = profiles[m.mentor_email];
                  const name = prof?.name || m.mentor_email;
                  const initials = String(name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  const reqForMentor = requests.find((r) => r.mentor_email === m.mentor_email);
                  const isPending = reqForMentor?.status === 'pending';
                  const isAccepted = reqForMentor?.status === 'accepted';
                  
                  return (
                    <div key={m.mentor_email} className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative">
                      {/* Badge */}
                      <div className="absolute top-6 right-6">
                         <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/20">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           Available
                         </div>
                      </div>

                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner overflow-hidden border border-white">
                          {prof?.picture ? (
                            <img src={prof.picture} alt={name} className="w-full h-full object-cover" />
                          ) : initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Star size={12} className="text-amber-500 fill-current" />
                            <span className="text-[11px] font-black text-slate-700">{m.rating_avg || '5.0'}</span>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.experience_years || '5'}+ Years Exp</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="bg-white/80 p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Price</p>
                              <p className="text-lg font-black text-slate-900 tracking-tight">₹{m.price || '499'}</p>
                           </div>
                           <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                              <Wallet size={18} />
                           </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                           {(m.skills || '').split(',').slice(0, 3).map(skill => (
                             <span key={skill} className="px-3 py-1.5 bg-slate-100/50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200/50">
                               {skill.trim()}
                             </span>
                           ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100">
                        <button 
                          onClick={() => sendRequest(m.mentor_email)}
                          disabled={!user?.email || requesting === m.mentor_email || isPending || isAccepted}
                          className="py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all"
                        >
                          {requesting === m.mentor_email ? '...' : isPending ? 'Pending' : isAccepted ? 'Joined' : 'Request'}
                        </button>
                        <button 
                          onClick={() => setPurchaseFor({ mentor_email: m.mentor_email, amount: Number((Number(m.price || 499) * 1.06).toFixed(2)), type: 'session' })}
                          className="py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                          Unlock Call
                        </button>
                      </div>
                    </div>
                    );
                })}
            </div>
          </div>

          {/* User Engagement Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Subscriptions */}
              <div className="bg-white rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 flex flex-col items-start min-h-[400px]">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                     <Star size={24} className="fill-emerald-600/10" />
                   </div>
                   <div>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Active Plans</h2>
                     <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Your Mentorship Subscriptions</p>
                   </div>
                </div>
                
                <div className="w-full space-y-4">
                  {subscriptions.length > 0 ? subscriptions.map(sub => (
                     <div key={sub.id} className="p-6 rounded-[32px] bg-slate-50/50 border border-slate-100 flex items-center justify-between group hover:bg-emerald-50/30 hover:border-emerald-100 transition-all duration-300">
                        <div>
                          <p className="font-black text-slate-900 text-[15px] uppercase tracking-tight mb-2">{sub.mentor_email}</p>
                          <div className="flex items-center gap-2">
                             <Clock size={12} className="text-slate-400" />
                             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Expires {sub.end_at ? new Date(sub.end_at).toLocaleDateString() : '—'}</p>
                          </div>
                        </div>
                        <span className={statusBadge(sub.status)}>{sub.status}</span>
                     </div>
                  )) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 grayscale opacity-40 text-center w-full">
                       <Wallet size={48} className="mb-4 text-slate-400" />
                       <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No active subscriptions</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-white rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 flex flex-col items-start min-h-[400px]">
                 <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                     <TrendingUp size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Recent Sessions</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Track your progress</p>
                  </div>
                </div>

                 <div className="w-full space-y-4">
                   {sessions.length > 0 ? sessions.slice(0, 5).map(s => (
                      <div key={s.id} className="p-6 rounded-[32px] bg-slate-50/50 border border-slate-100 group hover:bg-blue-50/30 hover:border-blue-100 transition-all duration-300">
                         <div className="flex items-center justify-between mb-4">
                           <div>
                              <p className="font-black text-slate-900 text-[15px] uppercase tracking-tight mb-2">{s.mentor_email}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <CalendarClock size={12} />
                                {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString() : 'Pending Schedule'}
                              </p>
                           </div>
                           <span className={statusBadge(s.status)}>{s.status}</span>
                         </div>
                         
                         {s.status === 'scheduled' && s.meeting_link && (
                            <a 
                              href={normalizeExternalLink(s.meeting_link)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                            >
                              Launch Session <ArrowRight size={14} />
                            </a>
                         )}
                      </div>
                   )) : (
                     <div className="flex-1 flex flex-col items-center justify-center py-20 grayscale opacity-40 text-center w-full">
                        <CalendarClock size={48} className="mb-4 text-slate-400" />
                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No recent sessions found</p>
                     </div>
                   )}
                 </div>
              </div>
          </div>
        </div>
      </div>
    </StudentNavigation>
  );
}
