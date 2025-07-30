"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Target, BookOpen, Users, ArrowLeft, Plus } from "lucide-react";

function RoadmapPage() {
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
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/alumni/dashboard" className="flex items-center text-blue-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Career Roadmaps</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <a href="/api/auth/logout">
                <Button variant="outline" size="sm">Logout</Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Career Guidance Roadmaps</h1>
          <p className="text-gray-600">Create and share career paths to guide students and fellow alumni</p>
        </div>

        {/* Create New Roadmap Button */}
        <div className="mb-8">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Roadmap
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Roadmaps Created</p>
                  <p className="text-2xl font-bold text-slate-900">5</p>
                </div>
                <Map className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Students Helped</p>
                  <p className="text-2xl font-bold text-slate-900">156</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Views</p>
                  <p className="text-2xl font-bold text-slate-900">2.1K</p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Roadmaps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>My Career Roadmaps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Full Stack Developer Roadmap</h3>
                  <p className="text-gray-600 mb-3">
                    A comprehensive guide to becoming a full-stack developer, covering both frontend and backend technologies.
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline">Frontend</Badge>
                    <Badge variant="outline">Backend</Badge>
                    <Badge variant="outline">Database</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">89</p>
                  <p className="text-sm text-gray-500">students following</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-semibold">8</p>
                  <p className="text-sm text-gray-500">Phases</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">6-12</p>
                  <p className="text-sm text-gray-500">Months</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Beginner</p>
                  <p className="text-sm text-gray-500">Level</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View Roadmap</Button>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <p className="text-sm text-gray-500">Updated 2 weeks ago</p>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Data Science Career Path</h3>
                  <p className="text-gray-600 mb-3">
                    Step-by-step guide to transition into data science, including mathematics, programming, and ML.
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline">Python</Badge>
                    <Badge variant="outline">Machine Learning</Badge>
                    <Badge variant="outline">Statistics</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">45</p>
                  <p className="text-sm text-gray-500">students following</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-semibold">10</p>
                  <p className="text-sm text-gray-500">Phases</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">8-15</p>
                  <p className="text-sm text-gray-500">Months</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Intermediate</p>
                  <p className="text-sm text-gray-500">Level</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View Roadmap</Button>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <p className="text-sm text-gray-500">Updated 1 month ago</p>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">DevOps Engineer Journey</h3>
                  <p className="text-gray-600 mb-3">
                    Complete roadmap to become a DevOps engineer, covering CI/CD, cloud platforms, and automation.
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline">AWS</Badge>
                    <Badge variant="outline">Docker</Badge>
                    <Badge variant="outline">Kubernetes</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">22</p>
                  <p className="text-sm text-gray-500">students following</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-semibold">7</p>
                  <p className="text-sm text-gray-500">Phases</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">4-8</p>
                  <p className="text-sm text-gray-500">Months</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Advanced</p>
                  <p className="text-sm text-gray-500">Level</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View Roadmap</Button>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <p className="text-sm text-gray-500">Updated 3 weeks ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Roadmaps from Community */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Popular Community Roadmaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Mobile App Development (Flutter)</h3>
                <p className="text-sm text-gray-500">By Rajesh Kumar • Class of 2018</p>
                <p className="text-sm text-gray-600 mt-1">Complete guide to Flutter development with real-world projects</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-blue-600">127 followers</p>
                <Button variant="outline" size="sm" className="mt-2">Follow</Button>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Product Management Transition</h3>
                <p className="text-sm text-gray-500">By Priya Sharma • Class of 2017</p>
                <p className="text-sm text-gray-600 mt-1">From engineering to product management - a practical guide</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">95 followers</p>
                <Button variant="outline" size="sm" className="mt-2">Follow</Button>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Cybersecurity Specialist Path</h3>
                <p className="text-sm text-gray-500">By Amit Patel • Class of 2015</p>
                <p className="text-sm text-gray-600 mt-1">Comprehensive cybersecurity career roadmap with certifications</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-purple-600">73 followers</p>
                <Button variant="outline" size="sm" className="mt-2">Follow</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withPageAuthRequired(RoadmapPage);
