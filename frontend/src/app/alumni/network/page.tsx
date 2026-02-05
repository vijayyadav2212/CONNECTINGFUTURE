"use client";
import { useEffect, useMemo, useState } from 'react';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Users, GraduationCap, Building, MapPin, MessageSquare, Clock } from 'lucide-react';

interface UserLite { id:number; email:string; name:string; picture?:string; user_type:string; bio?:string; major?:string; graduation_year?:number; current_job?:string; job_title?:string; company?:string; location?:string; skills?:string; is_mentor?:boolean; }
interface ConnectionRecord { id:number; pair_key:string; requester_email:string; target_email:string; status:'pending'|'accepted'|'rejected'|'removed'; }

function api() { const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'; return base.endsWith('/api')? base: base.replace(/\/$/,'')+'/api'; }
const API = api();
function pairKey(a:string,b:string){ const [x,y]=[a.toLowerCase().trim(),b.toLowerCase().trim()].sort(); return `${x}|${y}`; }

export default function NetworkPage(){
  const { user } = useUser();
  const myEmail = (user?.email as string)||'';
  const [type,setType]=useState<'students'|'alumni'>('students');
  const [q,setQ]=useState('');
  const [list,setList]=useState<UserLite[]>([]);
  const [connections,setConnections]=useState<ConnectionRecord[]>([]);
  const [loading,setLoading]=useState(false);
  const [connBusy,setConnBusy]=useState(false);
  const [profile,setProfile]=useState<UserLite|null>(null);
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, UserLite>>({});

  const map = useMemo(()=>{ const m=new Map<string,ConnectionRecord>(); connections.forEach(c=>m.set(c.pair_key,c)); return m; },[connections]);
  const getConn=(u:UserLite)=> map.get(pairKey(myEmail,u.email));

  async function load(){ setLoading(true); try { const params=new URLSearchParams(); params.set('type', type==='students'?'student':'alumni'); if(q.trim()) params.set('q', q.trim()); const resp= await fetch(`${API}/users?${params.toString()}`); const data= await resp.json(); setList(data.users||[]);} finally { setLoading(false);} }
  async function loadConnections(){ if(!myEmail) return; const resp= await fetch(`${API}/connections?user_email=${encodeURIComponent(myEmail)}`); if(resp.ok){ const data= await resp.json(); setConnections(data.connections||[]);} }
  useEffect(()=>{ load(); },[type]);
  useEffect(()=>{ loadConnections(); },[myEmail]);

  // Hydrate requester profiles for incoming pending requests
  useEffect(()=>{
    if(!myEmail) return;
    const incoming = connections.filter(c => c.status==='pending' && c.target_email.toLowerCase()===myEmail.toLowerCase());
    const emails = Array.from(new Set(incoming.map(c => c.requester_email.toLowerCase())));
    const missing = emails.filter(e => !requesterProfiles[e]);
    if(missing.length===0) return;
    (async ()=>{
      try {
        const results = await Promise.all(missing.map(async (email) => {
          try {
            const resp = await fetch(`${API}/users/by-email?email=${encodeURIComponent(email)}`);
            if(!resp.ok) return { email } as any;
            const data = await resp.json();
            const u = data.user || {};
            const mapped: UserLite = { id: u.id||0, email: (u.email||email), name: (u.name||email), picture: u.picture, user_type: u.user_type||'', bio: u.bio, major: u.major, graduation_year: u.graduation_year, current_job: u.current_job, job_title: u.job_title, company: u.company, location: u.location, skills: Array.isArray(u.skills)? (u.skills as string[]).join(',') : (u.skills||'') , is_mentor: !!u.is_mentor };
            return mapped;
          } catch { return { email } as any; }
        }));
        setRequesterProfiles(prev => {
          const next = { ...prev };
          results.forEach(r => { if(r && r.email) next[String(r.email).toLowerCase()] = r; });
          return next;
        });
      } catch {
        // silent
      }
    })();
  },[API, connections, myEmail, requesterProfiles]);

  async function request(u:UserLite){ if(!myEmail) return; setConnBusy(true); try{ const resp= await fetch(`${API}/connections/request`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requester_email: myEmail, target_email: u.email })}); if(resp.ok){ const data= await resp.json(); setConnections(p=>[data.connection,...p.filter(c=>c.pair_key!==data.connection.pair_key)]);} } finally{ setConnBusy(false);} }
  async function respond(u:UserLite, action:'accept'|'reject'){ setConnBusy(true); try{ const resp= await fetch(`${API}/connections/respond`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_email: myEmail, other_email: u.email, action })}); if(resp.ok){ const data= await resp.json(); setConnections(p=>p.map(c=>c.pair_key===data.connection.pair_key?data.connection:c)); } } finally { setConnBusy(false);} }
  async function remove(u:UserLite){ setConnBusy(true); try{ const resp= await fetch(`${API}/connections/remove`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_email: myEmail, other_email: u.email })}); if(resp.ok){ const data= await resp.json(); if(data.connection){ setConnections(p=>p.map(c=>c.pair_key===data.connection.pair_key?data.connection:c)); } } } finally { setConnBusy(false);} }

  return <AlumniNavigation>
    <div className="p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Network</h1>
            <p className="text-slate-600 mt-1">Browse {type==='students'?'students':'alumni'} and build connections.</p>
          </div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            <button onClick={()=>setType('students')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${type==='students'?'bg-white shadow text-blue-600':'text-slate-600 hover:text-slate-900'}`}>Students</button>
            <button onClick={()=>setType('alumni')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${type==='alumni'?'bg-white shadow text-blue-600':'text-slate-600 hover:text-slate-900'}`}>Alumni</button>
          </div>
        </header>

        {/* My Requests (incoming pending) */}
        {connections.length>0 && myEmail && (
          (() => {
            const incoming = connections.filter(c => c.status==='pending' && c.target_email.toLowerCase()===myEmail.toLowerCase());
            if (incoming.length===0) return null;
            return (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  My Requests
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {incoming.map(req => {
                    const email=req.requester_email;
                    const profile = requesterProfiles[email.toLowerCase()];
                    const displayName = profile?.name || email;
                    const initials = (displayName||'').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                    const userLite: UserLite = profile || { id:0, email, name: displayName, user_type:'', picture: undefined } as any;
                    return (
                      <div key={req.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">{initials}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                            <p className="text-xs text-gray-600 truncate">{email}</p>
                            {(profile?.major || profile?.graduation_year) && (
                              <p className="text-xs text-gray-500 truncate">{profile?.major || '—'}{profile?.graduation_year? ` • Class of ${profile.graduation_year}`:''}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2 justify-end">
                          <button disabled={connBusy} onClick={()=>respond(userLite,'accept')} className="px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-60">Accept</button>
                          <button disabled={connBusy} onClick={()=>respond(userLite,'reject')} className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-semibold hover:from-red-600 hover:to-rose-700 disabled:opacity-60">Decline</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        )}
        <div className="flex gap-3">
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=> e.key==='Enter' && load()} placeholder="Search name or email..." className="flex-1 px-5 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
          <button onClick={load} className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Search</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {loading && Array.from({length:6}).map((_,i)=>(
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}

          {!loading && list.map(u=>{
            const c = getConn(u);
            const status = c?.status;
            const isRequester = c && c.requester_email.toLowerCase() === myEmail.toLowerCase();
            const name = u.name || u.email || 'Unnamed';
            const skills = (u.skills||'').split(',').map(s=>s.trim()).filter(Boolean);
            const position = u.job_title || u.current_job || '';
            const isStudentView = type === 'students';
            return (
              <div key={u.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group relative overflow-hidden">
                {/* Status Badge for mentors */}
                {u.user_type==='alumni' && u.is_mentor && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      Available 🟢
                    </div>
                  </div>
                )}
                {/* Student badge */}
                {isStudentView && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      Student
                    </div>
                  </div>
                )}

                <div className="p-6 lg:p-8">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg lg:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg lg:text-xl truncate group-hover:text-blue-600 transition-colors duration-200 mb-1">{name}</h3>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        {u.graduation_year && <><GraduationCap className="w-4 h-4 text-blue-500" /><span className="font-medium">Class of {u.graduation_year}</span></>}
                      </div>
                      {u.major && <div className="text-xs text-gray-500 font-medium truncate">{u.major}</div>}
                    </div>
                  </div>

                  {/* Info Section: Education/Location for Students; Role/Location for Alumni */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl mb-6 border border-gray-100">
                    <div className="space-y-3">
                      {isStudentView ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <GraduationCap className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Education</p>
                              <p className="font-bold text-gray-900 text-sm truncate">{u.major || '—'}</p>
                              {u.graduation_year && <p className="text-blue-600 font-medium text-sm truncate">Class of {u.graduation_year}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <MapPin className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                              <p className="font-semibold text-gray-900 text-sm truncate">{u.location || '—'}</p>
                            </div>
                          </div>
                          {(position || u.company) && (
                            <div className="flex items-center gap-3">
                              <div className="bg-indigo-100 p-2 rounded-lg">
                                <Building className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Experience</p>
                                <p className="font-bold text-gray-900 text-sm truncate">{position || '—'}</p>
                                <p className="text-indigo-600 font-medium text-sm truncate">{u.company || '—'}</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Building className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Role</p>
                              <p className="font-bold text-gray-900 text-sm truncate">{position || '—'}</p>
                              <p className="text-blue-600 font-medium text-sm truncate">{u.company || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <MapPin className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                              <p className="font-semibold text-gray-900 text-sm truncate">{u.location || '—'}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expertise Tags */}
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Expertise Areas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0,3).map((exp,idx)=>(
                        <span key={idx} className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-purple-800 text-xs font-semibold rounded-lg hover:from-purple-100 hover:to-blue-100 transition-colors duration-200">
                          {exp}
                        </span>
                      ))}
                      {skills.length>3 && (
                        <span className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200">
                          +{skills.length-3} more
                        </span>
                      )}
                      {skills.length===0 && (
                        <span className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200">
                          No skills listed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mb-6">
                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{u.bio || 'No bio yet.'}</p>
                  </div>

                  {/* Mentoring Status */}
                  {u.user_type==='alumni' && (
                    u.is_mentor ? (
                      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="text-green-800 font-bold text-sm">Available for Mentoring</p>
                            <p className="text-green-700 text-xs">Ready to guide and support you</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <div>
                            <p className="text-gray-700 font-bold text-sm">Not available for mentoring</p>
                            <p className="text-gray-600 text-xs">Connection still possible</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button onClick={()=>setProfile(u)} className="px-4 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-500 transition-all duration-200 group text-sm font-semibold">
                      View Profile
                    </button>
                    {!myEmail || myEmail.toLowerCase()===u.email.toLowerCase()? null : (
                      <>
                        {!status && (
                          <button disabled={connBusy} onClick={()=>request(u)} className="flex-1 px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-60 text-sm">
                            <MessageSquare className="w-4 h-4 mr-2 inline" />
                            Connect
                          </button>
                        )}
                        {status==='pending' && isRequester && (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 flex items-center gap-1 self-center">
                            <Clock className="w-3 h-3" />
                            Request Sent
                          </span>
                        )}
                        {status==='pending' && !isRequester && (
                          <div className="flex gap-2 flex-1">
                            <button disabled={connBusy} onClick={()=>respond(u,'accept')} className="flex-1 text-sm px-3 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow hover:shadow-md disabled:opacity-60">Accept</button>
                            <button disabled={connBusy} onClick={()=>respond(u,'reject')} className="flex-1 text-sm px-3 py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow hover:shadow-md disabled:opacity-60">Decline</button>
                          </div>
                        )}
                        {status==='accepted' && (
                          <button disabled={connBusy} onClick={()=>remove(u)} className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-500 transition-all duration-200 group text-sm font-semibold disabled:opacity-60">Connected · Remove</button>
                        )}
                        {(status==='rejected' || status==='removed') && (
                          <button disabled={connBusy} onClick={()=>request(u)} className="flex-1 px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-60 text-sm">Re-connect</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && list.length===0 && (
            <div className="col-span-full">
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No Users Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">Try adjusting your search terms or switching between Students/Alumni.</p>
              </div>
            </div>
          )}
        </div>
        {profile && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={()=>setProfile(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 relative" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setProfile(null)} className="absolute top-3 right-3 text-slate-500 hover:text-slate-700">✕</button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">{(profile.name||profile.email).slice(0,2).toUpperCase()}</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{profile.name||'Unnamed'}</h2>
                <p className="text-sm text-slate-600">{profile.email}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {profile.user_type && <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{profile.user_type}</span>}
                  {profile.graduation_year && <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">Class {profile.graduation_year}</span>}
                  {profile.major && <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">{profile.major}</span>}
                </div>
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed mb-4">{profile.bio || 'No biography provided yet.'}</p>
            {profile.skills && <div className="flex flex-wrap gap-2 mb-6">{profile.skills.split(',').slice(0,12).map(s=> <span key={s} className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">{s.trim()}</span>)}</div>}
            <div className="flex gap-3">
              {(()=>{ const c=getConn(profile); const status=c?.status; const isRequester= c && c.requester_email.toLowerCase()===myEmail.toLowerCase(); if(!myEmail || myEmail.toLowerCase()===profile.email.toLowerCase()) return null; if(!status) return <button disabled={connBusy} onClick={()=>request(profile)} className="px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl disabled:opacity-60 text-sm">Connect</button>; if(status==='pending'&& isRequester) return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 flex items-center gap-1"><Clock className="w-3 h-3" />Request Sent</span>; if(status==='pending' && !isRequester) return <div className="flex gap-2"><button disabled={connBusy} onClick={()=>respond(profile,'accept')} className="text-sm px-3 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow hover:shadow-md disabled:opacity-60">Accept</button><button disabled={connBusy} onClick={()=>respond(profile,'reject')} className="text-sm px-3 py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow hover:shadow-md disabled:opacity-60">Decline</button></div>; if(status==='accepted') return <button disabled={connBusy} onClick={()=>remove(profile)} className="px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-60 text-sm">Connected · Remove</button>; if(status==='rejected'|| status==='removed') return <button disabled={connBusy} onClick={()=>request(profile)} className="px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl disabled:opacity-60 text-sm">Re-connect</button>; return null; })()}
              <button onClick={()=>setProfile(null)} className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200">Close</button>
            </div>
          </div>
        </div>}
      </div>
    </div>
  </AlumniNavigation>;
}
