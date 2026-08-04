"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building, Award, ArrowLeft, Plus } from "lucide-react";

function CareerTimelinePage() {
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
          <a href="/api/auth/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-[#1A1C23]">
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
              <h1 className="text-xl font-bold text-gray-900">Career Timeline</h1>
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Career Journey</h1>
          <p className="text-gray-600">Track and share your professional milestones with the community</p>
        </div>

        {/* Add New Experience Button */}
        <div className="mb-8">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Experience
          </Button>
        </div>

        {/* Career Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Years of Experience</p>
                  <p className="text-2xl font-bold text-slate-900">8</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Companies Worked</p>
                  <p className="text-2xl font-bold text-slate-900">4</p>
                </div>
                <Building className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Certifications</p>
                  <p className="text-2xl font-bold text-slate-900">6</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Current Position */}
              <div className="relative pl-8 border-l-2 border-blue-500">
                <div className="absolute w-4 h-4 bg-blue-500 rounded-full -left-2 top-0"></div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">Senior Software Architect</h3>
                      <p className="text-blue-600 font-medium">TechCorp Solutions</p>
                      <p className="text-sm text-gray-500">Jan 2022 - Present • 2 years 11 months</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Current</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">
                    Leading architecture decisions for large-scale distributed systems. Managing a team of 12 engineers 
                    across multiple product lines. Implemented microservices architecture that improved system performance by 40%.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">Leadership</Badge>
                    <Badge variant="outline">System Architecture</Badge>
                    <Badge variant="outline">Microservices</Badge>
                  </div>
                </div>
              </div>

              {/* Previous Position */}
              <div className="relative pl-8 border-l-2 border-gray-300">
                <div className="absolute w-4 h-4 bg-gray-400 rounded-full -left-2 top-0"></div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">Senior Software Engineer</h3>
                      <p className="text-gray-700 font-medium">InnovateLabs</p>
                      <p className="text-sm text-gray-500">Mar 2019 - Dec 2021 • 2 years 10 months</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">
                    Developed and maintained multiple client-facing applications. Led the migration from monolithic 
                    to microservices architecture. Mentored junior developers and established coding standards.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">Node.js</Badge>
                    <Badge variant="outline">AWS</Badge>
                  </div>
                </div>
              </div>

              {/* Another Position */}
              <div className="relative pl-8 border-l-2 border-gray-300">
                <div className="absolute w-4 h-4 bg-gray-400 rounded-full -left-2 top-0"></div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">Software Engineer</h3>
                      <p className="text-gray-700 font-medium">StartupXYZ</p>
                      <p className="text-sm text-gray-500">Jul 2017 - Feb 2019 • 1 year 8 months</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">
                    Built full-stack web applications from scratch. Worked closely with product and design teams 
                    to deliver user-centric solutions. Implemented automated testing and CI/CD pipelines.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">Full Stack</Badge>
                    <Badge variant="outline">Python</Badge>
                    <Badge variant="outline">PostgreSQL</Badge>
                  </div>
                </div>
              </div>

              {/* First Job */}
              <div className="relative pl-8 border-l-2 border-gray-300">
                <div className="absolute w-4 h-4 bg-gray-400 rounded-full -left-2 top-0"></div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">Junior Software Developer</h3>
                      <p className="text-gray-700 font-medium">DevSolutions Inc</p>
                      <p className="text-sm text-gray-500">Jun 2016 - Jun 2017 • 1 year 1 month</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">
                    Started my career as a junior developer working on web applications. Learned industry best practices 
                    and gained experience with various technologies. Contributed to multiple client projects.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">JavaScript</Badge>
                    <Badge variant="outline">PHP</Badge>
                    <Badge variant="outline">MySQL</Badge>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="relative pl-8 border-l-2 border-gray-300">
                <div className="absolute w-4 h-4 bg-purple-500 rounded-full -left-2 top-0"></div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">B.Tech in Computer Science</h3>
                      <p className="text-purple-600 font-medium">ABC Engineering College</p>
                      <p className="text-sm text-gray-500">2012 - 2016 • CGPA: 8.5/10</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Education</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">
                    Graduated with distinction. Active member of coding club and technical societies. 
                    Participated in multiple hackathons and technical competitions.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">Computer Science</Badge>
                    <Badge variant="outline">Data Structures</Badge>
                    <Badge variant="outline">Algorithms</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certifications Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <h3 className="font-medium">AWS Solutions Architect Professional</h3>
                <p className="text-sm text-gray-500">Amazon Web Services • Dec 2023</p>
              </div>
              <Badge variant="outline">Cloud</Badge>
            </div>

            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <h3 className="font-medium">Certified Kubernetes Administrator</h3>
                <p className="text-sm text-gray-500">CNCF • Sep 2023</p>
              </div>
              <Badge variant="outline">DevOps</Badge>
            </div>

            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <h3 className="font-medium">Google Cloud Professional Developer</h3>
                <p className="text-sm text-gray-500">Google Cloud • Jun 2022</p>
              </div>
              <Badge variant="outline">Cloud</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withPageAuthRequired(CareerTimelinePage);
