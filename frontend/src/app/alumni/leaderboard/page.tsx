"use client";

import React, { useEffect, useState } from "react";
import AlumniNavigation from "../AluminaNavigation/AlumniNavigation";
import { Trophy, Briefcase, Map, Users, Camera, TrendingUp } from "lucide-react";

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
};

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<Alum[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const ures = await fetch(`${API_BASE}/api/users?type=alumni&limit=200`);
        if (!ures.ok) throw new Error('Failed to load users');
        const uj = await ures.json();
        const users: any[] = uj.users || [];

        const entries = await Promise.all(users.map(async (u) => {
          const email = u.email;
          let jobsCount = 0;
          try {
            const r = await fetch(`${API_BASE}/api/jobs?posted_by=${encodeURIComponent(email)}&limit=1`);
            if (r.ok) { const j = await r.json(); jobsCount = Number(j.total || 0); }
          } catch {}

          let roadmapsCount = 0;
          try {
            const r = await fetch(`${API_BASE}/api/roadmaps?owner_email=${encodeURIComponent(email)}`);
            if (r.ok) { const rr = await r.json(); roadmapsCount = Array.isArray(rr.roadmaps) ? rr.roadmaps.length : 0; }
          } catch {}

          let mentorshipsCount = 0;
          try {
            const r = await fetch(`${API_BASE}/api/mentorship/sessions?mentor_email=${encodeURIComponent(email)}&status=completed`);
            if (r.ok) { const ms = await r.json(); mentorshipsCount = Array.isArray(ms.sessions) ? ms.sessions.length : 0; }
          } catch {}

          const total_points = jobsCount + roadmapsCount + mentorshipsCount;
          return { email, name: u.name || u.email, profile_pic: u.picture || null, jobs: jobsCount, roadmaps: roadmapsCount, mentorships: mentorshipsCount, memories: 0, total_points } as Alum;
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

  const avatarFor = (pic?: string | null, name?: string) =>
    pic || `https://i.pravatar.cc/100?u=${encodeURIComponent(name || 'anon')}`;

  const initials = (name?: string, email?: string) =>
    String(name || email || '').charAt(0).toUpperCase() || '?';

  const [first, second, third, ...rest] = leaders.length
    ? leaders
    : Array(3).fill({ email: '—', name: '—', profile_pic: '', jobs: 0, roadmaps: 0, mentorships: 0, memories: 0, total_points: 0 });

  const statCols = [
    { key: 'jobs', label: 'Jobs', icon: <Briefcase className="w-3 h-3" />, color: 'text-blue-600' },
    { key: 'roadmaps', label: 'Roadmaps', icon: <Map className="w-3 h-3" />, color: 'text-purple-600' },
    { key: 'mentorships', label: 'Mentorship', icon: <Users className="w-3 h-3" />, color: 'text-green-600' },
    { key: 'memories', label: 'Memories', icon: <Camera className="w-3 h-3" />, color: 'text-orange-600' },
  ];

  return (
    <AlumniNavigation>
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />Alumni Hall of Fame
            </h1>
            <p className="text-gray-500 text-sm mt-1">Recognizing alumni who give back most to the community</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-lg font-bold text-green-600">{leaders.length}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Contributors</p>
            </div>
            <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-lg font-bold text-amber-500">{leaders.reduce((s, a) => s + a.total_points, 0)}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Total Points</p>
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mr-3" />
            <p className="text-sm text-gray-500 font-medium">Computing scores…</p>
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center text-sm text-red-600 font-medium">{error}</div>
        )}

        {/* Podium */}
        {!loading && leaders.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />Top Contributors
            </h3>
            <div className="flex flex-col sm:flex-row items-end justify-center gap-4">

              {/* 2nd Place */}
              <div className="flex flex-col items-center order-2 sm:order-1">
                <div className="w-16 h-16 rounded-full bg-gray-100 border-4 border-gray-200 overflow-hidden shadow-md mb-2 flex items-center justify-center">
                  {second?.profile_pic
                    ? <img src={avatarFor(second.profile_pic, second.name)} alt={second.name} className="w-full h-full object-cover" />
                    : <span className="text-xl font-bold text-gray-500">{initials(second?.name, second?.email)}</span>}
                </div>
                <div className="bg-gray-100 w-24 h-28 rounded-t-xl flex flex-col justify-end items-center p-3 border border-gray-200">
                  <span className="text-3xl font-black text-gray-400 mb-1">2</span>
                  <p className="text-xs font-bold text-gray-700 text-center truncate w-full">{second?.name}</p>
                  <p className="text-xs text-gray-500 font-semibold">{second?.total_points} pts</p>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center order-1 sm:order-2 -mb-2">
                <div className="text-3xl mb-1 animate-bounce">👑</div>
                <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-400 overflow-hidden shadow-xl mb-2 ring-4 ring-amber-200/50 flex items-center justify-center">
                  {first?.profile_pic
                    ? <img src={avatarFor(first.profile_pic, first.name)} alt={first.name} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-black text-amber-600">{initials(first?.name, first?.email)}</span>}
                </div>
                <div className="bg-gradient-to-t from-amber-100 to-amber-50 w-28 h-36 rounded-t-xl flex flex-col justify-end items-center p-3 border border-amber-300">
                  <span className="text-4xl font-black text-amber-500 mb-1">1</span>
                  <p className="text-sm font-bold text-gray-900 text-center truncate w-full">{first?.name}</p>
                  <p className="text-sm text-amber-700 font-black">{first?.total_points} pts</p>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center order-3">
                <div className="w-16 h-16 rounded-full bg-orange-50 border-4 border-orange-300 overflow-hidden shadow-md mb-2 flex items-center justify-center">
                  {third?.profile_pic
                    ? <img src={avatarFor(third.profile_pic, third.name)} alt={third.name} className="w-full h-full object-cover" />
                    : <span className="text-xl font-bold text-orange-500">{initials(third?.name, third?.email)}</span>}
                </div>
                <div className="bg-gradient-to-t from-orange-100 to-orange-50 w-24 h-24 rounded-t-xl flex flex-col justify-end items-center p-3 border border-orange-200">
                  <span className="text-3xl font-black text-orange-400 mb-1">3</span>
                  <p className="text-xs font-bold text-gray-700 text-center truncate w-full">{third?.name}</p>
                  <p className="text-xs text-orange-600 font-semibold">{third?.total_points} pts</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Rankings Table */}
        {!loading && leaders.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Full Rankings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Alumni</th>
                    {statCols.map(c => (
                      <th key={c.key} className="px-4 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <span className="flex items-center justify-center gap-1">{c.icon}{c.label}</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-green-600 uppercase tracking-wider">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaders.map((alum, i) => (
                    <tr key={alum.email || i} className={`hover:bg-gray-50 transition-colors ${i < 3 ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                          i === 0 ? 'bg-amber-100 text-amber-700' :
                          i === 1 ? 'bg-gray-100 text-gray-600' :
                          i === 2 ? 'bg-orange-100 text-orange-600' :
                          'text-gray-400 font-semibold'
                        }`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden">
                            {alum.profile_pic
                              ? <img src={avatarFor(alum.profile_pic, alum.name)} alt={alum.name} className="w-full h-full object-cover" />
                              : initials(alum.name, alum.email)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">{alum.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{alum.email}</p>
                          </div>
                        </div>
                      </td>
                      {statCols.map(c => (
                        <td key={c.key} className={`px-4 py-3.5 text-center text-sm font-bold ${c.color}`}>
                          {alum[c.key as keyof Alum] as number}
                        </td>
                      ))}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-black border border-green-200">
                          <Trophy className="w-3 h-3" />{alum.total_points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && leaders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3"><Trophy className="w-7 h-7 text-amber-500" /></div>
            <p className="font-bold text-gray-900 text-sm mb-1">No contributors yet</p>
            <p className="text-xs text-gray-500">Be the first to post jobs, create roadmaps, and mentor students!</p>
          </div>
        )}
      </div>
    </AlumniNavigation>
  );
}