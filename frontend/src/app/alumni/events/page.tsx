"use client";

import React, { useState } from 'react';
import AlumniNavigation from '../AluminaNavigation';

export default function EventsPage() {

  interface Event {
    id: number;
    title: string;
    date: string;
    time: string;
    type: string;
    description: string;
    location: string;
    image?: string; // Optional for now
  }

  const initialEvents: Event[] = [
    {
      id: 1,
      title: "Annual Alumni Meetup 2024",
      date: "December 15, 2024",
      time: "6:00 PM",
      type: "Networking",
      description: "Join us for an evening of networking, memories, and celebrating our achievements.",
      location: "📍 Hotel Grand Ballroom"
    },
    {
      id: 2,
      title: "Tech Talk: AI in Industry",
      date: "December 20, 2024",
      time: "7:00 PM",
      type: "Workshop",
      description: "Expert panel discussion on the latest trends in artificial intelligence.",
      location: "🌐 Virtual Event"
    }
  ];

  const [showForm, setShowForm] = useState(false);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [mode, setMode] = useState("");
  const [events, setEvents] = useState<Event[]>(initialEvents);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newEvent: Event = {
      id: events.length + 1,
      title: formData.get('title') as string,
      date: formData.get('date') as string, // formatting needed in real app
      time: formData.get('time') as string,
      type: "Social", // Default or add a selector
      description: formData.get('description') as string,
      location: mode === 'online' ? (formData.get('meetLink') as string || 'Online') : (formData.get('venue') as string || 'TBD'),
      image: posterPreview || undefined
    };

    setEvents([newEvent, ...events]);
    alert("Event Created Successfully 🎉");
    setShowForm(false);
    setPosterPreview(null);
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
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{event.title}</h4>
                        <p className="text-slate-600">{event.date} • {event.time}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${event.id % 2 === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{event.type}</span>
                    </div>

                    <p className="text-slate-700 mb-4">
                      {event.description}
                    </p>

                    {event.image && (
                      <img src={event.image} alt={event.title} className="w-full h-48 object-cover rounded-xl mb-4" />
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{event.location}</span>

                      <button className={`bg-gradient-to-r ${event.id % 2 === 0 ? 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'} text-white px-4 py-2 rounded-lg font-medium transition-all duration-300`}>
                        {event.id % 2 === 0 ? 'Join' : 'RSVP'}
                      </button>
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

          <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-xl relative">

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
              <p className="font-bold text-black mb-2">Event Title</p>
              <input name="title" type="text" placeholder="Event Title" required className="w-full p-3 border rounded-xl bg-white text-black" />
              <p className="font-bold text-black mb-2">Event Description</p>
              <textarea name="description" placeholder="Event Description" rows={3} required className="w-full p-3 border rounded-xl bg-white text-black" />
              <p className="font-bold text-black mb-2">Event Date and Time</p>
              <div className="grid grid-cols-2 gap-4">
                <input name="date" type="date" required className="p-3 border rounded-xl bg-white text-black" />
                <input name="time" type="time" required className="p-3 border rounded-xl bg-white text-black" />
              </div>

              <select
                className="w-full p-3 border rounded-xl bg-white text-black"
                required
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="">Select Mode of Conduct</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>

              {mode === "offline" && (
                <>
                  <input
                    name="venue"
                    type="text"
                    placeholder="Venue / Location"
                    required
                    className="w-full p-3 border rounded-xl bg-white text-black"
                  />
                </>
              )}
              <p className="font-bold text-black mb-2">Registration Deadline</p>
              <input
                type="date"
                required
                className="w-full p-3 border rounded-xl bg-white text-black"
                placeholder="Registration Deadline"
              />

              <p className="font-bold text-black mb-2">Google Meet Link</p>
              <input name="meetLink" type="url" placeholder="Google Meet Link" className="w-full p-3 border rounded-xl bg-white text-black" />

              <p className="font-bold text-black mb-2">Add Media</p>
              <input type="file" accept="image/*" onChange={handlePosterChange} className="w-full p-3 border rounded-xl bg-white text-black" />

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

    </AlumniNavigation>
  );
}
