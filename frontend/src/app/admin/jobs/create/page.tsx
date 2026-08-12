"use client";

import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../../hooks/useAuth0Token';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase, ArrowLeft, Save, Building2, MapPin,
  DollarSign, Globe, Mail, Link2, Calendar,
  FileText, CheckCircle, AlertCircle, Sparkles, Users, TrendingUp
} from 'lucide-react';

interface FormData {
  title: string; company: string; location: string; industry: string;
  jobType: string; experienceLevel: string; description: string;
  requirements: string; responsibilities: string; skills: string;
  salaryMin: string; salaryMax: string; currency: string;
  applicationUrl: string; applicationEmail: string; expiresAt: string;
  benefits: string; category: string; workMode: string; vacancies: string;
}

const industries = ['Technology','Finance','Healthcare','Marketing','Consulting','Manufacturing','Education','Non-profit','Government','Retail','Media','Real Estate'];
const adminJobTypes = [
  { value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' }, { value: 'temporary', label: 'Temporary' },
  { value: 'internship-paid', label: 'Internship (Paid)' }, { value: 'internship-unpaid', label: 'Internship (Unpaid)' },
];

const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-teal-900/10 bg-white text-teal-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400";
const iconInputCls = "w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-teal-900/10 bg-white text-teal-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400";
const labelCls = "block text-xs font-bold text-teal-800 mb-1.5";
const sectionHeader = (icon: React.ReactNode, title: string, desc: string) => (
  <div className="flex items-center gap-3 pb-3 mb-4 border-b border-teal-900/10">
    <div className="w-9 h-9 rounded-xl bg-[#f6f3eb] text-teal-950 flex items-center justify-center">{icon}</div>
    <div><p className="text-sm font-black text-teal-950">{title}</p><p className="text-xs text-teal-600">{desc}</p></div>
  </div>
);

const steps = [
  { id: 1, name: 'Basic Info', icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: 2, name: 'Details',    icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 3, name: 'Salary',     icon: <DollarSign className="w-3.5 h-3.5" /> },
  { id: 4, name: 'Apply',      icon: <Link2 className="w-3.5 h-3.5" /> },
];

export default function CreateJobPage() {
  const router = useRouter();
  const { user } = useUser();
  const { token: accessToken } = useAuth0Token();
  const [activeStep, setActiveStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '', company: '', location: '', industry: 'Technology', jobType: 'full-time',
    experienceLevel: 'mid', description: '', requirements: '', responsibilities: '',
    skills: '', salaryMin: '', salaryMax: '', currency: 'INR', applicationUrl: '',
    applicationEmail: '', expiresAt: '30', benefits: '', category: 'software',
    workMode: 'hybrid', vacancies: '1',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
    const payload: any = {
      title: formData.title, company: formData.company, location: formData.location,
      description: formData.description, responsibilities: formData.responsibilities,
      requirements: formData.requirements, benefits: formData.benefits,
      salary_min: formData.salaryMin || null, salary_max: formData.salaryMax || null,
      currency: formData.currency || null,
      tags: formData.skills ? formData.skills.split(',').map(t => t.trim()).filter(Boolean) : [],
      status: 'Approved', featured: false,
      logo: `/placeholder.svg?height=40&width=40&text=${(formData.company || 'C').charAt(0)}`,
      industry: formData.industry, job_type: formData.jobType, is_remote: formData.workMode === 'remote',
      application_deadline: (() => { const d = Number(formData.expiresAt || '30'); return new Date(Date.now() + d * 86400000).toISOString(); })(),
      contact_person: null,
      application_method: formData.applicationUrl ? 'company' : formData.applicationEmail ? 'email' : null,
      application_url: formData.applicationUrl || null, posted_by: user?.email || null,
    };
    try {
      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST', headers: { 'content-type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setShowSuccess(true);
      setTimeout(() => router.push('/admin/jobs'), 1200);
    } catch (err) { console.error('Error creating job:', err); alert('Failed to create job. Check console for details.'); }
  };

  const canSubmit = !!(formData.applicationUrl || formData.applicationEmail);

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-[#f6f3eb] rounded-[20px] p-6 sm:p-8 flex items-center gap-5 border border-teal-900/10">
          <Link href="/admin/jobs" className="w-10 h-10 rounded-xl bg-white/60 border border-white text-teal-800 hover:bg-white transition-all shadow-sm shrink-0 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-950 tracking-tight flex items-center gap-2 mb-1">
              <Briefcase className="w-7 h-7 text-teal-950" />Post New Job
            </h1>
            <p className="text-teal-800 text-[15px] sm:text-base">Create a new job posting or internship opportunity</p>
          </div>
        </div>

        {/* Success */}
        {showSuccess && (
          <div className="bg-[#f6f3eb] border border-pink-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-teal-950" />
            <div><p className="text-sm font-bold text-rose-800">Job posted successfully!</p><p className="text-xs text-teal-950">Redirecting…</p></div>
          </div>
        )}

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-4">
          <div className="flex items-center gap-0">
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${activeStep >= step.id ? 'bg-[#f3b13a] text-teal-950 font-bold' : 'bg-[#f6f3eb] text-teal-600'}`}>{step.icon}</div>
                  <span className={`hidden sm:block text-xs font-bold ${activeStep >= step.id ? 'text-teal-950' : 'text-teal-600'}`}>{step.name}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${activeStep > step.id ? 'bg-teal-500' : 'bg-teal-100'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Step 1: Basic Info */}
          {activeStep === 1 && (
            <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-5">
              {sectionHeader(<Briefcase className="w-4 h-4" />, 'Basic Information', 'Core job details')}
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Job Title *</label>
                  <div className="relative"><Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" /><input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Senior Software Engineer" className={iconInputCls} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Company *</label>
                    <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" /><input type="text" name="company" value={formData.company} onChange={handleChange} required placeholder="e.g., Google" className={iconInputCls} /></div>
                  </div>
                  <div>
                    <label className={labelCls}>Category *</label>
                    <select name="category" value={formData.category} onChange={handleChange} required className={inputCls}>
                      <option value="software">Software Development</option><option value="design">Design</option><option value="marketing">Marketing</option>
                      <option value="sales">Sales</option><option value="finance">Finance</option><option value="hr">Human Resources</option>
                      <option value="operations">Operations</option><option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Job Type *</label>
                    <select name="jobType" value={formData.jobType} onChange={handleChange} required className={inputCls}>
                      {adminJobTypes.map(jt => <option key={jt.value} value={jt.value}>{jt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Industry *</label>
                    <select name="industry" value={formData.industry} onChange={handleChange} required className={inputCls}>
                      {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Location *</label>
                    <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" /><input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="Mumbai, India" className={iconInputCls} /></div>
                  </div>
                  <div>
                    <label className={labelCls}>Work Mode *</label>
                    <select name="workMode" value={formData.workMode} onChange={handleChange} required className={inputCls}>
                      <option value="remote">Remote</option><option value="onsite">On-site</option><option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Experience Level *</label>
                    <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} required className={inputCls}>
                      <option value="entry">Entry (0-2 yrs)</option><option value="mid">Mid (2-5 yrs)</option>
                      <option value="senior">Senior (5+ yrs)</option><option value="lead">Lead/Manager</option><option value="executive">Executive</option>
                    </select>
                  </div>
                </div>
                <div className="max-w-xs">
                  <label className={labelCls}>Vacancies</label>
                  <div className="relative"><Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" /><input type="number" name="vacancies" value={formData.vacancies} onChange={handleChange} min="1" placeholder="1" className={iconInputCls} /></div>
                </div>
              </div>
              <div className="flex justify-end mt-5 pt-4 border-t border-teal-900/10">
                <button type="button" onClick={() => setActiveStep(2)} className="px-5 py-2.5 text-sm font-bold rounded-xl bg-[#f3b13a] text-teal-950 font-bold hover:bg-[#d89c30] transition-colors">Next: Job Details →</button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {activeStep === 2 && (
            <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-5">
              {sectionHeader(<FileText className="w-4 h-4" />, 'Job Details', 'Describe the role and requirements')}
              <div className="space-y-4">
                <div><label className={labelCls}>Job Description *</label><textarea name="description" value={formData.description} onChange={handleChange} required rows={4} placeholder="Provide a comprehensive description of the role, team, and company culture…" className={`${inputCls} resize-none`} /></div>
                <div><label className={labelCls}>Key Responsibilities *</label><textarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} required rows={4} placeholder={"• Develop and maintain web applications\n• Collaborate with cross-functional teams"} className={`${inputCls} resize-none`} /></div>
                <div><label className={labelCls}>Required Qualifications *</label><textarea name="requirements" value={formData.requirements} onChange={handleChange} required rows={4} placeholder={"• Bachelor's degree in CS\n• 3+ years of experience"} className={`${inputCls} resize-none`} /></div>
                <div><label className={labelCls}>Required Skills *</label><input type="text" name="skills" value={formData.skills} onChange={handleChange} required placeholder="e.g., React, Node.js, TypeScript, AWS" className={inputCls} /><p className="text-[10px] text-teal-600 mt-1">Separate with commas</p></div>
                <div><label className={labelCls}>Benefits & Perks</label><textarea name="benefits" value={formData.benefits} onChange={handleChange} rows={3} placeholder={"• Health insurance\n• Flexible working hours"} className={`${inputCls} resize-none`} /></div>
              </div>
              <div className="flex justify-between mt-5 pt-4 border-t border-teal-900/10">
                <button type="button" onClick={() => setActiveStep(1)} className="px-5 py-2.5 text-sm font-bold rounded-xl border border-teal-900/10 text-teal-900 hover:bg-[#f6f3eb] transition-colors">← Back</button>
                <button type="button" onClick={() => setActiveStep(3)} className="px-5 py-2.5 text-sm font-bold rounded-xl bg-[#f3b13a] text-teal-950 font-bold hover:bg-[#d89c30] transition-colors">Next: Compensation →</button>
              </div>
            </div>
          )}

          {/* Step 3: Compensation */}
          {activeStep === 3 && (
            <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-5">
              {sectionHeader(<DollarSign className="w-4 h-4" />, 'Compensation', 'Salary range and currency')}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className={labelCls}>Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className={inputCls}>
                    <option value="INR">₹ INR</option><option value="USD">$ USD</option><option value="EUR">€ EUR</option><option value="GBP">£ GBP</option>
                  </select>
                </div>
                <div><label className={labelCls}>Min Salary (Annual)</label><input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleChange} placeholder="500000" className={inputCls} /></div>
                <div><label className={labelCls}>Max Salary (Annual)</label><input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleChange} placeholder="1000000" className={inputCls} /></div>
              </div>
              {formData.salaryMin && formData.salaryMax && (
                <div className="mt-4 bg-[#f6f3eb] border border-pink-200 rounded-xl p-4 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-teal-950 shrink-0" />
                  <div>
                    <p className="text-xs text-teal-700 font-semibold">Salary Range</p>
                    <p className="text-lg font-black text-rose-700">{formData.currency === 'INR' ? '₹' : '$'}{parseInt(formData.salaryMin).toLocaleString()} – {formData.currency === 'INR' ? '₹' : '$'}{parseInt(formData.salaryMax).toLocaleString()}</p>
                    <p className="text-[10px] text-teal-600">Per annum</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-5 pt-4 border-t border-teal-900/10">
                <button type="button" onClick={() => setActiveStep(2)} className="px-5 py-2.5 text-sm font-bold rounded-xl border border-teal-900/10 text-teal-900 hover:bg-[#f6f3eb] transition-colors">← Back</button>
                <button type="button" onClick={() => setActiveStep(4)} className="px-5 py-2.5 text-sm font-bold rounded-xl bg-[#f3b13a] text-teal-950 font-bold hover:bg-[#d89c30] transition-colors">Next: Application →</button>
              </div>
            </div>
          )}

          {/* Step 4: Application */}
          {activeStep === 4 && (
            <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-5">
              {sectionHeader(<Link2 className="w-4 h-4" />, 'Application Details', 'How candidates can apply')}
              <div className="space-y-4">
                <div><label className={labelCls}>Application URL</label>
                  <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" /><input type="url" name="applicationUrl" value={formData.applicationUrl} onChange={handleChange} placeholder="https://company.com/careers/apply" className={iconInputCls} /></div>
                </div>
                <div className="relative flex items-center gap-3"><div className="flex-1 h-px bg-teal-100" /><span className="text-xs text-teal-600 font-semibold">OR</span><div className="flex-1 h-px bg-teal-100" /></div>
                <div><label className={labelCls}>Application Email</label>
                  <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" /><input type="email" name="applicationEmail" value={formData.applicationEmail} onChange={handleChange} placeholder="careers@company.com" className={iconInputCls} /></div>
                </div>
                <div className="max-w-xs"><label className={labelCls}>Posting Expires In (days) *</label>
                  <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" /><input type="number" name="expiresAt" value={formData.expiresAt} onChange={handleChange} required min="1" max="90" placeholder="30" className={iconInputCls} /></div>
                  <p className="text-[10px] text-teal-600 mt-1">Maximum 90 days</p>
                </div>
                {!canSubmit && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 font-semibold">Please provide either an Application URL or Email for candidates to apply.</p>
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-5 pt-4 border-t border-teal-900/10">
                <button type="button" onClick={() => setActiveStep(3)} className="px-5 py-2.5 text-sm font-bold rounded-xl border border-teal-900/10 text-teal-900 hover:bg-[#f6f3eb] transition-colors">← Back</button>
                <button type="submit" disabled={!canSubmit} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-[#f3b13a] text-teal-950 font-bold hover:bg-[#d89c30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                  <Save className="w-4 h-4" />Post Job
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
