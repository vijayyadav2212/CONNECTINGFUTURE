"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, MapPin, Calendar, Building, Edit, ArrowLeft, Github, Globe } from "lucide-react";

function ProfilePage() {
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
              <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
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
      <div className="max-w-4xl mx-auto p-6">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-32 h-32">
                <AvatarImage src={user.picture || "/placeholder-user.jpg"} alt={user.name || "User"} />
                <AvatarFallback className="text-2xl">
                  {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name || 'User Name'}</h1>
                    <p className="text-xl text-gray-600 mb-3">Senior Software Architect</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Bangalore, India
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Class of 2016
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        TechCorp Solutions
                      </span>
                    </div>
                  </div>
                  <Button onClick={() => window.location.href = '/registration?redirect=/alumni/profile'} className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </div>

                <p className="text-gray-600 mb-4">
                  Passionate software architect with 8+ years of experience in building scalable distributed systems. 
                  Love mentoring junior developers and contributing to open-source projects. Always excited to connect 
                  with fellow alumni and share knowledge.
                </p>

                <div className="flex gap-4">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    {/* <LinkedIn className="w-4 h-4" />
                    LinkedIn */}
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Portfolio
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Current Position</h3>
                <p className="text-gray-600">Senior Software Architect at TechCorp Solutions</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Industry</h3>
                <p className="text-gray-600">Information Technology & Services</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Experience</h3>
                <p className="text-gray-600">8+ Years</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Specialization</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">System Architecture</Badge>
                  <Badge variant="outline">Microservices</Badge>
                  <Badge variant="outline">Cloud Computing</Badge>
                  <Badge variant="outline">Team Leadership</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Degree</h3>
                <p className="text-gray-600">B.Tech in Computer Science & Engineering</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Institution</h3>
                <p className="text-gray-600">ABC Engineering College</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Graduation Year</h3>
                <p className="text-gray-600">2016</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">CGPA</h3>
                <p className="text-gray-600">8.5/10</p>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Expertise */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Programming Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">JavaScript</Badge>
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">Python</Badge>
                    <Badge variant="outline">Java</Badge>
                    <Badge variant="outline">Go</Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">Node.js</Badge>
                    <Badge variant="outline">AWS</Badge>
                    <Badge variant="outline">Docker</Badge>
                    <Badge variant="outline">Kubernetes</Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Databases</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">PostgreSQL</Badge>
                    <Badge variant="outline">MongoDB</Badge>
                    <Badge variant="outline">Redis</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contributions & Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">AMA Sessions Hosted</span>
                <span className="font-medium">12</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Job Opportunities Posted</span>
                <span className="font-medium">8</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Career Roadmaps Created</span>
                <span className="font-medium">5</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Students Mentored</span>
                <span className="font-medium">45</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Donations</span>
                <span className="font-medium">₹25,000</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 border-l-4 border-blue-500 bg-blue-50">
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Hosted AMA Session:</span> "Breaking into Tech Industry"
                </p>
                <p className="text-xs text-gray-500">2 days ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border-l-4 border-green-500 bg-green-50">
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Posted Job Opening:</span> Senior Software Engineer at TechCorp
                </p>
                <p className="text-xs text-gray-500">1 week ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border-l-4 border-purple-500 bg-purple-50">
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Updated Career Timeline:</span> Added current position details
                </p>
                <p className="text-xs text-gray-500">2 weeks ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border-l-4 border-red-500 bg-red-50">
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Made Donation:</span> ₹10,000 to Scholarship Fund
                </p>
                <p className="text-xs text-gray-500">3 weeks ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withPageAuthRequired(ProfilePage);
