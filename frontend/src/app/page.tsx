"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Briefcase, MessageCircle } from "lucide-react";

export default function HomePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Connecting Future</h1>
            </div>
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700">Welcome, {user.name}</span>
                  <Link href="/alumni/dashboard">
                    <Button>Dashboard</Button>
                  </Link>
                  <a href="/api/auth/logout">
                    <Button variant="outline">Logout</Button>
                  </a>
                </>
              ) : (
                <>
                  <a href="/api/auth/login">
                    <Button variant="outline">Login</Button>
                  </a>
                  <a href="/api/auth/login?screen_hint=signup">
                    <Button>Sign Up</Button>
                  </a>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Connect Alumni with Students
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Bridge the gap between experienced alumni and current students. Share knowledge, 
            create opportunities, and build lasting connections.
          </p>
          {!user && (
            <div className="space-x-4">
              <a href="/api/auth/login?screen_hint=signup">
                <Button size="lg">Get Started</Button>
              </a>
              <a href="/api/auth/login">
                <Button size="lg" variant="outline">Login</Button>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Connecting Future?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-6 w-6 text-blue-600 mr-2" />
                  Network Building
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Connect with alumni from your field and build meaningful professional relationships.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-6 w-6 text-green-600 mr-2" />
                  Career Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Discover job opportunities, internships, and career guidance from experienced professionals.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-6 w-6 text-purple-600 mr-2" />
                  Mentorship
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get mentored by alumni or become a mentor yourself. Share knowledge and experiences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Connecting Future. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

