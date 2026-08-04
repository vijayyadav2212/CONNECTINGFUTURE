"use client";

import React, { useState, useEffect } from 'react';
import StudentNavigation from '../StudentNavigation/StudentNavigation';
import ProfilePhotoModal from '../../../components/ProfilePhotoModal';
import {
  User,
  Bell,
  Shield,
  Eye,
  Globe,
  Smartphone,
  Mail,
  Save,
  Camera,
  Key,
  LogOut,
  Moon,
  ChevronRight,
  Lock,
  Edit2,
  Calendar,
  GraduationCap,
  Hash,
  Trophy,
  MapPin,
  Cpu
} from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuthToken } from '../../../../contexts/AuthTokenContext';
import { toast } from 'react-hot-toast';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  university: string;
  major: string;
  graduationYear: string;
  bio: string;
  skills: string;
  interests: string[];
  linkedin: string;
  github: string;
  portfolio: string;
  rollNumber: string;
  yearOfStudy: string;
  semester: string;
  department: string;
  cgpa: string;
  location: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  eventReminders: boolean;
  mentorshipUpdates: boolean;
  weeklyDigest: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'alumni-only';
  showEmail: boolean;
  showPhone: boolean;
  showSocialLinks: boolean;
  allowMessages: boolean;
  allowMentorshipRequests: boolean;
}

export default function Settings() {
  const { user, isLoading: authLoading } = useUser();
  const { token, tokenLoading } = useAuthToken();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'security' | 'appearance'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const [profile, setProfile] = useState<StudentProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    avatar: '/placeholder-user.jpg',
    university: '',
    major: '',
    graduationYear: '',
    bio: '',
    skills: '',
    interests: [],
    linkedin: '',
    github: '',
    portfolio: '',
    rollNumber: '',
    yearOfStudy: '',
    semester: '',
    department: '',
    cgpa: '',
    location: ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    jobAlerts: true,
    eventReminders: true,
    mentorshipUpdates: true,
    weeklyDigest: false
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'alumni-only',
    showEmail: false,
    showPhone: false,
    showSocialLinks: true,
    allowMessages: true,
    allowMentorshipRequests: true
  });

  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    if (user && token) {
      fetchProfile();
    }
  }, [user, token]);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/v2/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      if (data.user) {
        setProfile({
          id: data.user.id || '',
          name: data.user.name || user?.name || '',
          email: data.user.email || user?.email || '',
          phone: data.user.phone || '',
          avatar: data.user.picture || user?.picture || '/placeholder-user.jpg',
          university: data.user.university || '',
          major: data.user.major || '',
          graduationYear: data.user.graduation_year?.toString() || '',
          bio: data.user.bio || '',
          skills: typeof data.user.skills === 'string' ? data.user.skills : Array.isArray(data.user.skills) ? data.user.skills.join(', ') : '',
          interests: [],
          linkedin: data.user.linkedin_url || '',
          github: data.user.github_url || '',
          portfolio: data.user.website_url || '',
          rollNumber: data.user.roll_number || '',
          yearOfStudy: data.user.year_of_study || '',
          semester: data.user.semester || '',
          department: data.user.department || data.user.major || '',
          cgpa: data.user.cgpa ? String(data.user.cgpa) : '',
          location: data.user.location || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!token) {
      toast.error('Authentication error. Please try again.');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${backendUrl}/api/v2/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          university: profile.university,
          course: profile.major,
          graduationYear: profile.graduationYear,
          bio: profile.bio,
          linkedIn: profile.linkedin,
          gitHub: profile.github,
          portfolio: profile.portfolio,
          skills: profile.skills,
          picture: profile.avatar,
          rollNumber: profile.rollNumber,
          yearOfStudy: profile.yearOfStudy,
          semester: profile.semester,
          department: profile.department,
          cgpa: profile.cgpa,
          location: profile.location
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (key: keyof StudentProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrivacyChange = (key: keyof PrivacySettings, value: any) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    window.location.href = '/api/auth/logout';
  };

  const menuItems = [
    { id: 'profile', label: 'Edit Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'appearance', label: 'Appearance', icon: Moon },
  ];

  const profileFieldClass =
    'w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-slate-200 focus:border-[#11233f] outline-none transition-all [color-scheme:light]';
  const profileFieldWithIconClass =
    'w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-slate-200 focus:border-[#11233f] outline-none transition-all [color-scheme:light]';
  const profileFieldDisabledClass =
    'w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 shadow-sm focus:ring-2 focus:ring-slate-200 focus:border-[#11233f] outline-none transition-all cursor-not-allowed [color-scheme:light]';

  return (
    <StudentNavigation>
      <div className="min-h-screen bg-[#F5F6FA] py-6 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="bg-[#1A1B23] rounded-[32px] p-8 lg:p-10 shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-[12px] uppercase tracking-[0.1em] mb-4">
                    <GraduationCap className="w-4 h-4" />
                    <span>Account Center</span>
                  </div>
                  <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight mb-4">
                    Settings
                  </h1>
                  <p className="text-[#8a94a6] text-lg max-w-2xl mb-8 leading-relaxed">
                    Manage your profile, notifications, privacy, and security preferences.
                  </p>
                </div>
              </div>
            </div>
          </div>

        <div className="relative z-10">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col md:flex-row">

            {/* Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200">
              <div className="p-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Account</h2>
                <nav className="space-y-2">
                  {menuItems.slice(0, 3).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                          ? 'bg-[#11233f] text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                        {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto opacity-75" />}
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-8">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Preferences</h2>
                  <nav className="space-y-2">
                    {menuItems.slice(3).map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id as any)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                            ? 'bg-[#11233f] text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                          {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto opacity-75" />}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="mt-8">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Support</h2>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm sm:text-[15px] font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-10">

              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
                    <button
                      onClick={handleProfileSave}
                      disabled={saving}
                      className="bg-[#11233f] hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium flex items-center shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8 mb-10">
                    <div className="shrink-0 flex flex-col items-center">
                      <div
                        onClick={() => setIsAvatarModalOpen(true)}
                        className="w-32 h-32 rounded-full bg-slate-200 relative overflow-hidden ring-4 ring-white shadow-lg mb-4 group cursor-pointer"
                      >
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAvatarModalOpen(true)}
                        className="text-[#11233f] text-sm font-semibold hover:underline"
                      >
                        Change Photo
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => handleProfileChange('name', e.target.value)}
                          className={profileFieldClass}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => handleProfileChange('email', e.target.value)}
                          className={profileFieldDisabledClass}
                          disabled
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => handleProfileChange('phone', e.target.value)}
                          className={profileFieldClass}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            value={profile.location}
                            onChange={(e) => handleProfileChange('location', e.target.value)}
                            className={profileFieldWithIconClass}
                            placeholder="e.g. Mumbai, India"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Enrollment / Roll Number *</label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            value={profile.rollNumber}
                            onChange={(e) => handleProfileChange('rollNumber', e.target.value)}
                            className={profileFieldWithIconClass}
                            placeholder="e.g. VU4F2223050"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Branch / Department *</label>
                        <div className="relative">
                          <Cpu className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            value={profile.department}
                            onChange={(e) => handleProfileChange('department', e.target.value)}
                            className={profileFieldWithIconClass}
                            placeholder="e.g. Computer Science Engineering"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Year of Study *</label>
                        <input
                          type="text"
                          value={profile.yearOfStudy}
                          onChange={(e) => handleProfileChange('yearOfStudy', e.target.value)}
                          className={profileFieldClass}
                          placeholder="e.g. Third Year (TY)"
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Current Semester</label>
                        <input
                          type="text"
                          value={profile.semester}
                          onChange={(e) => handleProfileChange('semester', e.target.value)}
                          className={profileFieldClass}
                          placeholder="e.g. Semester VI"
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Current CGPA</label>
                        <div className="relative">
                          <Trophy className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                          <input
                            type="number"
                            value={profile.cgpa}
                            onChange={(e) => handleProfileChange('cgpa', e.target.value)}
                            min="0"
                            max="10"
                            step="0.01"
                            className={profileFieldWithIconClass}
                            placeholder="e.g. 8.5"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">University</label>
                        <input
                          type="text"
                          value={profile.university}
                          onChange={(e) => handleProfileChange('university', e.target.value)}
                          className={profileFieldClass}
                          placeholder="Enter your university"
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Major / Course</label>
                        <input
                          type="text"
                          value={profile.major}
                          onChange={(e) => handleProfileChange('major', e.target.value)}
                          className={profileFieldClass}
                          placeholder="Enter your major or course"
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Graduation Year</label>
                        <input
                          type="text"
                          value={profile.graduationYear}
                          onChange={(e) => handleProfileChange('graduationYear', e.target.value)}
                          className={profileFieldClass}
                          placeholder="Enter graduation year"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">About Yourself</label>
                        <textarea
                          rows={3}
                          value={profile.bio}
                          onChange={(e) => handleProfileChange('bio', e.target.value)}
                          className={`${profileFieldClass} resize-none`}
                          placeholder="Tell us about yourself..."
                        />
                        <p className="text-xs text-slate-400 mt-2 text-right">{profile.bio.length}/500 characters</p>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Technical Skills</label>
                        <input
                          type="text"
                          value={profile.skills}
                          onChange={(e) => handleProfileChange('skills', e.target.value)}
                          className={profileFieldClass}
                          placeholder="e.g. Python, Java, React, Machine Learning"
                        />
                        <p className="text-xs text-slate-500 mt-2">Separate skills with commas</p>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn Profile</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                          <input
                            type="url"
                            value={profile.linkedin}
                            onChange={(e) => handleProfileChange('linkedin', e.target.value)}
                            className={profileFieldWithIconClass}
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">GitHub Profile</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                          <input
                            type="url"
                            value={profile.github}
                            onChange={(e) => handleProfileChange('github', e.target.value)}
                            className={profileFieldWithIconClass}
                            placeholder="https://github.com/username"
                          />
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Portfolio / Website</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                          <input
                            type="url"
                            value={profile.portfolio}
                            onChange={(e) => handleProfileChange('portfolio', e.target.value)}
                            className={profileFieldWithIconClass}
                            placeholder="https://yourportfolio.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Notification Preferences</h2>
                  <p className="text-slate-600 mb-8">Manage how and when you want to be notified.</p>

                  <div className="space-y-6">
                    {Object.entries(notifications).map(([key, value]) => {
                      let icon = <Bell className="w-5 h-5" />;
                      if (key.toLowerCase().includes('email')) icon = <Mail className="w-5 h-5" />;
                      if (key.toLowerCase().includes('job')) icon = <Shield className="w-5 h-5" />;
                      if (key.toLowerCase().includes('event')) icon = <User className="w-5 h-5" />; // Consistent with alumni
                      if (key.toLowerCase().includes('mentorship')) icon = <Smartphone className="w-5 h-5" />;

                      return (
                        <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                              {icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                              <p className="text-sm text-slate-500">Receive notifications about {key.replace(/([A-Z])/g, ' $1').toLowerCase()}.</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={() => handleNotificationChange(key as keyof NotificationSettings)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Privacy & Security</h2>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Security Recommendation</h4>
                      <p className="text-sm text-yellow-700 mt-1">Enable Two-Factor Authentication (2FA) to add an extra layer of security to your account.</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Profile Visibility</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['public', 'alumni-only', 'private'].map((option) => (
                          <div
                            key={option}
                            onClick={() => handlePrivacyChange('profileVisibility', option)}
                            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${privacy.profileVisibility === option
                              ? 'border-green-600 bg-green-50/50'
                              : 'border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${privacy.profileVisibility === option ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                              }`}>
                              {option === 'public' && <Globe className="w-6 h-6" />}
                              {option === 'alumni-only' && <User className="w-6 h-6" />}
                              {option === 'private' && <Lock className="w-6 h-6" />}
                            </div>
                            <h4 className="font-semibold capitalize text-slate-900">{option.replace('-', ' ')}</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {option === 'public' ? 'Everyone can see your profile.' :
                                option === 'alumni-only' ? 'Only verified alumni can view.' :
                                  'Only you can view your profile.'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Contact Info Visibility</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">Show Email Address</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={privacy.showEmail}
                              onChange={() => handlePrivacyChange('showEmail', !privacy.showEmail)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">Show Phone Number</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={privacy.showPhone}
                              onChange={() => handlePrivacyChange('showPhone', !privacy.showPhone)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings - Added from previous student page but styled */}
              {activeTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100 rounded-xl text-green-600">
                          <Key className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 mb-2 text-lg">Change Password</h3>
                          <p className="text-slate-600 text-sm mb-4">Update your password to keep your account secure</p>
                          <button className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-sm">
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Info */}
              {activeTab === 'appearance' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center py-20">
                  <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Moon className="w-12 h-12" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Dark Mode Coming Soon!</h2>
                  <p className="text-slate-500 max-w-md mx-auto">We are working on a sleek dark theme for those late night coding sessions. Stay tuned!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
      <ProfilePhotoModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={(url) => setProfile(prev => ({ ...prev, avatar: url }))}
        currentPhoto={profile.avatar}
      />
    </StudentNavigation>
  );
}
