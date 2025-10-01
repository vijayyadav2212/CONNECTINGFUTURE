"use client";
import { useEffect, useMemo, useState } from 'react';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import { useUser } from '@auth0/nextjs-auth0/client';

interface UserLite { id:number; email:string; name:string; picture?:string; user_type:string; bio?:string; major?:string; graduation_year?:number; current_job?:string; company?:string; location?:string; skills?:string; }
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

  const map = useMemo(()=>{ const m=new Map<string,ConnectionRecord>(); connections.forEach(c=>m.set(c.pair_key,c)); return m; },[connections]);
  const getConn=(u:UserLite)=> map.get(pairKey(myEmail,u.email));

  async function load(){ setLoading(true); try { const params=new URLSearchParams(); params.set('type', type==='students'?'student':'alumni'); if(q.trim()) params.set('q', q.trim()); const resp= await fetch(`${API}/users?${params.toString()}`); const data= await resp.json(); setList(data.users||[]);} finally { setLoading(false);} }
  async function loadConnections(){ if(!myEmail) return; const resp= await fetch(`${API}/connections?user_email=${encodeURIComponent(myEmail)}`); if(resp.ok){ const data= await resp.json(); setConnections(data.connections||[]);} }
  useEffect(()=>{ load(); },[type]);
  useEffect(()=>{ loadConnections(); },[myEmail]);

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
        <div className="flex gap-3">
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=> e.key==='Enter' && load()} placeholder="Search name or email..." className="flex-1 px-5 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
          <button onClick={load} className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Search</button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading && Array.from({length:8}).map((_,i)=><div key={i} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />)}
          {!loading && list.map(u=>{ const c=getConn(u); const status=c?.status; const isRequester= c && c.requester_email.toLowerCase()===myEmail.toLowerCase(); return <div key={u.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">{(u.name||u.email).slice(0,2).toUpperCase()}</div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{u.name||'Unnamed'}</h3>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 line-clamp-3 flex-1">{u.bio||'No bio yet.'}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {u.major && <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{u.major}</span>}
              {u.graduation_year && <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">{u.graduation_year}</span>}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button onClick={()=>setProfile(u)} className="w-full text-sm px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200">View Profile</button>
              {!myEmail || myEmail.toLowerCase()===u.email.toLowerCase()? null: <>
                {!status && <button disabled={connBusy} onClick={()=>request(u)} className="w-full text-sm px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Connect</button>}
                {status==='pending' && isRequester && <span className="text-xs text-amber-600 text-center">Request Sent</span>}
                {status==='pending' && !isRequester && <div className="flex gap-2"><button disabled={connBusy} onClick={()=>respond(u,'accept')} className="flex-1 text-sm px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">Accept</button><button disabled={connBusy} onClick={()=>respond(u,'reject')} className="flex-1 text-sm px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">Decline</button></div>}
                {status==='accepted' && <button disabled={connBusy} onClick={()=>remove(u)} className="w-full text-sm px-4 py-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-60">Connected · Remove</button>}
                {(status==='rejected'|| status==='removed') && <button disabled={connBusy} onClick={()=>request(u)} className="w-full text-sm px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Re-connect</button>}
              </>}
            </div>
          </div>; })}
          {!loading && list.length===0 && <div className="col-span-full text-center text-slate-500 py-20">No users found.</div>}
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
              {(()=>{ const c=getConn(profile); const status=c?.status; const isRequester= c && c.requester_email.toLowerCase()===myEmail.toLowerCase(); if(!myEmail || myEmail.toLowerCase()===profile.email.toLowerCase()) return null; if(!status) return <button disabled={connBusy} onClick={()=>request(profile)} className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">Connect</button>; if(status==='pending'&& isRequester) return <span className="text-sm text-amber-600">Request Sent</span>; if(status==='pending' && !isRequester) return <div className="flex gap-2"><button disabled={connBusy} onClick={()=>respond(profile,'accept')} className="px-5 py-3 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60">Accept</button><button disabled={connBusy} onClick={()=>respond(profile,'reject')} className="px-5 py-3 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60">Decline</button></div>; if(status==='accepted') return <button disabled={connBusy} onClick={()=>remove(profile)} className="px-5 py-3 rounded-2xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 disabled:opacity-60">Connected · Remove</button>; if(status==='rejected'|| status==='removed') return <button disabled={connBusy} onClick={()=>request(profile)} className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">Re-connect</button>; return null; })()}
              <button onClick={()=>setProfile(null)} className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200">Close</button>
            </div>
          </div>
        </div>}
      </div>
    </div>
  </AlumniNavigation>;
}
