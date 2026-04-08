"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../../hooks/useAuth0Token';
import AdminNavigation from '../../AdminNavigation/AdminNavigation';
import Link from 'next/link';
import {
  Calendar, MapPin, Users, Video, Save, X,
  FileText, CheckCircle, ArrowLeft, Upload, Clock, Tag
} from 'lucide-react';

interface EventFormData {
  title: string; description: string; eventType: 'virtual' | 'physical' | 'hybrid';
  date: string; time: string; duration: string; location: string; virtualLink: string;
  maxParticipants: string; category: string; tags: string;
  registrationDeadline: string; image: File | null;
  speakerName: string; speakerTitle: string; speakerBio: string;
  requirements: string; agenda: string;
}

const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400";
const iconInputCls = "w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400";
const labelCls = "block text-xs font-bold text-gray-600 mb-1.5";

const SectionHeader = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex items-center gap-3 pb-3 mb-4 border-b border-gray-100">
    <div className="w-9 h-9 rounded-xl bg-pink-50 text-rose-500 flex items-center justify-center">{icon}</div>
    <div><p className="text-sm font-black text-gray-900">{title}</p><p className="text-xs text-gray-400">{desc}</p></div>
  </div>
);

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useUser();
  const { token: accessToken } = useAuth0Token();
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    title: '', description: '', eventType: 'physical', date: '', time: '',
    duration: '60', location: '', virtualLink: '', maxParticipants: '100',
    category: 'workshop', tags: '', registrationDeadline: '', image: null,
    speakerName: '', speakerTitle: '', speakerBio: '', requirements: '', agenda: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFormData(p => ({ ...p, image: e.target.files![0] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
        let image_url = '';
        if (formData.image) {
          const imgForm = new FormData();
          imgForm.append('file', formData.image);
          const imgRes = await fetch(`${API_BASE}/api/upload/event-image`, { method: 'POST', body: imgForm });
          if (imgRes.ok) { const d = await imgRes.json(); image_url = d.url; }
          else { alert('Image upload failed'); return; }
        }
        const { image, ...rest } = formData;
        const payload: any = { ...rest, image_url, posted_by: user?.email };
        const res = await fetch(`${API_BASE}/api/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
          body: JSON.stringify(payload),
        });
        if (res.ok) { setShowSuccess(true); setTimeout(() => router.push('/admin/events'), 2000); }
        else alert('Failed to create event.');
      } catch { alert('Error creating event.'); }
    })();
  };

  const handleCancel = () => {
    if (confirm('Cancel? All unsaved changes will be lost.')) router.push('/admin/events');
  };

  const needsLocation  = formData.eventType === 'physical' || formData.eventType === 'hybrid';
  const needsVirtual   = formData.eventType === 'virtual'  || formData.eventType === 'hybrid';

  return (
    <AdminNavigation>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-pink-50 rounded-[20px] p-6 sm:p-8 flex items-center gap-5 border border-pink-100">
          <Link href="/admin/events" className="w-10 h-10 rounded-xl bg-white/60 border border-white text-gray-600 hover:bg-white transition-all shadow-sm shrink-0 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 mb-1">
              <Calendar className="w-7 h-7 text-rose-500" />Create New Event
            </h1>
            <p className="text-gray-600 text-[15px]">Host a new event for alumni and students</p>
          </div>
        </div>

        {/* Success */}
        {showSuccess && (
          <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-rose-600" />
            <div><p className="text-sm font-bold text-rose-800">Event created successfully!</p><p className="text-xs text-rose-600">Redirecting…</p></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader icon={<FileText className="w-4 h-4" />} title="Basic Information" desc="General event details" />
            <div className="space-y-4">
              <div><label className={labelCls}>Event Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Tech Talk: AI in Industry" className={inputCls} /></div>
              <div><label className={labelCls}>Description *</label><textarea name="description" value={formData.description} onChange={handleChange} required rows={4} placeholder="Provide a detailed description of the event…" className={`${inputCls} resize-none`} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Event Type *</label>
                  <select name="eventType" value={formData.eventType} onChange={handleChange} required className={inputCls}>
                    <option value="physical">Physical Event</option><option value="virtual">Virtual Event</option><option value="hybrid">Hybrid Event</option>
                  </select>
                </div>
                <div><label className={labelCls}>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required className={inputCls}>
                    <option value="workshop">Workshop</option><option value="seminar">Seminar</option><option value="webinar">Webinar</option>
                    <option value="networking">Networking</option><option value="conference">Conference</option>
                    <option value="career-fair">Career Fair</option><option value="social">Social Event</option><option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader icon={<Clock className="w-4 h-4" />} title="Date & Time" desc="Schedule your event" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={labelCls}>Event Date *</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputCls} /></div>
              <div><label className={labelCls}>Start Time *</label><input type="time" name="time" value={formData.time} onChange={handleChange} required className={inputCls} /></div>
              <div><label className={labelCls}>Duration (min) *</label><input type="number" name="duration" value={formData.duration} onChange={handleChange} required min="15" step="15" placeholder="60" className={inputCls} /></div>
              <div className="sm:col-span-3"><label className={labelCls}>Registration Deadline *</label><input type="date" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} required className={`${inputCls} max-w-xs`} /></div>
            </div>
          </div>

          {/* Location & Access */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader icon={<MapPin className="w-4 h-4" />} title="Location & Access" desc="Where the event will take place" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {needsLocation && (
                <div className={!needsVirtual ? 'sm:col-span-2' : ''}>
                  <label className={labelCls}>Physical Location *</label>
                  <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" name="location" value={formData.location} onChange={handleChange} required={needsLocation} placeholder="e.g., Main Auditorium, Building A" className={iconInputCls} /></div>
                </div>
              )}
              {needsVirtual && (
                <div className={!needsLocation ? 'sm:col-span-2' : ''}>
                  <label className={labelCls}>Virtual Meeting Link *</label>
                  <div className="relative"><Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="url" name="virtualLink" value={formData.virtualLink} onChange={handleChange} required={needsVirtual} placeholder="https://zoom.us/j/123456789" className={iconInputCls} /></div>
                </div>
              )}
              <div><label className={labelCls}>Max Participants</label>
                <div className="relative"><Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} min="1" placeholder="100" className={iconInputCls} /></div>
              </div>
              <div><label className={labelCls}>Tags (comma-separated)</label>
                <div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="AI, Technology, Career" className={iconInputCls} /></div>
              </div>
            </div>
          </div>

          {/* Speaker */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader icon={<Users className="w-4 h-4" />} title="Speaker Information" desc="Details about the event speaker(s)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Speaker Name</label><input type="text" name="speakerName" value={formData.speakerName} onChange={handleChange} placeholder="John Doe" className={inputCls} /></div>
              <div><label className={labelCls}>Speaker Title</label><input type="text" name="speakerTitle" value={formData.speakerTitle} onChange={handleChange} placeholder="Chief Technology Officer" className={inputCls} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Speaker Bio</label><textarea name="speakerBio" value={formData.speakerBio} onChange={handleChange} rows={3} placeholder="Brief biography of the speaker…" className={`${inputCls} resize-none`} /></div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader icon={<FileText className="w-4 h-4" />} title="Additional Details" desc="Agenda, requirements and event image" />
            <div className="space-y-4">
              <div><label className={labelCls}>Event Agenda</label><textarea name="agenda" value={formData.agenda} onChange={handleChange} rows={4} placeholder="Outline the event schedule and topics…" className={`${inputCls} resize-none`} /></div>
              <div><label className={labelCls}>Requirements</label><textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={3} placeholder="Any prerequisites or materials needed…" className={`${inputCls} resize-none`} /></div>
              <div>
                <label className={labelCls}>Event Image</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="eventImage" />
                  <label htmlFor="eventImage" className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-gray-500" />{formData.image ? formData.image.name : 'Choose Image'}
                  </label>
                  {formData.image && <span className="flex items-center gap-1 text-xs font-bold text-rose-600"><CheckCircle className="w-3.5 h-3.5" />Selected</span>}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">Recommended: 1200×630px · Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={handleCancel} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"><X className="w-4 h-4" />Cancel</button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"><Save className="w-4 h-4" />Create Event</button>
          </div>
        </form>
      </div>
    </AdminNavigation>
  );
}
