"use client";

import React, { useState, useEffect } from 'react';
import AdminNavigation from '../../AdminNavigation';
import { 
  UserCheck, UserX, Search, Filter, CheckCircle, 
  XCircle, Clock, Eye, Mail, Phone, Linkedin, 
  GraduationCap, Building, MapPin, Calendar 
} from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../../../hooks/useAuth0Token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

interface AlumniApproval {
  id: number;
  auth0_id?: string;
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
  approval_status?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AlumniApprovalsPage() {
  const { user, isLoading: userLoading } = useUser();
  const { token: accessToken, tokenLoading } = useAuth0Token();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alumniList, setAlumniList] = useState<AlumniApproval[]>([]);

  // Load alumni data from backend
  useEffect(() => {
    async function loadAlumni() {
      if (userLoading || tokenLoading || !user || !accessToken) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE}/api/users?type=alumni&limit=100`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to load alumni data');
          } else {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error('Server returned invalid response. Backend may be down.');
        }
        
        const data = await response.json();
        const users = data.users || [];
        
        // Transform backend data to match our interface
        const transformedAlumni: AlumniApproval[] = users.map((u: any) => ({
          id: u.id,
          auth0_id: u.auth0_id,
          name: u.name || 'Unknown',
          email: u.email,
          phone: u.phone,
          graduationYear: u.graduation_year || new Date().getFullYear(),
          major: u.major || 'Not specified',
          company: u.company,
          jobTitle: u.job_title,
          location: u.location,
          linkedinUrl: u.linkedin_url,
          bio: u.bio,
          skills: u.skills ? u.skills.split(',') : [],
          submittedAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown',
          status: (u.approval_status || 'pending') as 'pending' | 'approved' | 'rejected',
          approval_status: u.approval_status,
          created_at: u.created_at,
          updated_at: u.updated_at,
        }));
        
        setAlumniList(transformedAlumni);
      } catch (err: any) {
        console.error('Error loading alumni:', err);
        setError(err.message || 'Failed to load alumni data');
      } finally {
        setLoading(false);
      }
    }
    
    loadAlumni();
  }, [user, userLoading, accessToken, tokenLoading]);

  // Test data fallback (keep some test data for demonstration)
  useEffect(() => {
    if (!userLoading && !tokenLoading && alumniList.length === 0 && !error) {
      const testData: AlumniApproval[] = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+91 98765 43210',
          graduationYear: 2020,
          major: 'Computer Science',
          company: 'Google',
          jobTitle: 'Software Engineer',
          location: 'Mumbai, India',
          linkedinUrl: 'https://linkedin.com/in/johndoe',
          bio: 'Passionate software engineer with 4 years of experience in full-stack development.',
          skills: ['React', 'Node.js', 'Python', 'AWS'],
          submittedAt: '2 hours ago',
          status: 'pending'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          graduationYear: 2019,
          major: 'Mechanical Engineering',
          company: 'Tesla',
          jobTitle: 'Mechanical Design Engineer',
          location: 'Bangalore, India',
          bio: 'Experienced mechanical engineer specializing in automotive design.',
          skills: ['CAD', 'SolidWorks', 'FEA', 'Product Design'],
          submittedAt: '5 hours ago',
          status: 'pending'
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike.j@example.com',
          graduationYear: 2018,
          major: 'Electrical Engineering',
          company: 'Intel',
          jobTitle: 'Hardware Engineer',
          location: 'Pune, India',
          submittedAt: '1 day ago',
          status: 'approved'
        }
      ];
      setAlumniList(testData);
    }
  }, [userLoading, tokenLoading, alumniList.length, error]);

  const handleApprove = async (alumniId: number) => {
    if (!user || !accessToken) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${alumniId}/approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          approval_status: 'approved'
        }),
      });
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to approve alumni');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }
      
      // Update local state
      setAlumniList(alumniList.map(a => 
        a.id === alumniId ? { ...a, status: 'approved' as const } : a
      ));
      setSelectedAlumni(null);
      
      alert('Alumni approved successfully!');
    } catch (err: any) {
      alert(`Error approving alumni: ${err.message}`);
    }
  };

  const handleReject = async (alumniId: number, reason: string) => {
    if (!user || !accessToken) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${alumniId}/approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          approval_status: 'rejected',
          rejection_reason: reason
        }),
      });
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reject alumni');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }
      
      // Update local state
      setAlumniList(alumniList.map(a => 
        a.id === alumniId ? { ...a, status: 'rejected' as const } : a
      ));
      setShowRejectionModal(false);
      setSelectedAlumni(null);
      setRejectionReason('');
      
      alert('Alumni rejected successfully!');
    } catch (err: any) {
      alert(`Error rejecting alumni: ${err.message}`);
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Alumni</h3>
                <p className="text-red-700 text-sm">{error}</p>
                {error.includes('Backend may be down') && (
                  <p className="text-red-600 text-sm mt-2">
                    💡 Make sure the backend server is running on port 4000
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading alumni...</h3>
              <p className="text-gray-600">Please wait while we fetch the data</p>
            </div>
          ) : filteredAlumni.length === 0 ? (
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
                      {alumni.skills && alumni.skills.length > 0 && (
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
                        onClick={() => handleApprove(alumni.id)}
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
                onClick={() => handleReject(selectedAlumni.id, rejectionReason)}
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
