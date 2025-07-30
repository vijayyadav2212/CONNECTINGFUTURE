"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useState } from "react";
import AlumniNavigation from '../AluminaNavigation';

function AMAPage() {
  const { user, error, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin mx-auto mt-4 ml-4"></div>
          </div>
          <p className="text-white text-xl font-medium">Loading your AMA dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-slate-900">
        <div className="text-center bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-400 text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl text-white font-bold mb-4">Authentication Required</h1>
          <p className="text-red-200 mb-6">Please log in to access your AMA dashboard</p>
          <a 
            href="/api/auth/login" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
          >
            Login to Continue
          </a>
        </div>
      </div>
    );
  }

  return (
    <AlumniNavigation>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50">
        {/* Enhanced Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 opacity-90"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-yellow-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>
          
          <div className="relative z-10 px-8 py-16">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center justify-between">
                <div className="text-white mb-8 lg:mb-0">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <span className="text-4xl">🎙️</span>
                    </div>
                    <div>
                      <h1 className="text-5xl font-black mb-2">Ask Me Anything</h1>
                      <p className="text-purple-100 text-xl">Share your expertise, inspire the next generation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={user.picture || "/placeholder-user.jpg"} 
                        alt={user.name || "User"} 
                        className="w-12 h-12 rounded-full border-3 border-white/30"
                      />
                      <div>
                        <p className="font-bold text-lg">Welcome back, {user.name?.split(' ')[0]}!</p>
                        <p className="text-purple-200 text-sm">Ready to share your knowledge?</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex space-x-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-purple-200 text-sm">Sessions Hosted</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                      <p className="text-2xl font-bold">348</p>
                      <p className="text-purple-200 text-sm">Lives Impacted</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                      <p className="text-2xl font-bold">4.9</p>
                      <p className="text-purple-200 text-sm">Avg Rating</p>
                    </div>
                  </div>
                </div>

                <div className="text-center lg:text-right">
                  <button 
                    onClick={() => setShowScheduleModal(true)}
                    className="bg-white text-purple-600 px-10 py-5 rounded-3xl font-bold text-lg hover:bg-purple-50 transition-all duration-300 shadow-2xl transform hover:scale-105 mb-4"
                  >
                    🚀 Schedule New AMA
                  </button>
                  <p className="text-purple-200 text-sm">Next available slot: Tomorrow 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-2 shadow-xl border border-white/20 mb-8">
              <div className="flex space-x-2">
                {[
                  { id: 'upcoming', label: '📅 Upcoming Sessions', count: 3 },
                  { id: 'live', label: '🔴 Live Now', count: 0 },
                  { id: 'past', label: '📚 Past Sessions', count: 12 },
                  { id: 'analytics', label: '📊 Analytics', count: null }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'upcoming' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Sample Upcoming AMA */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center">
                        <span className="text-white text-xl">💼</span>
                      </div>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        In 2 days
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Breaking into Tech Leadership</h3>
                    <p className="text-slate-600 mb-4">Share insights on transitioning from developer to tech lead roles, including management challenges and growth strategies.</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="mr-2">📅</span>
                        <span>July 31, 2025 • 7:00 PM IST</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="mr-2">⏱️</span>
                        <span>Duration: 90 minutes</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="mr-2">👥</span>
                        <span>67 registered • 150 max capacity</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300">
                        Edit Session
                      </button>
                      <button className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors duration-200">
                        📋
                      </button>
                    </div>
                  </div>

                  {/* Another Sample AMA */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
                        <span className="text-white text-xl">🚀</span>
                      </div>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        Next week
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Startup Founder Journey</h3>
                    <p className="text-slate-600 mb-4">From idea to IPO: lessons learned, mistakes made, and advice for aspiring entrepreneurs.</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="mr-2">📅</span>
                        <span>August 5, 2025 • 8:00 PM IST</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="mr-2">⏱️</span>
                        <span>Duration: 120 minutes</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="mr-2">👥</span>
                        <span>89 registered • 200 max capacity</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-300">
                        Edit Session
                      </button>
                      <button className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors duration-200">
                        📋
                      </button>
                    </div>
                  </div>

                  {/* Create New AMA Card */}
                  <div 
                    onClick={() => setShowScheduleModal(true)}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-3xl p-8 hover:border-purple-400 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl">➕</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Schedule New AMA</h3>
                      <p className="text-slate-600">Share your expertise with the community</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'live' && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-red-500 text-4xl">📻</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">No Live Sessions</h3>
                <p className="text-slate-600 mb-6">You don't have any live AMA sessions at the moment</p>
                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300"
                >
                  Go Live Now
                </button>
              </div>
            )}

            {activeTab === 'past' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Past Session Examples */}
                  {[
                    {
                      title: "AI and Machine Learning Career Path",
                      date: "July 20, 2025",
                      duration: "2h 15m",
                      attendees: 124,
                      rating: 4.9,
                      color: "from-blue-500 to-cyan-500",
                      bgColor: "from-blue-50 to-cyan-50"
                    },
                    {
                      title: "Product Management Essentials",
                      date: "July 15, 2025", 
                      duration: "1h 45m",
                      attendees: 89,
                      rating: 4.8,
                      color: "from-green-500 to-emerald-500",
                      bgColor: "from-green-50 to-emerald-50"
                    },
                    {
                      title: "Remote Work Best Practices",
                      date: "July 10, 2025",
                      duration: "1h 30m", 
                      attendees: 156,
                      rating: 4.7,
                      color: "from-purple-500 to-pink-500",
                      bgColor: "from-purple-50 to-pink-50"
                    },
                    {
                      title: "Building Technical Teams",
                      date: "July 5, 2025",
                      duration: "2h 0m",
                      attendees: 93,
                      rating: 4.9,
                      color: "from-orange-500 to-red-500", 
                      bgColor: "from-orange-50 to-red-50"
                    }
                  ].map((session, index) => (
                    <div key={index} className={`bg-gradient-to-br ${session.bgColor} rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300`}>
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-12 h-12 bg-gradient-to-r ${session.color} rounded-2xl flex items-center justify-center`}>
                          <span className="text-white text-xl">✅</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < Math.floor(session.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>⭐</span>
                            ))}
                            <span className="text-sm font-bold text-slate-700 ml-2">{session.rating}</span>
                          </div>
                          <span className="text-sm text-slate-600">{session.attendees} attended</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{session.title}</h3>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-slate-600">
                          <span className="mr-2">📅</span>
                          <span>{session.date}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <span className="mr-2">⏱️</span>
                          <span>Duration: {session.duration}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button className={`flex-1 bg-gradient-to-r ${session.color} text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all duration-300`}>
                          View Recording
                        </button>
                        <button className="px-4 py-3 bg-white/60 text-slate-600 rounded-xl hover:bg-white/80 transition-colors duration-200">
                          📊
                        </button>
                        <button className="px-4 py-3 bg-white/60 text-slate-600 rounded-xl hover:bg-white/80 transition-colors duration-200">
                          💬
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Analytics Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 shadow-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                        <span className="text-white text-xl">👥</span>
                      </div>
                      <span className="text-green-600 text-sm font-bold bg-green-100 px-2 py-1 rounded-full">+23%</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-2">2,456</h3>
                    <p className="text-slate-600">Total Attendees</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-xl border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                        <span className="text-white text-xl">⭐</span>
                      </div>
                      <span className="text-green-600 text-sm font-bold bg-green-100 px-2 py-1 rounded-full">+0.3</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-2">4.8</h3>
                    <p className="text-slate-600">Average Rating</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 shadow-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                        <span className="text-white text-xl">🎙️</span>
                      </div>
                      <span className="text-green-600 text-sm font-bold bg-green-100 px-2 py-1 rounded-full">+4</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-2">12</h3>
                    <p className="text-slate-600">Sessions Hosted</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 shadow-xl border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                        <span className="text-white text-xl">⏱️</span>
                      </div>
                      <span className="text-green-600 text-sm font-bold bg-green-100 px-2 py-1 rounded-full">+2h</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-2">24h</h3>
                    <p className="text-slate-600">Total Hours</p>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">📈 Session Performance</h3>
                  <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl text-slate-400 mb-4 block">📊</span>
                      <p className="text-slate-600">Interactive charts coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-900">🚀 Schedule New AMA</h2>
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors duration-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Session Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Breaking into Product Management"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe what you'll cover in this AMA session..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Time</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Duration (minutes)</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200">
                      <option>60</option>
                      <option>90</option>
                      <option>120</option>
                      <option>180</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Max Attendees</label>
                    <input 
                      type="number" 
                      placeholder="100"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200">
                    <option>Career Development</option>
                    <option>Technical Skills</option>
                    <option>Leadership</option>
                    <option>Entrepreneurship</option>
                    <option>Industry Insights</option>
                    <option>Personal Development</option>
                  </select>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button 
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
                  >
                    Schedule AMA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AlumniNavigation>
  );
}

export default withPageAuthRequired(AMAPage);
