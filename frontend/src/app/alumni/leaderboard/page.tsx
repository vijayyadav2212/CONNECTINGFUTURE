"use client";

import React, { useEffect, useState } from "react";
import AlumniNavigation from "../AluminaNavigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

type Alum = {
  id?: number;
  email: string;
  name?: string;
  profile_pic?: string | null;
  jobs: number;
  roadmaps: number;
  mentorships: number;
  memories: number;
  total_points: number;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<Alum[]>([]);

  // Fetch alumni and compute scores
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch alumni users (limit to 200)
        const ures = await fetch(`${API_BASE}/api/users?type=alumni&limit=200`);
        if (!ures.ok) throw new Error('Failed to load users');
        const uj = await ures.json();
        const users: any[] = uj.users || [];

        // For each user, fetch counts in parallel
        const entries = await Promise.all(users.map(async (u) => {
          const email = u.email;
          // Jobs count (backend returns total)
          let jobsCount = 0;
          try {
            const r = await fetch(`${API_BASE}/api/jobs?posted_by=${encodeURIComponent(email)}&limit=1`);
            if (r.ok) {
              const j = await r.json();
              jobsCount = Number(j.total || 0);
            }
          } catch {}

          // Roadmaps count
          let roadmapsCount = 0;
          try {
            const r = await fetch(`${API_BASE}/api/roadmaps?owner_email=${encodeURIComponent(email)}`);
            if (r.ok) {
              const rr = await r.json();
              roadmapsCount = Array.isArray(rr.roadmaps) ? rr.roadmaps.length : 0;
            }
          } catch {}

          // Mentorship completed sessions count
          let mentorshipsCount = 0;
          try {
            const r = await fetch(`${API_BASE}/api/mentorship/sessions?mentor_email=${encodeURIComponent(email)}&status=completed`);
            if (r.ok) {
              const ms = await r.json();
              mentorshipsCount = Array.isArray(ms.sessions) ? ms.sessions.length : 0;
            }
          } catch {}

          // Memories: frontend local feature — set 0 (no API)
          const memoriesCount = 0;

          const total_points = jobsCount + roadmapsCount + mentorshipsCount + memoriesCount;

          return {
            email,
            name: u.name || u.email,
            profile_pic: u.picture || null,
            jobs: jobsCount,
            roadmaps: roadmapsCount,
            mentorships: mentorshipsCount,
            memories: memoriesCount,
            total_points,
          } as Alum;
        }));

        const sorted = entries.sort((a, b) => b.total_points - a.total_points);
        if (mounted) setLeaders(sorted);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Failed to load leaderboard');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const [first, second, third, ...rest] = leaders.length ? leaders : [
    { email: '—', name: '—', profile_pic: '', jobs:0, roadmaps:0, mentorships:0, memories:0, total_points:0 },
    { email: '—', name: '—', profile_pic: '', jobs:0, roadmaps:0, mentorships:0, memories:0, total_points:0 },
    { email: '—', name: '—', profile_pic: '', jobs:0, roadmaps:0, mentorships:0, memories:0, total_points:0 },
  ];

  const avatarFor = (pic?: string | null, name?: string) => pic || `https://i.pravatar.cc/100?u=${encodeURIComponent(name || 'anon')}`;

  return (
    <AlumniNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        <div className="space-y-10 max-w-6xl mx-auto">
          <h1 className="text-5xl font-black text-slate-900 text-center mb-8 tracking-tight">
            Alumni Hall of Fame 🏆
          </h1>
          {loading ? (
            <div className="text-center text-slate-600">Loading leaderboard…</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : null}

          {/* PODIUM SECTION */}
          <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-12">

            {/* 2nd Place */}
            <div className="relative flex flex-col items-center order-2 md:order-1">
              <div className="w-24 h-24 rounded-full border-4 border-slate-300 overflow-hidden shadow-xl mb-3 relative z-10 flex items-center justify-center bg-slate-100">
                {second.profile_pic ? (
                  <img src={avatarFor(second.profile_pic, second.name)} alt={second.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-700">
                    {String(second.name || second.email || '').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-t from-slate-200 to-slate-100 w-32 h-40 rounded-t-2xl flex flex-col justify-end items-center p-4 shadow-lg border border-slate-300/50">
                <span className="text-4xl font-black text-slate-400 mb-2">2</span>
                <span className="font-bold text-slate-800 text-center text-sm">{second.name}</span>
                <span className="text-slate-500 font-bold">{second.total_points} pts</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="relative flex flex-col items-center order-1 md:order-2 z-20 -mt-8">
              <div className="absolute -top-12 text-5xl animate-bounce">👑</div>
              <div className="w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden shadow-2xl mb-3 relative z-10 ring-4 ring-yellow-400/30 flex items-center justify-center bg-yellow-50">
                {first.profile_pic ? (
                  <img src={avatarFor(first.profile_pic, first.name)} alt={first.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-yellow-700">
                    {String(first.name || first.email || '').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-t from-yellow-200 to-yellow-100 w-40 h-56 rounded-t-2xl flex flex-col justify-end items-center p-4 shadow-2xl border border-yellow-300/50">
                <span className="text-6xl font-black text-yellow-600 mb-2">1</span>
                <span className="font-bold text-slate-900 text-center text-lg">{first.name}</span>
                <span className="text-yellow-700 font-black text-xl">{first.total_points} pts</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="relative flex flex-col items-center order-3 md:order-3">
              <div className="w-24 h-24 rounded-full border-4 border-orange-300 overflow-hidden shadow-xl mb-3 relative z-10 flex items-center justify-center bg-orange-50">
                {third.profile_pic ? (
                  <img src={avatarFor(third.profile_pic, third.name)} alt={third.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-orange-600">
                    {String(third.name || third.email || '').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-t from-orange-200 to-orange-100 w-32 h-32 rounded-t-2xl flex flex-col justify-end items-center p-4 shadow-lg border border-orange-300/50">
                <span className="text-4xl font-black text-orange-500 mb-2">3</span>
                <span className="font-bold text-slate-800 text-center text-sm">{third.name}</span>
                <span className="text-orange-700 font-bold">{third.total_points} pts</span>
              </div>
            </div>

          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <h3 className="text-xl font-bold p-6 bg-slate-50/50 border-b border-slate-100">Rising Stars</h3>
            <table className="min-w-full table-auto">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-slate-500 font-bold uppercase text-xs tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-slate-500 font-bold uppercase text-xs tracking-wider">Alumni</th>
                  <th className="px-6 py-4 text-center text-slate-500 font-bold uppercase text-xs tracking-wider">Jobs</th>
                  <th className="px-6 py-4 text-center text-slate-500 font-bold uppercase text-xs tracking-wider">Roadmaps</th>
                  <th className="px-6 py-4 text-center text-slate-500 font-bold uppercase text-xs tracking-wider">Mentorship</th>
                  <th className="px-6 py-4 text-center text-slate-500 font-bold uppercase text-xs tracking-wider">Memories</th>
                  <th className="px-6 py-4 text-center text-slate-900 font-black uppercase text-xs tracking-wider">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaders.map((alum, index) => (
                  <tr key={alum.email || index} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                    <td className="px-6 py-4 flex items-center gap-4 text-slate-800 font-medium">
                      {alum.profile_pic ? (
                        <img src={avatarFor(alum.profile_pic, alum.name)} alt={alum.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-sm font-bold text-slate-700 ring-2 ring-slate-100">
                          {String(alum.name || alum.email || '').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{alum.name}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">{alum.jobs}</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">{alum.roadmaps}</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">{alum.mentorships}</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">{alum.memories}</td>
                    <td className="px-6 py-4 text-center font-black text-indigo-600">{alum.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}