"use client";

import React, { useState } from 'react';
import StudentNavigation from '../StudentNavigation';
import { Search, Filter, Plus, MessageCircle, Calendar, Star, MapPin, Clock, Users, Briefcase, GraduationCap, Check, X } from 'lucide-react';

interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  expertise: string[];
  experience: string;
  rating: number;
  location: string;
  avatar: string;
  bio: string;
  available: boolean;
  responseTime: string;
  totalMentees: number;
}

interface MentorshipRequest {
  id: string;
  mentorId: string;
  mentorName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  requestDate: string;
  topic: string;
  description: string;
  sessionType: 'one-time' | 'ongoing';
}

export default function MentorshipRequests() {
  const [activeTab, setActiveTab] = useState<'find' | 'requests'>('find');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('all');

  const expertiseAreas = [
    { value: 'all', label: 'All Areas' },
    { value: 'software-engineering', label: 'Software Engineering' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'product-management', label: 'Product Management' },
    { value: 'design', label: 'Design' },
    { value: 'entrepreneurship', label: 'Entrepreneurship' },
    { value: 'career-guidance', label: 'Career Guidance' }
  ];

  const mentors: Mentor[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      title: 'Senior Software Engineer',
      company: 'Google',
      expertise: ['software-engineering', 'career-guidance'],
      experience: '8 years',
      rating: 4.9,
      location: 'San Francisco, CA',
      avatar: '/placeholder-user.jpg',
      bio: 'Passionate about helping students transition into tech careers. Specializing in full-stack development and system design.',
      available: true,
      responseTime: '< 2 hours',
      totalMentees: 25
    },
    {
      id: '2',
      name: 'David Rodriguez',
      title: 'Data Science Manager',
      company: 'Microsoft',
      expertise: ['data-science', 'career-guidance'],
      experience: '10 years',
      rating: 4.8,
      location: 'Seattle, WA',
      avatar: '/placeholder-user.jpg',
      bio: 'Leading data science teams and helping students master machine learning concepts and career development.',
      available: true,
      responseTime: '< 4 hours',
      totalMentees: 18
    },
    {
      id: '3',
      name: 'Emily Johnson',
      title: 'Product Manager',
      company: 'Meta',
      expertise: ['product-management', 'entrepreneurship'],
      experience: '6 years',
      rating: 4.7,
      location: 'Menlo Park, CA',
      avatar: '/placeholder-user.jpg',
      bio: 'Product strategy expert with experience in consumer products. Happy to guide students in product thinking.',
      available: false,
      responseTime: '< 1 day',
      totalMentees: 12
    },
    {
      id: '4',
      name: 'Alex Kumar',
      title: 'UX Design Lead',
      company: 'Adobe',
      expertise: ['design', 'career-guidance'],
      experience: '7 years',
      rating: 4.8,
      location: 'San Jose, CA',
      avatar: '/placeholder-user.jpg',
      bio: 'Design systems expert passionate about creating inclusive user experiences and mentoring upcoming designers.',
      available: true,
      responseTime: '< 3 hours',
      totalMentees: 20
    }
  ];

  const mentorshipRequests: MentorshipRequest[] = [
    {
      id: '1',
      mentorId: '1',
      mentorName: 'Sarah Chen',
      status: 'accepted',
      requestDate: '2024-01-15',
      topic: 'Career Transition to Tech',
      description: 'Looking for guidance on transitioning from academia to software engineering role',
      sessionType: 'ongoing'
    },
    {
      id: '2',
      mentorId: '2',
      mentorName: 'David Rodriguez',
      status: 'pending',
      requestDate: '2024-01-18',
      topic: 'Machine Learning Project Review',
      description: 'Need feedback on my capstone ML project and career advice',
      sessionType: 'one-time'
    },
    {
      id: '3',
      mentorId: '4',
      mentorName: 'Alex Kumar',
      status: 'rejected',
      requestDate: '2024-01-10',
      topic: 'UX Portfolio Review',
      description: 'Would like feedback on my UX design portfolio',
      sessionType: 'one-time'
    }
  ];

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExpertise = selectedExpertise === 'all' || mentor.expertise.includes(selectedExpertise);
    
    return matchesSearch && matchesExpertise;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-600';
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'rejected': return 'bg-red-100 text-red-600';
      case 'completed': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <Check className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      case 'completed': return <Check className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <StudentNavigation>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentorship</h1>
          <p className="text-gray-600">Connect with industry professionals for guidance and career advice</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('find')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'find'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Find Mentors
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Requests ({mentorshipRequests.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'find' && (
          <>
            {/* Search and Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search mentors by name, title, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select 
                  value={selectedExpertise}
                  onChange={(e) => setSelectedExpertise(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {expertiseAreas.map(area => (
                    <option key={area.value} value={area.value}>
                      {area.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mentors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMentors.map(mentor => (
                <div key={mentor.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <img 
                      src={mentor.avatar} 
                      alt={mentor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{mentor.name}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-700">{mentor.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">{mentor.title}</p>
                      <p className="text-blue-600 text-sm font-medium">{mentor.company}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{mentor.bio}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.expertise.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {skill.replace('-', ' ')}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {mentor.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {mentor.responseTime}
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {mentor.experience}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {mentor.totalMentees} mentees
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                        mentor.available 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!mentor.available}
                    >
                      {mentor.available ? 'Request Mentorship' : 'Unavailable'}
                    </button>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredMentors.length === 0 && (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">My Mentorship Requests</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Request
                </button>
              </div>
            </div>

            <div className="p-6">
              {mentorshipRequests.length > 0 ? (
                <div className="space-y-4">
                  {mentorshipRequests.map(request => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900">{request.topic}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                              {request.status}
                            </span>
                          </div>
                          <p className="text-blue-600 font-medium mb-1">Mentor: {request.mentorName}</p>
                          <p className="text-gray-600 text-sm">Requested on {new Date(request.requestDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {request.sessionType.replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{request.description}</p>

                      <div className="flex items-center gap-3">
                        {request.status === 'accepted' && (
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Schedule Session
                          </button>
                        )}
                        {request.status === 'pending' && (
                          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                            Cancel Request
                          </button>
                        )}
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Message Mentor
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No mentorship requests yet</h3>
                  <p className="text-gray-600 mb-6">Start by requesting mentorship from experienced professionals</p>
                  <button 
                    onClick={() => setActiveTab('find')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Find Mentors
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StudentNavigation>
  );
}