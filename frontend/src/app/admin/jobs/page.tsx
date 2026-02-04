"use client";

import React, { useState } from 'react';
import AdminNavigation from '../AdminNavigation';
import { 
  Briefcase, Search, Filter, CheckCircle, XCircle, 
  Clock, Eye, Plus, Edit, Trash2, MapPin, Building, 
  DollarSign, Calendar, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';

interface JobPosting {
  id: number;
  title: string;
  company: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior';
  description: string;
  requirements: string;
  salaryRange?: string;
  applicationUrl?: string;
  postedBy: string;
  postedByEmail: string;
  postedDate: string;
  expiresAt?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
}

export default function JobManagementPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const [jobs, setJobs] = useState<JobPosting[]>([
    {
      id: 1,
      title: 'Senior Software Engineer',
      company: 'Google',
      location: 'Mumbai, India',
      jobType: 'full-time',
      experienceLevel: 'senior',
      description: 'We are looking for an experienced software engineer to join our team...',
      requirements: 'BS in Computer Science, 5+ years experience in full-stack development',
      salaryRange: '₹25-35 LPA',
      applicationUrl: 'https://google.com/careers',
      postedBy: 'John Doe',
      postedByEmail: 'john@example.com',
      postedDate: '2 days ago',
      expiresAt: '30 days',
      approvalStatus: 'pending',
      isActive: true
    },
    {
      id: 2,
      title: 'Frontend Developer Intern',
      company: 'Microsoft',
      location: 'Bangalore, India',
      jobType: 'internship',
      experienceLevel: 'entry',
      description: 'Exciting internship opportunity for frontend developers...',
      requirements: 'Knowledge of React, TypeScript, and modern web development',
      salaryRange: '₹30,000/month',
      applicationUrl: 'https://careers.microsoft.com',
      postedBy: 'Jane Smith',
      postedByEmail: 'jane@example.com',
      postedDate: '1 day ago',
      approvalStatus: 'pending',
      isActive: true
    },
    {
      id: 3,
      title: 'Data Scientist',
      company: 'Amazon',
      location: 'Hyderabad, India',
      jobType: 'full-time',
      experienceLevel: 'mid',
      description: 'Join our data science team to build ML models...',
      requirements: 'MS in Data Science or related field, 3+ years experience',
      salaryRange: '₹20-30 LPA',
      postedBy: 'Mike Johnson',
      postedByEmail: 'mike@example.com',
      postedDate: '1 week ago',
      approvalStatus: 'approved',
      isActive: true
    },
  ]);

  const handleApprove = (jobId: number) => {
    setJobs(jobs.map(j => 
      j.id === jobId ? { ...j, approvalStatus: 'approved' as const } : j
    ));
  };

  const handleReject = (jobId: number) => {
    setJobs(jobs.map(j => 
      j.id === jobId ? { ...j, approvalStatus: 'rejected' as const } : j
    ));
  };

  const handleDelete = (jobId: number) => {
    setJobs(jobs.filter(j => j.id !== jobId));
  };

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'all' || job.approvalStatus === filter;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchQuery.toLowerCase());
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

  const getJobTypeBadge = (type: string) => {
    const colors = {
      'full-time': 'bg-blue-100 text-blue-700',
      'part-time': 'bg-purple-100 text-purple-700',
      'contract': 'bg-orange-100 text-orange-700',
      'internship': 'bg-green-100 text-green-700'
    };
    return <span className={`px-2 py-1 ${colors[type as keyof typeof colors]} rounded text-xs font-medium`}>{type}</span>;
  };

  return (
    <AdminNavigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600 mt-2">Manage job postings and internship opportunities</p>
          </div>
          <Link 
            href="/admin/jobs/create"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post New Job
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, company, or location..."
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
                All ({jobs.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({jobs.filter(j => j.approvalStatus === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved ({jobs.filter(j => j.approvalStatus === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({jobs.filter(j => j.approvalStatus === 'rejected').length})
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icon */}
                    <div className="p-3 bg-purple-50 rounded-lg flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-purple-600" />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="flex items-center text-gray-700 font-medium">
                              <Building className="w-4 h-4 mr-1" />{job.company}
                            </span>
                            <span className="flex items-center text-gray-600">
                              <MapPin className="w-4 h-4 mr-1" />{job.location}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(job.approvalStatus)}
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="flex items-center space-x-3 mt-3">
                        {getJobTypeBadge(job.jobType)}
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">{job.experienceLevel} Level</span>
                        {job.salaryRange && (
                          <span className="flex items-center text-gray-600 text-sm">
                            <DollarSign className="w-4 h-4 mr-1" />{job.salaryRange}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-sm text-gray-700 line-clamp-2">{job.description}</p>

                      {/* Posted Info */}
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>Posted by {job.postedBy} • {job.postedDate}</span>
                        {job.expiresAt && <span>Expires in {job.expiresAt}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    {job.applicationUrl && (
                      <a
                        href={job.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm flex items-center"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm flex items-center">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm flex items-center">
                      <Edit className="w-4 h-4" />
                    </button>
                    {job.approvalStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(job.id)}
                          className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium text-sm flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(job.id)}
                          className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium text-sm flex items-center"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm flex items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminNavigation>
  );
}
