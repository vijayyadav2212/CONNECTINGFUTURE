"use client";

import React, { useState } from 'react';
import AdminNavigation from '../AdminNavigation';
import { 
  Calendar, Search, Filter, CheckCircle, XCircle, 
  Clock, Eye, Plus, Edit, Trash2, MapPin, Users, 
  Video, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: number;
  title: string;
  description: string;
  eventType: 'webinar' | 'workshop' | 'networking' | 'meetup' | 'conference';
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
  startDate: string;
  endDate?: string;
  maxAttendees?: number;
  registrationUrl?: string;
  postedBy: string;
  postedByEmail: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
}

export default function EventManagementPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: 'Tech Talk: AI in Industry',
      description: 'Join us for an insightful discussion on how AI is transforming various industries.',
      eventType: 'webinar',
      isVirtual: true,
      virtualLink: 'https://meet.google.com/xyz',
      startDate: 'Feb 15, 2026 • 6:00 PM',
      maxAttendees: 100,
      registrationUrl: 'https://events.com/register',
      postedBy: 'John Doe',
      postedByEmail: 'john@example.com',
      approvalStatus: 'pending',
      isActive: true
    },
    {
      id: 2,
      title: 'Alumni Networking Meetup',
      description: 'Connect with fellow alumni in your city over coffee and conversations.',
      eventType: 'networking',
      location: 'Starbucks, Bandra, Mumbai',
      isVirtual: false,
      startDate: 'Feb 20, 2026 • 4:00 PM',
      endDate: 'Feb 20, 2026 • 7:00 PM',
      maxAttendees: 50,
      postedBy: 'Jane Smith',
      postedByEmail: 'jane@example.com',
      approvalStatus: 'pending',
      isActive: true
    },
    {
      id: 3,
      title: 'Career Workshop: Resume Building',
      description: 'Learn expert tips on creating impactful resumes that get noticed.',
      eventType: 'workshop',
      isVirtual: true,
      virtualLink: 'https://zoom.us/j/12345',
      startDate: 'Feb 18, 2026 • 5:00 PM',
      postedBy: 'Mike Johnson',
      postedByEmail: 'mike@example.com',
      approvalStatus: 'approved',
      isActive: true
    },
  ]);

  const handleApprove = (eventId: number) => {
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, approvalStatus: 'approved' as const } : e
    ));
  };

  const handleReject = (eventId: number) => {
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, approvalStatus: 'rejected' as const } : e
    ));
  };

  const handleDelete = (eventId: number) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.approvalStatus === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.eventType.toLowerCase().includes(searchQuery.toLowerCase());
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
                Pending ({events.filter(e => e.approvalStatus === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved ({events.filter(e => e.approvalStatus === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({events.filter(e => e.approvalStatus === 'rejected').length})
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.length === 0 ? (
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
                              <Calendar className="w-4 h-4 mr-1" />{event.startDate}
                            </span>
                            {event.isVirtual ? (
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
                          {getStatusBadge(event.approvalStatus)}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex items-center space-x-3 mt-3">
                        {getEventTypeBadge(event.eventType)}
                        {event.maxAttendees && (
                          <span className="flex items-center text-gray-600 text-sm">
                            <Users className="w-4 h-4 mr-1" />Max {event.maxAttendees} attendees
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-sm text-gray-700 line-clamp-2">{event.description}</p>

                      {/* Posted Info */}
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>Posted by {event.postedBy}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    {(event.registrationUrl || event.virtualLink) && (
                      <a
                        href={event.registrationUrl || event.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm flex items-center"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm flex items-center">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm flex items-center">
                      <Edit className="w-4 h-4" />
                    </button>
                    {event.approvalStatus === 'pending' && (
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
