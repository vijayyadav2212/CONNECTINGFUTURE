"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../../hooks/useAuth0Token';
import AdminNavigation from '../../AdminNavigation';
import { 
  Calendar, MapPin, Clock, Users, Globe, Video, 
  Link2, Save, X, AlertCircle, Image, Upload,
  FileText, CheckCircle, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface EventFormData {
  title: string;
  description: string;
  eventType: 'virtual' | 'physical' | 'hybrid';
  date: string;
  time: string;
  duration: string;
  location: string;
  virtualLink: string;
  maxParticipants: string;
  category: string;
  tags: string;
  registrationDeadline: string;
  image: File | null;
  speakerName: string;
  speakerTitle: string;
  speakerBio: string;
  requirements: string;
  agenda: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventType: 'physical',
    date: '',
    time: '',
    duration: '60',
    location: '',
    virtualLink: '',
    maxParticipants: '100',
    category: 'workshop',
    tags: '',
    registrationDeadline: '',
    image: null,
    speakerName: '',
    speakerTitle: '',
    speakerBio: '',
    requirements: '',
    agenda: ''
  });

  const { user } = useUser();
  const { token: accessToken } = useAuth0Token();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        image: e.target.files![0]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitEvent = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
        let image_url = '';
        if (formData.image) {
          const imgForm = new FormData();
          imgForm.append('image', formData.image);
          const imgRes = await fetch(`${API_BASE}/api/uploads/event-image`, {
            method: 'POST',
            body: imgForm
          });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            image_url = imgData.url;
          } else {
            alert('Image upload failed');
            return;
          }
        }
        const { image, ...eventData } = formData;
        // Do not set 'status' here — new events should start as pending and be
        // approved by an admin. Server will set approval_status = 'pending'.
        const payload: any = { ...eventData, image_url, posted_by: user?.email };
        const res = await fetch(`${API_BASE}/api/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowSuccess(true);
          setTimeout(() => {
            router.push('/admin/events');
          }, 2000);
        } else {
          alert('Failed to create event.');
        }
      } catch (err) {
        alert('Error creating event.');
      }
    };
    submitEvent();
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      router.push('/admin/events');
    }
  };

  return (
    <AdminNavigation>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/events"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create New Event
              </h1>
              <p className="text-gray-600 mt-1">Host a new event for alumni and students</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">Event created successfully!</p>
              <p className="text-xs text-green-700">Redirecting to events page...</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
                <p className="text-sm text-gray-500">General event details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Tech Talk: AI in Industry"
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide a detailed description of the event..."
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer text-gray-900 font-medium"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="physical">Physical Event</option>
                    <option value="virtual">Virtual Event</option>
                    <option value="hybrid">Hybrid Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer text-gray-900 font-medium"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="webinar">Webinar</option>
                    <option value="networking">Networking</option>
                    <option value="conference">Conference</option>
                    <option value="career-fair">Career Fair</option>
                    <option value="social">Social Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Date & Time</h2>
                <p className="text-sm text-gray-500">Schedule your event</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="60"
                  required
                  min="15"
                  step="15"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Registration Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Location & Access</h2>
                <p className="text-sm text-gray-500">Where the event will take place</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(formData.eventType === 'physical' || formData.eventType === 'hybrid') && (
                <div className={formData.eventType === 'physical' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Physical Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Main Auditorium, Building A"
                      required={formData.eventType === 'physical' || formData.eventType === 'hybrid'}
                      className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {(formData.eventType === 'virtual' || formData.eventType === 'hybrid') && (
                <div className={formData.eventType === 'virtual' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Virtual Meeting Link <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Video className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="url"
                      name="virtualLink"
                      value={formData.virtualLink}
                      onChange={handleChange}
                      placeholder="https://zoom.us/j/123456789"
                      required={formData.eventType === 'virtual' || formData.eventType === 'hybrid'}
                      className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Participants
                </label>
                <div className="relative">
                  <Users className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    placeholder="100"
                    min="1"
                    className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="AI, Technology, Career"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Speaker Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Speaker Information</h2>
                <p className="text-sm text-gray-500">Details about the event speaker(s)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Speaker Name
                </label>
                <input
                  type="text"
                  name="speakerName"
                  value={formData.speakerName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Speaker Title
                </label>
                <input
                  type="text"
                  name="speakerTitle"
                  value={formData.speakerTitle}
                  onChange={handleChange}
                  placeholder="Chief Technology Officer"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Speaker Bio
                </label>
                <textarea
                  name="speakerBio"
                  value={formData.speakerBio}
                  onChange={handleChange}
                  placeholder="Brief biography of the speaker..."
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Additional Details</h2>
                <p className="text-sm text-gray-500">Event agenda and requirements</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Agenda
                </label>
                <textarea
                  name="agenda"
                  value={formData.agenda}
                  onChange={handleChange}
                  placeholder="Outline the event schedule and topics..."
                  rows={4}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="Any prerequisites or materials needed..."
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Image
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="eventImage"
                  />
                  <label
                    htmlFor="eventImage"
                    className="flex items-center space-x-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {formData.image ? formData.image.name : 'Choose Image'}
                    </span>
                  </label>
                  {formData.image && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Image selected</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Recommended: 1200x630px, Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        </form>
      </div>
    </AdminNavigation>
  );
}
