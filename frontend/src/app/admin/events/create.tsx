"use client";

import React, { useState } from 'react';
import AdminNavigation from '../AdminNavigation/AdminNavigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, ArrowLeft, Plus, AlertCircle, CheckCircle,
  MapPin, Users, Clock, Tag, User
} from 'lucide-react';

const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400";
const iconInputCls = "w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400";
const labelCls = "block text-xs font-bold text-gray-600 mb-1.5";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const emptyForm = {
    title: '', description: '', event_date: '', event_time: '', duration: '',
    location: '', event_type: 'workshop', is_virtual: false,
    tags: '', organizer: '', max_attendees: '', current_attendees: '0', price: '0'
  };

  const [formData, setFormData] = useState(emptyForm);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage(null);
    try {
      const payload = {
        ...formData,
        is_virtual: formData.is_virtual,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        current_attendees: parseInt(formData.current_attendees) || 0,
        price: parseFloat(formData.price) || 0,
      };
      const response = await fetch('http://localhost:4000/api/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Event created successfully!' });
        setFormData(emptyForm);
        setTimeout(() => router.push('/admin/events'), 1500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to create event' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error: ' + (err instanceof Error ? err.message : String(err)) });
    } finally { setLoading(false); }
  };

  return (
    <AdminNavigation>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-pink-50 rounded-[20px] p-6 sm:p-8 flex items-center gap-5 border border-pink-100">
          <Link href="/admin/events" className="w-10 h-10 rounded-xl bg-white/60 border border-white text-gray-600 hover:bg-white transition-all shadow-sm shrink-0 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 mb-1">
              <Calendar className="w-7 h-7 text-rose-500" />Create Event
            </h1>
            <p className="text-gray-600 text-[15px]">Add a new event for students to discover</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${message.type === 'success' ? 'bg-pink-50 border-pink-200 text-rose-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">

          {/* Section: Basic */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <Calendar className="w-4 h-4 text-rose-500" />
              <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Event Details</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className={labelCls}>Event Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Web Development Workshop" className={inputCls} /></div>
              <div><label className={labelCls}>Event Type *</label>
                <select name="event_type" value={formData.event_type} onChange={handleChange} className={inputCls}>
                  <option value="workshop">Workshop</option><option value="seminar">Seminar</option>
                  <option value="networking">Networking</option><option value="career-fair">Career Fair</option>
                  <option value="hackathon">Hackathon</option><option value="webinar">Webinar</option>
                </select>
              </div>
              <div><label className={labelCls}>Organizer</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" name="organizer" value={formData.organizer} onChange={handleChange} placeholder="e.g., Tech Team" className={iconInputCls} /></div>
              </div>
              <div className="sm:col-span-2"><label className={labelCls}>Description *</label><textarea name="description" value={formData.description} onChange={handleChange} required rows={4} placeholder="Describe the event…" className={`${inputCls} resize-none`} /></div>
            </div>
          </div>

          {/* Section: Schedule & Location */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <Clock className="w-4 h-4 text-rose-500" />
              <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Schedule & Location</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Event Date & Time *</label><input type="datetime-local" name="event_date" value={formData.event_date} onChange={handleChange} required className={inputCls} /></div>
              <div><label className={labelCls}>Time (optional)</label><input type="time" name="event_time" value={formData.event_time} onChange={handleChange} className={inputCls} /></div>
              <div><label className={labelCls}>Duration</label><input type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g., 2 hours" className={inputCls} /></div>
              <div><label className={labelCls}>Location *</label>
                <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g., Tech Hub or Online" className={iconInputCls} /></div>
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 bg-pink-50 border border-pink-200 rounded-xl p-3">
                <input type="checkbox" name="is_virtual" id="is_virtual" checked={formData.is_virtual} onChange={handleChange} className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500" />
                <label htmlFor="is_virtual" className="text-sm font-semibold text-gray-700 cursor-pointer">Virtual Event</label>
              </div>
            </div>
          </div>

          {/* Section: Capacity & Pricing */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <Users className="w-4 h-4 text-rose-500" />
              <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Capacity & Pricing</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={labelCls}>Max Attendees</label>
                <div className="relative"><Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="number" name="max_attendees" value={formData.max_attendees} onChange={handleChange} placeholder="100" className={iconInputCls} /></div>
              </div>
              <div><label className={labelCls}>Current Attendees</label><input type="number" name="current_attendees" value={formData.current_attendees} onChange={handleChange} placeholder="0" className={inputCls} /></div>
              <div><label className={labelCls}>Price (₹)</label><input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" placeholder="0" className={inputCls} /></div>
            </div>
          </div>

          {/* Section: Tags */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <Tag className="w-4 h-4 text-rose-500" />
              <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Tags</p>
            </div>
            <div><label className={labelCls}>Tags (comma separated)</label><input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g., react, nodejs, web-dev" className={inputCls} /></div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Link href="/admin/events" className="px-5 py-2.5 text-sm font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />{loading ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </AdminNavigation>
  );
}
