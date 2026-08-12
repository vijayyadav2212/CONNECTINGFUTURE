"use client";

import React, { useState, useEffect, useRef } from 'react';

import { Search, Filter, MapPin, Building, Clock, DollarSign, BookmarkPlus, ExternalLink, Star, Calendar, Users, Briefcase, GraduationCap, AlertTriangle, Bookmark, BookmarkCheck, CheckCircle, Loader2, RefreshCw, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  const base = raw.replace(/\/$/, '');
  if (base.endsWith('/api')) return base;
  return `${base}/api`;
})();

interface JobOpportunity {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Temporary' | 'Internship (Paid)' | 'Internship (Unpaid)';
  salary?: string;
  posted: string;
  deadline?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  isBookmarked: boolean;
  applicants: number;
  companyLogo?: string | null;
}

interface ExternalJob {
  job_id: string;
  title: string;
  company: string;
  location: string;
  apply_link: string;
  employment_type: string;
  salary: string;
  posted_date: string | null;
  logo_url?: string | null;
  source?: string;
  view_count?: number;
  apply_click_count?: number;
  applied_confirm_count?: number;
  application_response_count?: number;
}

interface JobSearchSettings {
  role: string;
  location: string;
  employment_type: string;
}

const EXTERNAL_BOOKMARK_STORAGE_KEY = 'student-external-job-bookmarks';
const EXTERNAL_PENDING_APPLY_KEY = 'student-external-job-pending-apply';
const DEFAULT_EXTERNAL_SETTINGS: JobSearchSettings = {
  role: '',
  location: '',
  employment_type: 'All Types',
};

const JOB_TYPE_OPTIONS = ['All Types', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Remote'];

function formatExternalDate(value: string | null) {
  if (!value) return 'Recently posted';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'Recently posted';
  return dt.toLocaleDateString();
}

function buildExternalJobsUrl(filters: JobSearchSettings, refresh = false) {
  const params = new URLSearchParams();
  params.set('source', 'external');
  if (filters.role && filters.role.trim()) {
    params.set('role', filters.role.trim());
  }
  if (filters.location && filters.location.trim()) {
    params.set('location', filters.location.trim());
  }
  if (filters.employment_type && filters.employment_type !== 'All Types') {
    params.set('employment_type', filters.employment_type);
  }
  if (refresh) params.set('refresh', 'true');
  return `${API_BASE}/jobs?${params.toString()}`;
}

const JobOpportunitiesPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [initializedBookmarks, setInitializedBookmarks] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyJob, setApplyJob] = useState<JobOpportunity | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([]);
  const [analyticsJobs, setAnalyticsJobs] = useState<ExternalJob[]>([]);
  const [externalBookmarkedIds, setExternalBookmarkedIds] = useState<string[]>([]);
  const [externalLoading, setExternalLoading] = useState(true);
  const [externalRefreshing, setExternalRefreshing] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [externalFilters, setExternalFilters] = useState<JobSearchSettings>(DEFAULT_EXTERNAL_SETTINGS);
  const [activeJobsSection, setActiveJobsSection] = useState<'portal' | 'external'>('portal');
  const [externalApplyPromptOpen, setExternalApplyPromptOpen] = useState(false);
  const [externalApplyPromptJob, setExternalApplyPromptJob] = useState<ExternalJob | null>(null);
  const [submittingExternalFeedback, setSubmittingExternalFeedback] = useState(false);

  // Snapshots for notifications
  const prevJobsRef = useRef<JobOpportunity[]>([]);
  const prevAppStatusRef = useRef<Record<number, string>>({});

  const mapJobRow = (row: any): JobOpportunity => {
    const tags = row.tags ? String(row.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [];
    const requirements = tags.slice(0, 4);
    const benefits = ['Flexible hours', 'Mentorship', 'Growth'];
    const salary = row.salary_min && row.salary_max && row.currency ? `${row.currency} ${row.salary_min}-${row.salary_max}` : undefined;
    return {
      id: Number(row.id),
      title: row.title,
      company: row.company,
      location: row.location,
      type: row.job_type,
      salary,
      posted: (row.posted_date || row.created_at || new Date().toISOString()).toString().split('T')[0],
      deadline: row.application_deadline || undefined,
      description: row.description,
      requirements,
      benefits,
      isBookmarked: false,
      applicants: Number(row.applied || 0),
      companyLogo: row.logo || null,
    };
  };

  const fetchJobs = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (filterType && filterType !== 'all') params.set('job_type', filterType);
    try {
      const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
      const data = await res.json();
      const list = (data.jobs || []).map(mapJobRow);
      // apply saved bookmarks from localStorage
      let savedIds: number[] = [];
      try {
        const raw = localStorage.getItem('savedJobs');
        if (raw) savedIds = JSON.parse(raw);
      } catch {}
      const savedSet = new Set<number>(savedIds);
      setJobs(list.map((j: JobOpportunity) => savedSet.has(j.id) ? { ...j, isBookmarked: true } : j));
      setInitializedBookmarks(true);
    } catch (e) {
      console.warn('Failed to load jobs', e);
      toast({ title: 'Failed to load jobs', description: 'Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/applications?applicant_email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      const ids = new Set<number>();
      (data.applications || []).forEach((a: any) => ids.add(Number(a.job_id)));
      setAppliedJobIds(ids);
      setMyApplications(data.applications || []);
    } catch (e) {
      console.warn('Failed to load applications', e);
      // don't toast on background failures repeatedly
    }
  };

  const fetchExternalAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs/external/analytics/summary`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.jobs)) setAnalyticsJobs(data.jobs);
      else setAnalyticsJobs([]);
    } catch {
      setAnalyticsJobs([]);
    }
  };

  const fetchExternalJobs = async (next: JobSearchSettings, refresh = false) => {
    try {
      refresh ? setExternalRefreshing(true) : setExternalLoading(true);
      setExternalError(null);
      const res = await fetch(buildExternalJobsUrl(next, refresh), { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch external jobs');
      }
      setExternalJobs(Array.isArray(data.jobs) ? data.jobs : []);
      void fetchExternalAnalytics();
    } catch (e: any) {
      setExternalJobs([]);
      const msg = String(e?.message || 'Failed to fetch external jobs');
      if (msg.toLowerCase().includes('not subscribed')) {
        setExternalError('RapidAPI JSearch is not subscribed for this key. Subscribe on RapidAPI, then refresh this page.');
      } else {
        setExternalError(msg);
      }
    } finally {
      setExternalLoading(false);
      setExternalRefreshing(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { fetchJobs(); }, [searchTerm, filterType]);
  useEffect(() => { fetchMyApplications(); }, [user?.email]);
  useEffect(() => {
    void fetchExternalJobs(externalFilters, false);
    void fetchExternalAnalytics();
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(EXTERNAL_BOOKMARK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setExternalBookmarkedIds(parsed.map(String));
      }
    } catch {
      setExternalBookmarkedIds([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(EXTERNAL_BOOKMARK_STORAGE_KEY, JSON.stringify(externalBookmarkedIds));
  }, [externalBookmarkedIds]);

  useEffect(() => {
    const tryOpenPendingPrompt = () => {
      if (!user?.email || externalApplyPromptOpen) return;
      try {
        const raw = window.localStorage.getItem(EXTERNAL_PENDING_APPLY_KEY);
        if (!raw) return;
        const pending = JSON.parse(raw);
        if (!pending || pending.user_email !== user.email || !pending.job) return;
        const startedAt = Number(pending.started_at || 0);
        if (startedAt && Date.now() - startedAt > 1000 * 60 * 60 * 24) {
          window.localStorage.removeItem(EXTERNAL_PENDING_APPLY_KEY);
          return;
        }
        setExternalApplyPromptJob(pending.job as ExternalJob);
        setExternalApplyPromptOpen(true);
        window.localStorage.removeItem(EXTERNAL_PENDING_APPLY_KEY);
      } catch {
        window.localStorage.removeItem(EXTERNAL_PENDING_APPLY_KEY);
      }
    };

    const onFocus = () => setTimeout(tryOpenPendingPrompt, 150);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') setTimeout(tryOpenPendingPrompt, 150);
    };

    tryOpenPendingPrompt();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user?.email, externalApplyPromptOpen]);

  // Poll for new jobs/internships and toast updates
  useEffect(() => {
    let cancelled = false;
    const checkJobsUpdates = async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set('q', searchTerm);
        if (filterType && filterType !== 'all') params.set('job_type', filterType);
        const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
        const data = await res.json();
        const latest: JobOpportunity[] = (data.jobs || []).map(mapJobRow);
        if (!cancelled) {
          // Detect new jobs by id
          const prevIds = new Set(prevJobsRef.current.map(j => j.id));
          const newJobs = latest.filter(j => !prevIds.has(j.id));
          if (newJobs.length > 0) {
            const newInternships = newJobs.filter(j => String(j.type).toLowerCase().includes('internship'));
            if (newInternships.length > 0) {
              toast({ title: 'New internships available', description: `${newInternships.length} new internship${newInternships.length > 1 ? 's' : ''} posted.` });
            }
            const otherNew = newJobs.length - newInternships.length;
            if (otherNew > 0) {
              toast({ title: 'New jobs posted', description: `${otherNew} new job${otherNew > 1 ? 's' : ''} added.` });
            }
          }
          // Update state and snapshot while preserving bookmarks
          const savedIdsRaw = localStorage.getItem('savedJobs');
          const savedSet = new Set<number>(savedIdsRaw ? JSON.parse(savedIdsRaw) : []);
          const withBookmarks = latest.map(j => savedSet.has(j.id) ? { ...j, isBookmarked: true } : j);
          setJobs(withBookmarks);
          prevJobsRef.current = withBookmarks;
        }
      } catch (e) {
        // silent on background
      }
    };
    // initial snapshot
    prevJobsRef.current = jobs;
    checkJobsUpdates();
    const id = setInterval(checkJobsUpdates, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [searchTerm, filterType]);

  // Poll for application status updates and toast when changed
  useEffect(() => {
    let cancelled = false;
    const checkAppUpdates = async () => {
      try {
        if (!user?.email) return;
        const res = await fetch(`${API_BASE}/applications?applicant_email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        const latestApps: any[] = data.applications || [];
        // Compare status changes by job_id
        const prevMap = { ...prevAppStatusRef.current };
        latestApps.forEach(app => {
          const jid = Number(app.job_id);
          const prevStatus = prevMap[jid];
          const currentStatus = String(app.status || '').toLowerCase();
          if (prevStatus && currentStatus && prevStatus !== currentStatus) {
            const pretty = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
            toast({ title: 'Application update', description: `Your application for "${app.title || 'this role'}" is now ${pretty}.` });
          }
        });
        // Update state and snapshot
        setMyApplications(latestApps);
        const nextMap: Record<number, string> = {};
        latestApps.forEach(app => { nextMap[Number(app.job_id)] = String(app.status || '').toLowerCase(); });
        prevAppStatusRef.current = nextMap;
      } catch (e) {
        // silent on background
      }
    };
    // initialize snapshot from current myApplications
    const initMap: Record<number, string> = {};
    myApplications.forEach(app => { initMap[Number(app.job_id)] = String(app.status || '').toLowerCase(); });
    prevAppStatusRef.current = initMap;
    checkAppUpdates();
    const id = setInterval(checkAppUpdates, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user?.email]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || job.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const toggleBookmark = (jobId: number) => {
    const updated = jobs.map(job => job.id === jobId ? { ...job, isBookmarked: !job.isBookmarked } : job);
    setJobs(updated);
    // persist to localStorage
    try {
      const savedIds = updated.filter(j => j.isBookmarked).map(j => j.id);
      localStorage.setItem('savedJobs', JSON.stringify(savedIds));
    } catch {}
  };

  const toggleExternalBookmark = (jobId: string) => {
    setExternalBookmarkedIds(curr => (curr.includes(jobId) ? curr.filter(id => id !== jobId) : [...curr, jobId]));
  };

  const bookmarkedExternalJobs = externalJobs.filter(j => externalBookmarkedIds.includes(j.job_id));

  const submitExternalApplicationFeedback = async (applied: boolean) => {
    if (!externalApplyPromptJob || !user?.email) {
      setExternalApplyPromptOpen(false);
      setExternalApplyPromptJob(null);
      return;
    }
    setSubmittingExternalFeedback(true);
    try {
      await fetch(`${API_BASE}/jobs/external/${encodeURIComponent(externalApplyPromptJob.job_id)}/application-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: externalApplyPromptJob,
          applied,
          user_email: user.email,
              user_name: user.name || user.email,
          source_page: 'student-job-opportunities',
        }),
      });
      if (applied) {
        toast({ title: 'Application tracked', description: 'Thanks. Your application was counted for analytics.' });
      }
      void fetchExternalAnalytics();
    } catch {
      // no-op
    } finally {
      setSubmittingExternalFeedback(false);
      setExternalApplyPromptOpen(false);
      setExternalApplyPromptJob(null);
    }
  };

  const handleExternalApply = async (job: ExternalJob) => {
    const openedAt = Date.now();
    const win = window.open(job.apply_link, '_blank', 'noopener,noreferrer');

    if (user?.email) {
      try {
        window.localStorage.setItem(EXTERNAL_PENDING_APPLY_KEY, JSON.stringify({
          job,
          user_email: user.email,
          started_at: openedAt,
        }));
      } catch {
        // no-op
      }

      const onReturnFocus = () => {
        if (Date.now() - openedAt < 1200) return;
        window.removeEventListener('focus', onReturnFocus);
        setExternalApplyPromptJob(job);
        setExternalApplyPromptOpen(true);
        window.localStorage.removeItem(EXTERNAL_PENDING_APPLY_KEY);
      };
      window.addEventListener('focus', onReturnFocus);
    }

    try {
      await fetch(`${API_BASE}/jobs/external/${encodeURIComponent(job.job_id)}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      void fetchExternalAnalytics();
    } catch {
      // no-op
    }
    if (!win) window.location.href = job.apply_link;
  };

  const openApplyForm = (job: JobOpportunity) => {
    setApplyJob(job);
    setResumeUrl('');
    setCoverLetter('');
    setApplyOpen(true);
  };

  const submitApplication = async () => {
    if (!user?.email || !applyJob) return;
    setApplySubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/jobs/${applyJob.id}/apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ applicant_email: user.email, resume_url: resumeUrl || null, cover_letter: coverLetter || null })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Apply failed (${res.status}) ${text}`);
      }
      const updated = new Set(appliedJobIds);
      updated.add(applyJob.id);
      setAppliedJobIds(updated);
      setJobs(jobs.map(j => j.id === applyJob.id ? { ...j, applicants: j.applicants + 1 } : j));
      setApplyOpen(false);
      setApplyJob(null);
      setResumeUrl('');
      setCoverLetter('');
      fetchMyApplications();
      toast({ title: 'Application submitted', description: `${applyJob.title} at ${applyJob.company}` });
    } catch (e) {
      console.warn('Apply failed', e);
      toast({ title: 'Application failed', description: e instanceof Error ? e.message : 'Please try again', variant: 'destructive' });
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Only PDF, DOC, DOCX allowed', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum size is 10MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/upload/job-resume`, { method: 'POST', body: fd });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Upload failed (${res.status}) ${text}`);
      }
      const data = await res.json();
      setResumeUrl(data.url);
      setUploadedFileName(file.name);
      toast({ title: 'Resume uploaded', description: file.name });
    } catch (err) {
      toast({ title: 'Upload error', description: err instanceof Error ? err.message : 'Please try again', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Full-time': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm';
      case 'Part-time': return 'bg-gradient-to-r from-teal-100 to-teal-100 text-teal-800 border-teal-300 shadow-sm';
      case 'Internship': return 'bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-800 border-teal-300 shadow-sm';
      case 'Contract': return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-300 shadow-sm';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm';
    }
  };

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-[#f6f3eb] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              {/* Header Skeleton */}
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                </div>
              </div>
              
              {/* Search Bar Skeleton */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-12 bg-gray-200 rounded-xl w-40"></div>
                  <div className="h-12 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl w-32"></div>
                </div>
              </div>
              
              {/* Job Cards Skeleton */}
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                          {[1, 2, 3].map(j => (
                            <div key={j} className="bg-[#f6f3eb] p-3 rounded-lg">
                              <div className="h-10 bg-gray-200 rounded"></div>
                            </div>
                          ))}
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="ml-6">
                        <div className="h-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl w-24 mb-2"></div>
                        <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#f6f3eb] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="relative bg-teal-950 rounded-[32px] p-8 lg:p-10 shadow-2xl border border-teal-900/10 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-[12px] uppercase tracking-[0.1em] mb-4">
                    <GraduationCap className="w-4 h-4" />
                    <span>Career Journey</span>
                  </div>
                  <h1 className="text-4xl lg:text-[48px] font-black text-white mb-3 tracking-[-0.02em]">
                    Job Opportunities
                  </h1>
                  <p className="text-gray-400 text-[16px] font-medium max-w-2xl mb-2">
                    Discover internships and career opportunities matched to your goals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8">
            <div className="bg-white rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-teal-950" />
                </div>
                <h2 className="text-xl font-extrabold text-teal-950">Find Your Perfect Opportunity</h2>
              </div>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-white text-black placeholder:text-gray-500 caret-black [color-scheme:light] focus:ring-4 focus:ring-teal-100 focus:border-teal-500 transition-all duration-200 font-medium [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white] [&:-webkit-autofill]:[-webkit-text-fill-color:#000]"
                  />
                  {searchTerm.trim().length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-12 pr-8 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-500 bg-white min-w-[180px] font-medium text-gray-900 transition-all duration-200"
                  >
                    <option value="all">All Job Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <Button 
                  className="bg-teal-950 hover:bg-teal-900 text-white px-8 py-4 rounded-xl font-bold shadow-sm hover:shadow-md transition-all duration-200 h-auto"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Jobs
                </Button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-8">
            <div className="bg-white rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-6 lg:p-8 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-50 flex items-center justify-center shrink-0 rounded-[16px]">
                    <Briefcase className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-teal-950">
                      {filteredJobs.length} Opportunities Found
                    </p>
                    <p className="text-[13px] font-bold text-gray-500">
                      Out of {jobs.length} total positions available
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-[14px] border border-yellow-200">
                    <Star className="w-4 h-4 text-amber-600" />
                    <span className="text-[13px] font-bold text-amber-700">
                      {jobs.filter(job => job.isBookmarked).length} Saved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="inline-flex w-full sm:w-auto p-1.5 rounded-[16px] border border-gray-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setActiveJobsSection('portal')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-[12px] text-[13px] font-bold uppercase tracking-wider transition-colors ${activeJobsSection === 'portal' ? 'bg-teal-950 text-white' : 'text-[#8a94a6] hover:bg-gray-100 hover:text-teal-950'}`}
              >
                Portal Jobs
              </button>
              <button
                type="button"
                onClick={() => setActiveJobsSection('external')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-[12px] text-[13px] font-bold uppercase tracking-wider transition-colors ${activeJobsSection === 'external' ? 'bg-teal-950 text-white' : 'text-[#8a94a6] hover:bg-gray-100 hover:text-teal-950'}`}
              >
                External Jobs
              </button>
            </div>
          </div>

          {activeJobsSection === 'portal' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-teal-950">Portal Jobs</h2>
                <p className="text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em] mt-1">Jobs posted directly on the platform.</p>
              </div>

              {/* Job Listings */}
              <div className="space-y-6">
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-12 text-center border border-gray-100">
                <div className="bg-gray-100 w-24 h-24 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-10 h-10 text-teal-950" />
                </div>
                <h3 className="text-xl font-extrabold text-teal-950 mb-3">No Jobs Found</h3>
                <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">
                  We couldn't find any opportunities matching your criteria. Try adjusting your search terms or filters.
                </p>
                <Button 
                  onClick={() => {setSearchTerm(''); setFilterType('all');}}
                  className="bg-teal-950 hover:bg-teal-900 text-white px-8 py-4 rounded-[14px] font-bold shadow-sm transition-all duration-200 h-auto"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              filteredJobs.map(job => (
                <div key={job.id} className="bg-white rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100 hover:border-gray-200 group relative">
                  <div className="p-6 lg:p-8">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                          <h3 className="text-xl lg:text-2xl font-extrabold text-teal-950 group-hover:text-teal-600 transition-colors duration-200">
                            {job.title}
                          </h3>
                          <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 self-start ${getTypeColor(job.type)} transition-all duration-200 group-hover:scale-105`}>
                            {job.type}
                          </span>
                        </div>
                        
                        {/* Company Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          <div className="flex items-center gap-3 bg-[#f6f3eb] p-3 rounded-lg hover:bg-teal-50 transition-colors duration-200">
                            <div className="bg-teal-100 p-2 rounded-lg">
                              <Building className="w-4 h-4 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
                              <p className="font-semibold text-gray-900">{job.company}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-[#f6f3eb] p-3 rounded-lg hover:bg-green-50 transition-colors duration-200">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <MapPin className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                              <p className="font-semibold text-gray-900">{job.location}</p>
                            </div>
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-3 bg-[#f6f3eb] p-3 rounded-lg hover:bg-teal-50 transition-colors duration-200">
                              <div className="bg-teal-100 p-2 rounded-lg">
                                <DollarSign className="w-4 h-4 text-teal-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Salary</p>
                                <p className="font-semibold text-gray-900">{job.salary}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Description */}
                        <div className="mb-6">
                          <p className="text-gray-700 leading-relaxed text-base">{job.description}</p>
                        </div>
                        
                        {/* Requirements */}
                        <div className="mb-6">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                            Requirements
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {job.requirements.map((req, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors duration-200">
                                <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></div>
                                <span className="text-teal-800 font-medium text-sm">{req}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Benefits */}
                        <div className="mb-6">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Benefits & Perks
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {job.benefits.map((benefit, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors duration-200">
                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                <span className="text-green-800 font-medium text-sm">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Job Meta & Actions */}
                        <div className="border-t border-gray-100 pt-6">
                          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            {/* Job Meta */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="bg-gray-100 p-2 rounded-lg">
                                  <Clock className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Posted</p>
                                  <p className="font-semibold text-gray-900">{job.posted}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                  <Calendar className="w-4 h-4 text-orange-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Deadline</p>
                                    <p className="font-semibold text-gray-900">{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="bg-teal-100 p-2 rounded-lg">
                                  <Users className="w-4 h-4 text-teal-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Applicants</p>
                                  <p className="font-semibold text-gray-900">{job.applicants}</p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                              <Button 
                                onClick={() => toggleBookmark(job.id)}
                                variant="outline"
                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                                  job.isBookmarked 
                                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800' 
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-[#f6f3eb] hover:text-gray-900'
                                }`}
                              >
                                <BookmarkPlus className="w-4 h-4 mr-2" />
                                {job.isBookmarked ? 'Saved' : 'Save Job'}
                              </Button>
                              <Button 
                                onClick={() => openApplyForm(job)}
                                disabled={appliedJobIds.has(job.id)}
                                className={`px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 ${appliedJobIds.has(job.id) ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white hover:shadow-xl transform hover:scale-105'}`}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {appliedJobIds.has(job.id) ? 'Applied' : 'Apply Now'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats Badge */}
                      <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                          Hot Job 🔥
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
              </div>

              {/* Load More Button */}
              {filteredJobs.length > 0 && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="px-8 py-4 rounded-xl font-semibold border-2 border-gray-300 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Briefcase className="w-5 h-5 mr-2" />
                    Load More Opportunities
                  </Button>
                  <p className="text-sm text-gray-500 mt-3">
                    Showing {filteredJobs.length} of {jobs.length} total opportunities
                  </p>
                </div>
              )}
            </>
          )}

          {activeJobsSection === 'external' && (
            <>
              <div className="mt-1 mb-4">
                <h2 className="text-2xl font-extrabold text-gray-900">External Jobs</h2>
                <p className="text-sm text-gray-600">Jobs sourced from external providers.</p>
              </div>

              {/* External Jobs */}
              <div className="mt-6 space-y-3">
            {externalError ? (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Jobs fetch issue</p>
                  <p className="text-sm">{externalError}</p>
                </div>
              </div>
            ) : null}

            {externalLoading ? (
              <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                <Loader2 className="w-6 h-6 text-teal-950 animate-spin mr-3" />
                <p className="text-sm text-gray-500">Loading external jobs...</p>
              </div>
            ) : externalJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"><Briefcase className="w-6 h-6 text-gray-300" /></div>
                <p className="font-bold text-gray-900 text-xl">No jobs found</p>
                <p className="text-sm text-gray-500 mt-1">Try refreshing external jobs.</p>
              </div>
            ) : (
              externalJobs.map(job => {
                const isBookmarked = externalBookmarkedIds.includes(job.job_id);
                return (
                  <div key={job.job_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-950 flex items-center justify-center shrink-0 overflow-hidden">
                        {job.logo_url ? <img src={job.logo_url} alt={job.company} className="w-full h-full object-contain" /> : <Briefcase className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-bold text-gray-900 text-sm truncate">{job.title}</p>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200"><Clock className="w-3 h-3" />{formatExternalDate(job.posted_date)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 mb-2">
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" />{job.company}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-green-50 text-green-700 border-green-200">{job.employment_type || 'Not specified'}</span>
                        </div>
                        <p className="text-xs text-gray-500">Salary: <span className="font-semibold text-gray-700">{job.salary || 'Not specified'}</span></p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => toggleExternalBookmark(job.job_id)} className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f6f3eb] border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                          {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-teal-950" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleExternalApply(job)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#f3b13a] text-teal-950 font-bold hover:bg-[#d89c30] transition-colors">
                          Apply <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
              </div>
            </>
          )}

          <div className="mt-10">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Saved Jobs</h2>
              {jobs.filter(j => j.isBookmarked).length === 0 ? (
                <div className="text-gray-600">No saved jobs yet. Click "Save Job" on listings.</div>
              ) : (
                <div className="space-y-4">
                  {jobs.filter(j => j.isBookmarked).map(job => (
                    <div key={job.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-[#f6f3eb] rounded-xl border border-gray-200">
                      <div>
                        <div className="font-semibold text-gray-900">{job.title} — {job.company}</div>
                        <div className="text-sm text-gray-600">{job.location}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          onClick={() => toggleBookmark(job.id)}
                          className="border-yellow-300 text-yellow-700 bg-white hover:bg-yellow-50"
                        >
                          Remove
                        </Button>
                        <Button
                          onClick={() => openApplyForm(job)}
                          disabled={appliedJobIds.has(job.id)}
                          className={`px-6 py-2 rounded-xl font-semibold transition-all duration-200 ${appliedJobIds.has(job.id) ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white'}`}
                        >
                          {appliedJobIds.has(job.id) ? 'Applied' : 'Apply'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Applied History */}
          <div className="mt-10">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Applied History</h2>
              {myApplications.length === 0 ? (
                <div className="text-gray-600">No applications yet.</div>
              ) : (
                <div className="space-y-4">
                  {myApplications.map((app: any) => (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-[#f6f3eb] rounded-xl border border-gray-200">
                      <div>
                        <div className="font-semibold text-gray-900">{app.title} — {app.company}</div>
                        <div className="text-sm text-gray-600">{app.location}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                          {app.status || 'applied'}
                        </span>
                        <span className="text-sm text-gray-500">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Apply Form Modal */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="w-[95vw] sm:w-[92vw] md:w-[86vw] lg:w-[760px] max-w-[760px] max-h-[88vh] overflow-y-auto rounded-3xl bg-white p-0 text-slate-900 shadow-2xl [color-scheme:light]">
          <DialogHeader className="px-6 sm:px-8 pt-6 sm:pt-7 pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-bold">Apply to {applyJob?.title}</DialogTitle>
          </DialogHeader>
          <div className="px-6 sm:px-8 py-5 sm:py-6 space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Resume</label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-slate-700 [color-scheme:light] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-200 file:text-sm file:font-semibold file:bg-[#f6f3eb] file:text-teal-700 hover:file:bg-[#f6f3eb]"
                />
              </div>
              <div className="text-xs text-gray-500 leading-5">PDF, DOC, DOCX up to 10MB. Or paste a URL below.</div>
              <input
                type="url"
                placeholder="Or paste a public resume URL (Google Drive, etc.)"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all [color-scheme:light]"
              />
              {uploadedFileName && (
                <div className="text-sm text-green-700">Selected: {uploadedFileName}</div>
              )}
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Cover Letter</label>
              <textarea
                placeholder="Optional: brief cover letter or message"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all resize-none [color-scheme:light]"
              />
            </div>
            <div className="flex flex-wrap gap-3 pt-2 sm:pt-3 pb-1">
              <Button onClick={submitApplication} disabled={applySubmitting} className="bg-teal-600 hover:bg-teal-700 text-white">
                {applySubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setApplyOpen(false)}
                className="border-slate-200 bg-[#f6f3eb] text-slate-700 hover:bg-slate-200 hover:text-slate-900"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={externalApplyPromptOpen}
        onOpenChange={(open) => {
          setExternalApplyPromptOpen(open);
          if (!open) setExternalApplyPromptJob(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Did You Apply For This Job?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {externalApplyPromptJob ? `Did you complete your application for "${externalApplyPromptJob.title}"?` : 'Did you complete your external application?'}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => submitExternalApplicationFeedback(true)}
                disabled={submittingExternalFeedback}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Yes, I Applied
              </Button>
              <Button
                variant="outline"
                onClick={() => submitExternalApplicationFeedback(false)}
                disabled={submittingExternalFeedback}
              >
                No, Not Yet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobOpportunitiesPage;