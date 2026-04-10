"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "../../../lib/auth/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, User, Building, MapPin, Linkedin, FileText, Users, Heart, CheckCircle, ArrowRight, Calendar } from "lucide-react";

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
        // If user already completed registration, send them to alumni dashboard
        const completed = !!u.registration_completed;
        if (completed) {
          router.push('/alumni/dashboard');
          return;
        }
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

  // After registration, always redirect to the alumni dashboard. The client navigation will display
  // the appropriate pending/approved UI via `AlumniNavigation`.
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-6 px-2 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Complete your alumni profile</h1>
                <p className="text-gray-600 text-sm sm:text-base">Signed in as <span className="font-medium">{user.email}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Form */}
          <Card className="shadow-xl border border-gray-100 w-full lg:w-2/3 bg-white">
            <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="text-lg sm:text-xl flex items-center text-gray-900 font-bold">
                <User className="w-6 h-6 mr-3 text-blue-600" />
                Profile Details
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">Complete your profile to connect with fellow alumni</p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <div className="bg-white text-gray-900 px-6 py-3 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-bold uppercase tracking-wide flex items-center">
                      <User className="w-5 h-5 mr-3 text-gray-700" />
                      Personal Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        Graduation Year *
                      </label>
                      <select
                        name="graduationYear"
                        value={formData.graduationYear}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm text-gray-900 transition-all duration-200 hover:border-gray-400"
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
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Course/Major *
                    </label>
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400"
                      placeholder="e.g., Computer Science, Mechanical Engineering"
                    />
                  </div>
                </div>

                {/* Professional Information */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="bg-white text-gray-900 px-6 py-3 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wide flex items-center">
                      <Building className="w-5 h-5 mr-3 text-gray-700" />
                      Professional Information
                    </h3>
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
                  <div className="bg-white text-gray-900 px-6 py-3 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wide flex items-center">
                      <FileText className="w-5 h-5 mr-3 text-gray-700" />
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
                    <label className="flex items-center space-x-3 p-5 bg-white rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md">
                      <input
                        type="checkbox"
                        name="isOpenToMentoring"
                        checked={formData.isOpenToMentoring}
                        onChange={handleInputChange}
                        className="w-6 h-6 text-blue-600 bg-white border-2 border-gray-300 rounded-md focus:ring-3 focus:ring-blue-200 transition-all duration-150"
                      />
                      <div className="flex items-center space-x-3">
                        <Users className="w-6 h-6 text-gray-700" />
                        <span className="text-gray-900 font-bold text-base">
                          I'm open to mentoring students and junior alumni
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="border-t border-gray-200 pt-8">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
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
          <div className="w-full lg:w-1/3 lg:sticky lg:top-6">
            <Card className="shadow-xl border border-gray-100 bg-white">
              <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
                <CardTitle className="text-lg text-gray-900 font-bold flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Live Profile Preview
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">See how your profile looks to others</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-semibold text-gray-900">{formData.fullName || user.name || 'Your name'}</div>
                      <div className="text-gray-600 text-sm">
                        {formData.jobTitle || 'Your role'}
                        {formData.currentCompany ? ` • ${formData.currentCompany}` : ''}
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
  );
}