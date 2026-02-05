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

type Mentor = {
  mentor_email: string;
  skills?: string | null;
  topics?: string | null;
  availability?: string | null;
  price?: number | null;
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

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
  const [purchaseFor, setPurchaseFor] = useState<{ mentor_email: string; amount: number } | null>(null);
  const [scheduleForm, setScheduleForm] = useState<{ session_id: number; scheduled_at: string; duration_minutes: number; meeting_link: string } | null>(null);
  const { toast } = useToast();
  const [prevRequestStatuses, setPrevRequestStatuses] = useState<Record<number, string>>({});
  const [prevSessions, setPrevSessions] = useState<Record<number, string>>({});
  const [removedMentors, setRemovedMentors] = useState<string[]>([]);
  const [ratingForm, setRatingForm] = useState<{ session_id: number; rating: number; feedback: string } | null>(null);

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
      const rq = await fetch(`${API_BASE}/api/mentorship/requests?student_email=${encodeURIComponent(user.email)}`);
      const rj = await rq.json();
      setRequests(rj.requests || []);
    } catch {}
    try {
      const sq = await fetch(`${API_BASE}/api/mentorship/sessions?student_email=${encodeURIComponent(user.email)}`);
      const sj = await sq.json();
      setSessions(sj.sessions || []);
    } catch {}
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
        const rq = await fetch(`${API_BASE}/api/mentorship/requests?student_email=${encodeURIComponent(user.email)}`);
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
      } catch {}

      try {
        const sq = await fetch(`${API_BASE}/api/mentorship/sessions?student_email=${encodeURIComponent(user.email)}`);
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
      } catch {}
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
    } catch {}
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
      setRemovedMentors((prev) => [...prev, mentor_email]);
    } catch (e) {
      toast({ title: 'Remove Failed', description: 'Please try again.', variant: 'destructive' });
    }
  }

  async function submitRating(session_id: number, mentor_email: string, rating: number, feedback: string) {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/ratings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session_id, student_email: user.email, mentor_email, rating, feedback }),
      });
      if (!res.ok) throw new Error('Rating failed');
      toast({ title: 'Thanks for your feedback', description: 'Your rating has been submitted.' });
      setRatingForm(null);
      await loadRequestsAndSessions();
      await loadMentors();
    } catch (e) {
      toast({ title: 'Rating Error', description: 'Please try again.', variant: 'destructive' });
    }
  }

  return (
    <StudentNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-4xl">🎯</span>
                <h1 className="text-3xl md:text-4xl font-black">Find Your Mentor</h1>
              </div>
              <p className="text-blue-100 text-sm md:text-base">Discover mentors, request guidance, purchase sessions, and track progress</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-2xl font-bold border border-white/20">Student Hub</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input placeholder="Search skills/topics" value={q} onChange={(e) => setQ(e.target.value)} />
            <Input placeholder="Min experience (years)" type="number" value={minExp as any} onChange={(e) => setMinExp(e.target.value ? Number(e.target.value) : "")} />
            <Input placeholder="Max price (INR)" type="number" value={maxPrice as any} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")} />
            <Input placeholder="Min rating (1-5)" type="number" value={minRating as any} onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : "")} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={clearFilters} disabled={loading}>Clear</Button>
              <Button onClick={loadMentors} disabled={loading}>{loading ? "Searching..." : "Search"}</Button>
            </div>
          </div>
          {appliedFilters.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {appliedFilters.map((f) => (
                <Badge key={f.key} className="bg-blue-50 text-blue-700 border border-blue-200">{f.label}</Badge>
              ))}
            </div>
          ) : null}
        </div>

        {/* Available Mentors */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-slate-900">Available Mentors</h2>
          <div className="text-sm text-slate-600">{mentors.length} found</div>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {mentors.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="text-4xl mb-2">🧭</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No mentors found</h3>
                <p className="text-gray-600">Try adjusting filters or searching different skills/topics.</p>
              </div>
            </div>
          ) : null}
          {mentors.map((m) => {
            const prof = profiles[m.mentor_email];
            const name = prof?.name || m.mentor_email;
            const initials = String(name).split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
            const available = true; // treat listed mentors as available
            const skillChips = (m.skills || '')
              .split(/[,\n]/)
              .map(s => s.trim())
              .filter(Boolean)
              .slice(0, 6);
            const reqForMentor = requests.find((r) => r.mentor_email === m.mentor_email);
            const reqStatus = reqForMentor?.status;
            const isPending = reqStatus === 'pending';
            const isAccepted = reqStatus === 'accepted';
            const btnDisabled = !user?.email || requesting === m.mentor_email || isPending || isAccepted;
            const btnText = requesting === m.mentor_email
              ? 'Requesting...'
              : isPending
              ? 'Request Sent'
              : isAccepted
              ? 'Connected'
              : 'Request Mentorship';
            return (
              <div key={m.mentor_email} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group relative overflow-hidden h-full flex flex-col min-h-[420px] md:min-h-[460px]">
                {available && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white/20">
                      Available 🟢
                    </div>
                  </div>
                )}
                <div className="p-6 lg:p-8 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg lg:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {prof?.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={prof.picture} alt={name} className="w-full h-full rounded-full object-cover" />
                        ) : initials}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg lg:text-xl group-hover:text-blue-600 transition-colors duration-200 mb-1">
                        {name}
                      </h3>
                      {prof?.job_title || prof?.company ? (
                        <p className="text-gray-700 text-sm">{prof?.job_title} {prof?.company ? `• ${prof.company}` : ''}</p>
                      ) : null}
                      {m.experience_years ? <p className="text-xs text-gray-500 font-medium">Experience: {m.experience_years}+ years</p> : null}
                      {m.availability ? <p className="text-xs text-gray-500 font-medium">Availability: {m.availability}</p> : null}
                      {prof?.location ? (
                        <div className="mt-2"><Badge className="bg-slate-50 text-slate-700 border border-slate-200">{prof.location}</Badge></div>
                      ) : null}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl mb-4 border border-gray-100">
                    {skillChips.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skillChips.map((s) => (
                          <Badge key={s} className="bg-white text-slate-700 border border-slate-200">{s}</Badge>
                        ))}
                      </div>
                    ) : (
                      m.skills ? <p className="text-sm"><span className="font-medium">Skills:</span> {m.skills}</p> : null
                    )}
                    {m.topics ? <p className="text-sm mt-2"><span className="font-medium">Topics:</span> {m.topics}</p> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating value={Number(m.rating_avg || 0)} readOnly size={16} />
                        <span className="font-bold text-yellow-800 text-sm">{m.rating_avg ?? '—'}</span>
                      </div>
                      <p className="text-xs text-yellow-700 font-medium">Avg Rating ({m.rating_count || 0})</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="mb-1">
                        <span className="font-bold text-blue-800 text-sm">{m.price ? `₹${m.price}` : '—'}</span>
                      </div>
                      <p className="text-xs text-blue-700 font-medium">Session Price</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-100">
                    <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 font-semibold text-sm px-4" onClick={() => sendRequest(m.mentor_email)} disabled={btnDisabled}>
                      {btnText}
                    </Button>
                    {m.price ? ( 
                      <Button variant="outline" className="w-full h-12 border-2 hover:border-blue-300 font-semibold text-sm px-4" onClick={() => setPurchaseFor({ mentor_email: m.mentor_email, amount: Number(m.price) })}>
                        Purchase Session
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
             );
          })}
        </div>

        {purchaseFor ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
            <RazorpayPayment
              paymentDetails={{ amount: purchaseFor.amount, currency: "INR", description: `Mentorship session with ${purchaseFor.mentor_email}`, email: user?.email || undefined }}
              onSuccess={(paymentId, orderId) => {
                recordPurchase(paymentId, orderId, purchaseFor.mentor_email, purchaseFor.amount);
                setPurchaseFor(null);
              }}
              onFailure={() => {
                toast({ title: "Payment Cancelled", description: "You can try purchasing again." });
                setPurchaseFor(null);
              }}
            />
          </div>
        ) : null}

        {/* My Mentors */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900">My Mentors</h2>
            <div className="text-sm text-slate-600">
              {requests.filter((r) => r.status === 'accepted' && !removedMentors.includes(r.mentor_email)).length} connected
            </div>
          </div>
          <div>
            {requests.filter((r) => r.status === 'accepted' && !removedMentors.includes(r.mentor_email)).length > 0 ? (
              <div className="space-y-4">
                {requests.filter((r) => r.status === 'accepted' && !removedMentors.includes(r.mentor_email)).map((r) => {
                  const prof = profiles[r.mentor_email];
                  const name = prof?.name || r.mentor_email;
                  return (
                    <div key={`conn-${r.id}`} className="flex items-center justify-between p-6 border-2 border-slate-200 rounded-2xl hover:border-blue-400 transition-all duration-300 bg-gradient-to-r from-white to-blue-50">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xl">{String(name).charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xl">{name}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Connected</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="destructive" onClick={() => removeConnectionWithMentor(r.mentor_email)} className="h-12 px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-400 to-rose-500 text-white hover:from-red-500 hover:to-rose-600 transition-all min-w-[140px]">Remove Mentor</Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-600">No connected mentors yet.</div>
            )}
          </div>
        </div>

        {/* My Requests */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900">My Mentorship Requests</h2>
          </div>
          <div>
            {requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((r) => {
                  const prof = profiles[r.mentor_email];
                  const name = prof?.name || r.mentor_email;
                  return (
                    <div key={r.id} className="flex items-center justify-between p-6 border-2 border-slate-200 rounded-2xl hover:border-blue-400 transition-all duration-300 bg-gradient-to-r from-white to-blue-50">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xl">{String(name).charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xl">{name}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : r.status === 'accepted' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{r.status}</span>
                          </div>
                          <div className="text-sm text-slate-600 mt-1">Updated: {r.updated_at ? new Date(r.updated_at).toLocaleString() : '—'}</div>
                          {r.message ? <div className="mt-2 text-sm text-slate-700">{r.message}</div> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-600">No requests yet.</div>
            )}
          </div>
        </div>

        {/* My Sessions */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900">My Sessions</h2>
          </div>
          <div>
            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((s) => {
                  const prof = profiles[s.mentor_email];
                  const name = prof?.name || s.mentor_email;
                  return (
                    <div key={s.id} className="p-6 border-2 border-slate-200 rounded-2xl hover:border-blue-400 transition-all duration-300 bg-gradient-to-r from-white to-blue-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold">{String(name).charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Mentor: {name}</p>
                            <p className="text-slate-600 text-sm">Amount: {s.amount ? `₹${s.amount}` : '—'} {s.currency || ''}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : s.status === 'paid' ? 'bg-green-100 text-green-700' : s.status === 'completed' ? 'bg-slate-100 text-slate-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.status}</span>
                      </div>
                      <div className="text-slate-700">Scheduled: {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'} ({s.duration_minutes || 60} mins)</div>
                      {(() => {
                        if (!s.meeting_link || !s.scheduled_at) return null;
                        const start = new Date(s.scheduled_at).getTime();
                        const durMs = (s.duration_minutes || 60) * 60 * 1000;
                        const now = Date.now();
                        const isActive = s.status === 'scheduled' && now >= start && now < start + durMs;
                        if (!isActive) return null;
                        return (
                          <div className="mt-1 text-sm">
                            <a href={s.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Join Now</a>
                          </div>
                        );
                      })()}
                      {(() => {
                        const start = s.scheduled_at ? new Date(s.scheduled_at).getTime() : null;
                        const durMs = (s.duration_minutes || 60) * 60 * 1000;
                        const ended = start ? (Date.now() >= start + durMs) : false;
                        return s.status === 'completed' || ended;
                      })() ? (
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
                            className="h-12"
                            placeholder="Optional feedback"
                            value={ratingForm && ratingForm.session_id === s.id ? ratingForm.feedback : ''}
                            onChange={(e) => setRatingForm({ session_id: s.id, rating: ratingForm && ratingForm.session_id === s.id ? ratingForm.rating : 0, feedback: e.target.value })}
                          />
                          <Button
                            className="h-12 px-6 font-semibold text-sm min-w-[120px]"
                            onClick={() => {
                              if (!ratingForm || ratingForm.session_id !== s.id) return;
                              const r = ratingForm.rating;
                              if (r < 1 || r > 5) { toast({ title: 'Invalid rating', description: 'Pick 1-5 stars.', variant: 'destructive' }); return; }
                              submitRating(s.id, s.mentor_email, r, ratingForm.feedback);
                            }}
                            disabled={!ratingForm || ratingForm.session_id !== s.id || (ratingForm.rating < 1 || ratingForm.rating > 5)}
                          >
                            Submit Rating
                          </Button>
                        </div>
                      ) : null}
                      {s.status === 'paid' ? (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            className="h-12"
                            type="datetime-local"
                            value={scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.scheduled_at : ''}
                            onChange={(e) => setScheduleForm({
                              session_id: s.id,
                              scheduled_at: e.target.value,
                              duration_minutes: scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.duration_minutes : 60,
                              meeting_link: scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.meeting_link : '',
                            })}
                          />
                          <Input
                            className="h-12"
                            type="number"
                            placeholder="Duration (mins)"
                            value={scheduleForm && scheduleForm.session_id === s.id ? (scheduleForm.duration_minutes as number) : (60 as number)}
                            onChange={(e) => setScheduleForm({
                              session_id: s.id,
                              scheduled_at: scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.scheduled_at : '',
                              duration_minutes: Number(e.target.value) || 60,
                              meeting_link: scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.meeting_link : '',
                            })}
                          />
                          <Input
                            className="h-12"
                            type="url"
                            placeholder="Google Meet link (https://meet.google.com/...)"
                            value={scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.meeting_link : ''}
                            onChange={(e) => setScheduleForm({
                              session_id: s.id,
                              scheduled_at: scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.scheduled_at : '',
                              duration_minutes: scheduleForm && scheduleForm.session_id === s.id ? scheduleForm.duration_minutes : 60,
                              meeting_link: e.target.value,
                            })}
                          />
                          <Button
                            className="h-12 px-6 font-semibold text-sm min-w-[120px]"
                            onClick={() => {
                              if (!(scheduleForm && scheduleForm.session_id === s.id && scheduleForm.scheduled_at)) return;
                              const when = new Date(scheduleForm.scheduled_at);
                              const validFuture = when.getTime() > Date.now();
                              const dur = Number(scheduleForm.duration_minutes) || 60;
                              const link = scheduleForm.meeting_link || '';
                              const isUrl = /^https?:\/\//.test(link);
                              const isMeet = link.includes('meet.google.com');
                              if (!validFuture) {
                                toast({ title: 'Invalid time', description: 'Pick a future date/time.', variant: 'destructive' });
                                return;
                              }
                              if (dur < 15 || dur > 240) {
                                toast({ title: 'Invalid duration', description: 'Duration must be 15-240 minutes.', variant: 'destructive' });
                                return;
                              }
                              if (!isUrl || !isMeet) {
                                toast({ title: 'Invalid meeting link', description: 'Provide a valid Google Meet URL.', variant: 'destructive' });
                                return;
                              }
                              scheduleSession(scheduleForm.session_id, scheduleForm.scheduled_at, dur, link);
                            }}
                            disabled={!(scheduleForm && scheduleForm.session_id === s.id && scheduleForm.scheduled_at && scheduleForm.meeting_link)}
                          >
                            Schedule
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-600">No sessions yet.</div>
            )}
          </div>
        </div>
      </div>
    </StudentNavigation>
  );
}