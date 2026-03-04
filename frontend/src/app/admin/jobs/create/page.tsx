"use client";

import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../../hooks/useAuth0Token';
import AdminNavigation from '../../AdminNavigation';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, ArrowLeft, Save, X, Building2, MapPin, 
  Clock, DollarSign, Globe, Mail, Link2, Calendar,
  FileText, CheckCircle, AlertCircle, Sparkles, Users,
  TrendingUp, Award, Target, Eye, Info
} from 'lucide-react';
import Link from 'next/link';

interface FormData {
  title: string;
  company: string;
  location: string;
  industry: string;
  jobType: string;
  experienceLevel: string;
  description: string;
  requirements: string;
  responsibilities: string;
  skills: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  applicationUrl: string;
  applicationEmail: string;
  expiresAt: string;
  benefits: string;
  category: string;
  workMode: string;
  vacancies: string;
}

export default function CreateJobPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    company: '',
    location: '',
    industry: 'Technology',
    jobType: 'full-time',
    experienceLevel: 'mid',
    description: '',
    requirements: '',
    responsibilities: '',
    skills: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'INR',
    applicationUrl: '',
    applicationEmail: '',
    expiresAt: '30',
    benefits: '',
    category: 'software',
    workMode: 'hybrid',
    vacancies: '1'
  });

  const { user } = useUser();
  const { token: accessToken } = useAuth0Token();

  const industries = [
    'Technology', 'Finance', 'Healthcare', 'Marketing', 'Consulting', 'Manufacturing', 'Education', 'Non-profit', 'Government', 'Retail', 'Media', 'Real Estate'
  ];

  const adminJobTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship-paid', label: 'Internship (Paid)' },
    { value: 'internship-unpaid', label: 'Internship (Unpaid)' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
    

    const payload: any = {
      title: formData.title,
      company: formData.company,
      location: formData.location,
      description: formData.description,
      responsibilities: formData.responsibilities,
      requirements: formData.requirements,
      benefits: formData.benefits,
      salary_min: formData.salaryMin || null,
      salary_max: formData.salaryMax || null,
      currency: formData.currency || null,
      tags: formData.skills ? formData.skills.split(',').map((t) => t.trim()).filter(Boolean) : [],
      status: 'Approved',
      featured: false,
      logo: `/placeholder.svg?height=40&width=40&text=${(formData.company || 'C').charAt(0)}`,
      industry: formData.industry,
      job_type: formData.jobType,
      is_remote: formData.workMode === 'remote',
      application_deadline: (() => {
        const days = Number(formData.expiresAt || '30');
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      })(),
      contact_person: null,
      application_method: formData.applicationUrl ? 'company' : (formData.applicationEmail ? 'email' : null),
      application_url: formData.applicationUrl || null,
      posted_by: user?.email || null,
    };

    try {
      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error('Job create failed:', res.status, await res.text());
        throw new Error(`Failed to create job: ${res.status}`);
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push('/admin/jobs');
      }, 1200);
    } catch (err) {
      console.error('Error creating job:', err);
      // Show a simple inline error via console; keep UX minimal for now
      alert('Failed to create job. Check console for details.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const steps = [
    { id: 1, name: 'Basic Info', icon: <Briefcase className="w-4 h-4" /> },
    { id: 2, name: 'Details', icon: <FileText className="w-4 h-4" /> },
    { id: 3, name: 'Compensation', icon: <DollarSign className="w-4 h-4" /> },
    { id: 4, name: 'Application', icon: <Link2 className="w-4 h-4" /> }
  ];

  return (
    <AdminNavigation>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/jobs"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Post New Job
              </h1>
              <p className="text-gray-600 mt-1">Create a new job posting or internship opportunity</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">Job posted successfully!</p>
              <p className="text-xs text-green-700">Redirecting to jobs page...</p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    activeStep >= step.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="hidden md:block">
                    <p className={`text-sm font-semibold ${
                      activeStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      Step {step.id}
                    </p>
                    <p className={`text-xs ${
                      activeStep >= step.id ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {step.name}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    activeStep > step.id ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          {activeStep === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 animate-fade-in">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
                  <p className="text-sm text-gray-500">Enter the core job details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Job Title <span className="text-red-500 ml-1">*</span>
                    <Info className="w-3.5 h-3.5 text-gray-400 ml-1" />
                  </label>
                  <div className="relative">
                    <Sparkles className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Senior Software Engineer"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      Company <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Google"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer text-gray-900 font-medium"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="software">Software Development</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                        <option value="sales">Sales</option>
                        <option value="finance">Finance</option>
                        <option value="hr">Human Resources</option>
                        <option value="operations">Operations</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">Job Type <span className="text-red-500 ml-1">*</span></label>
                    <select name="jobType" value={formData.jobType} onChange={handleChange} required className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer text-gray-900 font-medium">
                      {adminJobTypes.map((jt) => <option key={jt.value} value={jt.value}>{jt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">Industry <span className="text-red-500 ml-1">*</span></label>
                    <select name="industry" value={(formData as any).industry} onChange={handleChange} required className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer text-gray-900 font-medium">
                      {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      Location <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        placeholder="Mumbai, India"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      Work Mode <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="workMode"
                        value={formData.workMode}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer text-gray-900 font-medium"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="remote">Remote</option>
                        <option value="onsite">On-site</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      Vacancies <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Users className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="number"
                        name="vacancies"
                        value={formData.vacancies}
                        onChange={handleChange}
                        required
                        min="1"
                        placeholder="1"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      Job Type <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="jobType"
                        value={formData.jobType}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer text-gray-900 font-medium"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                        <option value="freelance">Freelance</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      Experience Level <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer text-gray-900 font-medium"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="entry">Entry Level (0-2 years)</option>
                        <option value="mid">Mid Level (2-5 years)</option>
                        <option value="senior">Senior Level (5+ years)</option>
                        <option value="lead">Lead/Manager</option>
                        <option value="executive">Executive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Next: Job Details
                </button>
              </div>
            </div>
          )}

          {/* Job Details */}
          {activeStep === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 animate-fade-in">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Job Details</h2>
                  <p className="text-sm text-gray-500">Describe the role and requirements</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Job Description <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Provide a comprehensive description of the role, team, and company culture..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Key Responsibilities <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    name="responsibilities"
                    value={formData.responsibilities}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="• Develop and maintain web applications&#10;• Collaborate with cross-functional teams&#10;• Write clean, maintainable code"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Required Qualifications <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="• Bachelor's degree in Computer Science&#10;• 3+ years of experience&#10;• Strong problem-solving skills"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Required Skills <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    required
                    placeholder="e.g., React, Node.js, TypeScript, AWS"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Benefits & Perks
                  </label>
                  <textarea
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleChange}
                    rows={3}
                    placeholder="• Health insurance&#10;• Flexible working hours&#10;• Professional development opportunities"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-6 py-2.5 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Next: Compensation
                </button>
              </div>
            </div>
          )}

          {/* Compensation */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Currency
                  </label>
                  <div className="relative">
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer text-gray-900 font-medium"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      <option value="INR">₹ INR (Indian Rupee)</option>
                      <option value="USD">$ USD (US Dollar)</option>
                      <option value="EUR">€ EUR (Euro)</option>
                      <option value="GBP">£ GBP (British Pound)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Minimum Salary (Annual)
                  </label>
                  <input
                    type="number"
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    placeholder="500000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Maximum Salary (Annual)
                  </label>
                  <input
                    type="number"
                    name="salaryMax"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    placeholder="1000000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {formData.salaryMin && formData.salaryMax && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Salary Range</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {formData.currency === 'INR' ? '₹' : '$'}{parseInt(formData.salaryMin).toLocaleString()} - {formData.currency === 'INR' ? '₹' : '$'}{parseInt(formData.salaryMax).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Per annum</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-2.5 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Next: Application
                </button>
              </div>
            </div>
          )}

          {/* Application Details */}
          {activeStep === 4 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 animate-fade-in">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Application Details</h2>
                  <p className="text-sm text-gray-500">How candidates can apply</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Application URL
                  </label>
                  <div className="relative">
                    <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="url"
                      name="applicationUrl"
                      value={formData.applicationUrl}
                      onChange={handleChange}
                      placeholder="https://company.com/careers/apply"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Application Email
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      name="applicationEmail"
                      value={formData.applicationEmail}
                      onChange={handleChange}
                      placeholder="careers@company.com"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Job Posting Expires In (days) <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="number"
                      name="expiresAt"
                      value={formData.expiresAt}
                      onChange={handleChange}
                      required
                      min="1"
                      max="90"
                      placeholder="30"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Maximum 90 days</p>
                </div>

                {!formData.applicationUrl && !formData.applicationEmail && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">Application Method Required</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Please provide either an application URL or email address for candidates to apply.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-2.5 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!formData.applicationUrl && !formData.applicationEmail}
                  className="flex items-center space-x-2 px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  <span>Post Job</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </AdminNavigation>
  );
}
