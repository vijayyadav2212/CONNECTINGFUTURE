"use client";
import { useEffect, useMemo, useState } from 'react';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Users, GraduationCap, Building, MapPin, MessageSquare, Clock, Search, UserCheck, UserX, X, Sparkles, ChevronRight, Check } from 'lucide-react';

interface UserLite {
  id: number; email: string; name: string; picture?: string; user_type: string;
  bio?: string; major?: string; department?: string; graduation_year?: number; current_job?: string;
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
  const [type, setType] = useState<'students' | 'alumni'>('alumni');
  const [q, setQ] = useState('');
  const [list, setList] = useState<UserLite[]>([]);
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [connBusy, setConnBusy] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserLite | null>(null);
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, UserLite>>({});
  const [myProfile, setMyProfile] = useState<UserLite | null>(null);
  const [showOthers, setShowOthers] = useState(false);

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

  // Fetch own profile for batch/branch matching
  useEffect(() => {
    if (!myEmail) return;
    (async () => {
      try {
        const resp = await fetch(`${API}/users/by-email?email=${encodeURIComponent(myEmail)}`);
        if (resp.ok) {
          const data = await resp.json();
          const u = data.user || {};
          setMyProfile({ id: u.id, email: u.email, name: u.name, user_type: u.user_type, graduation_year: u.graduation_year, major: u.major || u.department } as UserLite);
        }
      } catch { }
    })();
  }, [myEmail]);

  // Split list: same batch & branch first, then others
  const { sameGroup, othersGroup } = useMemo(() => {
    const others = list.filter(u => u.email.toLowerCase() !== myEmail.toLowerCase());
    if (!myProfile?.graduation_year && !myProfile?.major) return { sameGroup: [], othersGroup: others };

    const same = others.filter(u => {
      const batchMatch = myProfile.graduation_year && u.graduation_year === myProfile.graduation_year;
      const branchMatch = myProfile.major && (u.major || u.department) && (u.major || u.department)?.toLowerCase() === myProfile.major.toLowerCase();
      return batchMatch || branchMatch;
    });

    const sameEmails = new Set(same.map(u => u.email.toLowerCase()));
    const rest = others.filter(u => !sameEmails.has(u.email.toLowerCase()));
    return { sameGroup: same, othersGroup: rest };
  }, [list, myProfile, myEmail]);

  const isSearching = q.trim().length > 0;
  const visibleOthers = sameGroup.length === 0 || showOthers || isSearching;

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

  const renderUserCard = (u: UserLite) => {
    const c = getConn(u);
    const status = c?.status;
    const isRequester = c && c.requester_email.toLowerCase() === myEmail.toLowerCase();
    const name = u.name || u.email || 'Unnamed';
    const skills = (u.skills || '').split(',').map(s => s.trim()).filter(Boolean);
    const position = u.job_title || u.current_job || '';
    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    return (
      <div key={u.id} className="bg-white rounded-[28px] p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-gray-100 h-full relative" onClick={() => setSelectedProfile(u)}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center font-bold text-[17px] shrink-0">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-[17px] tracking-tight leading-tight">{name}</h3>
              <p className="text-[13px] font-bold text-gray-400 mt-0.5">{position || (u.user_type === 'alumni' ? 'Alumni' : 'Student')}</p>
            </div>
          </div>
          {u.user_type === 'alumni' && u.is_mentor && (
            <span className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full bg-[#1A1C23] text-white">Mentor</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 mb-6">
           {u.company && <p className="text-[13px] font-bold text-gray-600"><span className="text-gray-400">At</span> {u.company}</p>}
           {u.graduation_year && <p className="text-[13px] font-bold text-gray-600"><span className="text-gray-400">Class</span> {u.graduation_year}</p>}
           {u.location && <p className="text-[13px] font-bold text-gray-600"><span className="text-gray-400">Loc</span> {u.location}</p>}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="px-3 py-1.5 bg-[#F4F6FB] text-gray-600 text-[11px] font-bold rounded-xl">
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="px-3 py-1.5 bg-[#F4F6FB] text-gray-600 text-[11px] font-bold rounded-xl">+{skills.length - 3}</span>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto" onClick={(e) => e.stopPropagation()}>
          {myEmail && myEmail.toLowerCase() !== u.email.toLowerCase() && (
            <div className="flex w-full gap-2">
              {!status && (
                <button disabled={connBusy} onClick={() => request(u)} className="flex-1 px-4 py-3 text-[13px] font-bold rounded-2xl bg-[#1A1C23] text-white hover:bg-black transition-colors disabled:opacity-50">
                  Connect
                </button>
              )}
              {status === 'pending' && isRequester && (
                <span className="flex-1 flex items-center justify-center px-4 py-3 text-[13px] font-bold rounded-2xl bg-gray-100 text-gray-500">
                  Sent
                </span>
              )}
              {status === 'pending' && !isRequester && (
                <>
                  <button disabled={connBusy} onClick={() => respond(u, 'accept')} className="flex-1 px-4 py-3 text-[13px] font-bold rounded-2xl bg-[#1A1C23] text-white hover:bg-black transition-colors disabled:opacity-50">Accept</button>
                  <button disabled={connBusy} onClick={() => respond(u, 'reject')} className="px-4 py-3 text-[13px] font-bold rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">Decline</button>
                </>
              )}
              {status === 'accepted' && (
                <button disabled={connBusy} onClick={() => remove(u)} className="flex-1 px-4 py-3 text-[13px] font-bold rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
                  Friends
                </button>
              )}
              {(status === 'rejected' || status === 'removed') && (
                <button disabled={connBusy} onClick={() => request(u)} className="flex-1 px-4 py-3 text-[13px] font-bold rounded-2xl bg-[#1A1C23] text-white hover:bg-black transition-colors disabled:opacity-50">
                  Re-connect
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const incoming = connections.filter(c => c.status === 'pending' && c.target_email.toLowerCase() === myEmail.toLowerCase());

  return (
    <AlumniNavigation>
      <div className="max-w-[1400px] mx-auto text-[#111111]">
        
        {/* Page Header Banner */}
        <div className="bg-[#1A1C23] rounded-[32px] p-8 md:p-12 text-white mb-10 relative overflow-hidden shadow-lg">
           <div className="relative z-10">
             <h1 className="text-[32px] md:text-[38px] font-bold mb-2 tracking-tight">Expand Your Reach</h1>
             <p className="text-[#8F93A3] text-[14px] font-medium max-w-[400px] leading-[1.6]">
               Browse {type === 'students' ? 'students' : 'fellow alumni'} and build meaningful connections within your community.
             </p>
           </div>
           {/* Abstract line art */}
           <svg className="absolute right-0 bottom-0 w-[250px] h-full pointer-events-none opacity-80" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40,70 C60,70 70,30 90,30 C110,30 120,60 140,60 C160,60 170,20 190,20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
           </svg>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
           {/* Tabs */}
           <div className="flex gap-4 sm:gap-8 text-[14px] font-bold text-gray-400 bg-white md:bg-transparent rounded-full md:rounded-none p-1 md:p-0">
             <span 
               onClick={() => { setType('alumni'); setShowOthers(false); }}
               className={`cursor-pointer transition-colors py-2.5 px-6 rounded-full ${type === 'alumni' ? 'bg-[#1A1C23] text-white shadow-sm' : 'hover:text-black'}`}
             >
               Alumni
             </span>
             <span 
               onClick={() => { setType('students'); setShowOthers(false); }}
               className={`cursor-pointer transition-colors py-2.5 px-6 rounded-full ${type === 'students' ? 'bg-[#1A1C23] text-white shadow-sm' : 'hover:text-black'}`}
             >
               Students
             </span>
           </div>
           
           {/* Search */}
           <div className="w-full md:max-w-md flex relative shadow-sm rounded-[16px] overflow-hidden">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2.5} />
             <input 
               value={q}
               onChange={e => setQ(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && load()}
               type="text" 
               placeholder="Search..." 
               className="w-full bg-white py-3.5 pl-12 pr-4 text-[15px] font-medium focus:outline-none placeholder-gray-400"
             />
             <button onClick={load} className="bg-white border-l border-gray-100 text-[#1A1C23] px-6 py-3.5 font-bold text-[14px] hover:bg-gray-50 transition-colors">Search</button>
           </div>
        </div>

        {/* Incoming Requests Panel */}
        {incoming.length > 0 && (
          <div className="mb-10">
             <div className="flex items-center gap-3 mb-6">
                <h2 className="text-[22px] font-bold tracking-tight">Connection Requests</h2>
                <span className="w-6 h-6 flex items-center justify-center bg-[#1A1C23] text-white text-[12px] font-bold rounded-full">{incoming.length}</span>
             </div>
             <div className="space-y-4">
                {incoming.map(req => {
                  const email = req.requester_email;
                  const rProfile = requesterProfiles[email.toLowerCase()];
                  const displayName = rProfile?.name || email;
                  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                  const userLite: UserLite = rProfile || { id: 0, email, name: displayName, user_type: '' };
                  
                  return (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-[24px] shadow-sm border border-gray-100 gap-4">
                       <div className="flex items-center gap-4 pl-2">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center font-bold text-[15px] shrink-0">
                            {initials}
                          </div>
                          <div>
                            <h4 className="font-bold text-[16px] tracking-tight leading-tight">{displayName}</h4>
                            <p className="text-[13px] font-bold text-gray-400 mt-0.5">{email}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button disabled={connBusy} onClick={() => respond(userLite, 'accept')} className="px-5 py-2.5 rounded-[14px] bg-[#1A1C23] text-white text-[13px] font-bold hover:bg-black transition-colors disabled:opacity-50">Accept</button>
                          <button disabled={connBusy} onClick={() => respond(userLite, 'reject')} className="px-5 py-2.5 rounded-[14px] bg-[#F4F6FB] text-gray-600 text-[13px] font-bold hover:bg-gray-200 transition-colors disabled:opacity-50">Decline</button>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/60 rounded-[28px] p-6 border border-white shadow-sm animate-pulse flex flex-col h-[280px]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded max-w-[120px]" />
                    <div className="h-3 bg-gray-100 rounded max-w-[150px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-3 mb-6">
                  <div className="h-3 w-40 bg-gray-100 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
                <div className="mt-auto space-y-2">
                  <div className="h-10 bg-gray-200 rounded-2xl w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* Same Batch & Branch Section */}
            {sameGroup.length > 0 && !isSearching && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-[22px] font-bold tracking-tight">Your Cohort</h2>
                  <span className="text-[13px] font-bold text-gray-400 bg-white px-3 py-1 rounded-full">{sameGroup.length} matches</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sameGroup.map(u => renderUserCard(u))}
                </div>
              </div>
            )}

            {/* Others Section */}
            {othersGroup.length > 0 && (
              <div className="space-y-6">
                {(sameGroup.length > 0 && !isSearching) && (
                  <div className="flex items-center justify-between mb-4 mt-10">
                    <h2 className="text-[22px] font-bold tracking-tight">Other {type === 'students' ? 'Students' : 'Alumni'}</h2>
                    <button
                      onClick={() => setShowOthers(!showOthers)}
                      className="text-[13px] font-bold text-gray-500 hover:text-black transition-colors"
                    >
                      {showOthers ? 'Show Less' : `Show All Others (${othersGroup.length})`}
                    </button>
                  </div>
                )}

                {visibleOthers && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {othersGroup.map(u => renderUserCard(u))}
                  </div>
                )}
              </div>
            )}

            {list.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                  <Search size={24} className="text-gray-400" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-[#1A1C23] mb-1">No Profiles Found</h3>
                <p className="text-[14px] font-bold text-gray-400 max-w-sm">Try adjusting your search criteria or switching between tabs.</p>
              </div>
            )}
          </>
        )}

        {/* Profile Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111]/40 backdrop-blur-sm p-4" onClick={() => setSelectedProfile(null)}>
            <div className="bg-white rounded-[40px] max-w-md w-full p-8 shadow-2xl relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedProfile(null)} className="absolute top-6 right-6 w-10 h-10 bg-gray-50 hover:bg-gray-100 flex items-center justify-center rounded-full transition-colors z-20">
                <X size={18} className="text-gray-600" strokeWidth={2.5} />
              </button>

              <div className="flex flex-col items-center mb-8 relative z-10 pt-4">
                <div className="w-24 h-24 rounded-[28px] bg-gray-100 text-[#1A1C23] flex items-center justify-center font-bold text-3xl shrink-0 mb-4 shadow-inner">
                  {(selectedProfile.name || selectedProfile.email).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <h2 className="text-[24px] font-bold text-[#1A1C23] text-center tracking-tight leading-tight">{selectedProfile.name || 'Unnamed'}</h2>
                <p className="text-[14px] font-bold text-gray-400 text-center mt-1">{selectedProfile.email}</p>
              </div>

              <div className="flex flex-col gap-2 mb-8 bg-gray-50 rounded-3xl p-5 border border-gray-100">
                {selectedProfile.user_type && (
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                     <span className="text-[13px] font-bold text-gray-400">Role</span>
                     <span className="text-[13px] font-bold text-[#1A1C23] capitalize">{selectedProfile.user_type}</span>
                  </div>
                )}
                {selectedProfile.graduation_year && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                     <span className="text-[13px] font-bold text-gray-400">Class Of</span>
                     <span className="text-[13px] font-bold text-[#1A1C23]">{selectedProfile.graduation_year}</span>
                  </div>
                )}
                {selectedProfile.major && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                     <span className="text-[13px] font-bold text-gray-400">Major</span>
                     <span className="text-[13px] font-bold text-[#1A1C23]">{selectedProfile.major}</span>
                  </div>
                )}
                {selectedProfile.company && (
                  <div className="flex justify-between items-center pt-2">
                     <span className="text-[13px] font-bold text-gray-400">Company</span>
                     <span className="text-[13px] font-bold text-[#1A1C23]">{selectedProfile.company}</span>
                  </div>
                )}
              </div>

              {selectedProfile.bio && (
                <div className="mb-8">
                  <h3 className="text-[13px] font-bold tracking-tight mb-2">About</h3>
                  <p className="text-[14px] text-gray-500 font-medium leading-relaxed">{selectedProfile.bio}</p>
                </div>
              )}

              {selectedProfile.skills && (
                <div className="mb-8 relative z-10">
                  <h3 className="text-[13px] font-bold tracking-tight mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.skills.split(',').slice(0, 12).map(s => (
                      <span key={s} className="px-3 py-1.5 text-[12px] rounded-xl bg-[#1A1C23] text-white font-bold">{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto flex gap-3 relative z-10">
                {(() => {
                  const c = getConn(selectedProfile);
                  const status = c?.status;
                  const isReq = c && c.requester_email.toLowerCase() === myEmail.toLowerCase();
                  if (!myEmail || myEmail.toLowerCase() === selectedProfile.email.toLowerCase()) return null;

                  if (!status) return <button disabled={connBusy} onClick={() => request(selectedProfile)} className="flex-1 py-4 text-[14px] font-bold rounded-2xl bg-[#1A1C23] text-white hover:bg-black transition-colors disabled:opacity-50">Connect</button>;

                  if (status === 'pending' && isReq) return <span className="flex-1 flex items-center justify-center py-4 text-[14px] font-bold rounded-2xl bg-gray-100 text-gray-500">Request Sent</span>;

                  if (status === 'pending' && !isReq) return <div className="flex-1 flex gap-3"><button disabled={connBusy} onClick={() => respond(selectedProfile, 'accept')} className="flex-1 py-4 text-[14px] font-bold rounded-2xl bg-[#1A1C23] text-white hover:bg-black transition-colors disabled:opacity-50">Accept</button><button disabled={connBusy} onClick={() => respond(selectedProfile, 'reject')} className="flex-1 py-4 text-[14px] font-bold rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">Decline</button></div>;

                  if (status === 'accepted') return <button disabled={connBusy} onClick={() => remove(selectedProfile)} className="flex-1 py-4 text-[14px] font-bold rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">Disconnect</button>;

                  if (status === 'rejected' || status === 'removed') return <button disabled={connBusy} onClick={() => request(selectedProfile)} className="flex-1 py-4 text-[14px] font-bold rounded-2xl bg-[#1A1C23] text-white hover:bg-black transition-colors disabled:opacity-50">Re-connect</button>;

                  return null;
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    </AlumniNavigation>
  );
}