"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useUser } from '@auth0/nextjs-auth0/client';
import AlumniNavigation from '../AluminaNavigation';
import { Share2, BookmarkPlus, Calendar, MapPin, Clock } from 'lucide-react';

export default function EventsPage() {

  interface Event {
    id: number;
    title: string;
    date: string;
    time: string;
    type: string;
    description: string;
    location: string;
    image?: string;
    image_url?: string;
    organizer?: string;
    is_virtual?: boolean;
  }

  const [showForm, setShowForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [mode, setMode] = useState("");
  const { user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);

  const handleShare = async (event: Event) => {
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}\nDate: ${event.date}\nLocation: ${event.location}`,
      url: window.location.href
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
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error("Failed to share");
      }
    }
  };

  // Fetch events on mount
  React.useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/events');
      if (res.ok) {
        const data = await res.json();
        // Map backend fields to frontend
        const mapped = data.map((e: any) => ({
          id: e.id,
          title: e.title,
          date: e.event_date ? new Date(e.event_date).toLocaleDateString() : '',
          time: e.event_time || '',
          type: e.event_type || 'Social',
          description: e.description,
          location: e.location,
          image: e.image_url,
          organizer: e.organizer
        }));
        setEvents(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    }
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      alert(`File selected: ${file.name} (${Math.round(file.size / 1024)} KB)`); // Debug alert
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // 1. Upload Image if exists
    let imageUrl = '';

    if (posterFile) {
      toast.info("Uploading image...", { duration: 2000 });
      // ... existing upload logic ...
      const imgData = new FormData();
      imgData.append('image', posterFile);
      try {
        const uploadRes = await fetch('http://localhost:4000/api/uploads/event-image', {
          method: 'POST',
          body: imgData,
        });

        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          imageUrl = uploadJson.url;
          console.log("Upload success:", imageUrl);
          toast.success("Image uploaded!");
        } else {
          const errText = await uploadRes.text();
          console.error("Upload failed response:", errText);
          toast.error(`Image Upload Failed: ${uploadRes.status}`);
        }
      } catch (err) {
        console.error("Image upload network error", err);
        toast.error("Image upload network error");
      }
    } else {
      console.log("No poster file selected");
    }

    // 2. Post Event Data
    const eventData = {
      title: formData.get('title'),
      description: formData.get('description'),
      event_date: formData.get('date'),
      event_time: formData.get('time'),
      event_type: "Social",
      is_virtual: mode === 'online',
      location: mode === 'online' ? (formData.get('meetLink') || 'Online') : (formData.get('venue') || 'TBD'),
      image_url: imageUrl,
      organizer: user?.name || user?.nickname || user?.email || "Alumni",
      tags: "",
      duration: "1h"
    };

    try {
      const res = await fetch('http://localhost:4000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (res.ok) {
        setShowForm(false);
        setPosterPreview(null);
        setPosterFile(null);
        setShowSuccessModal(true); // Show success modal
        fetchEvents();
      } else {
        const errData = await res.json();
        toast.error(`Failed to create event: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Create event error", err);
      toast.error("Error creating event. Check console.");
    }
  };

  return (
    <AlumniNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        <div className="space-y-8">

          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-4xl">📅</span>
                    <h1 className="text-4xl font-black">Alumni Events</h1>
                  </div>
                  <p className="text-purple-100 text-xl">Connect, network, and celebrate together</p>
                </div>

                <button
                  onClick={() => setShowForm(true)}
                  className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/30 transition-all duration-300 shadow-lg border border-white/20"
                >
                  Create Event
                </button>

              </div>
            </div>
          </div>

          {/* Enhanced Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Upcoming Events */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                <span className="mr-3">🎉</span>
                Upcoming Events
                <div className="ml-auto w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </h3>

              <div className="space-y-6">
                {events.map((event) => (
                  <div key={event.id} className={`p-6 bg-gradient-to-r ${event.id % 2 === 0 ? 'from-green-50 to-emerald-50 border-green-200/50' : 'from-blue-50 to-indigo-50 border-blue-200/50'} rounded-2xl border hover:shadow-lg transition-all duration-300`}>

                    {event.image_url && (
                      <div className="mb-4 overflow-hidden rounded-xl h-48 w-full">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{event.title}</h4>
                        <p className="text-slate-600">{event.date} • {event.time}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-4 py-1 rounded-full text-xs font-bold ${event.id % 2 === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {event.type || 'Social'}
                        </span>
                        <button
                          onClick={() => handleShare(event)}
                          className="p-2 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-2">
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200/50">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center">
                          <span className="mr-1">📍</span> {event.location}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">👤</span> {event.organizer || 'Alumni'}
                        </span>
                      </div>
                      {event.is_virtual && (
                        <a
                          href={event.location.startsWith('http') ? event.location : '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                          Join Link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Events */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                <span className="mr-3">📜</span>
                Past Events
              </h3>

              <div className="space-y-6">

                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Career Fair 2024</h4>
                      <p className="text-slate-600">November 10, 2024</p>
                    </div>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">Career</span>
                  </div>

                  <p className="text-slate-700 mb-4">
                    120+ attendees, 15 companies, 30+ job offers
                  </p>

                  <div className="flex items-center space-x-4">
                    <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                      View Photos
                    </button>

                    <span className="text-sm text-green-600 font-medium">✅ Attended</span>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Homecoming Weekend</h4>
                      <p className="text-slate-600">October 5-6, 2024</p>
                    </div>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">Social</span>
                  </div>

                  <p className="text-slate-700 mb-4">
                    A weekend of nostalgia, campus tours, and reconnections
                  </p>

                  <div className="flex items-center space-x-4">
                    <button className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                      View Highlights
                    </button>

                    <span className="text-sm text-slate-500 font-medium">❌ Missed</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Event Categories */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20">
            <h3 className="text-3xl font-black text-slate-900 mb-8 text-center">
              Event Categories
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

              {["🤝 Networking", "🎓 Educational", "🎉 Social", "💼 Career"].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-white text-3xl">{item.split(" ")[0]}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{item.split(" ")[1]}</h4>
                </div>
              ))}

            </div>
          </div>

        </div>
      </div>

      {/* CREATE EVENT FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-50">

          <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-xl relative max-h-[85vh] overflow-y-auto">


            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-black"
              onClick={() => setShowForm(false)}
            >
              ✖
            </button>

            <h2 className="text-3xl font-bold mb-6 text-center text-black">
              Create Event
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Shared Input Class */}
              {(() => {
                const inputClassName = "w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400";

                return (
                  <>
                    <p className="font-bold text-gray-900 mb-2">Event Title</p>
                    <input name="title" type="text" placeholder="Event Title" required className={inputClassName} />

                    <p className="font-bold text-gray-900 mb-2">Event Description</p>
                    <textarea name="description" placeholder="Event Description" rows={3} required className={inputClassName} />

                    <p className="font-bold text-gray-900 mb-2">Event Date and Time</p>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        name="date"
                        type="date"
                        required
                        className={inputClassName}
                        style={{ colorScheme: 'light' }}
                      />
                      <input
                        name="time"
                        type="time"
                        required
                        className={inputClassName}
                        style={{ colorScheme: 'light' }}
                      />
                    </div>

                    <select
                      className={inputClassName}
                      required
                      onChange={(e) => setMode(e.target.value)}
                    >
                      <option value="">Select Mode of Conduct</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>

                    {mode === "offline" && (
                      <input
                        name="venue"
                        type="text"
                        placeholder="Venue / Location"
                        required
                        className={inputClassName}
                      />
                    )}

                    <p className="font-bold text-gray-900 mb-2">Registration Deadline</p>
                    <input
                      type="date"
                      required
                      className={inputClassName}
                      style={{ colorScheme: 'light' }}
                      placeholder="Registration Deadline"
                    />

                    <p className="font-bold text-gray-900 mb-2">Google Meet Link</p>
                    <input name="meetLink" type="url" placeholder="Google Meet Link" className={inputClassName} />

                    <p className="font-bold text-gray-900 mb-2">Add Media</p>
                    <input type="file" accept="image/*" onChange={handlePosterChange} className={`${inputClassName} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100`} />
                  </>
                );
              })()}

              {posterPreview && (
                <img src={posterPreview} className="w-full h-48 object-cover rounded-xl" />
              )}

              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white py-3 rounded-xl font-bold">
                Create Event
              </button>

            </form>
          </div>
        </div>
      )}


      {/* SUCCESS MODAL */}
      {
        showSuccessModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative animate-in zoom-in-95 duration-200 border border-white/20">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-bounce">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Event Published!</h3>
              <p className="text-gray-600 mb-6 text-lg">
                Your event has been successfully created and is now live for students to see.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Awesome!
              </button>
            </div>
          </div>
        )
      }
    </AlumniNavigation>
  );
}
