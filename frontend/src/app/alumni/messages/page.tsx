"use client";

import React, { useState } from 'react';
import AlumniNavigation from '../AluminaNavigation';

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <AlumniNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-4xl">💬</span>
                    <h1 className="text-4xl font-black">Messages</h1>
                  </div>
                  <p className="text-cyan-100 text-xl">Stay connected with your network</p>
                </div>
                <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/30 transition-all duration-300 shadow-lg border border-white/20">
                  New Message
                </button>
              </div>
            </div>
          </div>
          
          {/* Message Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Message List */}
            <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20">
              {/* Tab Navigation */}
              <div className="p-6 border-b border-slate-200/50">
                <div className="flex space-x-1 bg-slate-100 rounded-2xl p-1">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === 'all'
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('unread')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === 'unread'
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unread (3)
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-blue-50 transition-all duration-300 cursor-pointer group">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold">S{i}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 truncate">Student {i}</h4>
                        <span className="text-xs text-slate-500">2h</span>
                      </div>
                      <p className="text-slate-600 text-sm truncate">
                        {i === 1 ? "Thank you for the mentoring session today!" : 
                         i === 2 ? "Could we schedule another meeting next week?" :
                         i === 3 ? "I got the job! Thanks for your guidance 🎉" :
                         i === 4 ? "Quick question about the project..." :
                         "Would love to connect on LinkedIn!"}
                      </p>
                      {i <= 3 && (
                        <div className="flex items-center mt-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="ml-2 text-xs text-blue-600 font-medium">Unread</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Content */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20">
              {/* Message Header */}
              <div className="p-6 border-b border-slate-200/50">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">S1</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xl">Student 1</h3>
                    <p className="text-slate-600">Computer Science • Final Year</p>
                  </div>
                  <div className="ml-auto flex space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-green-600 font-medium">Online</span>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="p-6 space-y-6 h-80 overflow-y-auto">
                {/* Received Message */}
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">S1</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm p-4 max-w-md">
                      <p className="text-slate-900">Hi! Thank you so much for the mentoring session today. Your insights about the interview process were incredibly valuable!</p>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 block">2 hours ago</span>
                  </div>
                </div>

                {/* Sent Message */}
                <div className="flex space-x-4 justify-end">
                  <div className="flex-1 flex justify-end">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl rounded-br-sm p-4 max-w-md">
                      <p className="text-white">You're very welcome! I'm glad I could help. Remember to practice the STAR method for behavioral questions. You're going to do great!</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">VY</span>
                  </div>
                </div>

                {/* Another Received Message */}
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">S1</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm p-4 max-w-md">
                      <p className="text-slate-900">Absolutely! I'll practice those examples we discussed. Would it be possible to have a quick mock interview session before my actual interview next week?</p>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 block">1 hour ago</span>
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-slate-200/50">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <div className="bg-slate-100 rounded-2xl px-6 py-4 flex items-center space-x-4">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-500 focus:outline-none"
                      />
                      <button className="text-slate-500 hover:text-slate-700 transition-colors">
                        📎
                      </button>
                      <button className="text-slate-500 hover:text-slate-700 transition-colors">
                        �
                      </button>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">💬</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">127</h3>
              <p className="text-slate-600 font-medium">Total Messages</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">�</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">23</h3>
              <p className="text-slate-600 font-medium">Active Chats</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">2.3h</h3>
              <p className="text-slate-600 font-medium">Avg Response</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">📈</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">95%</h3>
              <p className="text-slate-600 font-medium">Response Rate</p>
            </div>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}
