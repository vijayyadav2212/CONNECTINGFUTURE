"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useUser } from '@auth0/nextjs-auth0/client';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import { Share2, Calendar, MapPin, Clock, Plus, Users, X, Sparkles } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

interface Event {
  id: number;
  title: string;
  date: string;
  raw_date: string;
  time: string;
  type: string;
  description: string;
  location: string;
  image?: string;
  image_url?: string;
  organizer?: string;
  is_virtual?: boolean;
}

export default function EventsPage() {
  const { user } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [mode, setMode] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPreviewUrl = (url?: string | null, fileName?: string) => {
    if (!url) return '';
    return `/api/files/preview?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fileName || 'event-image.jpg')}`;
  };

  React.useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/events`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((e: any) => ({
          id: e.id,
          title: e.title,
          date: e.event_date ? new Date(e.event_date).toLocaleDateString() : '',
          raw_date: e.event_date || new Date().toISOString(),
          time: e.event_time || '',
          type: e.event_type || 'Social',
          description: e.description,
          location: e.location,
          image_url: e.image_url && !e.image_url.startsWith('http') ? `${API_BASE.replace('/api', '')}${e.image_url.startsWith('/') ? '' : '/'}${e.image_url}` : e.image_url,
          organizer: e.organizer,
          is_virtual: !!e.is_virtual,
        }));
        setEvents(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  const handleShare = async (event: Event) => {
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}\nDate: ${event.date}\nLocation: ${event.location}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success('Event details copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      if (err instanceof Error && err.name !== 'AbortError') toast.error('Failed to share');
    }
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    let imageUrl = '';

    if (posterFile) {
      const imgData = new FormData();
      imgData.append('image', posterFile);
      try {
        const uploadRes = await fetch(`${API_BASE}/uploads/event-image`, { method: 'POST', body: imgData });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          imageUrl = uploadJson.url;
        } else {
          toast.error('Image upload failed');
        }
      } catch (err) {
        toast.error('Image upload network error');
      }
    }

    const eventData = {
      title: formData.get('title'),
      description: formData.get('description'),
      event_date: formData.get('date'),
      event_time: formData.get('time'),
      event_type: 'Social',
      is_virtual: mode === 'online',
      location: mode === 'online' ? (formData.get('meetLink') || 'Online') : (formData.get('venue') || 'TBD'),
      image_url: imageUrl,
      organizer: user?.name || user?.nickname || user?.email || 'Alumni',
      tags: '',
      duration: '1h',
    };

    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (res.ok) {
        setShowForm(false);
        setPosterPreview(null);
        setPosterFile(null);
        setMode('');
        setShowSuccessModal(true);
        fetchEvents();
      } else {
        const errData = await res.json();
        toast.error(`Failed: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error('Error creating event. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingEvents = events.filter(e => new Date(e.raw_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.raw_date) < new Date());

  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all";

  return (
    <AlumniNavigation>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#edf2ff] to-[#f5efff] rounded-[32px] px-8 py-10 md:px-12 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-[14px] bg-indigo-50/50 w-fit px-3 py-1.5 rounded-full border border-indigo-100/50">
              <Sparkles className="w-4 h-4" />
              <span>Events Hub</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1e293b] tracking-tight">Discover Events!</h1>
            <p className="text-slate-500 font-semibold text-[16px]">Your community is growing. Ready to connect and make an impact today?</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="relative z-10 flex items-center justify-center gap-2 p-5 bg-white text-indigo-500 hover:text-indigo-600 font-bold rounded-[20px] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:scale-105 border border-indigo-50"
            title="Create Event"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: 'Total Events', value: events.length, color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-white' },
            { label: 'Upcoming', value: upcomingEvents.length, color: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-white' },
            { label: 'Past Events', value: pastEvents.length, color: 'text-purple-600', bg: 'bg-purple-50', iconBg: 'bg-white' },
            { label: 'Online', value: events.filter(e => e.is_virtual).length, color: 'text-orange-600', bg: 'bg-orange-50', iconBg: 'bg-white' },
          ].map((s, i) => (
            <div key={i} className={`rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 flex flex-col gap-4 ${s.bg}`}>
              <div className={`w-12 h-12 rounded-2xl ${s.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                <Calendar className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Upcoming Events */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <h3 className="text-[20px] font-bold text-slate-800 tracking-tight">Upcoming Events</h3>
              <span className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-widest">{upcomingEvents.length} events</span>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-[24px] border border-slate-100">
                <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-lg font-bold text-slate-700">No upcoming events</p>
                <p className="text-sm text-slate-500 mt-2 font-medium">Be the first to create one!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event, idx) => {
                  const colors = [
                    { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                    { badge: 'bg-blue-50 text-blue-700 border-blue-100' },
                    { badge: 'bg-purple-50 text-purple-700 border-purple-100' },
                    { badge: 'bg-orange-50 text-orange-700 border-orange-100' },
                  ][idx % 4];

                  return (
                    <div key={event.id} className="rounded-[24px] border border-slate-100 bg-white hover:shadow-xl transition-all duration-300 p-6 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none z-10" />
                      {event.image_url && (
                        <div className="mb-5 rounded-[16px] overflow-hidden h-48 w-full shadow-inner">
                          <a href={getPreviewUrl(event.image_url, `${event.title || 'event'}.jpg`)} target="_blank" rel="noreferrer" className="block w-full h-full">
                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          </a>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h4 className="font-black text-slate-800 text-[17px] leading-snug">{event.title}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full border ${colors.badge}`}>{event.type}</span>
                          <button onClick={() => handleShare(event)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors" title="Share">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[14px] font-medium text-slate-500 line-clamp-2 mb-5 leading-relaxed">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-[12px] font-bold text-slate-400 pt-5 border-t border-slate-100">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-300" />{event.date}</span>
                        {event.time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-300" />{event.time}</span>}
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-300" />{event.location}</span>
                        {event.organizer && <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-300" />{event.organizer}</span>}
                        {event.is_virtual && event.location.startsWith('http') && (
                          <a href={event.location} target="_blank" rel="noreferrer" className="ml-auto px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[12px] font-black hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">Join →</a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Events */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[20px] font-bold text-slate-800 tracking-tight">Past Events</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{pastEvents.length + 2} events</span>
            </div>

            <div className="space-y-4">
              {/* Static past events as placeholders */}
              {[
                { title: 'Career Fair 2024', date: 'November 10, 2024', type: 'Career', color: 'bg-purple-50 text-purple-700 border-purple-200', desc: '120+ attendees, 15 companies, 30+ job offers', attended: true },
                { title: 'Homecoming Weekend', date: 'October 5–6, 2024', type: 'Social', color: 'bg-orange-50 text-orange-700 border-orange-200', desc: 'A weekend of nostalgia, campus tours, and reconnections', attended: false },
              ].map((e, i) => (
                <div key={i} className="rounded-[20px] border border-slate-100 bg-slate-50/50 p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="font-black text-slate-800 text-[15px]">{e.title}</h4>
                      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">{e.date}</p>
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${e.color} uppercase tracking-widest shrink-0`}>{e.type}</span>
                  </div>
                  <p className="text-[13px] font-medium text-slate-500 mb-5 leading-relaxed">{e.desc}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/50">
                    <button className="text-[12px] font-black text-slate-500 hover:text-slate-800 transition-colors">VIEW HIGHLIGHTS</button>
                    <span className={`text-[12px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${e.attended ? 'bg-emerald-100/50 text-emerald-600' : 'bg-slate-200/50 text-slate-500'}`}>
                      {e.attended ? 'Attended' : 'Missed'}
                    </span>
                  </div>
                </div>
              ))}

              {pastEvents.map((event, idx) => (
                <div key={event.id} className="rounded-[20px] border border-slate-100 bg-slate-50/50 p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="font-black text-slate-800 text-[15px]">{event.title}</h4>
                    <span className="text-[10px] font-black px-3 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200 uppercase tracking-widest shrink-0">{event.type}</span>
                  </div>
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{event.date}</p>
                  <p className="text-[13px] font-medium text-slate-500 line-clamp-2 leading-relaxed">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Event Categories */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 mb-10">
          <h3 className="text-[20px] font-bold text-slate-800 tracking-tight mb-8">Event Categories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { emoji: '🤝', label: 'Networking', color: 'bg-blue-50 text-blue-600 shadow-blue-500/10' },
              { emoji: '🎓', label: 'Educational', color: 'bg-purple-50 text-purple-600 shadow-purple-500/10' },
              { emoji: '🎉', label: 'Social', color: 'bg-emerald-50 text-emerald-600 shadow-emerald-500/10' },
              { emoji: '💼', label: 'Career', color: 'bg-orange-50 text-orange-600 shadow-orange-500/10' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} rounded-[24px] p-6 text-center cursor-pointer hover:-translate-y-2 transition-transform duration-300 shadow-lg border border-white`}>
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform">{item.emoji}</div>
                <p className="text-[14px] font-black uppercase tracking-widest">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Create Event</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Event Title *</label>
                <input name="title" type="text" placeholder="e.g. Annual Alumni Meetup" required className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Description *</label>
                <textarea name="description" placeholder="Describe the event..." rows={3} required className={`${inputCls} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Date *</label>
                  <input name="date" type="date" required className={inputCls} style={{ colorScheme: 'light' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Time *</label>
                  <input name="time" type="time" required className={inputCls} style={{ colorScheme: 'light' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mode *</label>
                <select className={inputCls} required onChange={e => setMode(e.target.value)} value={mode}>
                  <option value="">Select mode</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {mode === 'offline' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Venue</label>
                  <input name="venue" type="text" placeholder="Venue / Location" required className={inputCls} />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Registration Deadline *</label>
                <input type="date" required className={inputCls} style={{ colorScheme: 'light' }} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Google Meet Link</label>
                <input name="meetLink" type="url" placeholder="https://meet.google.com/..." className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Event Image</label>
                <input type="file" accept="image/*" onChange={handlePosterChange}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer" />
                {posterPreview && (
                  <div className="mt-2 rounded-xl overflow-hidden h-36">
                    <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60">
                {isSubmitting ? 'Creating…' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Event Published!</h3>
            <p className="text-gray-500 text-sm mb-6">Your event is now live for students to see.</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </AlumniNavigation>
  );
}