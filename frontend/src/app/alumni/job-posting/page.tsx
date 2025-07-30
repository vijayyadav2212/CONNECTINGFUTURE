"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Clock, ArrowLeft, Plus } from "lucide-react";

function JobPostingPage() {
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
              <h1 className="text-xl font-bold text-gray-900">Job Postings</h1>
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
          <h1 className="text-3xl font-bold mb-2">Job Opportunities</h1>
          <p className="text-gray-600">Post job openings and help fellow alumni and students find opportunities</p>
        </div>

        {/* Create New Job Button */}
        <div className="mb-8">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Post New Job
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Jobs Posted</p>
                  <p className="text-2xl font-bold text-slate-900">8</p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Openings</p>
                  <p className="text-2xl font-bold text-slate-900">3</p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Applications Received</p>
                  <p className="text-2xl font-bold text-slate-900">47</p>
                </div>
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Job Postings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Senior Software Engineer</h3>
                    <p className="text-gray-600">TechCorp Solutions</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Bangalore, India
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Posted 3 days ago
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <p className="text-gray-600 mb-3">
                  Looking for an experienced software engineer to join our growing team. Must have 5+ years of experience with React and Node.js.
                </p>
                <div className="flex gap-2 mb-3">
                  <Badge variant="outline">React</Badge>
                  <Badge variant="outline">Node.js</Badge>
                  <Badge variant="outline">TypeScript</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">12 applications received</span>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">View Applications</Button>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Product Manager</h3>
                    <p className="text-gray-600">InnovateLabs</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Remote
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Posted 1 week ago
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <p className="text-gray-600 mb-3">
                  Seeking a product manager with 3+ years of experience to lead our mobile app development initiatives.
                </p>
                <div className="flex gap-2 mb-3">
                  <Badge variant="outline">Product Management</Badge>
                  <Badge variant="outline">Mobile Apps</Badge>
                  <Badge variant="outline">Agile</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">8 applications received</span>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">View Applications</Button>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg opacity-75">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Data Scientist</h3>
                    <p className="text-gray-600">DataFlow Analytics</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Mumbai, India
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Posted 3 weeks ago
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">Closed</Badge>
                </div>
                <p className="text-gray-600 mb-3">
                  Looking for a data scientist with machine learning expertise to analyze customer behavior patterns.
                </p>
                <div className="flex gap-2 mb-3">
                  <Badge variant="outline">Python</Badge>
                  <Badge variant="outline">Machine Learning</Badge>
                  <Badge variant="outline">SQL</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Position filled • 27 applications</span>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Rahul Kumar</p>
                  <p className="text-sm text-gray-500">Applied for Senior Software Engineer</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">2 hours ago</p>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Priya Sharma</p>
                  <p className="text-sm text-gray-500">Applied for Product Manager</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">5 hours ago</p>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Amit Patel</p>
                  <p className="text-sm text-gray-500">Applied for Senior Software Engineer</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">1 day ago</p>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withPageAuthRequired(JobPostingPage);
