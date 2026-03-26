"use client";

import React, { useState, useEffect } from 'react';
import AdminNavigation from '../AdminNavigation/AdminNavigation';
import {
  Calendar, Search, Filter, CheckCircle, XCircle,
  Clock, Plus, Trash2, MapPin, Users, Video, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../hooks/useAuth0Token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

interface Event {
  id: number; title: string; description: string; event_type: string;
  location?: string; is_virtual: boolean; virtual_link?: string;
  start_date: string; end_date?: string; max_attendees?: number;
  registration_url?: string; posted_by: string; status: string;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const getApprovalStatus = (status: string): FilterType => {
  const s = status.toLowerCase();
  if (s.includes('pending')) return 'pending';
  if (s.includes('approved')) return 'approved';
  if (s.includes('rejected')) return 'rejected';
  return 'pending';
};

const statusBadge = (status: FilterType) => {
  switch (status) {
    case 'pending':  return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" />Pending</span>;
    case 'approved': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200"><CheckCircle className="w-3 h-3" />Approved</span>;
    case 'rejected': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" />Rejected</span>;
  }
};

const eventTypeStyle: Record<string, string> = {
  webinar:    'bg-blue-50 text-blue-700 border-blue-200',
  workshop:   'bg-purple-50 text-purple-700 border-purple-200',
  networking: 'bg-green-50 text-green-700 border-green-200',
  meetup:     'bg-orange-50 text-orange-700 border-orange-200',
  conference: 'bg-pink-50 text-pink-700 border-pink-200',
  seminar:    'bg-teal-50 text-teal-700 border-teal-200',
  hackathon:  'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function EventManagementPage() {
  const { user } = useUser();
  const { token: accessToken } = useAuth0Token();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      if (!user || !accessToken) return;
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/events?limit=100&all=true`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : (data?.events ?? []);
          const normalized = list.map((ev: any) => ({
            ...ev,
            start_date: ev.start_date || ev.event_date || ev.start || ev.date || null,
            is_virtual: ev.is_virtual || Boolean(ev.virtual_link || ev.online || false),
            event_type: ev.event_type || ev.type || 'event',
            description: ev.description || ev.summary || '',
            posted_by: ev.posted_by || ev.organizer || ev.organiser || null,
            status: ev.status || ev.approval_status || 'pending',
          }));
          setEvents(normalized);
        }
      } catch (e) { console.error('Error loading events:', e); }
      finally { setLoading(false); }
    };
    loadEvents();
  }, [user, accessToken]);

  const handleApprove = async (eventId: number) => {
    if (!accessToken) return;
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ approval_status: 'approved' }) });
      if (r.ok) setEvents(e => e.map(x => x.id === eventId ? { ...x, status: 'Approved' } : x));
      else { const err = await r.json(); alert(err.error || 'Failed to approve event'); }
    } catch { alert('Failed to approve event'); }
  };

  const handleReject = async (eventId: number) => {
    if (!accessToken) return;
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ approval_status: 'rejected' }) });
      if (r.ok) setEvents(e => e.map(x => x.id === eventId ? { ...x, status: 'Rejected' } : x));
      else { const err = await r.json(); alert(err.error || 'Failed to reject event'); }
    } catch { alert('Failed to reject event'); }
  };

  const handleDelete = async (eventId: number) => {
    if (!accessToken || !confirm('Delete this event?')) return;
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      if (r.ok) setEvents(e => e.filter(x => x.id !== eventId));
      else alert('Failed to delete event');
    } catch { alert('Failed to delete event'); }
  };

  const count = (s: FilterType) => events.filter(e => getApprovalStatus(e.status) === s).length;

  const filteredEvents = events.filter(ev => {
    const matchFilter = filter === 'all' || getApprovalStatus(ev.status) === filter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || ev.title.toLowerCase().includes(q) || ev.description.toLowerCase().includes(q) || ev.event_type.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const filterBtns: { key: FilterType; label: string; active: string }[] = [
    { key: 'all',      label: `All (${events.length})`,          active: 'bg-gray-700 text-white' },
    { key: 'pending',  label: `Pending (${count('pending')})`,   active: 'bg-amber-500 text-white' },
    { key: 'approved', label: `Approved (${count('approved')})`, active: 'bg-green-600 text-white' },
    { key: 'rejected', label: `Rejected (${count('rejected')})`, active: 'bg-red-500 text-white' },
  ];

  return (
    <AdminNavigation>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-6 h-6 text-green-600" />Event Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and host alumni events</p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: 'Pending', value: count('pending'),  color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
              { label: 'Active',  value: count('approved'), color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
            ].map(s => (
              <div key={s.label} className={`px-4 py-2 rounded-xl border ${s.bg} text-center`}>
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wide ${s.color} opacity-70`}>{s.label}</p>
              </div>
            ))}
            <Link href="/admin/events/create" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />Create Event
            </Link>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search events…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {filterBtns.map(b => (
              <button key={b.key} onClick={() => setFilter(b.key)} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${filter === b.key ? b.active : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{b.label}</button>
            ))}
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="flex items-center justify-center py-14 bg-white rounded-2xl border border-gray-100">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-green-500 mr-3" />
            <p className="text-sm text-gray-400">Loading events…</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"><Calendar className="w-6 h-6 text-gray-300" /></div>
            <p className="font-bold text-gray-900 text-sm">No events found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map(event => {
              const approvalStatus = getApprovalStatus(event.status);
              return (
                <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0"><Calendar className="w-5 h-5" /></div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-gray-900 text-sm">{event.title}</p>
                        {statusBadge(approvalStatus)}
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 mb-2">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.start_date ? new Date(event.start_date).toLocaleString() : '—'}</span>
                        {event.is_virtual
                          ? <span className="flex items-center gap-1 text-blue-600"><Video className="w-3 h-3" />Virtual</span>
                          : event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                        {event.max_attendees && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Max {event.max_attendees}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${eventTypeStyle[event.event_type?.toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{event.event_type}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-1">{event.description}</p>
                      {event.posted_by && <p className="text-[10px] text-gray-400">Posted by {event.posted_by}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {(event.registration_url || event.virtual_link) && (
                        <a href={event.registration_url || event.virtual_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {approvalStatus === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(event.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"><CheckCircle className="w-3 h-3" />Approve</button>
                          <button onClick={() => handleReject(event.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"><XCircle className="w-3 h-3" />Reject</button>
                        </>
                      )}
                      <button onClick={() => handleDelete(event.id)} className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminNavigation>
  );
}
