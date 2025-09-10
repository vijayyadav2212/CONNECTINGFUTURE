"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "../../../lib/auth/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Complete your alumni profile</h1>
              <p className="text-gray-600 text-sm">Signed in as <span className="font-medium">{user.email}</span></p>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Form */}
          <Card className="shadow-sm border border-slate-200 lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Profile details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-sm font-medium text-slate-700">Personal information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName">Full name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        placeholder="Your full name"
                        className="mt-1 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="graduationYear">Graduation year *</Label>
                      <select
                        id="graduationYear"
                        name="graduationYear"
                        value={formData.graduationYear}
                        onChange={handleInputChange}
                        required
                        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <Label htmlFor="course">Course/Major *</Label>
                    <Input
                      id="course"
                      name="course"
                      value={formData.course}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Computer Science, Mechanical Engineering"
                      className="mt-1 h-11"
                    />
                  </div>
                </div>

                {/* Professional Information */}
                <div className="pt-2">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Professional information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="currentCompany">Current company</Label>
                      <Input
                        id="currentCompany"
                        name="currentCompany"
                        value={formData.currentCompany}
                        onChange={handleInputChange}
                        placeholder="Company name"
                        className="mt-1 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="jobTitle">Job title</Label>
                      <Input
                        id="jobTitle"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        placeholder="Your current position"
                        className="mt-1 h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="City, Country"
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="linkedIn">LinkedIn profile</Label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="linkedIn"
                          type="url"
                          name="linkedIn"
                          value={formData.linkedIn}
                          onChange={handleInputChange}
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="pt-2">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Additional information</h3>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Tell us about yourself, interests, and what you're passionate about..."
                      className="mt-1"
                    />
                  </div>

                  <div className="mt-6">
                    <Label htmlFor="skills">Skills & expertise</Label>
                    <Input
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      placeholder="e.g., JavaScript, React, Project Management"
                      className="mt-1 h-11"
                    />
                    <p className="text-xs text-gray-500 mt-2">Separate skills with commas</p>
                  </div>

                  <div className="mt-6">
                    <label className="flex items-center gap-3 p-3 rounded-md border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isOpenToMentoring"
                        checked={formData.isOpenToMentoring}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">I'm open to mentoring students and junior alumni</span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-md font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Completing registration...
                      </>
                    ) : (
                      <>
                        <span>Save and continue</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right: Live preview */}
          <div className="hidden md:block lg:sticky lg:top-6">
            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium text-gray-900">Live profile preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-base font-medium text-gray-900">{formData.fullName || user.name || 'Your name'}</div>
                      <div className="text-sm text-gray-600">
                        {formData.jobTitle || 'Your role'}
                        {formData.currentCompany ? ` • ${formData.currentCompany}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formData.graduationYear || 'Graduation year'}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      {formData.course || 'Course/Major'}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {formData.location || 'Location'}
                    </div>
                    {formData.linkedIn && (
                      <a className="text-xs text-blue-600 hover:underline flex items-center gap-2" href={formData.linkedIn} target="_blank" rel="noreferrer">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                  </div>

                  {formData.bio && (
                    <div className="text-sm text-gray-700">
                      {formData.bio}
                    </div>
                  )}

                  {formData.skills && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.split(',').map((s) => (
                        <span key={s.trim()} className="px-2 py-1 rounded-full text-[10px] bg-slate-100 text-slate-700">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {formData.isOpenToMentoring && (
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
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
