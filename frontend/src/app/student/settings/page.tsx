"use client";

import React, { useState } from 'react';
import StudentNavigation from '../StudentNavigation';
import { User, Bell, Shield, Eye, Globe, Smartphone, Mail, Save, Edit2, Camera, Key, LogOut, Calendar } from 'lucide-react';

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
  skills: string[];
  interests: string[];
  linkedin: string;
  github: string;
  portfolio: string;
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
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<StudentProfile>({
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    phone: '+1 (555) 123-4567',
    avatar: '/placeholder-user.jpg',
    university: 'State University',
    major: 'Computer Science',
    graduationYear: '2024',
    bio: 'Passionate computer science student interested in full-stack development and artificial intelligence. Currently seeking internship opportunities in tech.',
    skills: ['JavaScript', 'React', 'Python', 'Machine Learning', 'Git'],
    interests: ['Web Development', 'AI/ML', 'Mobile Apps', 'Startups'],
    linkedin: 'https://linkedin.com/in/sarahjohnson',
    github: 'https://github.com/sarahjohnson',
    portfolio: 'https://sarahjohnson.dev'
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Key }
  ];

  const handleProfileSave = () => {
    setIsEditing(false);
    // Save profile changes
    console.log('Profile saved:', profile);
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrivacyChange = (key: keyof PrivacySettings, value: any) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <StudentNavigation>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Settings</h1>
          <p className="text-base sm:text-lg text-gray-700 font-medium">Manage your account preferences and privacy settings</p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <div className="xl:w-72">
            <nav className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 hidden xl:block">Account Settings</h2>
              <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Profile Information</h2>
                    <p className="text-sm lg:text-base text-gray-600">Update your personal information and social links</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 ${
                      isEditing 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                    }`}
                  >
                    <Edit2 className="w-4 h-4" />
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Avatar */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="relative group">
                      <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                        <img 
                          src={profile.avatar} 
                          alt={profile.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      {isEditing && (
                        <button className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110">
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">{profile.name}</h3>
                      <p className="text-base lg:text-lg text-gray-700 font-medium mb-1">{profile.major}</p>
                      <p className="text-sm lg:text-base text-gray-600">Class of {profile.graduationYear}</p>
                      <p className="text-sm lg:text-base text-blue-600 font-medium mt-2">{profile.university}</p>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">Full Name</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 ${
                            isEditing 
                              ? 'border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white text-gray-900' 
                              : 'border-gray-200 bg-gray-100 text-gray-700'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">Email Address</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 ${
                            isEditing 
                              ? 'border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white text-gray-900' 
                              : 'border-gray-200 bg-gray-100 text-gray-700'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">Phone Number</label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 ${
                            isEditing 
                              ? 'border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white text-gray-900' 
                              : 'border-gray-200 bg-gray-100 text-gray-700'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">University</label>
                        <input
                          type="text"
                          value={profile.university}
                          onChange={(e) => setProfile(prev => ({ ...prev, university: e.target.value }))}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 ${
                            isEditing 
                              ? 'border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white text-gray-900' 
                              : 'border-gray-200 bg-gray-100 text-gray-700'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Edit2 className="w-5 h-5 text-blue-600" />
                      About Me
                    </h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">Bio</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={!isEditing}
                        rows={5}
                        className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 resize-none ${
                          isEditing 
                            ? 'border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white text-gray-900' 
                            : 'border-gray-200 bg-gray-100 text-gray-700'
                        }`}
                        placeholder="Tell us about yourself, your interests, goals, and achievements..."
                      />
                      <p className="text-xs text-gray-500 mt-2">{profile.bio.length}/500 characters</p>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Social Links
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-600 rounded"></div>
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          value={profile.linkedin}
                          onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="https://linkedin.com/in/yourprofile"
                          className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 ${
                            isEditing 
                              ? 'border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white text-gray-900' 
                              : 'border-gray-200 bg-gray-100 text-gray-700'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-800 rounded"></div>
                          GitHub
                        </label>
                        <input
                          type="url"
                          value={profile.github}
                          onChange={(e) => setProfile(prev => ({ ...prev, github: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="https://github.com/yourusername"
                          className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 ${
                            isEditing 
                              ? 'border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white text-gray-900' 
                              : 'border-gray-200 bg-gray-100 text-gray-700'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <div className="w-4 h-4 bg-purple-600 rounded"></div>
                          Portfolio
                        </label>
                        <input
                          type="url"
                          value={profile.portfolio}
                          onChange={(e) => setProfile(prev => ({ ...prev, portfolio: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="https://yourportfolio.com"
                          className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 ${
                            isEditing 
                              ? 'border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white text-gray-900' 
                              : 'border-gray-200 bg-gray-100 text-gray-700'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={handleProfileSave}
                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Save className="w-5 h-5" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-8 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:p-8">
                <div className="mb-8">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
                  <p className="text-sm lg:text-base text-gray-600">Choose how you want to be notified about updates and activities</p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg">Email Notifications</h3>
                        <p className="text-gray-700 text-sm lg:text-base font-medium">Receive notifications via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.emailNotifications}
                        onChange={() => handleNotificationChange('emailNotifications')}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 shadow-lg"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg">Push Notifications</h3>
                        <p className="text-gray-700 text-sm lg:text-base font-medium">Receive push notifications on your device</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.pushNotifications}
                        onChange={() => handleNotificationChange('pushNotifications')}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-green-600 shadow-lg"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg">Job Alerts</h3>
                        <p className="text-gray-700 text-sm lg:text-base font-medium">Get notified about new job postings</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.jobAlerts}
                        onChange={() => handleNotificationChange('jobAlerts')}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-purple-600 shadow-lg"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg">Event Reminders</h3>
                        <p className="text-gray-700 text-sm lg:text-base font-medium">Receive reminders for upcoming events</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.eventReminders}
                        onChange={() => handleNotificationChange('eventReminders')}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-orange-600 shadow-lg"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-teal-500 rounded-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg">Mentorship Updates</h3>
                        <p className="text-gray-700 text-sm lg:text-base font-medium">Get updates on mentorship requests and messages</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.mentorshipUpdates}
                        onChange={() => handleNotificationChange('mentorshipUpdates')}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-teal-500 peer-checked:to-teal-600 shadow-lg"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-rose-500 rounded-lg">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg">Weekly Digest</h3>
                        <p className="text-gray-700 text-sm lg:text-base font-medium">Receive a weekly summary of activities</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.weeklyDigest}
                        onChange={() => handleNotificationChange('weeklyDigest')}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-rose-500 peer-checked:to-rose-600 shadow-lg"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:p-8">
                <div className="mb-8">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Privacy Settings</h2>
                  <p className="text-sm lg:text-base text-gray-600">Control who can see your information and how you interact with others</p>
                </div>
                
                <div className="space-y-8">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      Profile Visibility
                    </h3>
                    <p className="text-gray-700 text-sm lg:text-base font-medium mb-6">Who can see your profile information</p>
                    <div className="space-y-4">
                      <label className="flex items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-200">
                        <input
                          type="radio"
                          name="visibility"
                          value="public"
                          checked={privacy.profileVisibility === 'public'}
                          onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="ml-4">
                          <span className="text-base font-semibold text-gray-900">Public</span>
                          <p className="text-sm text-gray-600">Anyone can see your profile</p>
                        </div>
                      </label>
                      <label className="flex items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-200">
                        <input
                          type="radio"
                          name="visibility"
                          value="alumni-only"
                          checked={privacy.profileVisibility === 'alumni-only'}
                          onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="ml-4">
                          <span className="text-base font-semibold text-gray-900">Alumni Only</span>
                          <p className="text-sm text-gray-600">Only registered alumni can see your profile</p>
                        </div>
                      </label>
                      <label className="flex items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-200">
                        <input
                          type="radio"
                          name="visibility"
                          value="private"
                          checked={privacy.profileVisibility === 'private'}
                          onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="ml-4">
                          <span className="text-base font-semibold text-gray-900">Private</span>
                          <p className="text-sm text-gray-600">Only you can see your profile</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Show Email Address</h3>
                      <p className="text-gray-600 text-sm">Allow others to see your email address</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.showEmail}
                        onChange={() => handlePrivacyChange('showEmail', !privacy.showEmail)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Show Phone Number</h3>
                      <p className="text-gray-600 text-sm">Allow others to see your phone number</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.showPhone}
                        onChange={() => handlePrivacyChange('showPhone', !privacy.showPhone)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Allow Direct Messages</h3>
                      <p className="text-gray-600 text-sm">Allow other users to send you messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.allowMessages}
                        onChange={() => handlePrivacyChange('allowMessages', !privacy.allowMessages)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Allow Mentorship Requests</h3>
                      <p className="text-gray-600 text-sm">Allow alumni to send you mentorship requests</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.allowMentorshipRequests}
                        onChange={() => handlePrivacyChange('allowMentorshipRequests', !privacy.allowMentorshipRequests)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:p-8">
                <div className="mb-8">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
                  <p className="text-sm lg:text-base text-gray-600">Manage your account security and authentication options</p>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500 rounded-xl">
                        <Key className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">Change Password</h3>
                        <p className="text-gray-700 text-sm lg:text-base font-medium mb-4">Update your password to keep your account secure</p>
                        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                          <Key className="w-4 h-4" />
                          Change Password
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-2 border-green-200 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-500 rounded-xl">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">Two-Factor Authentication</h3>
                        <p className="text-gray-700 text-sm lg:text-base font-medium mb-4">Add an extra layer of security to your account</p>
                        <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                          <Shield className="w-4 h-4" />
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-2 border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-500 rounded-xl">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">Active Sessions</h3>
                        <p className="text-gray-700 text-sm lg:text-base font-medium mb-4">Manage your active login sessions across all devices</p>
                        <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                          <Eye className="w-4 h-4" />
                          View Sessions
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-2 border-red-300 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-500 rounded-xl">
                        <LogOut className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-red-900 mb-2 text-lg">Delete Account</h3>
                        <p className="text-red-800 text-sm lg:text-base font-medium mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                        <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                          <LogOut className="w-4 h-4" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentNavigation>
  );
}