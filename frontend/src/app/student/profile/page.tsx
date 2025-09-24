"use client";

import React, { useState } from 'react';
import StudentNavigation from '../StudentNavigation';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Book, Award, Edit3 } from 'lucide-react';
import Link from 'next/link';

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    studentId: 'ST2021001',
    email: 'john.doe@university.edu',
    phone: '+1 (555) 123-4567',
    course: 'Computer Science',
    year: '3rd Year',
    gpa: '3.8',
    location: 'New York, NY',
    about: 'Passionate computer science student with interests in machine learning and software development. Active in various coding competitions and open source projects.'
  });

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Saving profile data:', profileData);
  };

  return (
    <StudentNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Navigation Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link 
                  href="/student/dashboard"
                  className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 text-blue-600 hover:text-blue-800 hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-semibold">Back to Dashboard</span>
                </Link>
                <div className="w-px h-8 bg-gradient-to-b from-blue-300 to-purple-300"></div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  👤 My Profile
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                  >
                    <Edit3 className="w-5 h-5" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                    >
                      <Save className="w-5 h-5" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Summary Card */}
            <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="text-center p-8 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10">
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
                    {profileData.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{profileData.fullName}</h2>
                <p className="text-lg text-gray-600 mb-4">{profileData.course} - {profileData.year}</p>
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <span className="font-bold text-yellow-700">GPA: {profileData.gpa}</span>
                </div>
              </div>
              <div className="px-8 pb-8 space-y-5">
                <div className="flex items-center gap-4 p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">{profileData.email}</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">{profileData.phone}</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">{profileData.location}</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg">
                    <Book className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">ID: {profileData.studentId}</span>
                </div>
              </div>
            </div>

            {/* Profile Details Form */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="p-6 border-b border-white/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                  <User className="w-6 h-6 text-blue-500" />
                  Profile Information
                </h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm text-gray-900 font-medium transition-all duration-200"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 font-medium text-gray-800">
                        {profileData.fullName}
                      </div>
                    )}
                  </div>

                  {/* Student ID */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Student ID
                    </label>
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border border-gray-300 font-medium text-gray-600">
                      {profileData.studentId}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      Student ID cannot be changed
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm text-gray-900 font-medium transition-all duration-200"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 font-medium text-gray-800">
                        {profileData.email}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm text-gray-900 font-medium transition-all duration-200"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 font-medium text-gray-800">
                        {profileData.phone}
                      </div>
                    )}
                  </div>

                  {/* Course */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Course/Program
                    </label>
                    {isEditing ? (
                      <select
                        value={profileData.course}
                        onChange={(e) => handleInputChange('course', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm text-gray-900 font-medium transition-all duration-200"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="Business Administration">Business Administration</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 font-medium text-gray-800">
                        {profileData.course}
                      </div>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Academic Year
                    </label>
                    {isEditing ? (
                      <select
                        value={profileData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm text-gray-900 font-medium transition-all duration-200"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Graduate">Graduate</option>
                      </select>
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 font-medium text-gray-800">
                        {profileData.year}
                      </div>
                    )}
                  </div>

                  {/* GPA */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      GPA
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="4.0"
                        value={profileData.gpa}
                        onChange={(e) => handleInputChange('gpa', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm text-gray-900 font-medium transition-all duration-200"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 font-medium text-gray-800">
                        {profileData.gpa}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Location
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm text-gray-900 font-medium transition-all duration-200"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 font-medium text-gray-800">
                        {profileData.location}
                      </div>
                    )}
                  </div>
                </div>

                {/* About Section */}
                <div className="mt-8">
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    About Me
                  </label>
                  {isEditing ? (
                    <textarea
                      value={profileData.about}
                      onChange={(e) => handleInputChange('about', e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm text-gray-900 font-medium transition-all duration-200 resize-none"
                      placeholder="Tell us about yourself, your interests, goals, and achievements..."
                    />
                  ) : (
                    <div className="px-4 py-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 font-medium text-gray-800 leading-relaxed">
                      {profileData.about}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="p-6 border-b border-white/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🚀 Quick Actions
              </h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link 
                  href="/student/dashboard"
                  className="group flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-2xl border border-blue-200 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <ArrowLeft className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Dashboard</h3>
                    <p className="text-sm text-gray-600 font-medium">Return to main dashboard</p>
                  </div>
                </Link>
                
                <Link 
                  href="/student/messages"
                  className="group flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl border border-green-200 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Messages</h3>
                    <p className="text-sm text-gray-600 font-medium">View your messages</p>
                  </div>
                </Link>
                
                <Link 
                  href="/student/settings"
                  className="group flex items-center gap-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl border border-purple-200 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Account Settings</h3>
                    <p className="text-sm text-gray-600 font-medium">Manage your account</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentNavigation>
  );
}