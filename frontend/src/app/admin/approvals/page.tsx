"use client";

import React, { useState, useEffect } from 'react';
import AdminNavigation from '../AdminNavigation/AdminNavigation';
import { Switch } from '@/components/ui/switch';
import {
  UserCheck, UserX, Search, Filter, CheckCircle,
  XCircle, Clock, Eye, Mail, Phone, Linkedin,
  GraduationCap, Building, MapPin, Calendar, Sparkles
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
    case 'approved': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-red-700 border border-purple-200"><CheckCircle className="w-3 h-3" />Approved</span>;
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
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [autoApproveLoading, setAutoApproveLoading] = useState(false);
  const [autoApproveSaving, setAutoApproveSaving] = useState(false);

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

  const fetchAutoApproveSetting = async () => {
    setAutoApproveLoading(true);
    try {
      const resp = await fetch('/api/admin/settings/alumni-auto-approve', { cache: 'no-store' });
      if (!resp.ok) throw new Error('Failed to fetch setting');
      const data = await resp.json();
      setAutoApproveEnabled(!!data?.enabled);
    } catch (e) {
      console.error('Failed to load alumni auto-approve setting', e);
    } finally {
      setAutoApproveLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
    fetchAutoApproveSetting();
  }, []);

  const handleAutoApproveToggle = async (enabled: boolean) => {
    const previous = autoApproveEnabled;
    setAutoApproveEnabled(enabled);
    setAutoApproveSaving(true);
    try {
      const resp = await fetch('/api/admin/settings/alumni-auto-approve', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!resp.ok) {
        let details = 'unknown error';
        try { const d = await resp.json(); details = d?.details || d?.error || JSON.stringify(d); } catch { try { details = await resp.text(); } catch {} }
        throw new Error(details);
      }
      setAutoApproveEnabled(enabled);
    } catch (e: any) {
      setAutoApproveEnabled(previous);
      alert(`Failed to update auto-approve setting: ${e?.message || 'unknown error'}`);
    } finally {
      setAutoApproveSaving(false);
    }
  };

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
    { key: 'approved', label: `Approved (${counts.approved})`, activeColor: 'bg-red-100 text-red-700 border border-red-200' },
    { key: 'rejected', label: `Rejected (${counts.rejected})`, activeColor: 'bg-red-500 text-white' },
  ];

  return (
    <AdminNavigation>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-purple-50 rounded-[20px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-purple-100 gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-red-500 font-semibold mb-2">
              <Sparkles className="w-[18px] h-[18px]" />
              <span className="text-sm tracking-wide">Admin Actions</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2 flex items-center gap-2">Alumni Approvals</h1>
            <p className="text-gray-600 text-[15px] sm:text-base">Review and approve alumni registration requests</p>
            <div className={`mt-4 inline-flex items-center gap-3 rounded-2xl px-3.5 py-2.5 border shadow-sm transition-colors ${autoApproveEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-white/80 border-purple-100'}`}>
              <Switch
                checked={autoApproveEnabled}
                onCheckedChange={handleAutoApproveToggle}
                disabled={autoApproveLoading || autoApproveSaving}
                className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-300"
                aria-label="Auto approve alumni registrations"
              />
              <div>
                <p className={`text-xs font-extrabold tracking-wide ${autoApproveEnabled ? 'text-emerald-800' : 'text-gray-900'}`}>Auto Approve Alumni</p>
                <p className={`text-[11px] ${autoApproveEnabled ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {autoApproveEnabled ? 'ON: New alumni registrations are approved automatically.' : 'OFF: Alumni registrations require manual review.'}
                </p>
              </div>
              {(autoApproveLoading || autoApproveSaving) ? (
                <span className="text-[11px] font-semibold text-slate-500">Saving...</span>
              ) : (
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${autoApproveEnabled ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {autoApproveEnabled ? 'Auto-Approve On' : 'Auto-Approve Off'}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            {[
              { label: 'Pending', value: counts.pending, color: 'text-amber-700', bg: 'bg-white/60 border-white/50 shadow-sm' },
              { label: 'Approved', value: counts.approved, color: 'text-red-600', bg: 'bg-white/60 border-white/50 shadow-sm' },
            ].map(s => (
              <div key={s.label} className={`px-5 py-3 rounded-2xl border ${s.bg} text-center min-w-[110px]`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${s.color} opacity-70 mt-0.5`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email or major…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400" />
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
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-red-500 mr-3" />
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
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-red-700 text-sm font-black flex items-center justify-center shrink-0">
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
                        {alumni.skills.slice(0, 6).map((sk, i) => <span key={i} className="px-2 py-0.5 bg-purple-50 text-red-700 border border-purple-200 rounded-full text-[10px] font-semibold">{sk}</span>)}
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
                      <button onClick={() => handleApprove(alumni.auth0Id ?? alumni.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
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

      {/* View Modal */}
      {selectedAlumni && !showRejectionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 text-red-700 text-2xl font-black flex items-center justify-center shrink-0">
                  {selectedAlumni.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight flex items-center gap-2">
                    {selectedAlumni.name}
                    {statusBadge(selectedAlumni.status)}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{selectedAlumni.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAlumni(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                <XCircle className="w-7 h-7" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                   <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><GraduationCap className="w-4 h-4" />Education</p>
                  <p className="text-base font-semibold text-gray-900">{selectedAlumni.major}</p>
                  <p className="text-sm text-gray-600">Class of {selectedAlumni.graduationYear}</p>
                </div>
                <div>
                   <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Building className="w-4 h-4" />Current Role</p>
                  <p className="text-base font-semibold text-gray-900">{selectedAlumni.jobTitle || 'Not specified'}</p>
                  <p className="text-sm text-gray-600">{selectedAlumni.company || ''}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                   <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4" />Contact</p>
                  <div className="space-y-2.5">
                    {selectedAlumni.phone && <p className="text-sm text-gray-900 flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400 shrink-0" /> {selectedAlumni.phone}</p>}
                    {selectedAlumni.location && <p className="text-sm text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400 shrink-0" /> {selectedAlumni.location}</p>}
                  </div>
                </div>
                {selectedAlumni.linkedinUrl && (
                  <div>
                     <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Linkedin className="w-4 h-4" />Social</p>
                    <a href={selectedAlumni.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            {selectedAlumni.bio && (
              <div className="mb-8">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">About / Bio</p>
                <div className="bg-purple-50/50 p-4 rounded-2xl text-sm text-gray-700 leading-relaxed border border-purple-100/50">
                  {selectedAlumni.bio}
                </div>
              </div>
            )}

            {selectedAlumni.skills && selectedAlumni.skills.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Skills &amp; Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAlumni.skills.map((sk: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-purple-50 text-red-700 border border-purple-200 rounded-full text-xs font-semibold">{sk}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-gray-100 mt-8">
              <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">Submitted {new Date(selectedAlumni.submittedAt).toLocaleDateString()}</span>
              {selectedAlumni.status === 'pending' && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => setShowRejectionModal(true)} className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">
                    Reject
                  </button>
                  <button onClick={() => { handleApprove(selectedAlumni.auth0Id ?? selectedAlumni.id); }} className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 shadow-sm transition-all">
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedAlumni && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reject Alumni Application</h3>
            <p className="text-sm text-gray-500 mb-4">You are rejecting <strong>{selectedAlumni.name}</strong>'s application. Please provide a reason:</p>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Enter rejection reason…" rows={4} className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowRejectionModal(false); setRejectionReason(''); }} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleReject(selectedAlumni.auth0Id ?? selectedAlumni.id, rejectionReason)} disabled={!rejectionReason.trim()} className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Reject Application</button>
            </div>
          </div>
        </div>
      )}
    </AdminNavigation>
  );
}
