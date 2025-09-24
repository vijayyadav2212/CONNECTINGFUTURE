"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "../../../lib/auth/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, User, Building, MapPin, Linkedin, FileText, Users, Heart, CheckCircle, ArrowRight, Calendar } from "lucide-react";

// Custom styles for animations
const customStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
  .animate-slideUp { animation: slideUp 0.8s ease-out forwards; }
`;

export default function RegistrationPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    graduationYear: '',
    course: '',
    currentCompany: '',
    jobTitle: '',
    location: '',
    linkedIn: '',
    bio: '',
    skills: '',
    isOpenToMentoring: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isLoading) {
      // Pre-fill form with Auth0 data
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
      }));
    }
  }, [user, isLoading]);

  // Prefill with existing saved profile from backend if available
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || isLoading) return;
      try {
        const resp = await fetch('/api/user/profile', { cache: 'no-store' });
        if (!resp.ok) return;
        const data = await resp.json();
        const u = data?.user || {};
        setFormData(prev => ({
          ...prev,
          fullName: (u.name ?? prev.fullName) || '',
          graduationYear: u.graduation_year ? String(u.graduation_year) : (prev.graduationYear || ''),
          course: u.major || prev.course || '',
          currentCompany: u.company || prev.currentCompany || '',
          jobTitle: u.job_title || u.current_job || prev.jobTitle || '',
          location: u.location || prev.location || '',
          linkedIn: u.linkedin_url || prev.linkedIn || '',
          bio: u.bio || prev.bio || '',
          skills: typeof u.skills === 'string' ? u.skills : (Array.isArray(u.skills) ? u.skills.join(',') : (prev.skills || '')),
          isOpenToMentoring: Boolean(u.is_mentor ?? prev.isOpenToMentoring),
        }));
      } catch {
        // ignore prefill failures
      }
    };
    loadProfile();
  }, [user, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('redirect');
      if (r) setRedirectTo(r);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
  // Save registration data to backend (authenticated)
  const payload = { ...formData, name: formData.fullName, email: user?.email || '' };
  const result = await apiClient.updateUserProfile(payload);
  console.log('Registration successful:', result);
  // Clear signup intent flag after successful registration
  try { document.cookie = 'signup_intent=; Max-Age=0; path=/'; } catch {}
      
      // Redirect to dashboard after successful registration
  router.push(redirectTo || '/alumni/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
  alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Join Connecting Future</CardTitle>
            <p className="text-gray-600 mt-2">Create your account to get started</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <a href="/api/auth/login?screen_hint=signup" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                <User className="w-5 h-5 mr-2" />
                Sign Up with Auth0
              </Button>
            </a>
            
            <div className="text-center">
              <span className="text-sm text-gray-500">Already have an account? </span>
              <a href="/api/auth/login" className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium">
                Sign In
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-4 px-2 sm:px-4 lg:px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-300">
                <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Complete your alumni profile
                </h1>
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  Signed in as <span className="font-semibold text-blue-600">{user.email}</span>
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Online
            </div>
          </div>
        </div>

        {/* Responsive two-column layout */}
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
          {/* Left: Form */}
          <Card className="shadow-2xl border-0 w-full xl:w-2/3 bg-white/95 backdrop-blur-sm overflow-hidden animate-slideUp">
            <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 animate-pulse"></div>
              <div className="relative z-10">
                <CardTitle className="text-xl sm:text-2xl flex items-center text-gray-900 font-bold">
                  <User className="w-7 h-7 mr-3 text-blue-600 animate-bounce" />
                  Profile Details
                </CardTitle>
                <p className="text-sm sm:text-base text-gray-600 mt-2">Complete your profile to connect with fellow alumni</p>
                
                {/* Progress indicator */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Profile Completion</span>
                    <span>
                      {Math.round(
                        (Object.values(formData).filter(val => 
                          typeof val === 'string' ? val.trim() !== '' : val === true
                        ).length / Object.keys(formData).length) * 100
                      )}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.round(
                          (Object.values(formData).filter(val => 
                            typeof val === 'string' ? val.trim() !== '' : val === true
                          ).length / Object.keys(formData).length) * 100
                        )}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-8 lg:space-y-10">
                {/* Personal Information */}
                <div className="space-y-6 animate-fadeIn" style={{animationDelay: '0.1s'}}>
                  <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                    <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide flex items-center">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 mr-3 animate-pulse" />
                      Personal Information
                    </h3>
                    <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                      <div className="w-1/3 bg-white rounded-full h-1 animate-pulse"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    <div className="group">
                      <label className="block text-sm font-bold text-gray-900 mb-3 transition-colors duration-200 group-focus-within:text-blue-600">
                        Full Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 transition-all duration-300 hover:border-gray-400 hover:shadow-md group-hover:transform group-hover:scale-[1.02]"
                          placeholder="Enter your full name"
                        />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                        {formData.fullName && (
                          <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-fadeIn" />
                        )}
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-bold text-gray-900 mb-3 transition-colors duration-200 group-focus-within:text-blue-600">
                        Graduation Year *
                      </label>
                      <div className="relative">
                        <select
                          name="graduationYear"
                          value={formData.graduationYear}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm text-gray-900 transition-all duration-300 hover:border-gray-400 hover:shadow-md appearance-none cursor-pointer"
                        >
                          <option value="">Select year</option>
                          {Array.from({ length: 30 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <option key={year} value={year.toString()}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                        {formData.graduationYear && (
                          <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-fadeIn" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="group lg:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-3 transition-colors duration-200 group-focus-within:text-blue-600">
                      Course/Major *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="course"
                        value={formData.course}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 transition-all duration-300 hover:border-gray-400 hover:shadow-md"
                        placeholder="e.g., Computer Science, Mechanical Engineering"
                      />
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      {formData.course && (
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-fadeIn" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="border-t border-gray-200 pt-8 animate-fadeIn" style={{animationDelay: '0.3s'}}>
                  <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] mb-6">
                    <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide flex items-center">
                      <Building className="w-5 h-5 sm:w-6 sm:h-6 mr-3 animate-pulse" />
                      Professional Information
                    </h3>
                    <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                      <div className="w-2/3 bg-white rounded-full h-1 animate-pulse"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        Current Company
                      </label>
                      <input
                        type="text"
                        name="currentCompany"
                        value={formData.currentCompany}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        Job Title
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter your current position"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        LinkedIn Profile
                      </label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 w-5 h-5" />
                        <input
                          type="url"
                          name="linkedIn"
                          value={formData.linkedIn}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400"
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg shadow-md mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wide flex items-center">
                      <FileText className="w-5 h-5 mr-3" />
                      Additional Information
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-purple-200 focus:border-purple-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400 resize-none"
                      placeholder="Tell us about yourself, your interests, and what you're passionate about..."
                    />
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Skills & Expertise
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-purple-200 focus:border-purple-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400"
                      placeholder="e.g., JavaScript, React, Project Management, Data Analysis"
                    />
                    <p className="text-xs text-gray-700 mt-2 font-medium">Separate skills with commas</p>
                  </div>

                  <div className="mt-6">
                    <label className="flex items-center space-x-3 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md">
                      <input
                        type="checkbox"
                        name="isOpenToMentoring"
                        checked={formData.isOpenToMentoring}
                        onChange={handleInputChange}
                        className="w-6 h-6 text-blue-600 bg-white border-2 border-blue-300 rounded-md focus:ring-3 focus:ring-blue-200 transition-all duration-150"
                      />
                      <div className="flex items-center space-x-3">
                        <Users className="w-6 h-6 text-blue-600" />
                        <span className="text-gray-900 font-bold text-base">
                          I'm open to mentoring students and junior alumni
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="border-t border-gray-200 pt-8 animate-fadeIn" style={{animationDelay: '0.7s'}}>
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                        <span className="font-medium">Ready to submit?</span>
                        <span className="text-blue-600 font-bold">
                          {Object.values(formData).filter(val => 
                            typeof val === 'string' ? val.trim() !== '' : val === true
                          ).length} / {Object.keys(formData).length} fields completed
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>All required fields are marked with *</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white py-4 sm:py-5 px-6 rounded-xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                        Completing Registration...
                      </>
                    ) : (
                      <>
                        <span>Save & continue to dashboard</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right: Live preview */}
          <div className="w-full xl:w-1/3 lg:sticky lg:top-6 animate-slideUp" style={{animationDelay: '0.5s'}}>
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-3xl transition-all duration-500">
              <CardHeader className="pb-4 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5"></div>
                <div className="relative z-10">
                  <CardTitle className="text-lg sm:text-xl text-gray-900 font-bold flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    Live Profile Preview
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">See how your profile looks to others</p>
                  
                  {/* Live update indicator */}
                  <div className="flex items-center gap-2 mt-3 p-2 bg-white/50 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600 font-medium">Live updates</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="relative">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="relative">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg">
                          <User className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                        </div>
                        {(formData.fullName || formData.jobTitle || formData.currentCompany) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
                            <CheckCircle className="w-full h-full text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          {formData.fullName || user.name || (
                            <span className="text-gray-400 italic">Your name will appear here</span>
                          )}
                        </div>
                        <div className="text-gray-600 text-sm truncate">
                          {formData.jobTitle || formData.currentCompany ? (
                            <>
                              {formData.jobTitle || 'Your role'}
                              {formData.currentCompany && formData.jobTitle && ' • '}
                              {formData.currentCompany}
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Professional info</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formData.graduationYear || 'Graduation year'}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      {formData.course || 'Course/Major'}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {formData.location || 'Location'}
                    </div>
                    {formData.linkedIn && (
                      <a className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-2" href={formData.linkedIn} target="_blank" rel="noreferrer">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                  </div>

                  {formData.bio && (
                    <div className="text-xs sm:text-sm text-gray-700">
                      {formData.bio}
                    </div>
                  )}

                  {formData.skills && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.split(',').map((s) => (
                        <span key={s.trim()} className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {formData.isOpenToMentoring && (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <Users className="w-3.5 h-3.5" />
                      Open to mentoring
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
