"use client";

import React from 'react';


export default function BlogPage() {
  return (
    <>
      <div className="p-8 bg-[#f6f3eb] min-h-screen">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-slate-900">✍️ Blog</h1>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-teal-950 text-3xl">✍️</span>
              </div>
              <p className="text-slate-600 text-lg mb-4">Blog section coming soon...</p>
              <p className="text-slate-500">Share your knowledge and experiences through articles and blogs!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
