"use client";

import React, { useState, useEffect } from 'react';
import AdminNavigation from '../../AdminNavigation';
import { 
  UserCheck, UserX, Search, Filter, CheckCircle, 
  XCircle, Clock, Eye, Mail, Phone, Linkedin, 
  GraduationCap, Building, MapPin, Calendar 
} from 'lucide-react';

interface AlumniApproval {
  id: number;
  auth0Id?: string;
  name: string;
  email: string;
  userType?: string;
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

export default function AlumniApprovalsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Mock data
  const [alumniList, setAlumniList] = useState<AlumniApproval[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/users', { cache: 'no-store' });
      if (!resp.ok) throw new Error('Failed to fetch alumni');
      const data = await resp.json();
      const users = data.alumni || data.users || [];
      // Only consider users who are alumni
      const alumniUsers = users.filter((u: any) => String(u.user_type || u.type || '').toLowerCase() === 'alumni');
      const mapped = alumniUsers.map((u: any) => {
        // Normalize skills to an array
        let skills: string[] = [];
        if (Array.isArray(u.skills)) skills = u.skills;
        else if (typeof u.skills === 'string') skills = u.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        else if (Array.isArray(u.tags)) skills = u.tags;
        else if (typeof u.tags === 'string') skills = u.tags.split(',').map((s: string) => s.trim()).filter(Boolean);

        return {
          id: u.id,
          auth0Id: u.auth0_id || u.auth0Id || null,
          userType: u.user_type || u.type || '',
          name: u.name || u.email || 'Unnamed',
          email: u.email || '',
          phone: u.phone || u.contact_number || '',
          graduationYear: u.graduation_year || u.graduationYear || null,
          major: u.major || u.branch || '',
          company: u.company || u.current_company || '',
          jobTitle: u.job_title || u.current_position || '',
          location: u.location || u.city || '',
          linkedinUrl: u.linkedin_url || u.linkedin || '',
          bio: u.bio || u.summary || '',
          skills,
          submittedAt: u.created_at || u.submitted_at || '',
          status: (u.approval_status || u.status || 'pending').toLowerCase()
        };
      });
      setAlumniList(mapped);
    } catch (e) {
      console.error('Failed to load alumni approvals', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlumni(); }, []);

  const handleApprove = async (alumniIdOrAuth0: number | string) => {
    if (!confirm('Approve this alumni?')) return;
    try {
      // Use server-side proxy so it can attach admin/management token
      const payload: any = { approval_status: 'approved' };
      if (typeof alumniIdOrAuth0 === 'string') payload.auth0_id = alumniIdOrAuth0; else payload.id = alumniIdOrAuth0;
      const resp = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) {
        let details = 'unknown error';
        try { const d = await resp.json(); details = d && (d.details || d.error || JSON.stringify(d)); } catch { try { details = await resp.text(); } catch {} }
        console.error('Approve failed upstream:', resp.status, details);
        alert('Approve failed: ' + details);
        return;
      }
      await fetchAlumni();
      setSelectedAlumni(null);
    } catch (e) {
      console.error('Approve error', e);
      alert('Failed to approve');
    }
  };

  const handleReject = async (alumniIdOrAuth0: number | string, reason: string) => {
    if (!confirm('Reject this alumni?')) return;
    try {
      // Use server-side proxy for reject as well
      const payload: any = { approval_status: 'rejected', reason };
      if (typeof alumniIdOrAuth0 === 'string') payload.auth0_id = alumniIdOrAuth0; else payload.id = alumniIdOrAuth0;
      const resp = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) {
        let details = 'unknown error';
        try { const d = await resp.json(); details = d && (d.details || d.error || JSON.stringify(d)); } catch { try { details = await resp.text(); } catch {} }
        console.error('Reject failed upstream:', resp.status, details);
        alert('Reject failed: ' + details);
        return;
      }
      await fetchAlumni();
      setShowRejectionModal(false);
      setSelectedAlumni(null);
      setRejectionReason('');
    } catch (e) {
      console.error('Reject error', e);
      alert('Failed to reject');
    }
  };

  const filteredAlumni = alumniList.filter(alumni => {
    const matchesFilter = filter === 'all' || alumni.status === filter;
    const matchesSearch = alumni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alumni.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alumni.major.toLowerCase().includes(searchQuery.toLowerCase());
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

  return (
    <AdminNavigation>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alumni Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve alumni registration requests</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or major..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({alumniList.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({alumniList.filter(a => a.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved ({alumniList.filter(a => a.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({alumniList.filter(a => a.status === 'rejected').length})
              </button>
            </div>
          </div>
        </div>

        {/* Alumni List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAlumni.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No alumni found</h3>
              <p className="text-gray-600">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredAlumni.map((alumni) => (
              <div key={alumni.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xl">
                        {alumni.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{alumni.name}</h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center"><GraduationCap className="w-4 h-4 mr-1" />{alumni.major}</span>
                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />Class of {alumni.graduationYear}</span>
                          </div>
                          {alumni.company && (
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center"><Building className="w-4 h-4 mr-1" />{alumni.jobTitle} at {alumni.company}</span>
                              {alumni.location && <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{alumni.location}</span>}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(alumni.status)}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <a href={`mailto:${alumni.email}`} className="flex items-center text-blue-600 hover:text-blue-700">
                          <Mail className="w-4 h-4 mr-1" />{alumni.email}
                        </a>
                        {alumni.phone && (
                          <span className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-1" />{alumni.phone}
                          </span>
                        )}
                        {alumni.linkedinUrl && (
                          <a href={alumni.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-700">
                            <Linkedin className="w-4 h-4 mr-1" />LinkedIn
                          </a>
                        )}
                      </div>

                      {/* Bio */}
                      {alumni.bio && (
                        <p className="mt-3 text-sm text-gray-700 line-clamp-2">{alumni.bio}</p>
                      )}

                      {/* Skills */}
                      {Array.isArray(alumni.skills) && alumni.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {alumni.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Submitted Time */}
                      <p className="mt-3 text-xs text-gray-500">Submitted {alumni.submittedAt}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {alumni.status === 'pending' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedAlumni(alumni)}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleApprove(alumni.auth0Id ?? alumni.id)}
                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium text-sm flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAlumni(alumni);
                          setShowRejectionModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium text-sm flex items-center"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && selectedAlumni && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Alumni Application</h3>
            <p className="text-gray-600 mb-4">
              You are about to reject <strong>{selectedAlumni.name}</strong>'s application. 
              Please provide a reason for rejection:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedAlumni.auth0Id ?? selectedAlumni.id, rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminNavigation>
  );
}
