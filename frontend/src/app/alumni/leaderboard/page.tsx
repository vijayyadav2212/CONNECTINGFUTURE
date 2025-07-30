"use client";

import React from 'react';
import AlumniNavigation from '../AluminaNavigation';

export default function LeaderboardPage() {
  return (
    <AlumniNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-slate-900">🏆 Leaderboard</h1>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-yellow-600 text-3xl">🏆</span>
              </div>
              <p className="text-slate-600 text-lg mb-4">Leaderboard section coming soon...</p>
              <p className="text-slate-500">Track your impact and see top contributors in the alumni network!</p>
            </div>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}
