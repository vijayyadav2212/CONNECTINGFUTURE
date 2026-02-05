"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Briefcase, MessageCircle, ArrowRight, Star, Award, Globe, Heart } from "lucide-react";

// Stat Card Component
const StatCard = ({ icon: Icon, count, suffix, label, color, delay, isVisible }: {
  icon: any;
  count: number;
  suffix: string;
  label: string;
  color: string;
  delay: string;
  isVisible: boolean;
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600'
  };

  return (
    <div 
      className={`text-center transform transition-all duration-700 hover:scale-105 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-16 h-16 ${colorClasses[color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:rotate-3`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-2 font-mono">
        {count}{suffix}
      </h3>
      <p className="text-gray-600 font-medium">{label}</p>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, color, delay, isVisible }: {
  icon: any;
  title: string;
  description: string;
  color: string;
  delay: string;
  isVisible: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600 group-hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600 group-hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600 group-hover:bg-purple-600'
  };

  const backgroundGradients = {
    blue: 'hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100',
    green: 'hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100',
    purple: 'hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100'
  };

  return (
    <Card 
      className={`group shadow-lg hover:shadow-2xl transition-all duration-500 border-0 bg-white transform hover:scale-105 hover:-translate-y-2 cursor-pointer ${backgroundGradients[color as keyof typeof backgroundGradients]} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-4">
        <div className={`w-14 h-14 ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center mb-4 transition-all duration-300 transform group-hover:rotate-6 group-hover:scale-110 shadow-lg`}>
          <Icon className="h-7 w-7 text-white transition-transform duration-300 group-hover:scale-110" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
          {description}
        </p>
        <div className={`mt-4 h-1 bg-gradient-to-r ${color === 'blue' ? 'from-blue-400 to-blue-600' : color === 'green' ? 'from-green-400 to-green-600' : 'from-purple-400 to-purple-600'} rounded-full transform origin-left transition-transform duration-500 ${isHovered ? 'scale-x-100' : 'scale-x-0'}`}></div>
      </CardContent>
    </Card>
  );
};

// Testimonial Card Component
const TestimonialCard = ({ name, role, initials, testimonial, color, delay, isVisible }: {
  name: string;
  role: string;
  initials: string;
  testimonial: string;
  color: string;
  delay: string;
  isVisible: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const colorClasses = {
    blue: 'bg-blue-500 group-hover:bg-blue-600',
    green: 'bg-green-500 group-hover:bg-green-600',
    purple: 'bg-purple-500 group-hover:bg-purple-600'
  };

  const backgroundClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100',
    green: 'bg-green-50 hover:bg-green-100',
    purple: 'bg-purple-50 hover:bg-purple-100'
  };

  return (
    <Card 
      className={`group shadow-lg hover:shadow-2xl transition-all duration-500 border-0 ${backgroundClasses[color as keyof typeof backgroundClasses]} transform hover:scale-105 hover:-translate-y-2 cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6 relative">
        <div className="absolute top-4 right-4 text-6xl text-gray-200 font-serif">"</div>
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 ${colorClasses[color as keyof typeof colorClasses]} rounded-full flex items-center justify-center mr-4 transition-all duration-300 transform group-hover:scale-110 shadow-lg`}>
            <span className="text-white font-semibold">{initials}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">{name}</h4>
            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{role}</p>
          </div>
        </div>
        <p className="text-gray-700 italic leading-relaxed group-hover:text-gray-800 transition-colors duration-300 relative z-10">
          {testimonial}
        </p>
        <div className="flex items-center mt-4">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-4 h-4 text-yellow-400 fill-current transition-all duration-300 ${isHovered ? 'animate-pulse' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Custom hooks for animations
const useIntersectionObserver = <T extends Element>(elementRef: React.RefObject<T | null>, threshold = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(element);
    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [elementRef, threshold]);

  return isIntersecting;
};

const useAnimatedCounter = (end: number, duration = 2000, trigger = true) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, trigger]);

  return count;
};

export default function HomePage() {
  const { user, isLoading } = useUser();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Refs for intersection observers
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  
  // Intersection observer hooks
  const isHeroVisible = useIntersectionObserver(heroRef);
  const isStatsVisible = useIntersectionObserver(statsRef);
  const isFeaturesVisible = useIntersectionObserver(featuresRef);
  const isTestimonialsVisible = useIntersectionObserver(testimonialsRef);

  // Mouse move effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
      {/* Custom CSS Styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
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
                  <Link href="/post-login">
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
      <section ref={heroRef} className="py-20 relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        <div 
          className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        ></div>
        <div 
          className="absolute top-32 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"
          style={{
            transform: `translate(${-mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)`,
            animationDelay: '2s'
          }}
        ></div>
        <div 
          className="absolute bottom-10 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${-mousePosition.y * 0.01}px)`,
            animationDelay: '4s'
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className={`mb-8 transition-all duration-1000 ${isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className={`w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform transition-all duration-700 hover:scale-110 hover:rotate-3 ${isHeroVisible ? 'animate-bounce' : ''}`}>
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6 transition-all duration-1000 ${isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ animationDelay: '0.2s' }}>
              Connect Alumni with Students
            </h2>
            <p className={`text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 ${isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
               style={{ animationDelay: '0.4s' }}>
              Bridge the gap between experienced alumni and current students. Share knowledge, 
              create opportunities, and build lasting connections that shape the future.
            </p>
          </div>
          {!user && (
            <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ${isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                 style={{ animationDelay: '0.6s' }}>
              <a href="/api/auth/login?screen_hint=signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 text-white font-semibold px-8 py-4 rounded-xl">
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </a>
              <a href="/api/auth/login">
                <Button size="lg" variant="outline" className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transform transition-all duration-300 hover:scale-105 font-semibold px-8 py-4 rounded-xl">
                  Login
                </Button>
              </a>
            </div>
          )}
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 animate-float">
          <div className="w-4 h-4 bg-blue-400 rounded-full opacity-60"></div>
        </div>
        <div className="absolute top-3/4 right-1/4 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-6 h-6 bg-purple-400 rounded-full opacity-60"></div>
        </div>
        <div className="absolute top-1/2 right-1/3 animate-float" style={{ animationDelay: '2s' }}>
          <div className="w-3 h-3 bg-pink-400 rounded-full opacity-60"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard
              icon={Users}
              count={useAnimatedCounter(500, 2000, isStatsVisible)}
              suffix="+"
              label="Active Alumni"
              color="blue"
              delay="0"
              isVisible={isStatsVisible}
            />
            <StatCard
              icon={Briefcase}
              count={useAnimatedCounter(200, 2000, isStatsVisible)}
              suffix="+"
              label="Job Placements"
              color="green"
              delay="200"
              isVisible={isStatsVisible}
            />
            <StatCard
              icon={MessageCircle}
              count={useAnimatedCounter(1000, 2000, isStatsVisible)}
              suffix="+"
              label="Mentorship Sessions"
              color="purple"
              delay="400"
              isVisible={isStatsVisible}
            />
            <StatCard
              icon={Award}
              count={useAnimatedCounter(50, 2000, isStatsVisible)}
              suffix="+"
              label="Success Stories"
              color="yellow"
              delay="600"
              isVisible={isStatsVisible}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${isFeaturesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-4">
              Why Choose Connecting Future?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our platform provides everything you need to build meaningful connections and advance your career.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Users}
              title="Network Building"
              description="Connect with alumni from your field and build meaningful professional relationships that last throughout your career journey."
              color="blue"
              delay="0"
              isVisible={isFeaturesVisible}
            />
            <FeatureCard
              icon={Briefcase}
              title="Career Opportunities"
              description="Discover job opportunities, internships, and career guidance from experienced professionals who have walked the same path."
              color="green"
              delay="200"
              isVisible={isFeaturesVisible}
            />
            <FeatureCard
              icon={MessageCircle}
              title="Mentorship"
              description="Get mentored by alumni or become a mentor yourself. Share knowledge, experiences, and help shape the next generation of professionals."
              color="purple"
              delay="400"
              isVisible={isFeaturesVisible}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-white to-purple-50/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${isTestimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent mb-4">
              What Our Community Says
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from alumni and students who have benefited from our platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              name="Arjun Kumar"
              role="Software Engineer at Google"
              initials="AK"
              testimonial="Connecting Future helped me find my dream job. The mentorship program was invaluable in preparing me for technical interviews."
              color="blue"
              delay="0"
              isVisible={isTestimonialsVisible}
            />
            <TestimonialCard
              name="Sneha Kumar"
              role="Product Manager at Microsoft"
              initials="SK"
              testimonial="As an alumni, I love giving back to the community. The platform makes it easy to connect with students and share my experiences."
              color="green"
              delay="200"
              isVisible={isTestimonialsVisible}
            />
            <TestimonialCard
              name="Rahul Singh"
              role="Student, Computer Science"
              initials="RS"
              testimonial="The mentorship I received through this platform was incredible. My mentor helped me understand industry expectations and prepare for interviews."
              color="purple"
              delay="400"
              isVisible={isTestimonialsVisible}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.05),transparent)]"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6 animate-fade-in-up">
            Ready to Start Your Journey?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Join thousands of alumni and students who are already building meaningful connections.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <a href="/api/auth/login?screen_hint=signup">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 font-semibold px-8 py-4 rounded-xl">
                  <span>Join Now</span>
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </a>
              <a href="/api/auth/login">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm transform transition-all duration-300 hover:scale-105 font-semibold px-8 py-4 rounded-xl">
                  Learn More
                </Button>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-xl font-bold">Connecting Future</h4>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Bridging the gap between alumni and students to create meaningful connections.
              </p>
            </div>
            <div className="transform hover:translate-y-1 transition-all duration-300">
              <h5 className="font-semibold mb-4 text-blue-400">Platform</h5>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Features</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Mentorship</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Jobs</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Events</a></li>
              </ul>
            </div>
            <div className="transform hover:translate-y-1 transition-all duration-300">
              <h5 className="font-semibold mb-4 text-green-400">Community</h5>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Alumni</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Students</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Success Stories</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Blog</a></li>
              </ul>
            </div>
            <div className="transform hover:translate-y-1 transition-all duration-300">
              <h5 className="font-semibold mb-4 text-purple-400">Support</h5>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Help Center</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Contact Us</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transform transition-all duration-200 inline-block">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 transform hover:scale-105 transition-all duration-300 inline-block">
              &copy; 2025 Connecting Future. All rights reserved. Made with <Heart className="w-4 h-4 inline text-red-500 animate-pulse" /> for the community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

