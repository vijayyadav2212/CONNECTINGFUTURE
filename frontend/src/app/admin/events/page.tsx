"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNavigation from '../AdminNavigation';
import { Plus, AlertCircle, CheckCircle, Clock, XCircle, Search, Filter, Calendar, Video, MapPin, Users, ExternalLink, Eye, Edit, Trash2 } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  duration: string;
  location: string;
  event_type: string;
  is_virtual: boolean;
  tags: string;
  organizer: string;
  max_attendees: number;
  current_attendees: number;
  price: number;
  approval_status: string;
}

export default function EventManagementPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [eventsLoading, setEventsLoading] = useState(true);

  // Fetch events from backend
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await fetch('http://localhost:4000/api/events');
      if (response.ok) {
        const data = await response.json();
        console.log('admin fetched events:', data);
        setEvents(data || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleApprove = async (eventId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: 'approved' })
      });
      if (response.ok) {
        await fetchEvents();
        setMessage({ type: 'success', text: 'Event approved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to approve event' });
      }
    } catch (err) {
      console.error('Error approving event:', err);
      setMessage({ type: 'error', text: 'Error approving event' });
    }
  };

  const handleReject = async (eventId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: 'rejected' })
      });
      if (response.ok) {
        await fetchEvents();
        setMessage({ type: 'success', text: 'Event rejected successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to reject event' });
      }
    } catch (err) {
      console.error('Error rejecting event:', err);
      setMessage({ type: 'error', text: 'Error rejecting event' });
    }
  };

  const handleDelete = async (eventId: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/events/${eventId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchEvents();
          setMessage({ type: 'success', text: 'Event deleted successfully!' });
        } else {
          setMessage({ type: 'error', text: 'Failed to delete event' });
        }
      } catch (err) {
        console.error('Error deleting event:', err);
        setMessage({ type: 'error', text: 'Error deleting event' });
      }
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.approval_status === filter;
    const matchesSearch = (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.event_type || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center"><XCircle className="w-3 h-3 mr-1" />Rejected</span>;
      default:
        return null;
    }
  };

  const getEventTypeBadge = (type: string) => {
    const colors = {
      'webinar': 'bg-blue-100 text-blue-700',
      'workshop': 'bg-purple-100 text-purple-700',
      'networking': 'bg-green-100 text-green-700',
      'meetup': 'bg-orange-100 text-orange-700',
      'conference': 'bg-pink-100 text-pink-700'
    };
    return <span className={`px-2 py-1 ${colors[type as keyof typeof colors]} rounded text-xs font-medium capitalize`}>{type}</span>;
  };

  return (
    <AdminNavigation>
      <div className="space-y-6">
        {/* Message Alert */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
            <p className="text-gray-600 mt-2">Manage and host alumni events</p>
          </div>
          <Link 
            href="/admin/events/create"
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Event
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({events.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({events.filter(e => e.approval_status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved ({events.filter(e => e.approval_status === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({events.filter(e => e.approval_status === 'rejected').length})
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="grid grid-cols-1 gap-4">
          {eventsLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icon */}
                    <div className="p-3 bg-green-50 rounded-lg flex-shrink-0">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="flex items-center text-gray-700 font-medium">
                              <Calendar className="w-4 h-4 mr-1" />{event.event_date}
                            </span>
                            {event.is_virtual ? (
                              <span className="flex items-center text-blue-600">
                                <Video className="w-4 h-4 mr-1" />Virtual Event
                              </span>
                            ) : (
                              <span className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 mr-1" />{event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(event.approval_status)}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex items-center space-x-3 mt-3">
                        {getEventTypeBadge(event.event_type)}
                        {event.max_attendees && (
                          <span className="flex items-center text-gray-600 text-sm">
                            <Users className="w-4 h-4 mr-1" />Max {event.max_attendees} attendees
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-sm text-gray-700 line-clamp-2">{event.description}</p>

                      {/* Posted Info */}
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>Posted by {event.organizer}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm flex items-center">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm flex items-center">
                      <Edit className="w-4 h-4" />
                    </button>
                    {event.approval_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(event.id)}
                          className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium text-sm flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(event.id)}
                          className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium text-sm flex items-center"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm flex items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminNavigation>
  );
}
