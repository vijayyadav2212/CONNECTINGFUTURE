'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Download, CheckCircle, XCircle, MessageSquare, Loader, Sparkles, Award, FileText, Send, Clock, UserX } from 'lucide-react';
import AluminaNavigation from '../AluminaNavigation/AlumniNavigation';
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
        
        // Transform data to ensure clean student_name
        const transformedReviews = (data.reviews || []).map((req: ResumeRequest) => ({
          ...req,
          student_name: req.student_name && req.student_name.trim() ? req.student_name.trim() : null
        }));
        
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
    <div className="space-y-8 max-w-[1400px] mx-auto h-full flex flex-col font-sans text-[#111111] mb-12">
      {/* Header Banner */}
      <div className="bg-[#1A1C23] rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-[32px] md:text-[38px] font-bold mb-2 tracking-tight">
            Resume Reviews
          </h1>
          <p className="text-[#8F93A3] text-[14px] font-medium leading-[1.6]">
            Review student resumes and provide valuable feedback to help shape the next generation of professionals.
          </p>
        </div>
        {/* Abstract line art */}
        <svg className="absolute right-0 bottom-0 w-[300px] h-full pointer-events-none opacity-50" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40,70 C60,70 70,30 90,30 C110,30 120,60 140,60 C160,60 170,20 190,20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-50 flex items-start justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">Pending</p>
            <p className="text-[32px] font-extrabold text-[#111111] tracking-tight">{stats.pending}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center shrink-0">
            <Clock size={20} strokeWidth={2.5} />
          </div>
        </div>
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-50 flex items-start justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">Accepted</p>
            <p className="text-[32px] font-extrabold text-[#111111] tracking-tight">{stats.accepted}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center shrink-0">
            <CheckCircle size={20} strokeWidth={2.5} />
          </div>
        </div>
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-50 flex items-start justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">Completed</p>
            <p className="text-[32px] font-extrabold text-[#111111] tracking-tight">{stats.completed}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center shrink-0">
            <Award size={20} strokeWidth={2.5} />
          </div>
        </div>
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-50 flex items-start justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">Rejected</p>
            <p className="text-[32px] font-extrabold text-[#111111] tracking-tight">{stats.rejected}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center shrink-0">
            <XCircle size={20} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-[#1A1C23]" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-gray-50 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-5">
            <FileText size={24} strokeWidth={2} />
          </div>
          <p className="text-gray-900 font-bold text-[18px]">No resume review requests yet.</p>
          <p className="text-gray-500 font-medium text-[14px] mt-2">Students will see your profile when they request reviews.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Left Column: Pending & In Progress */}
          <div className="space-y-8">
            {groupedRequests.pending.length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[22px] font-bold tracking-tight">Pending Requests</h3>
                  <span className="text-[12px] font-bold bg-[#1A1C23] text-white px-3 py-1 rounded-full">
                    {groupedRequests.pending.length} New
                  </span>
                </div>
                <div className="space-y-4">
                  {groupedRequests.pending.map((req) => (
                    <div key={req.id} className="bg-white border border-gray-100 rounded-[24px] p-5 hover:border-gray-200 transition-all shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center font-bold text-[15px] shrink-0">
                            {getStudentDisplayName(req).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-[16px] tracking-tight">{getStudentDisplayName(req)}</p>
                            <p className="text-[13px] font-bold text-gray-400 mt-0.5">{new Date(req.requested_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {req.student_message && (
                        <div className="bg-gray-50 rounded-[16px] p-4 mb-4 border border-gray-100">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Message</p>
                          <p className="text-[14px] font-medium text-gray-800">{req.student_message}</p>
                        </div>
                      )}

                      {req.resume_url ? (
                        <div className="flex gap-2 mb-4">
                          <a href={getPreviewUrl(req.resume_url, req.filename)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-[13px] font-bold rounded-[14px] bg-[#F4F6FB] text-[#1A1C23] hover:bg-gray-200 transition-colors flex items-center gap-2">
                            <FileText size={16} /> Open Resume
                          </a>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-100 rounded-[12px] p-3 mb-4">
                          <p className="text-[13px] font-bold text-gray-500">Resume not available</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => handleAccept(req.id)} className="flex-1 bg-[#1A1C23] hover:bg-black text-white font-bold py-3 rounded-[16px] transition flex items-center justify-center gap-2 text-[14px]">
                          Accept
                        </button>
                        <button onClick={() => handleReject(req.id)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-[16px] transition flex items-center justify-center gap-2 text-[14px]">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedRequests.accepted.length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
                <h3 className="text-[22px] font-bold tracking-tight mb-6">In Progress</h3>
                <div className="space-y-4">
                  {groupedRequests.accepted.map((req) => (
                    <div key={req.id} className="bg-white border border-gray-100 rounded-[24px] p-5 hover:border-gray-200 transition-all shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#1A1C23] flex items-center justify-center font-bold text-[15px] shrink-0">
                            {getStudentDisplayName(req).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-[16px] tracking-tight">{getStudentDisplayName(req)}</p>
                            <p className="text-[13px] font-bold text-gray-400 mt-0.5">Accepted {new Date(req.accepted_at || '').toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-[8px] uppercase tracking-wider border border-gray-200">Reviewing</span>
                      </div>

                      {req.resume_url && (
                        <div className="flex gap-2 mb-4">
                           <a href={getPreviewUrl(req.resume_url, req.filename)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-[13px] font-bold rounded-[14px] bg-[#F4F6FB] text-[#1A1C23] hover:bg-gray-200 transition-colors flex items-center gap-2">
                             <FileText size={16} /> Open Resume
                           </a>
                        </div>
                      )}

                      <button onClick={() => handleOpenFeedback(req.id)} className="w-full bg-[#1A1C23] hover:bg-black text-white font-bold py-3 rounded-[16px] transition flex items-center justify-center gap-2 text-[14px]">
                        <MessageSquare size={16} /> Provide Feedback
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Completed & Rejected */}
          <div className="space-y-8">
            {groupedRequests.completed.length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
                <h3 className="text-[22px] font-bold tracking-tight mb-6">Completed History</h3>
                <div className="space-y-4">
                  {groupedRequests.completed.map((req) => (
                    <div key={req.id} className="bg-gray-50 border border-gray-100 rounded-[24px] p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 text-[#1A1C23] flex items-center justify-center font-bold text-[15px] shrink-0">
                            {getStudentDisplayName(req).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-[16px] tracking-tight">{getStudentDisplayName(req)}</p>
                            <p className="text-[13px] font-bold text-gray-400 mt-0.5">Completed {new Date(req.completed_at || '').toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {req.alumni_feedback && (
                        <div className="bg-white rounded-[16px] p-4 mb-4 border border-gray-100">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Award size={14} className="text-[#1A1C23]" /> Your Feedback
                          </p>
                          <p className="text-[14px] font-medium text-gray-800">{req.alumni_feedback}</p>
                        </div>
                      )}

                      {req.resume_url && (
                        <div className="flex gap-2">
                           <a href={getPreviewUrl(req.resume_url, req.filename)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-[13px] font-bold rounded-[14px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                             <FileText size={16} /> Open Resume
                           </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedRequests.rejected.length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[22px] font-bold tracking-tight text-gray-400">Declined</h3>
                  <span className="text-[12px] font-bold text-gray-400">{groupedRequests.rejected.length} Total</span>
                </div>
                <div className="space-y-4 opacity-75">
                  {groupedRequests.rejected.map((req) => (
                    <div key={req.id} className="bg-gray-50 border border-gray-100 rounded-[20px] p-5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center font-bold text-[14px] shrink-0">
                            {getStudentDisplayName(req).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-500 text-[15px] tracking-tight">{getStudentDisplayName(req)}</p>
                            <p className="text-[12px] font-bold text-gray-400 mt-0.5">Declined {new Date(req.rejected_at || '').toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-[8px] uppercase tracking-wider border border-gray-200">Declined</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal.visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111]/40 backdrop-blur-sm p-4" onClick={() => setFeedbackModal({ visible: false })}>
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[22px] font-bold tracking-tight">Provide Feedback</h3>
              <button onClick={() => setFeedbackModal({ visible: false })} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                <UserX size={16} />
              </button>
            </div>
            
            <p className="text-[14px] font-medium text-gray-500 mb-4">Share constructive feedback to help the student improve their resume. Be specific about strengths and areas to improve.</p>

            <div className="space-y-4">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What are their strengths? Areas to improve? Specific suggestions?"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-[16px] bg-gray-50 focus:outline-none focus:border-gray-400 focus:bg-white text-gray-900 font-medium resize-none transition-all placeholder-gray-400"
                rows={6}
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setFeedbackModal({ visible: false })}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3.5 rounded-[16px] transition-colors text-[14px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback || !feedbackText.trim()}
                  className="flex-1 bg-[#1A1C23] hover:bg-black disabled:bg-gray-300 text-white font-bold py-3.5 rounded-[16px] transition-colors text-[14px] flex items-center justify-center gap-2"
                >
                  {submittingFeedback ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit
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
