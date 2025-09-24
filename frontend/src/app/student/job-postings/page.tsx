"use client";

import React, { useState } from 'react';
import StudentNavigation from '../StudentNavigation';
import { Search, Filter, MapPin, Calendar, DollarSign, Clock, Building, Users, ExternalLink, Bookmark, Heart, Briefcase, GraduationCap } from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship' | 'contract';
  experience: 'entry' | 'mid' | 'senior';
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  postedDate: string;
  deadline: string;
  description: string;
  requirements: string[];
  benefits: string[];
  remote: boolean;
  saved: boolean;
  applied: boolean;
  companyLogo: string;
}

export default function JobPostings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [remoteOnly, setRemoteOnly] = useState(false);

  const jobTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'internship', label: 'Internship' },
    { value: 'contract', label: 'Contract' }
  ];

  const experienceLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' }
  ];

  const jobPostings: JobPosting[] = [
    {
      id: '1',
      title: 'Software Engineer Intern',
      company: 'Google',
      location: 'Mountain View, CA',
      type: 'internship',
      experience: 'entry',
      salary: { min: 7000, max: 9000, currency: 'USD' },
      postedDate: '2024-01-20',
      deadline: '2024-03-15',
      description: 'Join our team as a Software Engineer Intern and work on cutting-edge projects that impact billions of users worldwide.',
      requirements: ['Strong programming skills in Python, Java, or C++', 'Knowledge of data structures and algorithms', 'Currently pursuing CS degree'],
      benefits: ['Health insurance', 'Free meals', 'Learning stipend', 'Mentorship program'],
      remote: false,
      saved: false,
      applied: false,
      companyLogo: '/placeholder-logo.png'
    },
    {
      id: '2',
      title: 'Frontend Developer',
      company: 'Meta',
      location: 'Menlo Park, CA',
      type: 'full-time',
      experience: 'entry',
      salary: { min: 120000, max: 150000, currency: 'USD' },
      postedDate: '2024-01-18',
      deadline: '2024-02-28',
      description: 'Build the future of social technology with React and cutting-edge frontend frameworks.',
      requirements: ['3+ years React experience', 'TypeScript proficiency', 'Bachelor\'s degree in CS or related field'],
      benefits: ['Competitive salary', 'Stock options', 'Comprehensive healthcare', 'Flexible PTO'],
      remote: true,
      saved: true,
      applied: false,
      companyLogo: '/placeholder-logo.png'
    },
    {
      id: '3',
      title: 'Data Science Intern',
      company: 'Microsoft',
      location: 'Seattle, WA',
      type: 'internship',
      experience: 'entry',
      salary: { min: 6500, max: 8500, currency: 'USD' },
      postedDate: '2024-01-15',
      deadline: '2024-03-01',
      description: 'Work with our data science team to analyze large datasets and build machine learning models.',
      requirements: ['Python and R proficiency', 'Machine learning knowledge', 'Statistics background'],
      benefits: ['Housing stipend', 'Transportation', 'Networking events', 'Full-time offer potential'],
      remote: false,
      saved: false,
      applied: true,
      companyLogo: '/placeholder-logo.png'
    },
    {
      id: '4',
      title: 'UX Designer',
      company: 'Adobe',
      location: 'San Jose, CA',
      type: 'full-time',
      experience: 'entry',
      salary: { min: 85000, max: 110000, currency: 'USD' },
      postedDate: '2024-01-22',
      deadline: '2024-02-25',
      description: 'Create intuitive and beautiful user experiences for our creative software suite.',
      requirements: ['Portfolio of design work', 'Figma/Adobe XD expertise', 'User research experience'],
      benefits: ['Creative software access', 'Design conferences', 'Flexible work arrangements', 'Professional development'],
      remote: true,
      saved: true,
      applied: false,
      companyLogo: '/placeholder-logo.png'
    }
  ];

  const filteredJobs = jobPostings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || job.type === selectedType;
    const matchesExperience = selectedExperience === 'all' || job.experience === selectedExperience;
    const matchesRemote = !remoteOnly || job.remote;
    
    return matchesSearch && matchesType && matchesExperience && matchesRemote;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-600';
      case 'part-time': return 'bg-blue-100 text-blue-600';
      case 'internship': return 'bg-purple-100 text-purple-600';
      case 'contract': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case 'entry': return 'bg-green-100 text-green-600';
      case 'mid': return 'bg-yellow-100 text-yellow-600';
      case 'senior': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatSalary = (salary: JobPosting['salary']) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    return diffDays === 1 ? '1 day left' : `${diffDays} days left`;
  };

  return (
    <StudentNavigation>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Postings</h1>
          <p className="text-gray-600">Discover career opportunities and internships</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{jobPostings.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Saved Jobs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{jobPostings.filter(j => j.saved).length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Applications</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{jobPostings.filter(j => j.applied).length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Remote Jobs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{jobPostings.filter(j => j.remote).length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search jobs by title, company, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {jobTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <select 
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remote-only"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="remote-only" className="text-sm text-gray-700">
              Remote jobs only
            </label>
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <img 
                    src={job.companyLogo} 
                    alt={job.company}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-blue-600 font-medium mb-2">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatSalary(job.salary)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getDaysAgo(job.postedDate)}
                      </div>
                      {job.remote && (
                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                          Remote
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                    {job.type.replace('-', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getExperienceColor(job.experience)}`}>
                    {job.experience} level
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{job.description}</p>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Requirements:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {job.requirements.slice(0, 3).map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Deadline: {getDaysUntil(job.deadline)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      job.saved 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${job.saved ? 'fill-current' : ''}`} />
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Details
                  </button>
                  <button 
                    className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
                      job.applied
                        ? 'bg-green-100 text-green-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    disabled={job.applied}
                  >
                    {job.applied ? 'Applied' : 'Apply Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </StudentNavigation>
  );
}