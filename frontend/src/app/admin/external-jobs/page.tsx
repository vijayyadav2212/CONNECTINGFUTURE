"use client";

import React, { useEffect, useMemo, useState } from 'react';

import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building,
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { useAuth0Token } from '../../../hooks/useAuth0Token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
const BOOKMARK_STORAGE_KEY = 'admin-external-job-bookmarks';

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
  apply_conversion_pct?: number;
  bookmark_count?: number;
}

interface ExternalJobApplicationEntry {
  id: number;
  job_id: string;
  user_email: string;
  user_name: string;
  applied: boolean;
  source_page?: string | null;
  updated_at?: string | null;
  title?: string | null;
  company?: string | null;
  location?: string | null;
}

interface JobSearchSettings {
  role: string;
  location: string;
  employment_type: string;
}

const DEFAULT_SETTINGS: JobSearchSettings = {
  role: 'software developer',
  location: 'India',
  employment_type: 'All Types',
};

const JOB_TYPE_OPTIONS = ['All Types', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Remote'];

function formatDate(value: string | null) {
  if (!value) return 'Recently posted';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'Recently posted';
  return dt.toLocaleDateString();
}

function buildJobsUrl(filters: JobSearchSettings, refresh = false) {
  const params = new URLSearchParams();
  params.set('source', 'external');
  params.set('role', filters.role || DEFAULT_SETTINGS.role);
  params.set('location', filters.location || DEFAULT_SETTINGS.location);
  if (filters.employment_type && filters.employment_type !== 'All Types') {
    params.set('employment_type', filters.employment_type);
  }
  if (refresh) params.set('refresh', 'true');
  return `${API_BASE}/api/jobs?${params.toString()}`;
}

export default function ExternalJobsPage() {
  const { token: accessToken } = useAuth0Token();
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [analyticsJobs, setAnalyticsJobs] = useState<ExternalJob[]>([]);
  const [applications, setApplications] = useState<ExternalJobApplicationEntry[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<JobSearchSettings>(DEFAULT_SETTINGS);
  const [filters, setFilters] = useState<JobSearchSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setBookmarkedIds(parsed.map(String));
      }
    } catch {
      setBookmarkedIds([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs/external/analytics/summary`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.jobs)) setAnalyticsJobs(data.jobs);
    } catch {
      setAnalyticsJobs([]);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs/external/analytics/applications?status=applied&limit=10`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.applications)) setApplications(data.applications);
      else setApplications([]);
    } catch {
      setApplications([]);
    }
  };

  const fetchJobs = async (next: JobSearchSettings, refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const res = await fetch(buildJobsUrl(next, refresh), { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      void fetchAnalytics();
      void fetchApplications();
    } catch (e: any) {
      setJobs([]);
      const msg = String(e?.message || 'Failed to fetch jobs');
      if (msg.toLowerCase().includes('not subscribed')) {
        setError('RapidAPI JSearch is not subscribed for this key. Subscribe on RapidAPI, then refresh this page.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs(DEFAULT_SETTINGS, false);
    void fetchAnalytics();
    void fetchApplications();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch(`${API_BASE}/api/admin/settings/jobs`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!res.ok) return;
        const data = await res.json();
        const fromApi: JobSearchSettings = {
          role: data.role || DEFAULT_SETTINGS.role,
          location: data.location || DEFAULT_SETTINGS.location,
          employment_type: data.employment_type || DEFAULT_SETTINGS.employment_type,
        };
        setSettings(fromApi);
        setFilters(fromApi);
        await fetchJobs(fromApi, false);
      } catch {
        // no-op
      }
    };
    void loadSettings();
  }, [accessToken]);

  const toggleBookmark = (jobId: string) => {
    setBookmarkedIds(curr => (curr.includes(jobId) ? curr.filter(id => id !== jobId) : [...curr, jobId]));
  };

  const bookmarkedJobs = useMemo(() => jobs.filter(j => bookmarkedIds.includes(j.job_id)), [jobs, bookmarkedIds]);

  const handleApply = async (job: ExternalJob) => {
    const win = window.open(job.apply_link, '_blank', 'noopener,noreferrer');
    try {
      await fetch(`${API_BASE}/api/jobs/external/${encodeURIComponent(job.job_id)}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      void fetchAnalytics();
    } catch {
      // no-op
    }
    if (!win) window.location.href = job.apply_link;
  };

  const handleSaveDefaults = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    try {
      setSavingSettings(true);
      const res = await fetch(`${API_BASE}/api/admin/settings/jobs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(filters),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save defaults');
      const next: JobSearchSettings = {
        role: data.role || filters.role,
        location: data.location || filters.location,
        employment_type: data.employment_type || filters.employment_type,
      };
      setSettings(next);
      setFilters(next);
      setShowSettings(false);
      await fetchJobs(next, true);
    } catch (e: any) {
      setError(String(e?.message || 'Failed to save defaults'));
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl border border-rose-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-teal-950 flex items-center gap-2"><Briefcase className="w-6 h-6 text-teal-950" />Job Opportunities</h1>
            <p className="text-teal-700 text-sm mt-1">Fetch and review real-time job listings through backend RapidAPI proxy</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl border bg-white text-center">
              <p className="text-lg font-black text-teal-950">{jobs.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">Loaded</p>
            </div>
            <div className="px-4 py-2 rounded-xl border bg-white text-center">
              <p className="text-lg font-black text-rose-700">{bookmarkedJobs.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-teal-950">Bookmarked</p>
            </div>
            <button onClick={() => setShowSettings(s => !s)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-white border border-teal-900/10 text-teal-900 hover:bg-[#f6f3eb] transition-colors shadow-sm"><Settings className="w-4 h-4" />Defaults</button>
            <button onClick={() => fetchJobs(filters, true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-[#f3b13a] text-teal-950 font-bold hover:bg-[#d89c30] transition-colors shadow-sm disabled:opacity-60">
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Jobs fetch issue</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : null}

        {showSettings ? (
          <form onSubmit={handleSaveDefaults} className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-teal-950 flex items-center gap-2"><Settings className="w-4 h-4" />Default search configuration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-teal-700 uppercase">Role</span>
                <input value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-teal-900/10 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-teal-700 uppercase">Location</span>
                <input value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-teal-900/10 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-teal-700 uppercase">Job Type</span>
                <select value={filters.employment_type} onChange={e => setFilters({ ...filters, employment_type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-teal-900/10 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none text-sm bg-white text-teal-950">
                  {JOB_TYPE_OPTIONS.map(option => (<option key={option} value={option}>{option}</option>))}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowSettings(false)} className="px-4 py-2 text-sm font-bold text-teal-700 hover:text-teal-900">Cancel</button>
              <button type="submit" disabled={savingSettings} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-teal-900 transition-colors disabled:opacity-60">
                {savingSettings ? 'Saving...' : 'Save defaults'}
              </button>
            </div>
          </form>
        ) : null}

        <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
            <input value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })} placeholder="Role e.g. software developer" className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-teal-900/10 bg-white text-teal-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400" />
          </div>
          <div className="relative flex-1 max-w-sm">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
            <input value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} placeholder="Location e.g. Mumbai" className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-teal-900/10 bg-white text-teal-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-600" />
            <select value={filters.employment_type} onChange={e => setFilters({ ...filters, employment_type: e.target.value })} className="px-3 py-2.5 rounded-xl border border-teal-900/10 text-sm bg-white text-teal-950">
              {JOB_TYPE_OPTIONS.map(option => (<option key={option} value={option}>{option}</option>))}
            </select>
            <button onClick={() => fetchJobs(filters, true)} className="px-4 py-2.5 text-sm font-bold rounded-xl bg-[#f3b13a] text-teal-950 font-bold hover:bg-[#d89c30] transition-colors">Search</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-teal-900/10">
                <Loader2 className="w-6 h-6 text-teal-950 animate-spin mr-3" />
                <p className="text-sm text-teal-700">Loading external jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-teal-900/10 text-center">
                <div className="w-12 h-12 rounded-full bg-[#f6f3eb] flex items-center justify-center mb-3"><Briefcase className="w-6 h-6 text-gray-300" /></div>
                <p className="font-bold text-teal-950 text-xl">No jobs found</p>
                <p className="text-sm text-teal-700 mt-1">Try another role/location or refresh after fixing RapidAPI subscription.</p>
              </div>
            ) : (
              jobs.map(job => {
                const isBookmarked = bookmarkedIds.includes(job.job_id);
                return (
                  <div key={job.job_id} className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-950 flex items-center justify-center shrink-0 overflow-hidden">
                        {job.logo_url ? <img src={job.logo_url} alt={job.company} className="w-full h-full object-contain" /> : <Briefcase className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-bold text-teal-950 text-sm truncate">{job.title}</p>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200"><Clock className="w-3 h-3" />{formatDate(job.posted_date)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-teal-700 mb-2">
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" />{job.company}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-green-50 text-green-700 border-green-200">{job.employment_type || 'Not specified'}</span>
                        </div>
                        <p className="text-xs text-teal-700">Salary: <span className="font-semibold text-teal-900">{job.salary || 'Not specified'}</span></p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => toggleBookmark(job.job_id)} className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f6f3eb] border border-teal-900/10 text-teal-700 hover:bg-[#f6f3eb] transition-colors">
                          {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-teal-950" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleApply(job)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#f3b13a] text-teal-950 font-bold hover:bg-[#d89c30] transition-colors">
                          Apply <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-4">
              <h3 className="font-bold text-teal-950 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-950" />Current defaults</h3>
              <p className="text-xs text-teal-700 mt-2">Role: {settings.role}</p>
              <p className="text-xs text-teal-700">Location: {settings.location}</p>
              <p className="text-xs text-teal-700">Type: {settings.employment_type}</p>
            </div>

            <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-4">
              <h3 className="font-bold text-teal-950 flex items-center gap-2"><Bookmark className="w-4 h-4 text-teal-950" />Bookmarks</h3>
              <div className="mt-3 space-y-2">
                {bookmarkedJobs.length === 0 ? (
                  <p className="text-xs text-teal-700">No bookmarks yet.</p>
                ) : bookmarkedJobs.slice(0, 5).map(job => (
                  <div key={job.job_id} className="p-2 rounded-xl bg-[#f6f3eb] border border-teal-900/10">
                    <p className="text-xs font-semibold text-teal-950 truncate">{job.title}</p>
                    <p className="text-[11px] text-teal-700 truncate">{job.company}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-4">
              <h3 className="font-bold text-teal-950 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-950" />Most viewed jobs</h3>
              <div className="mt-3 space-y-2">
                {analyticsJobs.length === 0 ? (
                  <p className="text-xs text-teal-700">No analytics yet.</p>
                ) : analyticsJobs.map(job => (
                  <div key={job.job_id} className="p-2 rounded-xl bg-[#f6f3eb] border border-teal-900/10">
                    <p className="text-xs font-semibold text-teal-950 truncate">{job.title}</p>
                    <p className="text-[11px] text-teal-700">{job.view_count || 0} views • {job.apply_click_count || 0} apply clicks</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">{job.applied_confirm_count || 0} confirmed applications</p>
                    <p className="text-[10px] text-teal-700">Response: {job.application_response_count || 0} • Conversion: {job.apply_conversion_pct || 0}%</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-4">
              <h3 className="font-bold text-teal-950 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-950" />Confirmed External Applications</h3>
              <div className="mt-3 space-y-2">
                {applications.length === 0 ? (
                  <p className="text-xs text-teal-700">No confirmed applications yet.</p>
                ) : applications.map(entry => (
                  <div key={entry.id} className="p-2 rounded-xl bg-[#f6f3eb] border border-teal-900/10">
                    <p className="text-xs font-semibold text-teal-950 truncate">{entry.user_name}</p>
                    <p className="text-[11px] text-teal-800 truncate">{entry.title || 'External job'}{entry.company ? ` at ${entry.company}` : ''}</p>
                    <p className="text-[10px] text-teal-700 truncate">{entry.user_email}</p>
                    <p className="text-[10px] text-teal-700">{entry.updated_at ? new Date(entry.updated_at).toLocaleString() : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}