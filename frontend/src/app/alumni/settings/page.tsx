"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthToken } from '../../../../contexts/AuthTokenContext';
import AlumniNavigation from '../AluminaNavigation';
import {
  User,
  Bell,
  Lock,
  Shield,
  Eye,
  Smartphone,
  Mail,
  Globe,
  Moon,
  LogOut,
  ChevronRight,
  Camera,
  Save,
  Briefcase,
  GraduationCap,
  Linkedin,
  FileText,
  MapPin,
  Check
} from 'lucide-react';
import { position } from 'html2canvas/dist/types/css/property-descriptors/position';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    fullName: 'Ved Prakash',
    graduationYear: '2026',
    course: 'Information technology',
    email: 'ved.prakash@example.com',
    phone: '+91 98765 43210',
    currentCompany: 'MotorCorp',
    jobTitle: 'R&D',
    location: 'Mumbai',
    linkedin: 'https://linkedin.com/in/yourprofile',
    website: '',
    bio: 'Motivated Information Technology undergraduate seeking an entry-level opportunity to apply knowledge of programming, databases, and software development while contributing to organizational growth',
    skills: 'data analysis, SQL',
    isMentor: true,
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  });

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    jobAlerts: true,
    eventInvites: false,
    communityNews: true,
    mentorshipRequests: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessages: true
  });



  const { token, tokenLoading: authLoading } = useAuthToken();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  React.useEffect(() => {
    if (!authLoading && token) {
      fetchProfile();
    } else if (!authLoading && !token) {
        setLoading(false); // Stop loading if no token (auth will handle redirect or we show empty)
    }
  }, [authLoading, token]);

  const fetchProfile = async () => {
    try {
      if (!token) return;
      const res = await fetch('http://localhost:4000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setProfileData({
          fullName: data.user.name || '',
          graduationYear: String(data.user.graduation_year || ''),
          course: data.user.major || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          currentCompany: data.user.company || '',
          jobTitle: data.user.job_title || '',
          location: data.user.location || '',
          linkedin: data.user.linkedin_url || '',
          website: data.user.website_url || '',
          bio: data.user.bio || '',
          skills: data.user.skills || '',
          isMentor: !!data.user.is_mentor,
          profileImage: data.user.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        });
        if (data.user.notification_preferences) {
          setNotifications(prev => ({ ...prev, ...data.user.notification_preferences }));
        }
        if (data.user.privacy_settings) {
          setPrivacy(prev => ({ ...prev, ...data.user.privacy_settings }));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (!token) throw new Error('Not authenticated');
      const payload = {
        name: profileData.fullName,
        phone: profileData.phone,
        email: profileData.email,
        location: profileData.location,
        graduationYear: profileData.graduationYear,
        course: profileData.course,
        currentCompany: profileData.currentCompany,
        jobTitle: profileData.jobTitle,
        linkedIn: profileData.linkedin,
        portfolio: profileData.website,
        bio: profileData.bio,
        skills: profileData.skills,
        isOpenToMentoring: profileData.isMentor,
        picture: profileData.profileImage,
        notification_preferences: notifications,
        privacy_settings: privacy
      };

      const res = await fetch('http://localhost:4000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };



  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    window.location.href = '/api/auth/logout';
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProfileData({ ...profileData, [name]: checked });
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Edit Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Moon },
  ];

  return (
    <AlumniNavigation>
      <div className="bg-slate-50 min-h-screen pb-12">
        {/* Header Background */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-48 w-full relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="container mx-auto px-6 h-full flex items-center">
            <h1 className="text-4xl font-bold text-white tracking-tight">Settings</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col md:flex-row">

            {/* Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200">
              <div className="p-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Account</h2>
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
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
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Support</h2>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-10">

              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-slate-900">Profile Details</h2>
                  </div>
                  <p className="text-slate-500 mb-8 ml-9">Complete your profile to connect with fellow alumni</p>

                  <div className="flex justify-end mb-6">
                    <div className="flex items-center gap-4">
                      {message && (
                        <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {message.text}
                        </span>
                      )}
                      <button 
                        onClick={saveProfile}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8">

                    {/* Left Column: Profile Image */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="relative group cursor-pointer mb-3">
                        <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-slate-100">
                          <img
                            src={profileData.profileImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="w-8 h-8 text-white" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                        <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full shadow-md border-2 border-white">
                          <Camera className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium text-center">Allowed *.jpeg, *.jpg, *.png,<br /> max size of 3 MB</p>
                    </div>

                    {/* Right Column: Form Sections */}
                    <div className="flex-1 space-y-8">

                      {/* PERSONAL INFORMATION (BLUE) */}
                      <div>
                        <div className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-3 shadow-md mb-6">
                          <User className="w-5 h-5" />
                          <h3 className="font-bold uppercase tracking-wide text-sm">Personal Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
                            <input
                              name="fullName"
                              value={profileData.fullName}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Graduation Year *</label>
                            <select
                              name="graduationYear"
                              value={profileData.graduationYear}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                              {Array.from({ length: 15 }, (_, i) => 2030 - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Course/Major *</label>
                            <input
                              name="course"
                              value={profileData.course}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* PROFESSIONAL INFORMATION (GREEN) */}
                      <div>
                        <div className="bg-green-700 text-white px-4 py-3 rounded-lg flex items-center gap-3 shadow-md mb-6">
                          <Briefcase className="w-5 h-5" />
                          <h3 className="font-bold uppercase tracking-wide text-sm">Professional Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Current Company</label>
                            <input
                              name="currentCompany"
                              value={profileData.currentCompany}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Job Title</label>
                            <input
                              name="jobTitle"
                              value={profileData.jobTitle}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                              <input
                                name="location"
                                value={profileData.location}
                                onChange={handleProfileChange}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">LinkedIn Profile</label>
                            <div className="relative">
                              <Linkedin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                              <input
                                name="linkedin"
                                value={profileData.linkedin}
                                onChange={handleProfileChange}
                                placeholder="https://linkedin.com/in/..."
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Portfolio / Website</label>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                              <input
                                name="website"
                                value={profileData.website}
                                onChange={handleProfileChange}
                                placeholder="https://yourportfolio.com"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ADDITIONAL INFORMATION (PURPLE) */}
                      <div>
                        <div className="bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center gap-3 shadow-md mb-6">
                          <FileText className="w-5 h-5" />
                          <h3 className="font-bold uppercase tracking-wide text-sm">Additional Information</h3>
                        </div>
                        <div className="space-y-6 px-2">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
                            <textarea
                              name="bio"
                              rows={4}
                              value={profileData.bio}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Skills & Expertise</label>
                            <input
                              name="skills"
                              value={profileData.skills}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                            />
                            <p className="text-xs text-slate-500 mt-2">Separate skills with commas</p>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                            <input
                              type="checkbox"
                              name="isMentor"
                              checked={profileData.isMentor}
                              onChange={handleProfileChange}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            />
                            <label className="font-bold text-slate-800 flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-600" />
                              I'm open to mentoring students and junior alumni
                            </label>
                          </div>
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
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            {key.includes('email') && <Mail className="w-5 h-5" />}
                            {key.includes('job') && <Shield className="w-5 h-5" />}
                            {key.includes('event') && <User className="w-5 h-5" />}
                            {key.includes('mentorship') && <Smartphone className="w-5 h-5" />}
                            {!key.match(/email|job|event|mentorship/) && <Bell className="w-5 h-5" />}
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
                            onChange={() => setNotifications({ ...notifications, [key]: !value })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
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
                            onClick={() => setPrivacy({ ...privacy, profileVisibility: option })}
                            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${privacy.profileVisibility === option
                              ? 'border-blue-600 bg-blue-50/50'
                              : 'border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${privacy.profileVisibility === option ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
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
                            <input type="checkbox" checked={privacy.showEmail} onChange={() => setPrivacy({ ...privacy, showEmail: !privacy.showEmail })} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">Show Phone Number</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={privacy.showPhone} onChange={() => setPrivacy({ ...privacy, showPhone: !privacy.showPhone })} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
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
    </AlumniNavigation>
  );
}
