"use client";

import React, { useState, useEffect } from 'react';
<<<<<<< HEAD:frontend/src/app/admin/approvals/page.tsx
import AdminNavigation from '../AdminNavigation';
import { 
  UserCheck, UserX, Search, Filter, CheckCircle, 
  XCircle, Clock, Eye, Mail, Phone, Linkedin, 
  GraduationCap, Building, MapPin, Calendar 
=======
import AdminNavigation from '../../AdminNavigation/AdminNavigation';
import {
  UserCheck, UserX, Search, Filter, CheckCircle,
  XCircle, Clock, Eye, Mail, Phone, Linkedin,
  GraduationCap, Building, MapPin, Calendar
>>>>>>> 77a6fd9 (Updated feature / fixed bug / added new changes):frontend/src/app/admin/approvals/alumni/page.tsx
} from 'lucide-react';

interface AlumniApproval {
  id: number;
  auth0Id?: string;
  name: string;
  email: string;
  phone?: string;
  graduationYear: number;
  major: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  linkedinUrl?: string;
  bio?: string;
  skills?: string[];
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const statusBadge = (status: string) => {
  switch (status) {
    case 'pending':  return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" />Pending</span>;
    case 'approved': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200"><CheckCircle className="w-3 h-3" />Approved</span>;
    case 'rejected': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" />Rejected</span>;
    default: return null;
  }
};

export default function AlumniApprovalsPage() {
  const [filter, setFilter] = useState<FilterType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [alumniList, setAlumniList] = useState<AlumniApproval[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/users', { cache: 'no-store' });
      if (!resp.ok) throw new Error('Failed to fetch alumni');
      const data = await resp.json();
      const users = data.alumni || data.users || [];
      const alumniUsers = users.filter((u: any) => String(u.user_type || u.type || '').toLowerCase() === 'alumni');
      const mapped: AlumniApproval[] = alumniUsers.map((u: any) => {
        let skills: string[] = [];
        if (Array.isArray(u.skills)) skills = u.skills;
        else if (typeof u.skills === 'string') skills = u.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        else if (Array.isArray(u.tags)) skills = u.tags;
        else if (typeof u.tags === 'string') skills = u.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
        return {
          id: u.id, auth0Id: u.auth0_id || u.auth0Id || null,
          name: u.name || u.email || 'Unnamed', email: u.email || '',
          phone: u.phone || u.contact_number || '',
          graduationYear: u.graduation_year || u.graduationYear || null,
          major: u.major || u.branch || '', company: u.company || u.current_company || '',
          jobTitle: u.job_title || u.current_position || '', location: u.location || u.city || '',
          linkedinUrl: u.linkedin_url || u.linkedin || '', bio: u.bio || u.summary || '',
          skills, submittedAt: u.created_at || u.submitted_at || '',
          status: (u.approval_status || u.status || 'pending').toLowerCase() as AlumniApproval['status']
        };
      });
      setAlumniList(mapped);
    } catch (e) { console.error('Failed to load alumni approvals', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlumni(); }, []);

  const handleApprove = async (alumniIdOrAuth0: number | string) => {
    if (!confirm('Approve this alumni?')) return;
    try {
      const payload: any = { approval_status: 'approved' };
      if (typeof alumniIdOrAuth0 === 'string') payload.auth0_id = alumniIdOrAuth0; else payload.id = alumniIdOrAuth0;
      const resp = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) {
        let details = 'unknown error';
        try { const d = await resp.json(); details = d?.details || d?.error || JSON.stringify(d); } catch { try { details = await resp.text(); } catch {} }
        alert('Approve failed: ' + details); return;
      }
      await fetchAlumni(); setSelectedAlumni(null);
    } catch { alert('Failed to approve'); }
  };

  const handleReject = async (alumniIdOrAuth0: number | string, reason: string) => {
    if (!confirm('Reject this alumni?')) return;
    try {
      const payload: any = { approval_status: 'rejected', reason };
      if (typeof alumniIdOrAuth0 === 'string') payload.auth0_id = alumniIdOrAuth0; else payload.id = alumniIdOrAuth0;
      const resp = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) {
        let details = 'unknown error';
        try { const d = await resp.json(); details = d?.details || d?.error || JSON.stringify(d); } catch { try { details = await resp.text(); } catch {} }
        alert('Reject failed: ' + details); return;
      }
      await fetchAlumni(); setShowRejectionModal(false); setSelectedAlumni(null); setRejectionReason('');
    } catch { alert('Failed to reject'); }
  };

  const counts = { all: alumniList.length, pending: alumniList.filter(a => a.status === 'pending').length, approved: alumniList.filter(a => a.status === 'approved').length, rejected: alumniList.filter(a => a.status === 'rejected').length };
  const filteredAlumni = alumniList.filter(a => {
    const matchFilter = filter === 'all' || a.status === filter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.major.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const filterBtns: { key: FilterType; label: string; activeColor: string }[] = [
    { key: 'all',      label: `All (${counts.all})`,           activeColor: 'bg-gray-700 text-white' },
    { key: 'pending',  label: `Pending (${counts.pending})`,   activeColor: 'bg-amber-500 text-white' },
    { key: 'approved', label: `Approved (${counts.approved})`, activeColor: 'bg-green-600 text-white' },
    { key: 'rejected', label: `Rejected (${counts.rejected})`, activeColor: 'bg-red-500 text-white' },
  ];

  return (
    <AdminNavigation>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><UserCheck className="w-6 h-6 text-green-600" />Alumni Approvals</h1>
            <p className="text-gray-500 text-sm mt-1">Review and approve alumni registration requests</p>
          </div>
          <div className="flex gap-3">
            {[
              { label: 'Pending', value: counts.pending, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
              { label: 'Approved', value: counts.approved, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
            ].map(s => (
              <div key={s.label} className={`px-4 py-2 rounded-xl border ${s.bg} text-center`}>
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wide ${s.color} opacity-70`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email or major…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {filterBtns.map(b => (
              <button key={b.key} onClick={() => setFilter(b.key)} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${filter === b.key ? b.activeColor : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{b.label}</button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-14 bg-white rounded-2xl border border-gray-100">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-green-500 mr-3" />
            <p className="text-sm text-gray-400">Loading requests…</p>
          </div>
        ) : filteredAlumni.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"><UserCheck className="w-6 h-6 text-gray-300" /></div>
            <p className="font-bold text-gray-900 text-sm">No alumni found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlumni.map(alumni => (
              <div key={alumni.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 text-sm font-black flex items-center justify-center shrink-0">
                    {alumni.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-gray-900 text-sm">{alumni.name}</p>
                      {statusBadge(alumni.status)}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 mb-2">
                      <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{alumni.major} • Class of {alumni.graduationYear}</span>
                      {alumni.company && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{alumni.jobTitle} @ {alumni.company}</span>}
                      {alumni.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alumni.location}</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] mb-2">
                      <a href={`mailto:${alumni.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail className="w-3 h-3" />{alumni.email}</a>
                      {alumni.phone && <span className="flex items-center gap-1 text-gray-500"><Phone className="w-3 h-3" />{alumni.phone}</span>}
                      {alumni.linkedinUrl && <a href={alumni.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline"><Linkedin className="w-3 h-3" />LinkedIn</a>}
                    </div>
                    {alumni.bio && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{alumni.bio}</p>}
                    {alumni.skills && alumni.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {alumni.skills.slice(0, 6).map((sk, i) => <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-semibold">{sk}</span>)}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400">Submitted {alumni.submittedAt ? new Date(alumni.submittedAt).toLocaleDateString() : '—'}</p>
                  </div>

                  {/* Actions */}
                  {alumni.status === 'pending' && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button onClick={() => setSelectedAlumni(alumni)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                        <Eye className="w-3 h-3" />View
                      </button>
                      <button onClick={() => handleApprove(alumni.auth0Id ?? alumni.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors">
                        <CheckCircle className="w-3 h-3" />Approve
                      </button>
                      <button onClick={() => { setSelectedAlumni(alumni); setShowRejectionModal(true); }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">
                        <UserX className="w-3 h-3" />Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && selectedAlumni && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reject Alumni Application</h3>
            <p className="text-sm text-gray-500 mb-4">You are rejecting <strong>{selectedAlumni.name}</strong>'s application. Please provide a reason:</p>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Enter rejection reason…" rows={4} className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowRejectionModal(false); setRejectionReason(''); }} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleReject(selectedAlumni.auth0Id ?? selectedAlumni.id, rejectionReason)} disabled={!rejectionReason.trim()} className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Reject Application</button>
            </div>
          </div>
        </div>
      )}
    </AdminNavigation>
  );
}
