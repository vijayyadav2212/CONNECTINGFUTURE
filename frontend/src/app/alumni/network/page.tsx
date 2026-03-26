"use client";
import { useEffect, useMemo, useState } from 'react';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Users, GraduationCap, Building, MapPin, MessageSquare, Clock, Search, UserCheck, UserX, X, Sparkles } from 'lucide-react';

interface UserLite {
  id: number; email: string; name: string; picture?: string; user_type: string;
  bio?: string; major?: string; graduation_year?: number; current_job?: string;
  job_title?: string; company?: string; location?: string; skills?: string; is_mentor?: boolean;
}
interface ConnectionRecord {
  id: number; pair_key: string; requester_email: string; target_email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'removed';
}

function getAPI() {
  const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  return base.endsWith('/api') ? base : base.replace(/\/$/, '') + '/api';
}
const API = getAPI();

function pairKey(a: string, b: string) {
  const [x, y] = [a.toLowerCase().trim(), b.toLowerCase().trim()].sort();
  return `${x}|${y}`;
}

export default function NetworkPage() {
  const { user } = useUser();
  const myEmail = (user?.email as string) || '';
  const [type, setType] = useState<'students' | 'alumni'>('students');
  const [q, setQ] = useState('');
  const [list, setList] = useState<UserLite[]>([]);
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [connBusy, setConnBusy] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserLite | null>(null);
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, UserLite>>({});

  const map = useMemo(() => {
    const m = new Map<string, ConnectionRecord>();
    connections.forEach(c => m.set(c.pair_key, c));
    return m;
  }, [connections]);

  const getConn = (u: UserLite) => map.get(pairKey(myEmail, u.email));

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', type === 'students' ? 'student' : 'alumni');
      if (q.trim()) params.set('q', q.trim());
      const resp = await fetch(`${API}/users?${params.toString()}`);
      const data = await resp.json();
      setList(data.users || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadConnections() {
    if (!myEmail) return;
    const resp = await fetch(`${API}/connections?user_email=${encodeURIComponent(myEmail)}`);
    if (resp.ok) {
      const data = await resp.json();
      setConnections(data.connections || []);
    }
  }

  useEffect(() => { load(); }, [type]);
  useEffect(() => { loadConnections(); }, [myEmail]);

  useEffect(() => {
    if (!myEmail) return;
    const incoming = connections.filter(c => c.status === 'pending' && c.target_email.toLowerCase() === myEmail.toLowerCase());
    const emails = Array.from(new Set(incoming.map(c => c.requester_email.toLowerCase())));
    const missing = emails.filter(e => !requesterProfiles[e]);
    if (missing.length === 0) return;
    (async () => {
      try {
        const results = await Promise.all(missing.map(async (email) => {
          try {
            const resp = await fetch(`${API}/users/by-email?email=${encodeURIComponent(email)}`);
            if (!resp.ok) return { email } as any;
            const data = await resp.json();
            const u = data.user || {};
            return { id: u.id || 0, email: u.email || email, name: u.name || email, picture: u.picture, user_type: u.user_type || '', bio: u.bio, major: u.major, graduation_year: u.graduation_year, current_job: u.current_job, job_title: u.job_title, company: u.company, location: u.location, skills: Array.isArray(u.skills) ? u.skills.join(',') : (u.skills || ''), is_mentor: !!u.is_mentor } as UserLite;
          } catch { return { email } as any; }
        }));
        setRequesterProfiles(prev => {
          const next = { ...prev };
          results.forEach(r => { if (r?.email) next[String(r.email).toLowerCase()] = r; });
          return next;
        });
      } catch { }
    })();
  }, [connections, myEmail]);

  async function request(u: UserLite) {
    if (!myEmail) return;
    setConnBusy(true);
    try {
      const resp = await fetch(`${API}/connections/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requester_email: myEmail, target_email: u.email }) });
      if (resp.ok) { const data = await resp.json(); setConnections(p => [data.connection, ...p.filter(c => c.pair_key !== data.connection.pair_key)]); }
    } finally { setConnBusy(false); }
  }

  async function respond(u: UserLite, action: 'accept' | 'reject') {
    setConnBusy(true);
    try {
      const resp = await fetch(`${API}/connections/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: myEmail, other_email: u.email, action }) });
      if (resp.ok) { const data = await resp.json(); setConnections(p => p.map(c => c.pair_key === data.connection.pair_key ? data.connection : c)); }
    } finally { setConnBusy(false); }
  }

  async function remove(u: UserLite) {
    setConnBusy(true);
    try {
      const resp = await fetch(`${API}/connections/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: myEmail, other_email: u.email }) });
      if (resp.ok) { const data = await resp.json(); if (data.connection) { setConnections(p => p.map(c => c.pair_key === data.connection.pair_key ? data.connection : c)); } }
    } finally { setConnBusy(false); }
  }

  const incoming = connections.filter(c => c.status === 'pending' && c.target_email.toLowerCase() === myEmail.toLowerCase());

  return (
    <AlumniNavigation>
      <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col font-sans mb-8">

        {/* Page Header Banner */}
        <div className="bg-gradient-to-r from-[#e7eaff] to-[#eaddff] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-8 mb-2">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[15px] mb-3">
              <Sparkles size={18} className="text-indigo-500" />
              <span>Expand Your Reach</span>
            </div>
            <h1 className="text-4xl md:text-[44px] font-extrabold text-[#1e293b] mb-4 tracking-tight leading-tight">
              Network
            </h1>
            <p className="text-slate-600 text-[17px] font-medium opacity-90">
              Browse {type === 'students' ? 'students' : 'fellow alumni'} and build connections.
            </p>
          </div>

          {/* Type Toggle */}
          <div className="relative z-10 flex gap-2 bg-white/40 p-2 rounded-2xl shadow-sm border border-white/60 backdrop-blur-md shrink-0">
            <button
              onClick={() => setType('students')}
              className={`px-8 py-3.5 rounded-xl text-[15px] font-bold transition-all duration-300 ${type === 'students' ? 'bg-white text-[#4F46E5] shadow-sm border border-white' : 'text-indigo-900/60 hover:text-indigo-900 hover:bg-white/40 border border-transparent'}`}
            >
              Students
            </button>
            <button
              onClick={() => setType('alumni')}
              className={`px-8 py-3.5 rounded-xl text-[15px] font-bold transition-all duration-300 ${type === 'alumni' ? 'bg-white text-[#4F46E5] shadow-sm border border-white' : 'text-indigo-900/60 hover:text-indigo-900 hover:bg-white/40 border border-transparent'}`}
            >
              Alumni
            </button>
          </div>
        </div>

        {/* Incoming Requests Panel */}
        {incoming.length > 0 && (
          <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-50/50 rounded-full blur-[40px] -mt-10 -mr-10 pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Users size={22} className="text-[#4F46E5]" strokeWidth={2} />
              <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">
                Connection Requests
              </h2>
              <span className="flex items-center justify-center h-6 min-w-[24px] px-2 bg-rose-500 text-white text-[12px] font-bold rounded-full shadow-sm shadow-rose-500/20 ml-2">
                {incoming.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
              {incoming.map(req => {
                const email = req.requester_email;
                const rProfile = requesterProfiles[email.toLowerCase()];
                const displayName = rProfile?.name || email;
                const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                const userLite: UserLite = rProfile || { id: 0, email, name: displayName, user_type: '' };
                return (
                  <div key={req.id} className="flex items-center justify-between p-4 rounded-[20px] border border-slate-100 bg-[#f8fafc] hover:bg-white hover:shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:border-indigo-100 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[14px] bg-indigo-50 text-[#4F46E5] flex items-center justify-center font-bold text-[15px] shadow-sm shrink-0">{initials}</div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-[15px] truncate">{displayName}</p>
                        <p className="text-[13px] text-slate-500 font-medium truncate">{email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button disabled={connBusy} onClick={() => respond(userLite, 'accept')} className="p-2.5 rounded-[12px] bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50">
                        <UserCheck size={18} strokeWidth={2} />
                      </button>
                      <button disabled={connBusy} onClick={() => respond(userLite, 'reject')} className="p-2.5 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50">
                        <UserX size={18} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative group">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4F46E5] transition-colors" strokeWidth={2.5} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="Search by name or email..."
              className="w-full pl-14 pr-6 py-4.5 min-h-[56px] rounded-[20px] border border-white bg-white/70 backdrop-blur-xl text-[15px] text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] placeholder:text-slate-400 transition-all focus:bg-white"
            />
          </div>
          <button onClick={load} className="px-8 py-4.5 min-h-[56px] rounded-[20px] bg-[#4F46E5] hover:bg-indigo-600 text-white text-[15px] font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
            Search
          </button>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/60 rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-pulse flex flex-col h-[280px]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-slate-200/60 rounded-[16px]" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-200/60 rounded max-w-[120px]" />
                  <div className="h-3 bg-slate-100/60 rounded max-w-[150px]" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                  <div className="h-6 w-20 bg-slate-100/60 rounded-xl" />
                  <div className="h-6 w-24 bg-slate-100/60 rounded-xl" />
              </div>
              <div className="mt-auto space-y-2">
                <div className="h-3 bg-slate-100/60 rounded w-full" />
                <div className="h-3 bg-slate-100/60 rounded w-2/3" />
              </div>
            </div>
          ))}

          {!loading && list.map(u => {
            const c = getConn(u);
            const status = c?.status;
            const isRequester = c && c.requester_email.toLowerCase() === myEmail.toLowerCase();
            const name = u.name || u.email || 'Unnamed';
            const skills = (u.skills || '').split(',').map(s => s.trim()).filter(Boolean);
            const position = u.job_title || u.current_job || '';
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div key={u.id} className="bg-white rounded-[32px] p-6 lg:p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 hover:border-indigo-50 transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
                {/* Visual decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none" />

                {/* Profile Header */}
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-[#4F46E5] flex items-center justify-center font-extrabold text-[17px] shadow-sm shrink-0 border border-indigo-50">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-[17px] truncate group-hover:text-[#4F46E5] transition-colors">{name}</h3>
                      <p className="text-[13px] font-medium text-slate-500 truncate mt-0.5">{u.email}</p>
                    </div>
                  </div>
                  {u.user_type === 'alumni' && u.is_mentor && (
                    <span className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">Mentor</span>
                  )}
                  {u.user_type === 'student' && (
                    <span className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100/50">Student</span>
                  )}
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                  {u.graduation_year && (
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/80">
                      <GraduationCap size={13} className="text-slate-400" strokeWidth={2.5} />
                      Class of {u.graduation_year}
                    </div>
                  )}
                  {(position || u.company) && (
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/80">
                      <Building size={13} className="text-slate-400" strokeWidth={2.5} />
                      <span className="truncate max-w-[120px]">{position || u.company}</span>
                    </div>
                  )}
                  {u.location && (
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/80">
                      <MapPin size={13} className="text-slate-400" strokeWidth={2.5} />
                      <span className="truncate max-w-[80px]">{u.location}</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5 relative z-10">
                    {skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-indigo-50/50 text-[#4F46E5] text-[11px] font-bold tracking-wide rounded-[8px] border border-indigo-100/50">
                        {skill}
                      </span>
                    ))}
                    {skills.length > 3 && (
                      <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[11px] font-bold rounded-[8px] border border-slate-100">+{skills.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Bio */}
                {u.bio && (
                  <p className="text-[13px] text-slate-500 font-medium leading-relaxed line-clamp-2 mb-6 relative z-10">{u.bio}</p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-5 mt-auto border-t border-slate-100/80 relative z-10">
                  <button
                    onClick={() => setSelectedProfile(u)}
                    className="px-4 py-2.5 text-[13px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-colors border border-slate-200/60"
                  >
                    View
                  </button>

                  {myEmail && myEmail.toLowerCase() !== u.email.toLowerCase() && (
                    <div className="flex-1 flex gap-2 justify-end">
                      {!status && (
                        <button disabled={connBusy} onClick={() => request(u)} className="flex items-center justify-center flex-1 gap-1.5 px-3 py-2.5 text-[13px] font-bold rounded-xl bg-[#4F46E5] text-white hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50">
                          <MessageSquare size={14} /> Connect
                        </button>
                      )}
                      {status === 'pending' && isRequester && (
                        <span className="flex items-center justify-center flex-1 gap-1.5 px-3 py-2.5 text-[13px] font-bold rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                          <Clock size={14} /> Sent
                        </span>
                      )}
                      {status === 'pending' && !isRequester && (
                        <div className="flex w-full gap-2">
                          <button disabled={connBusy} onClick={() => respond(u, 'accept')} className="flex-1 px-3 py-2.5 text-[13px] font-bold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">Accept</button>
                          <button disabled={connBusy} onClick={() => respond(u, 'reject')} className="flex-1 px-3 py-2.5 text-[13px] font-bold rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 hover:bg-rose-100 hover:text-rose-700 transition-colors disabled:opacity-50">Decline</button>
                        </div>
                      )}
                      {status === 'accepted' && (
                        <button disabled={connBusy} onClick={() => remove(u)} className="flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-bold rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200/60 disabled:opacity-50">
                          <UserCheck size={14} /> Friends
                        </button>
                      )}
                      {(status === 'rejected' || status === 'removed') && (
                        <button disabled={connBusy} onClick={() => request(u)} className="flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-bold rounded-xl bg-[#4F46E5] text-white hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50">
                          Re-connect
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!loading && list.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/40 backdrop-blur-md rounded-[32px] border border-white">
              <div className="w-20 h-20 rounded-[20px] bg-slate-100 flex items-center justify-center mb-6 shadow-sm border border-slate-200/50">
                <Users size={32} className="text-slate-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Profiles Found</h3>
              <p className="text-[15px] font-medium text-slate-500 max-w-sm">Try adjusting your search criteria or switching between the Students / Alumni tabs.</p>
            </div>
          )}
        </div>

        {/* Profile Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setSelectedProfile(null)}>
            <div className="bg-white rounded-[32px] max-w-xl w-full p-8 shadow-[0_20px_60px_rgb(0,0,0,0.1)] border border-white relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedProfile(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20">
                <X size={20} strokeWidth={2.5}/>
              </button>

              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-full blur-[40px] -mt-10 -mr-10 pointer-events-none" />

              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#4F46E5] to-indigo-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-indigo-500/30 shrink-0">
                  {(selectedProfile.name || selectedProfile.email).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 pr-8">
                  <h2 className="text-[22px] font-extrabold text-slate-900 truncate tracking-tight">{selectedProfile.name || 'Unnamed'}</h2>
                  <p className="text-[15px] font-medium text-slate-500 truncate mt-0.5">{selectedProfile.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedProfile.user_type && <span className="text-[11px] px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">{selectedProfile.user_type}</span>}
                    {selectedProfile.graduation_year && <span className="text-[11px] px-3 py-1 rounded-full bg-indigo-50 text-[#4F46E5] font-bold uppercase tracking-wider">Class {selectedProfile.graduation_year}</span>}
                    {selectedProfile.major && <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold uppercase tracking-wider border border-emerald-100/50">{selectedProfile.major}</span>}
                  </div>
                </div>
              </div>

              {selectedProfile.bio && (
                  <div className="mb-6">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">About</h3>
                      <p className="text-[14px] text-slate-600 font-medium leading-relaxed p-4 bg-slate-50 rounded-[20px] border border-slate-100/80">{selectedProfile.bio}</p>
                  </div>
              )}

              {selectedProfile.skills && (
                <div className="mb-8 relative z-10">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.skills.split(',').slice(0, 12).map(s => (
                      <span key={s} className="px-3 py-1.5 text-[12px] rounded-xl bg-indigo-50/50 text-[#4F46E5] font-bold border border-indigo-100/50">{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-slate-100 relative z-10">
                {(() => {
                  const c = getConn(selectedProfile);
                  const status = c?.status;
                  const isReq = c && c.requester_email.toLowerCase() === myEmail.toLowerCase();
                  if (!myEmail || myEmail.toLowerCase() === selectedProfile.email.toLowerCase()) return null;
                  
                  if (!status) return <button disabled={connBusy} onClick={() => request(selectedProfile)} className="flex-1 px-5 py-3 text-[14px] font-bold rounded-xl bg-[#4F46E5] text-white hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-md shadow-indigo-500/20">Connect</button>;
                  
                  if (status === 'pending' && isReq) return <span className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-[14px] font-bold rounded-xl bg-amber-50 text-amber-700 border border-amber-200"><Clock size={16} /> Request Sent</span>;
                  
                  if (status === 'pending' && !isReq) return <div className="flex-1 flex gap-3"><button disabled={connBusy} onClick={() => respond(selectedProfile, 'accept')} className="flex-1 px-5 py-3 text-[14px] font-bold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/20">Accept</button><button disabled={connBusy} onClick={() => respond(selectedProfile, 'reject')} className="flex-1 px-5 py-3 text-[14px] font-bold rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50">Decline</button></div>;
                  
                  if (status === 'accepted') return <button disabled={connBusy} onClick={() => remove(selectedProfile)} className="flex-1 px-5 py-3 text-[14px] font-bold rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80 transition-colors disabled:opacity-50">Disconnect</button>;
                  
                  if (status === 'rejected' || status === 'removed') return <button disabled={connBusy} onClick={() => request(selectedProfile)} className="flex-1 px-5 py-3 text-[14px] font-bold rounded-xl bg-[#4F46E5] text-white hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-md shadow-indigo-500/20">Re-connect</button>;
                  
                  return null;
                })()}
                <button onClick={() => setSelectedProfile(null)} className="px-6 py-3 text-[14px] font-bold rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-slate-200/80 transition-colors">Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AlumniNavigation>
  );
}