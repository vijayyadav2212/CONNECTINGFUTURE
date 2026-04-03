"use client";

import React, { useState, useEffect } from 'react';
import AdminNavigation from '../AdminNavigation/AdminNavigation';
import {
  Briefcase, Search, Filter, CheckCircle, XCircle,
  Clock, ExternalLink, Plus, Trash2, MapPin, Building,
  DollarSign, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../hooks/useAuth0Token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

interface JobPosting {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type?: string;
  description: string;
  requirements?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  application_url?: string;
  posted_by: string;
  posted_date?: string;
  status: string;
  industry?: string;
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
    case 'approved': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-rose-700 border border-pink-200"><CheckCircle className="w-3 h-3" />Approved</span>;
    case 'rejected': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" />Rejected</span>;
  }
};

const jobTypeStyle: Record<string, string> = {
  'full-time': 'bg-blue-50 text-blue-700 border-blue-200',
  'part-time': 'bg-purple-50 text-purple-700 border-purple-200',
  'contract':  'bg-orange-50 text-orange-700 border-orange-200',
  'internship': 'bg-pink-50 text-rose-700 border-pink-200',
};

export default function JobManagementPage() {
  const { user } = useUser();
  const { token: accessToken } = useAuth0Token();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      if (!user || !accessToken) return;
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/jobs?limit=100&status=All%20Status`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (response.ok) { const data = await response.json(); setJobs(data.jobs || []); }
      } catch (e) { console.error('Error loading jobs:', e); }
      finally { setLoading(false); }
    };
    loadJobs();
  }, [user, accessToken]);

  const handleApprove = async (jobId: number) => {
    if (!accessToken) return;
    try {
      const r = await fetch(`${API_BASE}/api/jobs/${jobId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ status: 'Approved' }) });
      if (r.ok) setJobs(j => j.map(x => x.id === jobId ? { ...x, status: 'Approved' } : x));
      else { const e = await r.json(); alert(e.error || 'Failed to approve job'); }
    } catch { alert('Failed to approve job'); }
  };

  const handleReject = async (jobId: number) => {
    if (!accessToken) return;
    try {
      const r = await fetch(`${API_BASE}/api/jobs/${jobId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ status: 'Rejected' }) });
      if (r.ok) setJobs(j => j.map(x => x.id === jobId ? { ...x, status: 'Rejected' } : x));
      else { const e = await r.json(); alert(e.error || 'Failed to reject job'); }
    } catch { alert('Failed to reject job'); }
  };

  const handleDelete = async (jobId: number) => {
    if (!accessToken || !confirm('Delete this job?')) return;
    try {
      const r = await fetch(`${API_BASE}/api/jobs/${jobId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      if (r.ok) setJobs(j => j.filter(x => x.id !== jobId));
      else alert('Failed to delete job');
    } catch { alert('Failed to delete job'); }
  };

  const count = (s: FilterType) => jobs.filter(j => getApprovalStatus(j.status) === s).length;

  const filteredJobs = jobs.filter(job => {
    const approvalStatus = getApprovalStatus(job.status);
    const matchFilter = filter === 'all' || approvalStatus === filter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q) || job.location.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const filterBtns: { key: FilterType; label: string; active: string }[] = [
    { key: 'all',      label: `All (${jobs.length})`,        active: 'bg-gray-700 text-white' },
    { key: 'pending',  label: `Pending (${count('pending')})`, active: 'bg-amber-500 text-white' },
    { key: 'approved', label: `Approved (${count('approved')})`, active: 'bg-rose-500 text-white' },
    { key: 'rejected', label: `Rejected (${count('rejected')})`, active: 'bg-red-500 text-white' },
  ];

  return (
    <AdminNavigation>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-pink-50 rounded-[20px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-pink-100 gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-rose-500 font-semibold mb-2">
              <Sparkles className="w-[18px] h-[18px]" />
              <span className="text-sm tracking-wide">Admin Actions</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Job Management</h1>
            <p className="text-gray-600 text-[15px] sm:text-base">Manage job postings and internship opportunities</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {[
              { label: 'Pending', value: count('pending'), color: 'text-amber-700', bg: 'bg-white/60 border-white/50 shadow-sm' },
              { label: 'Active',  value: count('approved'), color: 'text-rose-600', bg: 'bg-white/60 border-white/50 shadow-sm' },
            ].map(s => (
              <div key={s.label} className={`px-5 py-3 rounded-2xl border ${s.bg} text-center min-w-[90px]`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${s.color} opacity-70 mt-0.5`}>{s.label}</p>
              </div>
            ))}
            <Link href="/admin/jobs/create" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />Post Job
            </Link>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by title, company, or location…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {filterBtns.map(b => (
              <button key={b.key} onClick={() => setFilter(b.key)} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${filter === b.key ? b.active : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{b.label}</button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-14 bg-white rounded-2xl border border-gray-100">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-rose-500 mr-3" />
            <p className="text-sm text-gray-400">Loading jobs…</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"><Briefcase className="w-6 h-6 text-gray-300" /></div>
            <p className="font-bold text-gray-900 text-sm">No jobs found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map(job => {
              const approvalStatus = getApprovalStatus(job.status);
              return (
                <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><Briefcase className="w-5 h-5" /></div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-gray-900 text-sm">{job.title}</p>
                        {statusBadge(approvalStatus)}
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 mb-2">
                        <span className="flex items-center gap-1"><Building className="w-3 h-3" />{job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        {job.salary_min || job.salary_max ? <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.currency || '₹'}{job.salary_min ?? ''}{job.salary_max ? `–${job.salary_max}` : ''}</span> : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {job.job_type && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${jobTypeStyle[job.job_type.toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{job.job_type}</span>}
                        {job.industry && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200">{job.industry}</span>}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{job.description}</p>
                      <p className="text-[10px] text-gray-400">Posted by {job.posted_by}{job.posted_date ? ` · ${new Date(job.posted_date).toLocaleDateString()}` : ''}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {job.application_url && (
                        <a href={job.application_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {approvalStatus === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(job.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors"><CheckCircle className="w-3 h-3" />Approve</button>
                          <button onClick={() => handleReject(job.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"><XCircle className="w-3 h-3" />Reject</button>
                        </>
                      )}
                      <button onClick={() => handleDelete(job.id)} className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors">
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
