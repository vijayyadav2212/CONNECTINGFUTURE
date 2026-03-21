"use client";
import { useEffect, useMemo, useState } from 'react';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Users, GraduationCap, Building, MapPin, MessageSquare, Clock, Search, UserCheck, UserX } from 'lucide-react';

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
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Network</h1>
            <p className="text-gray-500 text-sm mt-1">Browse {type === 'students' ? 'students' : 'fellow alumni'} and build connections.</p>
          </div>
          {/* Type Toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setType('students')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'students' ? 'bg-white shadow-sm text-green-700 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Students
            </button>
            <button
              onClick={() => setType('alumni')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'alumni' ? 'bg-white shadow-sm text-green-700 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Alumni
            </button>
          </div>
        </div>

        {/* Incoming Requests Panel */}
        {incoming.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={18} className="text-green-600" />
              Connection Requests
              <span className="ml-auto text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{incoming.length}</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {incoming.map(req => {
                const email = req.requester_email;
                const rProfile = requesterProfiles[email.toLowerCase()];
                const displayName = rProfile?.name || email;
                const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                const userLite: UserLite = rProfile || { id: 0, email, name: displayName, user_type: '' };
                return (
                  <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">{initials}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button disabled={connBusy} onClick={() => respond(userLite, 'accept')} className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50">
                        <UserCheck size={16} />
                      </button>
                      <button disabled={connBusy} onClick={() => respond(userLite, 'reject')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                        <UserX size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
            />
          </div>
          <button onClick={load} className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm">
            Search
          </button>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
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
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="p-5">
                  {/* Profile Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-base shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-green-700 transition-colors">{name}</h3>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    {u.user_type === 'alumni' && u.is_mentor && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">Mentor</span>
                    )}
                    {u.user_type === 'student' && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Student</span>
                    )}
                  </div>

                  {/* Info Pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {u.graduation_year && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <GraduationCap size={11} className="text-gray-400" />
                        Class of {u.graduation_year}
                      </div>
                    )}
                    {(position || u.company) && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <Building size={11} className="text-gray-400" />
                        <span className="truncate max-w-[120px]">{position || u.company}</span>
                      </div>
                    )}
                    {u.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <MapPin size={11} className="text-gray-400" />
                        <span className="truncate max-w-[80px]">{u.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-md border border-blue-100">
                          {skill}
                        </span>
                      ))}
                      {skills.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-md">+{skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Bio */}
                  {u.bio && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">{u.bio}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedProfile(u)}
                      className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      View Profile
                    </button>

                    {myEmail && myEmail.toLowerCase() !== u.email.toLowerCase() && (
                      <div className="flex-1 flex gap-2 justify-end">
                        {!status && (
                          <button disabled={connBusy} onClick={() => request(u)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm">
                            <MessageSquare size={12} /> Connect
                          </button>
                        )}
                        {status === 'pending' && isRequester && (
                          <span className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={12} /> Sent
                          </span>
                        )}
                        {status === 'pending' && !isRequester && (
                          <div className="flex gap-2">
                            <button disabled={connBusy} onClick={() => respond(u, 'accept')} className="px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">Accept</button>
                            <button disabled={connBusy} onClick={() => respond(u, 'reject')} className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50">Decline</button>
                          </div>
                        )}
                        {status === 'accepted' && (
                          <button disabled={connBusy} onClick={() => remove(u)} className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 disabled:opacity-50">
                            Connected · Remove
                          </button>
                        )}
                        {(status === 'rejected' || status === 'removed') && (
                          <button disabled={connBusy} onClick={() => request(u)} className="px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm">
                            Re-connect
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && list.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Users size={28} className="text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No Users Found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or switching between Students / Alumni.</p>
            </div>
          )}
        </div>

        {/* Profile Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedProfile(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedProfile(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>

              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xl">
                  {(selectedProfile.name || selectedProfile.email).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedProfile.name || 'Unnamed'}</h2>
                  <p className="text-sm text-gray-500">{selectedProfile.email}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedProfile.user_type && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">{selectedProfile.user_type}</span>}
                    {selectedProfile.graduation_year && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">Class {selectedProfile.graduation_year}</span>}
                    {selectedProfile.major && <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold">{selectedProfile.major}</span>}
                  </div>
                </div>
              </div>

              {selectedProfile.bio && <p className="text-sm text-gray-600 leading-relaxed mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">{selectedProfile.bio}</p>}

              {selectedProfile.skills && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {selectedProfile.skills.split(',').slice(0, 12).map(s => (
                    <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">{s.trim()}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                {(() => {
                  const c = getConn(selectedProfile);
                  const status = c?.status;
                  const isReq = c && c.requester_email.toLowerCase() === myEmail.toLowerCase();
                  if (!myEmail || myEmail.toLowerCase() === selectedProfile.email.toLowerCase()) return null;
                  if (!status) return <button disabled={connBusy} onClick={() => request(selectedProfile)} className="px-4 py-2 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm">Connect</button>;
                  if (status === 'pending' && isReq) return <span className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 border border-amber-200"><Clock size={12} /> Request Sent</span>;
                  if (status === 'pending' && !isReq) return <div className="flex gap-2"><button disabled={connBusy} onClick={() => respond(selectedProfile, 'accept')} className="px-3 py-2 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">Accept</button><button disabled={connBusy} onClick={() => respond(selectedProfile, 'reject')} className="px-3 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50">Decline</button></div>;
                  if (status === 'accepted') return <button disabled={connBusy} onClick={() => remove(selectedProfile)} className="px-4 py-2 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-colors disabled:opacity-50">Connected · Remove</button>;
                  if (status === 'rejected' || status === 'removed') return <button disabled={connBusy} onClick={() => request(selectedProfile)} className="px-4 py-2 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm">Re-connect</button>;
                  return null;
                })()}
                <button onClick={() => setSelectedProfile(null)} className="px-4 py-2 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AlumniNavigation>
  );
}