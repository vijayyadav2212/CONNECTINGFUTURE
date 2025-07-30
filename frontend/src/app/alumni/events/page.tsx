"use client";

import React from 'react';
import AlumniNavigation from '../AluminaNavigation';

export default function EventsPage() {
  return (
    <AlumniNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-4xl">📅</span>
                    <h1 className="text-4xl font-black">Alumni Events</h1>
                  </div>
                  <p className="text-purple-100 text-xl">Connect, network, and celebrate together</p>
                </div>
                <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/30 transition-all duration-300 shadow-lg border border-white/20">
                  Create Event
                </button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Events */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                <span className="mr-3">🎉</span>
                Upcoming Events
                <div className="ml-auto w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </h3>
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Annual Alumni Meetup 2024</h4>
                      <p className="text-slate-600">December 15, 2024 • 6:00 PM</p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">Networking</span>
                  </div>
                  <p className="text-slate-700 mb-4">Join us for an evening of networking, memories, and celebrating our achievements.</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">📍 Hotel Grand Ballroom</span>
                    </div>
                    <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300">
                      RSVP
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Tech Talk: AI in Industry</h4>
                      <p className="text-slate-600">December 20, 2024 • 7:00 PM</p>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">Workshop</span>
                  </div>
                  <p className="text-slate-700 mb-4">Expert panel discussion on the latest trends in artificial intelligence.</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">🌐 Virtual Event</span>
                    </div>
                    <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Past Events */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                <span className="mr-3">�</span>
                Past Events
              </h3>
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Career Fair 2024</h4>
                      <p className="text-slate-600">November 10, 2024</p>
                    </div>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">Career</span>
                  </div>
                  <p className="text-slate-700 mb-4">120+ attendees, 15 companies, 30+ job offers</p>
                  <div className="flex items-center space-x-4">
                    <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                      View Photos
                    </button>
                    <span className="text-sm text-green-600 font-medium">✅ Attended</span>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Homecoming Weekend</h4>
                      <p className="text-slate-600">October 5-6, 2024</p>
                    </div>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">Social</span>
                  </div>
                  <p className="text-slate-700 mb-4">A weekend of nostalgia, campus tours, and reconnections</p>
                  <div className="flex items-center space-x-4">
                    <button className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                      View Highlights
                    </button>
                    <span className="text-sm text-slate-500 font-medium">❌ Missed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Categories */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20">
            <h3 className="text-3xl font-black text-slate-900 mb-8 text-center">Event Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-white text-3xl">🤝</span>
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Networking</h4>
                <p className="text-slate-600 text-sm">Connect with fellow alumni</p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-white text-3xl">🎓</span>
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Educational</h4>
                <p className="text-slate-600 text-sm">Workshops and seminars</p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-white text-3xl">🎉</span>
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Social</h4>
                <p className="text-slate-600 text-sm">Fun gatherings and parties</p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-white text-3xl">💼</span>
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Career</h4>
                <p className="text-slate-600 text-sm">Professional development</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}
