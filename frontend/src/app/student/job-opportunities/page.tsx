"use client";

import React, { useState, useEffect } from 'react';
import StudentNavigation from '../StudentNavigation';
import { Search, Filter, MapPin, Building, Clock, DollarSign, BookmarkPlus, ExternalLink, Star, Calendar, Users, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  salary?: string;
  posted: string;
  deadline: string;
  description: string;
  requirements: string[];
  benefits: string[];
  isBookmarked: boolean;
  applicants: number;
  companyLogo?: string;
}

const JobOpportunitiesPage = () => {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API call
  const mockJobs: JobOpportunity[] = [
    {
      id: '1',
      title: 'Software Engineering Intern',
      company: 'Google',
      location: 'Mountain View, CA',
      type: 'Internship',
      salary: '$6,000/month',
      posted: '2 days ago',
      deadline: '2025-10-15',
      description: 'Join our engineering team to work on cutting-edge technologies and gain hands-on experience in software development.',
      requirements: ['Computer Science student', 'Python/Java proficiency', 'Strong problem-solving skills'],
      benefits: ['Competitive stipend', 'Mentorship program', 'Free meals', 'Housing assistance'],
      isBookmarked: false,
      applicants: 234,
    },
    {
      id: '2',
      title: 'Data Science Intern',
      company: 'Microsoft',
      location: 'Seattle, WA',
      type: 'Internship',
      salary: '$5,500/month',
      posted: '1 week ago',
      deadline: '2025-10-30',
      description: 'Work with our data science team to analyze large datasets and build machine learning models.',
      requirements: ['Statistics/Data Science background', 'Python, R, SQL', 'Machine Learning knowledge'],
      benefits: ['Health insurance', 'Learning budget', 'Flexible hours', 'Remote work options'],
      isBookmarked: true,
      applicants: 189,
    },
    {
      id: '3',
      title: 'Frontend Developer',
      company: 'Spotify',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$95,000/year',
      posted: '3 days ago',
      deadline: '2025-11-15',
      description: 'Build amazing user experiences and interfaces for millions of music lovers worldwide.',
      requirements: ['React/Angular expertise', 'JavaScript/TypeScript', '2+ years experience', 'UI/UX knowledge'],
      benefits: ['Stock options', 'Premium Spotify', 'Health insurance', 'Gym membership'],
      isBookmarked: false,
      applicants: 156,
    },
    {
      id: '4',
      title: 'Product Management Intern',
      company: 'Amazon',
      location: 'Austin, TX',
      type: 'Internship',
      salary: '$5,800/month',
      posted: '5 days ago',
      deadline: '2025-10-20',
      description: 'Learn product strategy and work on features that impact millions of customers globally.',
      requirements: ['Business/Engineering student', 'Analytical skills', 'Leadership experience', 'Communication skills'],
      benefits: ['Relocation assistance', 'Networking events', 'Career mentorship', 'Employee discounts'],
      isBookmarked: false,
      applicants: 312,
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setJobs(mockJobs);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || job.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const toggleBookmark = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, isBookmarked: !job.isBookmarked } : job
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Full-time': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm';
      case 'Part-time': return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300 shadow-sm';
      case 'Internship': return 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-300 shadow-sm';
      case 'Contract': return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-300 shadow-sm';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm';
    }
  };

  if (loading) {
    return (
      <StudentNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
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
                            <div key={j} className="bg-gray-50 p-3 rounded-lg">
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
      </StudentNavigation>
    );
  }

  return (
    <StudentNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center lg:text-left">
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Job Opportunities
              </h1>
              <p className="text-base lg:text-lg text-gray-700 font-medium max-w-2xl mx-auto lg:mx-0">
                Discover amazing internships and career opportunities from top companies worldwide
              </p>
              <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{jobs.length} Active Jobs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Updated Daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="font-medium">Direct Applications</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Find Your Perfect Opportunity
              </h2>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-medium text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-12 pr-8 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white min-w-[180px] font-medium text-gray-900 transition-all duration-200"
                  >
                    <option value="all">All Job Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Jobs
                </Button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 lg:p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {filteredJobs.length} Opportunities Found
                    </p>
                    <p className="text-sm text-gray-600">
                      Out of {jobs.length} total positions available
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800">
                      {jobs.filter(job => job.isBookmarked).length} Saved
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    More Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="space-y-6">
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No Jobs Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn't find any opportunities matching your criteria. Try adjusting your search terms or filters.
                </p>
                <Button 
                  onClick={() => {setSearchTerm(''); setFilterType('all');}}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              filteredJobs.map(job => (
                <div key={job.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group relative">
                  <div className="p-6 lg:p-8">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {job.title}
                          </h3>
                          <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 self-start ${getTypeColor(job.type)} transition-all duration-200 group-hover:scale-105`}>
                            {job.type}
                          </span>
                        </div>
                        
                        {/* Company Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Building className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
                              <p className="font-semibold text-gray-900">{job.company}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-green-50 transition-colors duration-200">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <MapPin className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                              <p className="font-semibold text-gray-900">{job.location}</p>
                            </div>
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200">
                              <div className="bg-purple-100 p-2 rounded-lg">
                                <DollarSign className="w-4 h-4 text-purple-600" />
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
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Requirements
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {job.requirements.map((req, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors duration-200">
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <span className="text-blue-800 font-medium text-sm">{req}</span>
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
                                  <p className="font-semibold text-gray-900">{new Date(job.deadline).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                  <Users className="w-4 h-4 text-purple-600" />
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
                                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100' 
                                    : 'hover:bg-gray-50 border-gray-300'
                                }`}
                              >
                                <BookmarkPlus className="w-4 h-4 mr-2" />
                                {job.isBookmarked ? 'Saved' : 'Save Job'}
                              </Button>
                              <Button 
                                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Apply Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats Badge */}
                      <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
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
                className="px-8 py-4 rounded-xl font-semibold border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                Load More Opportunities
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                Showing {filteredJobs.length} of {jobs.length} total opportunities
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentNavigation>
  );
};

export default JobOpportunitiesPage;