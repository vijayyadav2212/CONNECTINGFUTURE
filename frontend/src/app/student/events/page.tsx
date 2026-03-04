"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { toast } from 'sonner';
import StudentNavigation from '../StudentNavigation';
import { Calendar, MapPin, Clock, Users, Search, Filter, Plus, ExternalLink, Share2, BookmarkPlus } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

interface Event {
  id: string;
  title: string;
  description: string;
  eventType?: string;
  date?: string;
  time?: string;
  duration?: string;
  location?: string;
  isVirtual?: boolean;
  organizer?: string;
  maxAttendees?: number;
  currentAttendees?: number;
  price?: number;
  image?: string;
  image_url?: string;
  tags?: string[];
  isRegistered?: boolean;
  isSaved?: boolean;
}

export default function Events() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [virtualOnly, setVirtualOnly] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successEventTitle, setSuccessEventTitle] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [lastRegisterLog, setLastRegisterLog] = useState<string | null>(null);
  const { user } = useUser();

  const handleRegister = async (eventId: string, eventTitle: string) => {
    if (!user) {
      console.log('handleRegister: no user', user);
      setLastRegisterLog(`no-user:${eventId}@${new Date().toISOString()}`);
      toast.error("Please log in to register — redirecting to login...");
      // Redirect to Auth0 login route and return to the current page afterwards
      try {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/api/auth/login?returnTo=${returnTo}`;
      } catch (e) {
        console.error('Redirect to login failed', e);
      }
      return;
    }

    // Show loading on button only
    setRegisteringEventId(eventId);
    const now = new Date().toISOString();
    setLastRegisterLog(`attempt:${eventId}@${now}`);
    console.log('handleRegister called', { eventId, userEmail: user.email, time: now });

    try {
      const url = `${API_BASE}/api/events/${encodeURIComponent(eventId)}/register`;
      console.log('POST ->', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_email: user.email,
          user_name: user.name || user.nickname || 'Student'
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // First: Update button to "Registered" state
        setRegisteringEventId(null);
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isRegistered: true, currentAttendees: (e.currentAttendees || 0) + 1 } : e));

        // Second: Show loading animation in center
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to see button change
        setIsRegistering(true);
        setSuccessEventTitle(eventTitle);

        // Third: Wait for buffer duration
        await new Promise(resolve => setTimeout(resolve, 800));

        // Fourth: Hide loading and show success modal
        setIsRegistering(false);
        setShowSuccessModal(true);
        setLastRegisterLog(`success:${eventId}@${new Date().toISOString()}`);
        console.log('Registration success', { eventId });
      } else {
        setRegisteringEventId(null);
        const errMsg = (data && data.error) ? data.error : `Registration failed (${res.status})`;
        setLastRegisterLog(`fail:${eventId}@${new Date().toISOString()} ${errMsg}`);
        console.warn('Registration failed', errMsg, data);
        toast.error(errMsg);
      }
    } catch (err) {
      console.error("Registration error", err);
      setRegisteringEventId(null);
      setLastRegisterLog(`error:${eventId}@${new Date().toISOString()}`);
      toast.error("Unable to reach server. Please try again later.");
    }
  };

  const handleShare = async (event: Event) => {
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}\nDate: ${event.date}\nLocation: ${event.location}`,
      url: window.location.href // Or deep link to specific event if routing existed
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success("Event details copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      // Don't show error if user canceled share
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error("Failed to share");
      }
    }
  };

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

  const [events, setEvents] = useState<Event[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const url = user?.email
          ? `${API_BASE}/api/events?user_email=${encodeURIComponent(user.email)}`
          : `${API_BASE}/api/events`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          console.log('student fetched events raw:', data);
          // Map backend fields to frontend expected fields
          const mapped = data.map((e: any) => ({
            id: e.id?.toString() ?? '',
            title: e.title,
            description: e.description,
            eventType: e.event_type,
            type: e.event_type, // for filters
            date: e.event_date,
            time: e.event_time || '',
            duration: e.duration || '',
            location: e.location,
            isVirtual: e.is_virtual,
            organizer: e.organizer || '',
            maxAttendees: e.max_attendees || undefined,
            currentAttendees: e.current_attendees || 0,
            price: e.price || 0,
            image: e.image_url || e.image || '',
            image_url: e.image_url || '',
            tags: e.tags ? (Array.isArray(e.tags) ? e.tags : String(e.tags).split(',')) : [],
            isRegistered: e.isRegistered || false,
            isSaved: false,
          }));
          setEvents(mapped);
        }
      } catch (err) {
        // handle error
      }
    };

    fetchEvents();

    // Auto-refresh every 10 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchEvents, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, user]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(event.tags) ? event.tags : []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || event.eventType === selectedType;
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

  const upcomingEvents = events
    .filter(event => event.date && new Date(event.date) >= new Date())
    .slice(0, 3);

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
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(event.eventType ?? '')} shadow-sm`}>
                      {(event.eventType ?? '').replace('-', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {getDaysUntil(event.date ?? '')}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg leading-tight">{event.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    {formatDate(event.date ?? '')} at {event.time}
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
            <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="auto-refresh" className="text-sm text-gray-800 font-medium">
                  🔄 Auto-refresh (10s)
                </label>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredEvents.map(event => (
              <div key={event.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl hover:transform hover:scale-105 transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <img
                    src={event.image_url || event.image}
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
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(event.eventType ?? '')} shadow-sm`}>
                      {(event.eventType ?? '').replace('-', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {getDaysUntil(event.date ?? '')}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{event.title}</h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">{event.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                      <span className="font-medium">{formatDate(event.date ?? '')} at {event.time}</span>
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
                    {(event.tags ?? []).slice(0, 3).map(tag => (
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
                    <div className="flex items-center gap-3" onClickCapture={(ev) => {
                      try {
                        const clientX = (ev as any).clientX || 0;
                        const clientY = (ev as any).clientY || 0;
                        const el = document.elementFromPoint(clientX, clientY as any);
                        console.log('click capture', { target: ev.target, elemAtPoint: el, userAtClick: user });
                        const id = (ev.target as any)?.dataset?.eventId || (el as any)?.dataset?.eventId || '';
                        if (id) setLastRegisterLog(`clicked:${id}@${new Date().toISOString()}`);
                      } catch (e) { /* ignore */ }
                    }}>
                      <button
                        className={`p-2 rounded-xl transition-all duration-200 shadow-sm ${event.isSaved
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-110'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-110'
                          }`}
                      >
                        <BookmarkPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShare(event)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-110 shadow-sm"
                        title="Share Event"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        style={{ position: 'relative', zIndex: 60, pointerEvents: 'auto' }}
                        className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg flex items-center gap-2 ${event.isRegistered
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-not-allowed'
                          : registeringEventId === event.id
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white cursor-wait'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'
                          }`}
                        disabled={event.isRegistered || registeringEventId === event.id}
                        data-event-id={event.id}
                        onPointerDown={() => console.log('pointerdown', event.id)}
                        onMouseDown={() => console.log('mousedown', event.id)}
                        onClickCapture={(ev) => {
                          console.log('button click capture', event.id);
                          // Guard to avoid double-submitting
                          if (event.isRegistered || registeringEventId === event.id) return;
                          try { handleRegister(event.id, event.title); } catch (e) { console.error(e); }
                        }}
                        onClick={() => !event.isRegistered && handleRegister(event.id, event.title)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (!event.isRegistered) handleRegister(event.id, event.title);
                          }
                        }}
                      >
                        {registeringEventId === event.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Registering...
                          </>
                        ) : event.isRegistered ? '✓ Registered' : 'Register Now'}
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

      {/* Loading Modal */}
      {isRegistering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
              <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Registration...</h3>
            <p className="text-gray-600 text-base">
              Please wait while we register you for this event.
            </p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-bounce">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Registration Confirmed!</h3>
            <p className="text-gray-600 mb-6 text-lg">
              You are all set for <span className="font-semibold text-blue-600">{successEventTitle}</span>.
              <br /><br />
              A confirmation email has been sent to your inbox with all the details.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Okay, Great!
            </button>
          </div>
        </div>
      )}
    </StudentNavigation>
  );
}