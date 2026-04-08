'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Download, CheckCircle, XCircle, MessageSquare, Loader, Sparkles, Award, FileText, Send } from 'lucide-react';
import AluminaNavigation from '../AluminaNavigation';
import { toast } from 'sonner';

interface ResumeRequest {
  id: number;
  student_email: string;
  alumni_email: string;
  student_name: string;
  resume_url: string;
  download_url?: string | null;
  filename: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  student_message?: string;
  alumni_feedback?: string;
  requested_at: string;
  accepted_at?: string;
  completed_at?: string;
  rejected_at?: string;
}

interface Stats {
  pending: number;
  accepted: number;
  completed: number;
  rejected: number;
}

function AlumniResumeReviewsContent() {
  const { user, isLoading: userLoading } = useUser();
  const [requests, setRequests] = useState<ResumeRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, accepted: 0, completed: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ visible: boolean; requestId?: number }>({ visible: false });
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const userEmail = user?.email as string || '';

  const getPreviewUrl = (resumeUrl?: string, filename?: string) => {
    if (!resumeUrl) return '';
    const safeName = filename && filename.trim() ? filename.trim() : 'resume.pdf';
    return `/api/files/preview?url=${encodeURIComponent(resumeUrl)}&filename=${encodeURIComponent(safeName)}`;
  };

  // Helper function to get display name - prioritize student_name field
  const getStudentDisplayName = (req: ResumeRequest) => {
    console.log(`[STUDENT NAME DEBUG] ID: ${req.id}, Name: "${req.student_name}", Email: "${req.student_email}"`);
    
    // Priority 1: Use student_name if it exists and is not empty/null
    if (req.student_name && typeof req.student_name === 'string' && req.student_name.trim().length > 0) {
      return req.student_name.trim();
    }
    
    // Priority 2: Extract readable name from email
    const emailPart = req.student_email?.split('@')[0] || 'Student';
    return emailPart || 'Student';
  };

  useEffect(() => {
    const fetchRequests = async () => {
      if (!userEmail) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/resume-reviews/alumni/${encodeURIComponent(userEmail)}`);
        const data = await response.json();
        console.log('Alumni Requests Data:', data.reviews); // Debug log
        
        // Transform data to ensure clean student_name
        const transformedReviews = (data.reviews || []).map((req: ResumeRequest) => ({
          ...req,
          student_name: req.student_name && req.student_name.trim() ? req.student_name.trim() : null
        }));
        
        console.log('Transformed Reviews:', transformedReviews); // Debug log
        setRequests(transformedReviews);

        // Calculate stats
        const newStats = { pending: 0, accepted: 0, completed: 0, rejected: 0 };
        transformedReviews.forEach((req: ResumeRequest) => {
          if (req.status in newStats) {
            newStats[req.status as keyof Stats]++;
          }
        });
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast.error('Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchRequests();
    }
  }, [userEmail, userLoading]);

  const handleAccept = async (requestId: number) => {
    try {
      const response = await fetch(`/api/resume-reviews/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to accept request');

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: 'accepted', accepted_at: new Date().toISOString() } : req
        )
      );
      setStats((prev) => ({ ...prev, pending: prev.pending - 1, accepted: prev.accepted + 1 }));
      toast.success('Request accepted!');
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await fetch(`/api/resume-reviews/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to reject request');

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: 'rejected', rejected_at: new Date().toISOString() } : req
        )
      );
      setStats((prev) => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
      toast.success('Request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleOpenFeedback = (requestId: number, existingFeedback?: string) => {
    setFeedbackModal({ visible: true, requestId });
    setFeedbackText(existingFeedback || '');
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackModal.requestId) return;

    try {
      setSubmittingFeedback(true);
      const response = await fetch(`/api/resume-reviews/${feedbackModal.requestId}/submit-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumni_feedback: feedbackText }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setRequests((prev) =>
        prev.map((req) =>
          req.id === feedbackModal.requestId
            ? { ...req, status: 'completed', alumni_feedback: feedbackText, completed_at: new Date().toISOString() }
            : req
        )
      );
      setStats((prev) => ({ ...prev, accepted: prev.accepted - 1, completed: prev.completed + 1 }));
      setFeedbackModal({ visible: false });
      setFeedbackText('');
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const groupedRequests = {
    pending: requests.filter((r) => r.status === 'pending'),
    accepted: requests.filter((r) => r.status === 'accepted'),
    completed: requests.filter((r) => r.status === 'completed'),
    rejected: requests.filter((r) => r.status === 'rejected'),
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6 md:p-8 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#fce7f3] to-[#dbeafe] rounded-[28px] p-8 md:p-10 relative overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-pink-600 font-semibold text-[15px] mb-3">
            <Sparkles size={18} className="text-pink-500" />
            <span>Help Students Succeed</span>
          </div>
          <h1 className="text-3xl md:text-[44px] font-extrabold text-slate-900 mb-3 tracking-tight">
            Resume Review Requests
          </h1>
          <p className="text-slate-600 text-[16px] font-medium max-w-2xl">
            Review student resumes and provide valuable feedback to help shape the next generation of professionals.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-[18px] p-5 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-[18px] p-5 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Accepted</p>
          <p className="text-3xl font-bold text-blue-600">{stats.accepted}</p>
        </div>
        <div className="bg-white rounded-[18px] p-5 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-[18px] p-5 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium text-lg">No resume review requests yet.</p>
          <p className="text-slate-500 text-sm mt-2">Students will see your profile when they request reviews.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Requests */}
          {groupedRequests.pending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">Pending ({groupedRequests.pending.length})</h2>
              </div>
              <div className="space-y-4">
                {groupedRequests.pending.map((req) => (
                  <div key={req.id} className="bg-white border border-yellow-200 rounded-[18px] p-6 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-xl mb-1">{getStudentDisplayName(req)}</p>
                        <p className="text-xs text-slate-500 font-medium">{req.student_email}</p>
                        <p className="text-xs text-slate-400 mt-2">{new Date(req.requested_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">New</span>
                    </div>

                    {req.student_message && (
                      <div className="bg-yellow-50 rounded-[12px] p-3 mb-4 border border-yellow-100">
                        <p className="text-xs font-bold text-yellow-900 mb-1">Message:</p>
                        <p className="text-sm text-yellow-900">{req.student_message}</p>
                      </div>
                    )}

                    {req.resume_url ? (
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <a
                          href={getPreviewUrl(req.resume_url, req.filename)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition"
                        >
                          <FileText className="w-4 h-4" />
                          Open Resume
                        </a>
                        <a
                          href={req.download_url || req.resume_url}
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition"
                        >
                          <Download className="w-4 h-4" />
                          {req.filename || 'Download Resume'}
                        </a>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-[12px] p-3 mb-4">
                        <p className="text-xs font-bold text-red-700">⚠️ Resume not available</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-[12px] transition flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-[12px] transition flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(220,38,38,0.3)]"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Accepted Requests - Waiting for Feedback */}
          {groupedRequests.accepted.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">In Progress ({groupedRequests.accepted.length})</h2>
              </div>
              <div className="space-y-4">
                {groupedRequests.accepted.map((req) => (
                  <div key={req.id} className="bg-white border border-blue-200 rounded-[18px] p-6 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-xl mb-1">{getStudentDisplayName(req)}</p>
                        <p className="text-xs text-slate-500 font-medium">{req.student_email}</p>
                        <p className="text-xs text-slate-400 mt-2">Accepted {new Date(req.accepted_at || '').toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">In Review</span>
                    </div>

                    {req.resume_url ? (
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <a
                          href={getPreviewUrl(req.resume_url, req.filename)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition"
                        >
                          <FileText className="w-4 h-4" />
                          Open Resume
                        </a>
                        <a
                          href={req.download_url || req.resume_url}
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition"
                        >
                          <Download className="w-4 h-4" />
                          {req.filename || 'Download Resume'}
                        </a>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-[12px] p-3 mb-4">
                        <p className="text-xs font-bold text-red-700">⚠️ Resume not available</p>
                      </div>
                    )}

                    <button
                      onClick={() => handleOpenFeedback(req.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-[12px] transition flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Provide Feedback
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Completed Requests */}
          {groupedRequests.completed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">Completed ({groupedRequests.completed.length})</h2>
              </div>
              <div className="space-y-4">
                {groupedRequests.completed.map((req) => (
                  <div key={req.id} className="bg-green-50 border border-green-200 rounded-[18px] p-6 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-xl mb-1">{getStudentDisplayName(req)}</p>
                        <p className="text-xs text-slate-500 font-medium">{req.student_email}</p>
                        <p className="text-xs text-slate-400 mt-2">Completed {new Date(req.completed_at || '').toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Complete
                      </span>
                    </div>

                    {req.alumni_feedback && (
                      <div className="bg-white rounded-[12px] p-4 mb-4 border border-green-200">
                        <p className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                          <Award className="w-4 h-4 text-green-600" />
                          Your Feedback
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">{req.alumni_feedback}</p>
                      </div>
                    )}

                    {req.resume_url ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={getPreviewUrl(req.resume_url, req.filename)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm transition"
                        >
                          <FileText className="w-4 h-4" />
                          Open Resume
                        </a>
                        <a
                          href={req.download_url || req.resume_url}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition"
                        >
                          <Download className="w-4 h-4" />
                          {req.filename || 'Download Resume'}
                        </a>
                      </div>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-red-600\">⚠️ Resume not available</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rejected Requests */}
          {groupedRequests.rejected.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">Rejected ({groupedRequests.rejected.length})</h2>
              </div>
              <div className="space-y-4">
                {groupedRequests.rejected.map((req) => (
                  <div key={req.id} className="bg-red-50 border border-red-200 rounded-[18px] p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-xl mb-1">{getStudentDisplayName(req)}</p>
                        <p className="text-xs text-slate-500 font-medium">{req.student_email}</p>
                        <p className="text-xs text-slate-400 mt-2">Rejected {new Date(req.rejected_at || '').toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">Declined</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal.visible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setFeedbackModal({ visible: false })}>
          <div className="bg-white rounded-[32px] max-w-md w-full shadow-[0_20px_60px_rgb(0,0,0,0.1)] overflow-hidden border border-white relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/80 rounded-full blur-[40px] -mt-10 -mr-10 pointer-events-none" />
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-8 py-7 border-b border-slate-200 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                <h3 className="text-2xl font-bold text-slate-900">Provide Feedback</h3>
              </div>
              <p className="text-sm text-slate-600 ml-5">Share constructive feedback to help the student improve their resume</p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-5 relative z-10">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">Your Feedback</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What are their strengths? Areas to improve? Specific suggestions?"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-[14px] bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white text-slate-700 font-medium resize-none transition placeholder-slate-400"
                  rows={6}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setFeedbackModal({ visible: false })}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-3 rounded-[12px] transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback || !feedbackText.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-[12px] transition text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
                >
                  {submittingFeedback ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlumniResumeReviews() {
  return (
    <AluminaNavigation>
      <AlumniResumeReviewsContent />
    </AluminaNavigation>
  );
}
