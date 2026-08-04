'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Upload, CheckCircle, Loader, Sparkles, FileText, Send, BookOpen } from 'lucide-react';
import StudentNavigation from '../StudentNavigation';
import { toast } from 'sonner';

interface Alumni {
  email: string;
  name: string;
  picture?: string;
  skills?: string;
  job_title?: string;
  isConnected?: boolean;
  connectionStatus?: 'none' | 'pending' | 'accepted';
}

interface UploadedResume {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

interface ResumeRequest {
  id: number;
  student_email: string;
  alumni_email: string;
  alumni_name?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  alumni_feedback?: string;
  requested_at: string;
}

function StudentResumeReviewContent() {
  const { user, isLoading: userLoading } = useUser();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [selectedAlumni, setSelectedAlumni] = useState('');
  const [resume, setResume] = useState<UploadedResume | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<ResumeRequest[]>([]);
  const [showMoreRestAlumni, setShowMoreRestAlumni] = useState(false);

  const userEmail = user?.email as string || '';
  const userName = user?.name as string || '';

  useEffect(() => {
    console.log('[STUDENT PAGE] User loaded:', { userEmail, userName, user });
  }, [user, userEmail, userName]);

  const myMentors = useMemo(() => alumni.filter(a => a.isConnected), [alumni]);
  const restMentors = useMemo(() => alumni.filter(a => !a.isConnected), [alumni]);
  const restMentorsToShow = showMoreRestAlumni ? restMentors : restMentors.slice(0, 5);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const query = userEmail ? `?student_email=${encodeURIComponent(userEmail)}` : '';
        const response = await fetch(`/api/resume-reviews/mentors${query}`);
        const data = await response.json();
        setAlumni(data.mentors || []);
      } catch (error) {
        console.error('Error fetching alumni:', error);
      }
    };

    const fetchRequests = async () => {
      if (!userEmail) return;
      try {
        const response = await fetch(`/api/resume-reviews/student/${encodeURIComponent(userEmail)}`);
        const data = await response.json();
        setRequests(data.reviews || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    if (!userLoading) {
      fetchAlumni();
      if (userEmail) fetchRequests();
    }
  }, [userEmail, userLoading]);

  const handleResumeUpload = async (file: File | undefined) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      console.log('[RESUME UPLOAD] Starting upload for:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const response = await fetch('/api/upload/review-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('[RESUME UPLOAD] Response:', data);
      
      if (!response.ok) {
        const errorMsg = data.error || `Upload failed with status ${response.status}`;
        console.error('[RESUME UPLOAD] Error response:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!data.url) {
        throw new Error('No upload URL returned from server');
      }
      
      setResume(data);
      console.log('[RESUME UPLOAD] Success! URL:', data.url);
    } catch (error) {
      console.error('[RESUME UPLOAD] Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload resume';
      alert(`Upload failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedAlumni || !resume) {
      alert('Please select an alumni and upload your resume');
      return;
    }
    
    if (!userEmail) {
      alert('User email not available. Please refresh and try again.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        student_email: userEmail,
        alumni_email: selectedAlumni,
        resume_url: resume.url,
        filename: resume.filename,
        student_message: message,
      };
      
      console.log('[STUDENT PAGE] Submitting:', payload);
      
      const response = await fetch('/api/resume-reviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('[STUDENT PAGE] Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Request submission failed');
      }
      
      setSelectedAlumni('');
      setResume(null);
      setMessage('');
      
      const updatedResponse = await fetch(`/api/resume-reviews/student/${encodeURIComponent(userEmail)}`);
      const updatedData = await updatedResponse.json();
      setRequests(updatedData.reviews || []);
      
      toast.success('Resume review request sent successfully!');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(`Failed to submit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6 md:p-8 font-sans">
      {/* Header Banner */}
      <div className="bg-[#1A1B23] rounded-[32px] p-8 md:p-10 relative overflow-hidden shadow-2xl border border-white/5">
        {/* Subtle background wave/gradient */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-[12px] uppercase tracking-[0.1em] mb-4">
            <Sparkles size={16} />
            <span>Get Professional Feedback</span>
          </div>
          <h1 className="text-4xl md:text-[48px] font-black text-white mb-3 tracking-[-0.02em]">
            Resume Review
          </h1>
          <p className="text-gray-400 text-[16px] font-medium max-w-2xl leading-relaxed">
            Connect with experienced alumni mentors to improve your resume. Get detailed feedback to land your dream job.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Form - Left Side */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 md:p-10 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#11233f]" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#11233f]">Submit Request</h2>
          </div>

          {/* Mentor Selection - Two Dropdowns */}
          {alumni.length > 0 ? (
            <div className="space-y-6">
              {/* Dropdown 1: Your Mentors */}
              {myMentors.length > 0 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em]">
                    <CheckCircle className="w-3.5 h-3.5 text-[#11233f]" />
                    Your Mentors (Direct Access)
                  </label>
                  <select
                    value={selectedAlumni}
                    onChange={(e) => setSelectedAlumni(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 bg-white rounded-[14px] focus:outline-none focus:ring-2 focus:ring-gray-300 font-medium text-slate-900 cursor-pointer transition"
                  >
                    <option value="">Choose from your mentors...</option>
                    {myMentors.map((a) => (
                      <option key={a.email} value={a.email}>
                        {a.name} {a.job_title && `(${a.job_title})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dropdown 2: Other Mentors with Show/Hide */}
              {restMentors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em]">Other Alumni</label>
                    {restMentors.length > 5 && (
                      <button
                        onClick={() => setShowMoreRestAlumni(!showMoreRestAlumni)}
                        className="text-[11px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-800 transition"
                      >
                        {showMoreRestAlumni ? `Show Less (${restMentors.length})` : `Show More (${restMentors.length})`}
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedAlumni}
                    onChange={(e) => setSelectedAlumni(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 bg-white rounded-[14px] focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 cursor-pointer transition"
                  >
                    <option value="">Choose from other mentors...</option>
                    {restMentorsToShow.map((a) => (
                      <option key={a.email} value={a.email}>
                        {a.name} {a.job_title && `(${a.job_title})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {myMentors.length === 0 && restMentors.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-[14px]">
                  <p className="text-yellow-700 text-sm font-medium">Loading mentors or no approved mentors available.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-gray-100 rounded-[14px]">
              <p className="text-slate-600 text-sm font-medium">Loading mentors...</p>
            </div>
          )}

          {/* Resume Upload */}
          <div className="space-y-2 mt-6">
            <label className="block text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em]">Upload Resume</label>
            <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-10 text-center hover:border-gray-300 hover:bg-gray-50 transition cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleResumeUpload(e.target.files?.[0])}
                className="hidden"
                id="resume-input"
                disabled={loading}
              />
              <label htmlFor="resume-input" className="cursor-pointer block">
                {resume ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-semibold">{resume.filename}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Click to upload resume</p>
                      <p className="text-xs text-slate-500">PDF, DOC, DOCX, or TXT (Max 5MB)</p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2 mt-6">
            <label className="block text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em]">Additional Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the mentor what specific feedback you'd like..."
              className="w-full px-4 py-3 border border-slate-300 rounded-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 text-slate-700 font-medium"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitRequest}
            disabled={loading || !selectedAlumni || !resume}
            className="w-full bg-[#16161c] hover:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-[14px] transition flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>

        {/* Stats Card - Right Side */}
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-[#11233f]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#11233f]">Your Reviews</h3>
          </div>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">No requests yet. Submit one above!</p>
            ) : (
              <>
                <div className="bg-white rounded-[12px] p-4 border border-gray-100">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">TOTAL REQUESTS</p>
                  <p className="text-3xl font-bold text-[#16161c] mt-2">{requests.length}</p>
                </div>
                <div className="bg-white rounded-[12px] p-4 border border-gray-100">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">PENDING</p>
                  <p className="text-2xl font-bold text-amber-600">{requests.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="bg-white rounded-[12px] p-4 border border-gray-100">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">COMPLETED</p>
                  <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'completed').length}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Past Requests */}
      {requests.length > 0 && (
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="text-[#16161c]" size={24} />
            <h2 className="text-xl font-bold text-slate-900">Review Requests History</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <div key={req.id} className="border border-gray-100 rounded-[16px] p-5 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{req.alumni_name || 'Alumni Mentor'}</p>
                    <p className="text-xs text-slate-600 mt-1">{req.alumni_email}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(req.requested_at).toLocaleString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ml-2 ${
                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    req.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                    req.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>
                {req.alumni_feedback && (
                  <div className="bg-green-50 border border-green-200 rounded-[12px] p-3 mt-3">
                    <p className="text-xs font-bold text-green-900 mb-1">Feedback:</p>
                    <p className="text-xs text-green-800 line-clamp-2">{req.alumni_feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentResumeReview() {
  return (
    <StudentNavigation>
      <StudentResumeReviewContent />
    </StudentNavigation>
  );
}
