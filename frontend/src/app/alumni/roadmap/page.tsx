"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Map, Target, BookOpen, Users, Plus, TrendingUp, Building, X, Sparkles, BarChart3 } from "lucide-react";
import AlumniNavigation from "../AluminaNavigation/AlumniNavigation";

function RoadmapPage() {
  const { user, error, isLoading } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "",
    duration: "",
    phases: "",
    tags: ""
  });

  const handleCreateRoadmap = () => {
    setShowCreateModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating roadmap:", formData);
    setShowCreateModal(false);
    setFormData({
      title: "",
      description: "",
      category: "",
      level: "",
      duration: "",
      phases: "",
      tags: ""
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
      <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 min-h-screen">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/40 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-100/40 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-50/20 via-purple-50/20 to-indigo-50/20 rounded-full blur-3xl"></div>
        </div>
        
        {/* Page Header */}
        <div className="mb-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-2">Career Roadmaps</h1>
              <p className="text-gray-600">Create and share career paths to guide students and fellow alumni</p>
            </div>
            <Button 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={handleCreateRoadmap}
            >
              <Plus className="w-4 h-4" />
              Create New Roadmap
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative z-10">
          <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-blue-50 via-blue-100/80 to-cyan-100/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Roadmaps Created</p>
                  <p className="text-3xl font-bold text-blue-900">5</p>
                  <p className="text-sm text-blue-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +2 this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full flex items-center justify-center shadow-md">
                  <Map className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-green-50 via-green-100/80 to-emerald-100/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Students Helped</p>
                  <p className="text-3xl font-bold text-green-900">156</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12 this week
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-full flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-purple-50 via-purple-100/80 to-violet-100/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Views</p>
                  <p className="text-3xl font-bold text-purple-900">2.1K</p>
                  <p className="text-sm text-purple-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +156 today
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full flex items-center justify-center shadow-md">
                  <Target className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-orange-50 via-orange-100/80 to-amber-100/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Avg. Rating</p>
                  <p className="text-3xl font-bold text-orange-900">4.8</p>
                  <p className="text-sm text-orange-600 flex items-center mt-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Excellent
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full flex items-center justify-center shadow-md">
                  <BarChart3 className="w-6 h-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Roadmaps */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm relative z-10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">My Career Roadmaps</CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                3 Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 rounded-xl p-6 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-sm">
                      <Map className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">Full Stack Developer Roadmap</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">Frontend</Badge>
                        <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">Backend</Badge>
                        <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50">Database</Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    A comprehensive guide to becoming a full-stack developer, covering both frontend and backend technologies with hands-on projects.
                  </p>
                </div>
                <div className="text-right ml-6">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">89</p>
                    <p className="text-xs text-blue-600 font-medium">followers</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">8</p>
                  <p className="text-sm text-gray-600">Phases</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">6-12</p>
                  <p className="text-sm text-gray-600">Months</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Beginner</p>
                  <p className="text-sm text-gray-600">Level</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">View Roadmap</Button>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <p className="text-sm text-gray-500">Updated 2 weeks ago</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-green-50/30 border border-green-100 rounded-xl p-6 hover:shadow-lg hover:shadow-green-100/50 transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center shadow-sm">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 via-green-700 to-emerald-600 bg-clip-text text-transparent">Data Science Career Path</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">Python</Badge>
                        <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">Machine Learning</Badge>
                        <Badge variant="outline" className="text-xs border-teal-200 text-teal-700 bg-teal-50">Statistics</Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Step-by-step guide to transition into data science, including mathematics, programming, and machine learning fundamentals.
                  </p>
                </div>
                <div className="text-right ml-6">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">45</p>
                    <p className="text-xs text-green-600 font-medium">followers</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">10</p>
                  <p className="text-sm text-gray-600">Phases</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">8-15</p>
                  <p className="text-sm text-gray-600">Months</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Intermediate</p>
                  <p className="text-sm text-gray-600">Level</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">View Roadmap</Button>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <p className="text-sm text-gray-500">Updated 1 month ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Community Roadmaps */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm relative z-10">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-orange-600" />
              </div>
              Popular Community Roadmaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-br from-white to-purple-50/30 border border-purple-100 rounded-xl p-6 hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                      RK
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 bg-clip-text text-transparent">Mobile App Development (Flutter)</h3>
                      <p className="text-sm text-gray-700 mb-2 font-medium">By Rajesh Kumar • Class of 2018</p>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Complete guide to Flutter development with real-world projects and industry best practices
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">Flutter</Badge>
                        <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">Mobile</Badge>
                        <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50">Dart</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <div className="bg-blue-50 rounded-lg p-3 text-center mb-3">
                    <p className="text-lg font-bold text-blue-600">127</p>
                    <p className="text-xs text-blue-600 font-medium">followers</p>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full">Follow</Button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100 rounded-xl p-6 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                      PS
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 bg-gradient-to-r from-gray-900 via-green-700 to-emerald-600 bg-clip-text text-transparent">Product Management Transition</h3>
                      <p className="text-sm text-gray-700 mb-2 font-medium">By Priya Sharma • Class of 2017</p>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        From engineering to product management - a practical guide with real transition stories
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">Product</Badge>
                        <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">Strategy</Badge>
                        <Badge variant="outline" className="text-xs border-teal-200 text-teal-700 bg-teal-50">Management</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <div className="bg-green-50 rounded-lg p-3 text-center mb-3">
                    <p className="text-lg font-bold text-green-600">95</p>
                    <p className="text-xs text-green-600 font-medium">followers</p>
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full">Follow</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Roadmap Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white via-white to-blue-50/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-100/50">
              <div className="p-6 border-b border-gradient-to-r from-blue-100 to-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">Create New Roadmap</h2>
                      <p className="text-gray-600">Share your expertise and guide others</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                    className="w-8 h-8 p-0 hover:bg-blue-100/50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gradient-to-br from-white to-blue-50/20">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-800 bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent">
                      Roadmap Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g., Full Stack Developer Journey"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-800 bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent">
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe what this roadmap covers and who it's for..."
                      className="mt-1 min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-sm font-semibold text-gray-800 bg-gradient-to-r from-gray-800 to-green-700 bg-clip-text text-transparent">
                        Category *
                      </Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-blue-50/30"
                        required
                      >
                        <option value="" className="text-gray-500">Select category</option>
                        <option value="frontend" className="text-blue-700">Frontend Development</option>
                        <option value="backend" className="text-green-700">Backend Development</option>
                        <option value="fullstack" className="text-purple-700">Full Stack Development</option>
                        <option value="mobile" className="text-indigo-700">Mobile Development</option>
                        <option value="datascience" className="text-emerald-700">Data Science</option>
                        <option value="devops" className="text-orange-700">DevOps</option>
                        <option value="cybersecurity" className="text-red-700">Cybersecurity</option>
                        <option value="product" className="text-teal-700">Product Management</option>
                        <option value="design" className="text-pink-700">UI/UX Design</option>
                        <option value="other" className="text-gray-700">Other</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="level" className="text-sm font-semibold text-gray-800 bg-gradient-to-r from-gray-800 to-purple-700 bg-clip-text text-transparent">
                        Difficulty Level *
                      </Label>
                      <select
                        id="level"
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-purple-50/30"
                        required
                      >
                        <option value="" className="text-gray-500">Select level</option>
                        <option value="beginner" className="text-green-700">Beginner</option>
                        <option value="intermediate" className="text-yellow-700">Intermediate</option>
                        <option value="advanced" className="text-orange-700">Advanced</option>
                        <option value="expert" className="text-red-700">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration" className="text-sm font-semibold text-gray-800 bg-gradient-to-r from-gray-800 to-orange-700 bg-clip-text text-transparent">
                        Duration *
                      </Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        placeholder="e.g., 6-12 months"
                        className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phases" className="text-sm font-semibold text-gray-800 bg-gradient-to-r from-gray-800 to-indigo-700 bg-clip-text text-transparent">
                        Number of Phases *
                      </Label>
                      <Input
                        id="phases"
                        type="number"
                        value={formData.phases}
                        onChange={(e) => setFormData({...formData, phases: e.target.value})}
                        placeholder="e.g., 8"
                        className="mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                        min="1"
                        max="20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags" className="text-sm font-semibold text-gray-800 bg-gradient-to-r from-gray-800 to-teal-700 bg-clip-text text-transparent">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="e.g., JavaScript, React, Node.js (comma separated)"
                      className="mt-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gradient-to-r from-blue-100 to-purple-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  >
                    Create Roadmap
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AlumniNavigation>
  );
}

export default withPageAuthRequired(RoadmapPage);
