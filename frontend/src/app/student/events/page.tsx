"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { toast } from 'sonner';

import { Calendar, MapPin, Clock, Users, Search, Filter, Plus, ExternalLink, Share2, BookmarkPlus, Sparkles, GraduationCap } from 'lucide-react';
import Image from 'next/image';

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
  return (
    <>
      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <EventsContent />
    </>
  );
}

function EventsContent() {
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

  const getPreviewUrl = (url?: string | null, fileName?: string) => {
    if (!url) return '';
    return `/api/files/preview?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fileName || 'event-image.jpg')}`;
  };

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
      case 'workshop': return 'bg-teal-100 text-teal-600';
      case 'seminar': return 'bg-green-100 text-green-600';
      case 'networking': return 'bg-teal-100 text-teal-600';
      case 'career-fair': return 'bg-orange-100 text-orange-600';
      case 'hackathon': return 'bg-red-100 text-red-600';
      case 'webinar': return 'bg-teal-100 text-teal-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeAccent = (type: string) => {
    switch (type) {
      case 'workshop': return 'from-teal-500/20 via-teal-500/8 to-transparent';
      case 'seminar': return 'from-emerald-500/20 via-emerald-500/8 to-transparent';
      case 'networking': return 'from-teal-500/20 via-teal-500/8 to-transparent';
      case 'career-fair': return 'from-orange-500/20 via-orange-500/8 to-transparent';
      case 'hackathon': return 'from-rose-500/20 via-rose-500/8 to-transparent';
      case 'webinar': return 'from-teal-500/20 via-teal-500/8 to-transparent';
      default: return 'from-slate-500/20 via-slate-500/8 to-transparent';
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
    <>
      <div className="min-h-screen bg-[#f6f3eb] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-[32px] border border-teal-900/10 bg-teal-950 p-8 lg:p-10 shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-[12px] uppercase tracking-[0.1em] mb-4">
                    <GraduationCap className="w-4 h-4" />
                    <span>Campus Events</span>
                  </div>
                  <h1 className="text-4xl lg:text-[48px] font-black text-white mb-3 tracking-[-0.02em]">
                    Discover events that fit your next step.
                  </h1>
                  <p className="max-w-2xl text-[16px] text-gray-400 font-medium leading-relaxed mb-6">
                    Browse workshops, seminars, career fairs, and networking sessions in a clean, focused layout built around the theme colors already used in the app.
                  </p>
                  <div className="flex flex-wrap gap-4 text-[13px] font-bold text-gray-400">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-[14px] border border-white/10">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>{events.length} Events</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-[14px] border border-white/10">
                      <div className="w-2 h-2 bg-teal-500 rounded-full" />
                      <span>{events.filter(e => e.isRegistered).length} Registered</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-[14px] border border-white/10">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span>{events.filter(e => e.isSaved).length} Saved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events Highlight */}
          <div className="mb-8 rounded-[32px] border border-gray-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] lg:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-3 text-2xl font-extrabold text-teal-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-teal-950">
                🚀
                </div>
                Upcoming Events
              </h2>
              <span className="hidden text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em] sm:inline-flex">
                Top picks this week
              </span>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {upcomingEvents.map(event => (
                <div key={event.id} className="group cursor-pointer rounded-[28px] border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getTypeColor(event.eventType ?? '')} shadow-sm`}>
                      {(event.eventType ?? '').replace('-', ' ')}
                    </span>
                    <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">
                      {getDaysUntil(event.date ?? '')}
                    </span>
                  </div>
                  <h3 className="mb-3 text-[17px] font-extrabold leading-tight text-slate-950 transition-colors group-hover:text-emerald-700">{event.title}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs font-bold text-slate-800">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-teal-950" />
                      {formatDate(event.date ?? '')} <span className="mx-2 text-slate-300">•</span> {event.time}
                    </div>
                    <div className="flex items-center text-xs font-bold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-teal-500" />
                      {event.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 rounded-[32px] border border-gray-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] lg:p-8">
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="flex-1 relative group">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-teal-950 transition-colors" />
                <input
                  type="text"
                  placeholder="Search events by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-[20px] bg-[#f6f3eb]/60 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 font-medium text-slate-900 placeholder-slate-400 transition-all duration-200 shadow-sm"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-6 py-4 border border-slate-200 rounded-[20px] bg-[#f6f3eb]/60 focus:bg-white focus:outline-none focus:border-emerald-500/30 font-bold text-slate-700 min-w-[180px] appearance-none cursor-pointer transition-all shadow-sm"
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="px-6 py-4 border border-slate-200 rounded-[20px] bg-[#f6f3eb]/60 focus:bg-white focus:outline-none focus:border-emerald-500/30 font-bold text-slate-700 min-w-[150px] appearance-none cursor-pointer transition-all shadow-sm"
                >
                  {timeFilters.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={virtualOnly}
                    onChange={(e) => setVirtualOnly(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${virtualOnly ? 'bg-[#f6f3eb]0' : 'bg-slate-200'}`} />
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${virtualOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em]">Virtual Only</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${autoRefresh ? 'bg-[#f6f3eb]0' : 'bg-slate-200'}`} />
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${autoRefresh ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em]">Auto-refresh (10s)</span>
              </label>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {filteredEvents.map(event => (
              <div key={event.id} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)]">
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${getTypeAccent(event.eventType ?? '')}`} />
                <div className="relative aspect-video overflow-hidden bg-[#f6f3eb]">
                  <a
                    href={getPreviewUrl(event.image_url || event.image || '', `${event.title || 'event'}.jpg`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 block"
                  >
                    <Image
                      src={event.image_url || event.image || "https://images.unsplash.com/photo-1540575861501-7ad0582371f3?q=80&w=2070&auto=format&fit=crop"}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                      unoptimized={true} // Using unoptimized as backend domains vary
                    />
                  </a>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/25 to-transparent opacity-85 transition-opacity group-hover:opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

                  <div className="absolute left-5 top-5 flex gap-2">
                    <span className={`rounded-full border border-white/20 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] shadow-sm backdrop-blur ${getTypeColor(event.eventType ?? '')}`}>
                      {(event.eventType ?? '').replace('-', ' ')}
                    </span>
                  </div>

                  <div className="absolute right-5 top-5 flex gap-2">
                    {event.isVirtual && (
                      <div className="px-4 py-2 bg-[#f3b13a]/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl border border-white/20">
                        🌐 Virtual
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-7 lg:p-8">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100/50">
                      {getDaysUntil(event.date ?? '')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                      {event.organizer || 'Campus Team'}
                    </span>
                  </div>

                  <h3 className="mb-4 text-2xl font-black tracking-tight text-slate-950 transition-colors group-hover:text-emerald-700 leading-tight">{event.title}</h3>
                  <p className="mb-8 text-[15px] font-semibold leading-relaxed text-slate-800 line-clamp-2">{event.description}</p>

                  <div className="mb-8 grid grid-cols-2 gap-3">
                    <div className="flex items-center rounded-2xl border border-slate-100 bg-[#f6f3eb]/70 p-3 text-xs font-bold text-slate-800 shadow-sm">
                      <Calendar className="w-4 h-4 mr-3 text-teal-950" />
                      <span>{formatDate(event.date ?? '')}</span>
                    </div>
                    <div className="flex items-center rounded-2xl border border-slate-100 bg-[#f6f3eb]/70 p-3 text-xs font-bold text-slate-800 shadow-sm">
                      <Clock className="w-4 h-4 mr-3 text-teal-500" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center rounded-2xl border border-slate-100 bg-[#f6f3eb]/70 p-3 text-xs font-bold text-slate-800 shadow-sm">
                      <MapPin className="w-4 h-4 mr-3 text-teal-500" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center rounded-2xl border border-slate-100 bg-[#f6f3eb]/70 p-3 text-xs font-bold text-slate-800 shadow-sm">
                      <Users className="w-4 h-4 mr-3 text-teal-500" />
                      <span>{event.currentAttendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''} joined</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {(event.tags ?? []).slice(0, 3).map(tag => (
                      <span key={tag} className="px-4 py-1.5 bg-[#f6f3eb] text-slate-700 text-[11px] rounded-full font-black uppercase tracking-widest border border-slate-200 hover:bg-white hover:text-teal-950 transition-all cursor-default">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-5 pt-7 border-t border-slate-100 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-col">
                      <span className="text-2xl font-black text-teal-950 tracking-tight leading-none">
                        {event.price === 0 ? 'FREE' : `$${event.price}`}
                      </span>
                      <span className="mt-1 max-w-[16rem] truncate text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        by {event.organizer}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <button
                        className={`p-3 rounded-2xl transition-all duration-300 shadow-sm border ${event.isSaved
                          ? 'bg-amber-500 text-white border-amber-600 hover:scale-110'
                          : 'bg-[#f6f3eb] text-slate-600 border-slate-200 hover:bg-white hover:text-teal-950 hover:scale-110'
                          }`}
                      >
                        <BookmarkPlus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleShare(event)}
                        className="p-3 bg-[#f6f3eb] text-slate-600 border border-slate-200 rounded-2xl hover:bg-white hover:text-teal-950 hover:scale-110 transition-all duration-300 shrink-0"
                        title="Share Event"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button
                        className={`px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95 shrink-0 whitespace-nowrap ${event.isRegistered
                          ? 'bg-[#f6f3eb] text-teal-950 border border-teal-900/10 cursor-not-allowed shadow-none'
                          : registeringEventId === event.id
                            ? 'bg-slate-200 text-slate-400 cursor-wait'
                            : 'bg-[#f3b13a] hover:bg-[#d89c30] text-white shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5'
                          }`}
                        disabled={event.isRegistered || registeringEventId === event.id}
                        onClickCapture={(ev) => {
                          if (event.isRegistered || registeringEventId === event.id) return;
                          handleRegister(event.id, event.title);
                        }}
                      >
                        {registeringEventId === event.id ? 'Registering...' : event.isRegistered ? 'Registered' : 'Register Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="bg-white rounded-[40px] p-20 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 text-center">
              <div className="bg-[#f6f3eb] w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                <Calendar className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">No Events Found</h3>
              <p className="text-slate-600 font-semibold text-lg max-w-md mx-auto">Try adjusting your search criteria or filters to discover more events</p>
            </div>
          )}
        </div>
      </div>

      {/* Loading Modal */}
      {isRegistering && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-300 rounded-[32px] border border-slate-100 bg-white p-10 text-center shadow-2xl">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-[#f6f3eb]">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-900 uppercase">Processing...</h3>
            <p className="text-slate-500 font-medium px-4">
              Please wait while we secure your spot for this event.
            </p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-300 rounded-[32px] border border-slate-100 bg-white p-10 text-center shadow-2xl">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-[#f6f3eb]0 shadow-xl shadow-emerald-500/20 animate-bounce">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 uppercase">Registration Confirmed!</h2>
            <p className="mb-10 px-4 text-lg font-medium leading-relaxed text-slate-600">
              Awesome! You've successfully registered for <span className="font-extrabold text-teal-950">"{successEventTitle}"</span>.
              Check your inbox for the confirmation details.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-5 px-8 bg-[#f3b13a] hover:bg-[#d89c30] text-white font-black rounded-[24px] transition-all shadow-xl shadow-emerald-500/20 active:scale-95 uppercase tracking-widest text-sm"
            >
              Okay, Let's Go!
            </button>
          </div>
        </div>
      )}
    </>
  );
}