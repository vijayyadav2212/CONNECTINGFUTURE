"use client";

import React from 'react';
import AlumniNavigation from '../AluminaNavigation';

export default function MentorshipPage() {
  return (
    <AlumniNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-4xl">🧑‍🏫</span>
                    <h1 className="text-4xl font-black">Mentorship Hub</h1>
                  </div>
                  <p className="text-blue-100 text-xl">Shape the future through meaningful guidance</p>
                </div>
                <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/30 transition-all duration-300 shadow-lg border border-white/20">
                  Accept New Mentees
                </button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Mentorship Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 text-center group hover:scale-105 transition-all duration-500">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white text-3xl">👥</span>
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-3">12</h3>
              <p className="text-slate-600 font-semibold text-lg">Active Mentees</p>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full w-4/5"></div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 text-center group hover:scale-105 transition-all duration-500">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white text-3xl">✅</span>
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-3">48</h3>
              <p className="text-slate-600 font-semibold text-lg">Sessions Completed</p>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full w-full"></div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 text-center group hover:scale-105 transition-all duration-500">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white text-3xl">⭐</span>
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-3">4.9</h3>
              <p className="text-slate-600 font-semibold text-lg">Average Rating</p>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full w-5/6"></div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Current Mentees Section */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-black text-slate-900">Current Mentees</h3>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-6 border-2 border-slate-200 rounded-2xl hover:border-blue-400 transition-all duration-300 bg-gradient-to-r from-white to-blue-50 group">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-xl">S{i}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xl">Student {i}</p>
                      <p className="text-slate-600 font-medium">Computer Science • Final Year</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Active</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Frontend Focus</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-500 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                      Schedule
                    </button>
                    <button className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-500 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Enhanced Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mentorship Analytics */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                <span className="mr-3">📊</span>
                Mentorship Analytics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Success Rate</span>
                  <span className="font-bold text-green-600">87%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full w-5/6"></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Response Time</span>
                  <span className="font-bold text-blue-600">2.4 hrs</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                <span className="mr-3">🗓️</span>
                Upcoming Sessions
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">R</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Rahul - Interview Prep</p>
                    <p className="text-slate-600 text-sm">Today at 3:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">A</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Anisha - Career Guidance</p>
                    <p className="text-slate-600 text-sm">Tomorrow at 10:00 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}
