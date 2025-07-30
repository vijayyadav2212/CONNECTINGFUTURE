"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Briefcase, MessageCircle, Sparkles, TrendingUp, Award } from "lucide-react";

export default function HomePage() {
  // Temporarily disable Auth0 to resolve provider issues
  // Re-enable when Auth0 is properly configured
  const user = null;
  const isLoading = false;
  const error = null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Connecting Future</h1>
                <p className="text-xs text-gray-600">Alumni-Student Network</p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-2xl border border-green-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">U</span>
                    </div>
                    <span className="text-gray-700 font-medium">Welcome, User</span>
                  </div>
                  <Link href="/alumni/dashboard">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                      Dashboard
                    </Button>
                  </Link>
                  <a href="/api/auth/logout">
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50 font-medium px-4 py-2 rounded-xl">
                      Logout
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <a href="/api/auth/login">
                    <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 font-medium px-6 py-2 rounded-xl">
                      Login
                    </Button>
                  </a>
                  <a href="/api/auth/login?screen_hint=signup">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                      Sign Up
                    </Button>
                  </a>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 mb-6">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span className="text-indigo-600 font-bold">Connecting Alumni & Students</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
              Bridge the Gap Between
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block">
                Experience & Ambition
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Join thousands of alumni and students building meaningful connections. Share knowledge, 
              discover opportunities, and shape the future of your professional community.
            </p>
          </div>

          {user ? (
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome back!</h3>
              <p className="text-gray-600 mb-6">Ready to continue making an impact?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/alumni/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/alumni/profile">
                  <Button size="lg" variant="outline" className="border-gray-300 hover:bg-gray-50 font-bold px-8 py-4 rounded-2xl">
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/api/auth/login?screen_hint=signup">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    Get Started Free
                  </Button>
                </a>
                <a href="/api/auth/login">
                  <Button size="lg" variant="outline" className="border-gray-300 hover:bg-white/80 font-bold px-10 py-4 rounded-2xl backdrop-blur-sm">
                    Sign In
                  </Button>
                </a>
              </div>
              
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>2,500+ Alumni</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>5,000+ Students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>500+ Companies</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black text-gray-900 mb-6">
              Why Choose Connecting Future?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the power of meaningful connections through our comprehensive platform designed for growth and success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-100 pb-6">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Professional Networking
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Connect with alumni from your field and build meaningful professional relationships that last a lifetime.
                </p>
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">93% connection success rate</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-100 pb-6">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  Career Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Discover exclusive job opportunities, internships, and career guidance from experienced professionals in your industry.
                </p>
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Award className="h-4 w-4" />
                  <span className="font-medium">78% placement success rate</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-100 pb-6">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  Expert Mentorship
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Get mentored by industry leaders or become a mentor yourself. Share knowledge, experiences, and insights.
                </p>
                <div className="flex items-center space-x-2 text-sm text-purple-600">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">4.9/5 mentor satisfaction</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-black mb-2">10K+</div>
              <div className="text-blue-100">Active Connections</div>
            </div>
            <div>
              <div className="text-4xl font-black mb-2">500+</div>
              <div className="text-blue-100">Partner Companies</div>
            </div>
            <div>
              <div className="text-4xl font-black mb-2">2.5K+</div>
              <div className="text-blue-100">Successful Placements</div>
            </div>
            <div>
              <div className="text-4xl font-black mb-2">95%</div>
              <div className="text-blue-100">User Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Connecting Future</h3>
            </div>
            <p className="text-gray-400 mb-6">Bridging the gap between experience and ambition</p>
            <p className="text-gray-500">&copy; 2025 Connecting Future. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

