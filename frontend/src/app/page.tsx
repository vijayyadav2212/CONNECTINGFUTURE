"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Briefcase, MessageCircle, ArrowRight, Star, Award, Globe, Heart } from "lucide-react";

export default function HomePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Connecting Future</h1>
            </div>
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">Welcome, {user.name}</span>
                  </div>
                  <Link href="/alumni/dashboard">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Dashboard
                    </Button>
                  </Link>
                  <a href="/api/auth/logout">
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                      Logout
                    </Button>
                  </a>
                </>
              ) : (
                <>
                  <a href="/api/auth/login">
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                      Login
                    </Button>
                  </a>
                  <a href="/api/auth/login?screen_hint=signup">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Sign Up
                    </Button>
                  </a>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Connect Alumni with Students
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Bridge the gap between experienced alumni and current students. Share knowledge, 
              create opportunities, and build lasting connections that shape the future.
            </p>
          </div>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/auth/login?screen_hint=signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl">
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <a href="/api/auth/login">
                <Button size="lg" variant="outline" className="border-gray-300 hover:bg-gray-50">
                  Login
                </Button>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">500+</h3>
              <p className="text-gray-600">Active Alumni</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">200+</h3>
              <p className="text-gray-600">Job Placements</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">1000+</h3>
              <p className="text-gray-600">Mentorship Sessions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">50+</h3>
              <p className="text-gray-600">Success Stories</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Connecting Future?
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides everything you need to build meaningful connections and advance your career.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">Network Building</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Connect with alumni from your field and build meaningful professional relationships 
                  that last throughout your career journey.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">Career Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Discover job opportunities, internships, and career guidance from experienced 
                  professionals who have walked the same path.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">Mentorship</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Get mentored by alumni or become a mentor yourself. Share knowledge, 
                  experiences, and help shape the next generation of professionals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Community Says
            </h3>
            <p className="text-xl text-gray-600">
              Hear from alumni and students who have benefited from our platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">AK</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Arjun Kumar</h4>
                    <p className="text-sm text-gray-600">Software Engineer at Google</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Connecting Future helped me find my dream job. The mentorship program 
                  was invaluable in preparing me for technical interviews."
                </p>
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">SK</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Sneha Kumar</h4>
                    <p className="text-sm text-gray-600">Product Manager at Microsoft</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "As an alumni, I love giving back to the community. The platform makes 
                  it easy to connect with students and share my experiences."
                </p>
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">RS</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Rahul Singh</h4>
                    <p className="text-sm text-gray-600">Student, Computer Science</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "The mentorship I received through this platform was incredible. 
                  My mentor helped me understand industry expectations and prepare for interviews."
                </p>
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of alumni and students who are already building meaningful connections.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/auth/login?screen_hint=signup">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl">
                  <span>Join Now</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <a href="/api/auth/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-xl font-bold">Connecting Future</h4>
              </div>
              <p className="text-gray-400">
                Bridging the gap between alumni and students to create meaningful connections.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Platform</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mentorship</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Jobs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Events</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Community</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Alumni</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Students</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2025 Connecting Future. All rights reserved. Made with <Heart className="w-4 h-4 inline text-red-500" /> for the community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

