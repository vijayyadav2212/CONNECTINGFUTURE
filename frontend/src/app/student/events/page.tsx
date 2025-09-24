"use client";

import React, { useState } from 'react';
import StudentNavigation from '../StudentNavigation';
import { Calendar, MapPin, Clock, Users, Search, Filter, Plus, ExternalLink, Share2, BookmarkPlus } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'workshop' | 'seminar' | 'networking' | 'career-fair' | 'hackathon' | 'webinar';
  date: string;
  time: string;
  duration: string;
  location: string;
  isVirtual: boolean;
  organizer: string;
  maxAttendees?: number;
  currentAttendees: number;
  price: number;
  image: string;
  tags: string[];
  isRegistered: boolean;
  isSaved: boolean;
}

export default function Events() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [virtualOnly, setVirtualOnly] = useState(false);

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'workshop', label: 'Workshops' },
    { value: 'seminar', label: 'Seminars' },
    { value: 'networking', label: 'Networking' },
    { value: 'career-fair', label: 'Career Fairs' },
    { value: 'hackathon', label: 'Hackathons' },
    { value: 'webinar', label: 'Webinars' }
  ];

  const timeFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  const events: Event[] = [
    {
      id: '1',
      title: 'Full Stack Development Workshop',
      description: 'Learn modern web development with React, Node.js, and MongoDB. Build a complete application from scratch with hands-on coding experience.',
      type: 'workshop',
      date: '2024-02-15',
      time: '10:00 AM',
      duration: '4 hours',
      location: 'Tech Hub, Building A',
      isVirtual: false,
      organizer: 'TechEd Institute',
      maxAttendees: 30,
      currentAttendees: 18,
      price: 0,
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80',
      tags: ['React', 'Node.js', 'MongoDB', 'Web Development'],
      isRegistered: true,
      isSaved: false
    },
    {
      id: '2',
      title: 'AI/ML Career Panel Discussion',
      description: 'Join industry experts from Google, Microsoft, and startups to discuss career paths in AI and Machine Learning. Get insider insights and networking opportunities.',
      type: 'seminar',
      date: '2024-02-18',
      time: '2:00 PM',
      duration: '2 hours',
      location: 'Virtual Event',
      isVirtual: true,
      organizer: 'AI Professional Network',
      currentAttendees: 156,
      price: 0,
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      tags: ['AI', 'Machine Learning', 'Career', 'Panel'],
      isRegistered: false,
      isSaved: true
    },
    {
      id: '3',
      title: 'Spring Tech Career Fair',
      description: 'Meet with 50+ companies including Fortune 500 tech giants and innovative startups. Bring your resumes and network with recruiters!',
      type: 'career-fair',
      date: '2024-02-22',
      time: '9:00 AM',
      duration: '6 hours',
      location: 'University Convention Center',
      isVirtual: false,
      organizer: 'University Career Services',
      currentAttendees: 245,
      price: 0,
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      tags: ['Hiring', 'Networking', 'Tech Companies', 'Jobs'],
      isRegistered: true,
      isSaved: true
    },
    {
      id: '4',
      title: 'Mobile App Development Hackathon',
      description: '48-hour hackathon to build innovative mobile applications. Prizes worth $10,000 and internship opportunities awaiting winners.',
      type: 'hackathon',
      date: '2024-03-01',
      time: '6:00 PM',
      duration: '48 hours',
      location: 'Innovation Lab, Campus',
      isVirtual: false,
      organizer: 'Student Developer Club',
      maxAttendees: 100,
      currentAttendees: 67,
      price: 25,
      image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80',
      tags: ['Mobile', 'Hackathon', 'Competition', 'Prizes'],
      isRegistered: false,
      isSaved: false
    },
    {
      id: '5',
      title: 'UX Design Principles Webinar',
      description: 'Learn fundamental UX design principles and best practices from Adobe Design team leaders. Interactive session with Q&A.',
      type: 'webinar',
      date: '2024-02-20',
      time: '7:00 PM',
      duration: '1.5 hours',
      location: 'Virtual Event',
      isVirtual: true,
      organizer: 'Adobe Design Community',
      currentAttendees: 89,
      price: 0,
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1464&q=80',
      tags: ['UX Design', 'Adobe', 'Design Principles'],
      isRegistered: false,
      isSaved: false
    },
    {
      id: '6',
      title: 'Alumni Networking Mixer',
      description: 'Connect with recent graduates working at top tech companies. Great opportunity for mentorship, career advice, and professional connections.',
      type: 'networking',
      date: '2024-02-25',
      time: '5:30 PM',
      duration: '3 hours',
      location: 'Alumni Center',
      isVirtual: false,
      organizer: 'Alumni Association',
      maxAttendees: 80,
      currentAttendees: 34,
      price: 15,
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80',
      tags: ['Alumni', 'Networking', 'Mentorship', 'Tech'],
      isRegistered: false,
      isSaved: true
    }
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || event.type === selectedType;
    const matchesVirtual = !virtualOnly || event.isVirtual;
    
    // Time filtering logic would go here
    const matchesTime = selectedTime === 'all'; // Simplified for now
    
    return matchesSearch && matchesType && matchesVirtual && matchesTime;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'workshop': return 'bg-blue-100 text-blue-600';
      case 'seminar': return 'bg-green-100 text-green-600';
      case 'networking': return 'bg-purple-100 text-purple-600';
      case 'career-fair': return 'bg-orange-100 text-orange-600';
      case 'hackathon': return 'bg-red-100 text-red-600';
      case 'webinar': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past event';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const upcomingEvents = events.filter(event => new Date(event.date) >= new Date()).slice(0, 3);

  return (
    <StudentNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Discover Events
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join workshops, seminars, and networking opportunities to enhance your skills and expand your professional network
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Events</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-1">{events.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Registered</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-1">{events.filter(e => e.isRegistered).length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Saved Events</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-1">{events.filter(e => e.isSaved).length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg shadow-lg">
                  <BookmarkPlus className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Virtual Events</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mt-1">{events.filter(e => e.isVirtual).length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg shadow-lg">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events Highlight */}
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl p-6 mb-8 border border-white/20 backdrop-blur-sm">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              🚀 Upcoming Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <div key={event.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/30 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(event.type)} shadow-sm`}>
                      {event.type.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs font-medium bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {getDaysUntil(event.date)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg leading-tight">{event.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    {formatDate(event.date)} at {event.time}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                    {event.location}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-blue-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search events by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                />
              </div>
              <div className="flex gap-4">
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium min-w-[140px]"
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value} className="text-gray-900 bg-white">
                      {type.label}
                    </option>
                  ))}
                </select>
                <select 
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium min-w-[120px]"
                >
                  {timeFilters.map(filter => (
                    <option key={filter.value} value={filter.value} className="text-gray-900 bg-white">
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="virtual-only"
                checked={virtualOnly}
                onChange={(e) => setVirtualOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="virtual-only" className="text-sm text-gray-800 font-medium">
                🌐 Virtual events only
              </label>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredEvents.map(event => (
              <div key={event.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl hover:transform hover:scale-105 transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.title}
                    className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  <div className="absolute top-4 right-4">
                    {event.isVirtual && (
                      <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-semibold shadow-lg">
                        🌐 Virtual
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(event.type)} shadow-sm`}>
                      {event.type.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {getDaysUntil(event.date)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{event.title}</h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">{event.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                      <span className="font-medium">{formatDate(event.date)} at {event.time}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-3 text-green-500" />
                      <span className="font-medium">Duration: {event.duration}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-3 text-purple-500" />
                      <span className="font-medium">{event.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-3 text-indigo-500" />
                      <span className="font-medium">{event.currentAttendees} {event.maxAttendees ? `/ ${event.maxAttendees}` : ''} attendees</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {event.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs rounded-full font-medium border border-gray-200">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {event.price === 0 ? 'FREE' : `$${event.price}`}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">by {event.organizer}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className={`p-2 rounded-xl transition-all duration-200 shadow-sm ${
                          event.isSaved 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-110' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-110'
                        }`}
                      >
                        <BookmarkPlus className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-110 shadow-sm">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button 
                        className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg ${
                          event.isRegistered
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'
                        }`}
                        disabled={event.isRegistered}
                      >
                        {event.isRegistered ? '✓ Registered' : 'Register Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/20 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent mb-3">No events found</h3>
              <p className="text-gray-600 text-lg">Try adjusting your search criteria or filters to discover more events</p>
            </div>
          )}
        </div>
      </div>
    </StudentNavigation>
  );
}