"use client";

import React from "react";
import AlumniNavigation from "../AluminaNavigation";

export default function LeaderboardPage() {
  const leaderboardData = [
    { id: 1, name: "Alice Johnson", profile_pic: "https://i.pravatar.cc/100?img=1", jobs: 5, roadmaps: 3, mentorships: 2, memories: 4 },
    { id: 2, name: "Bob Smith", profile_pic: "https://i.pravatar.cc/100?img=2", jobs: 3, roadmaps: 5, mentorships: 4, memories: 2 },
    { id: 3, name: "Carol Lee", profile_pic: "https://i.pravatar.cc/100?img=3", jobs: 4, roadmaps: 2, mentorships: 3, memories: 3 },
    { id: 4, name: "David Kim", profile_pic: "https://i.pravatar.cc/100?img=4", jobs: 2, roadmaps: 3, mentorships: 1, memories: 4 },
    { id: 5, name: "Eva Green", profile_pic: "https://i.pravatar.cc/100?img=5", jobs: 3, roadmaps: 1, mentorships: 2, memories: 3 },
  ];

  // Calculate scores and sort
  const sortedLeaderboard = leaderboardData.map(alum => ({
    ...alum,
    total_points: alum.jobs + alum.roadmaps + alum.mentorships + alum.memories
  })).sort((a, b) => b.total_points - a.total_points);

  const [first, second, third, ...rest] = sortedLeaderboard;

  return (
    <AlumniNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        <div className="space-y-10 max-w-6xl mx-auto">
          <h1 className="text-5xl font-black text-slate-900 text-center mb-8 tracking-tight">
            Alumni Hall of Fame 🏆
          </h1>

          {/* PODIUM SECTION */}
          <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-12">

            {/* 2nd Place */}
            <div className="relative flex flex-col items-center order-2 md:order-1">
              <div className="w-24 h-24 rounded-full border-4 border-slate-300 overflow-hidden shadow-xl mb-3 relative z-10">
                <img src={second.profile_pic} alt={second.name} className="w-full h-full object-cover" />
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
              <div className="w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden shadow-2xl mb-3 relative z-10 ring-4 ring-yellow-400/30">
                <img src={first.profile_pic} alt={first.name} className="w-full h-full object-cover" />
              </div>
              <div className="bg-gradient-to-t from-yellow-200 to-yellow-100 w-40 h-56 rounded-t-2xl flex flex-col justify-end items-center p-4 shadow-2xl border border-yellow-300/50">
                <span className="text-6xl font-black text-yellow-600 mb-2">1</span>
                <span className="font-bold text-slate-900 text-center text-lg">{first.name}</span>
                <span className="text-yellow-700 font-black text-xl">{first.total_points} pts</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="relative flex flex-col items-center order-3 md:order-3">
              <div className="w-24 h-24 rounded-full border-4 border-orange-300 overflow-hidden shadow-xl mb-3 relative z-10">
                <img src={third.profile_pic} alt={third.name} className="w-full h-full object-cover" />
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
                {rest.map((alum, index) => (
                  <tr key={alum.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 font-bold text-slate-400">#{index + 4}</td>
                    <td className="px-6 py-4 flex items-center gap-4 text-slate-800 font-medium">
                      <img src={alum.profile_pic} alt={alum.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100" />
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