"use client";

import React, { useState } from 'react';
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
  Save
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    fullName: 'Ved Prakash',
    email: 'ved.prakash@example.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    bio: 'Software Engineer passionate about building scalable web applications and community building.',
    website: 'https://vedprakash.dev'
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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
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
                  <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
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
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center shadow-lg shadow-blue-200 transition-all active:scale-95">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8 mb-10">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full bg-slate-200 relative overflow-hidden ring-4 ring-white shadow-lg mb-4 group cursor-pointer">
                        <img
                          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <button className="text-blue-600 text-sm font-semibold hover:underline">Change Photo</button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                        <input
                          name="fullName"
                          value={profileData.fullName}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 text-slate-500"
                          disabled
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                        <input
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                        <input
                          name="location"
                          value={profileData.location}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                        <textarea
                          name="bio"
                          rows={3}
                          value={profileData.bio}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        />
                        <p className="text-xs text-slate-500 mt-2 text-right">250 characters max</p>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Website / Portfolio</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                          <input
                            name="website"
                            value={profileData.website}
                            onChange={handleProfileChange}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
