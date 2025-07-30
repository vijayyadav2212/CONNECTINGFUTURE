"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import AlumniNavigation from '../AluminaNavigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, DollarSign, Target } from "lucide-react";

function DonationPage() {
  const { user, error, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl text-red-500">Authentication Error</h1>
          <a href="/api/auth/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <AlumniNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-4xl">💝</span>
                    <h1 className="text-4xl font-black">Support Your Alma Mater</h1>
                  </div>
                  <p className="text-green-100 text-xl">Help future students by contributing to various initiatives</p>
                  <div className="flex items-center mt-4 space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">👤</span>
                      <span className="font-medium">Welcome, {user.name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <p className="text-green-100 text-sm mb-2">Your Total Impact</p>
                    <p className="text-3xl font-bold">₹25,000</p>
                    <p className="text-green-200 text-sm">15 Students Helped</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Donation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Your Total Contributions</p>
                  <p className="text-3xl font-bold text-slate-900">₹25,000</p>
                  <p className="text-green-600 text-sm mt-1">+₹5,000 this year</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Donations This Year</p>
                  <p className="text-3xl font-bold text-slate-900">3</p>
                  <p className="text-blue-600 text-sm mt-1">Last: Nov 15, 2024</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Students Helped</p>
                  <p className="text-3xl font-bold text-slate-900">15</p>
                  <p className="text-purple-600 text-sm mt-1">Across 3 programs</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Donation Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Scholarship Fund</h3>
                  <p className="text-slate-600">Help deserving students pursue their education</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-2xl border border-red-200">
                  <p className="text-sm text-slate-600 mb-2">Current Goal: ₹5,00,000</p>
                  <div className="w-full bg-red-200 rounded-full h-2 mb-2">
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full" style={{width: '68%'}}></div>
                  </div>
                  <p className="text-sm text-red-600 font-medium">₹3,40,000 raised • 32% to go</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-red-100 to-pink-100 text-red-700 py-4 rounded-2xl font-bold hover:from-red-200 hover:to-pink-200 transition-all duration-300 border border-red-200">
                  Donate ₹5,000
                </button>
                <button className="w-full bg-gradient-to-r from-red-100 to-pink-100 text-red-700 py-4 rounded-2xl font-bold hover:from-red-200 hover:to-pink-200 transition-all duration-300 border border-red-200">
                  Donate ₹10,000
                </button>
                <button className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 rounded-2xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg">
                  Custom Amount
                </button>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Infrastructure Development</h3>
                  <p className="text-slate-600">Support campus development and modern facilities</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-2xl border border-blue-200">
                  <p className="text-sm text-slate-600 mb-2">Current Goal: ₹10,00,000</p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{width: '45%'}}></div>
                  </div>
                  <p className="text-sm text-blue-600 font-medium">₹4,50,000 raised • 55% to go</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 py-4 rounded-2xl font-bold hover:from-blue-200 hover:to-cyan-200 transition-all duration-300 border border-blue-200">
                  Donate ₹15,000
                </button>
                <button className="w-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 py-4 rounded-2xl font-bold hover:from-blue-200 hover:to-cyan-200 transition-all duration-300 border border-blue-200">
                  Donate ₹25,000
                </button>
                <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-2xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg">
                  Custom Amount
                </button>
              </div>
            </div>
          </div>

          {/* Donation History */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
              <span className="mr-3">📋</span>
              Your Donation History
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div>
                  <h4 className="font-bold text-slate-900">Scholarship Fund</h4>
                  <p className="text-sm text-slate-600">November 15, 2024</p>
                  <p className="text-sm text-green-600 mt-1">Helped 3 students • Certificate issued</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">₹10,000</p>
                  <p className="text-sm text-green-500 bg-green-100 px-3 py-1 rounded-full">Completed</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                <div>
                  <h4 className="font-bold text-slate-900">Infrastructure Development</h4>
                  <p className="text-sm text-slate-600">August 20, 2024</p>
                  <p className="text-sm text-blue-600 mt-1">New computer lab setup • Plaque installed</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">₹15,000</p>
                  <p className="text-sm text-blue-500 bg-blue-100 px-3 py-1 rounded-full">Completed</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                <div>
                  <h4 className="font-bold text-slate-900">Library Enhancement</h4>
                  <p className="text-sm text-slate-600">March 10, 2024</p>
                  <p className="text-sm text-purple-600 mt-1">500+ new books added • Digital catalog</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">₹5,000</p>
                  <p className="text-sm text-purple-500 bg-purple-100 px-3 py-1 rounded-full">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Statement */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
              <span className="mr-3">🌟</span>
              Your Impact Story
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                  Thanks to your generous contributions, you have directly helped <span className="font-bold text-green-600">15 students</span> receive scholarships 
                  and supported the development of new computer labs that benefit over <span className="font-bold text-blue-600">200 students</span> annually.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <p className="text-2xl font-bold text-green-600">15</p>
                    <p className="text-sm text-slate-600">Students Supported</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">200+</p>
                    <p className="text-sm text-slate-600">Lives Impacted</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                  <p className="text-blue-800 font-medium text-lg mb-3">
                    "Your scholarship support helped me complete my engineering degree. Thank you for believing in students like me!"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">PS</span>
                    </div>
                    <div>
                      <p className="text-blue-600 font-medium">Priya S.</p>
                      <p className="text-blue-500 text-sm">ECE 2024</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                  <p className="text-green-800 font-medium text-lg mb-3">
                    "The new computer lab with modern equipment really enhanced our practical learning experience!"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">AR</span>
                    </div>
                    <div>
                      <p className="text-green-600 font-medium">Arjun R.</p>
                      <p className="text-green-500 text-sm">CSE 2025</p>                  
                    </div>
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

export default withPageAuthRequired(DonationPage);
