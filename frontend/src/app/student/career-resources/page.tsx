"use client";

import React, { useState } from 'react';
import StudentNavigation from '../StudentNavigation';
import { Search, Filter, BookOpen, Video, FileText, ExternalLink, Star, Clock, Users, TrendingUp, Briefcase, GraduationCap, Code } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'article' | 'video' | 'tool' | 'book';
  category: string;
  rating: number;
  duration?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  url: string;
  provider: string;
  featured?: boolean;
}

export default function CareerResources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'programming', label: 'Programming' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-development', label: 'Mobile Development' },
    { value: 'career-guidance', label: 'Career Guidance' },
    { value: 'interview-prep', label: 'Interview Preparation' },
    { value: 'soft-skills', label: 'Soft Skills' }
  ];

  const resources: Resource[] = [
    {
      id: '1',
      title: 'Complete React Developer Course',
      description: 'Learn React from basics to advanced concepts with real-world projects',
      type: 'course',
      category: 'web-development',
      rating: 4.8,
      duration: '40 hours',
      level: 'intermediate',
      url: '#',
      provider: 'TechEd',
      featured: true
    },
    {
      id: '2',
      title: 'System Design Interview Guide',
      description: 'Comprehensive guide to ace system design interviews at top tech companies',
      type: 'book',
      category: 'interview-prep',
      rating: 4.9,
      level: 'advanced',
      url: '#',
      provider: 'TechBooks',
      featured: true
    },
    {
      id: '3',
      title: 'Data Structures and Algorithms in Python',
      description: 'Master DSA concepts with Python implementation and practice problems',
      type: 'course',
      category: 'programming',
      rating: 4.7,
      duration: '30 hours',
      level: 'intermediate',
      url: '#',
      provider: 'CodeAcademy'
    },
    {
      id: '4',
      title: 'Machine Learning Fundamentals',
      description: 'Introduction to ML algorithms and their practical applications',
      type: 'course',
      category: 'data-science',
      rating: 4.6,
      duration: '25 hours',
      level: 'beginner',
      url: '#',
      provider: 'ML Institute'
    },
    {
      id: '5',
      title: 'Mobile App Development with Flutter',
      description: 'Build cross-platform mobile apps using Flutter framework',
      type: 'video',
      category: 'mobile-development',
      rating: 4.5,
      duration: '12 hours',
      level: 'intermediate',
      url: '#',
      provider: 'FlutterPro'
    },
    {
      id: '6',
      title: 'Resume Writing for Tech Professionals',
      description: 'Craft compelling resumes that get you noticed by tech recruiters',
      type: 'article',
      category: 'career-guidance',
      rating: 4.4,
      level: 'beginner',
      url: '#',
      provider: 'CareerHub'
    },
    {
      id: '7',
      title: 'Git and Version Control Mastery',
      description: 'Complete guide to Git workflows and collaboration best practices',
      type: 'tool',
      category: 'programming',
      rating: 4.8,
      duration: '8 hours',
      level: 'beginner',
      url: '#',
      provider: 'DevTools'
    },
    {
      id: '8',
      title: 'Leadership Skills for Developers',
      description: 'Develop leadership and communication skills essential for career growth',
      type: 'course',
      category: 'soft-skills',
      rating: 4.3,
      duration: '15 hours',
      level: 'intermediate',
      url: '#',
      provider: 'LeadershipPro'
    }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || resource.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const featuredResources = resources.filter(resource => resource.featured);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <GraduationCap className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'article': return <FileText className="w-5 h-5" />;
      case 'book': return <BookOpen className="w-5 h-5" />;
      case 'tool': return <Code className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course': return 'bg-blue-100 text-blue-600';
      case 'video': return 'bg-red-100 text-red-600';
      case 'article': return 'bg-green-100 text-green-600';
      case 'book': return 'bg-purple-100 text-purple-600';
      case 'tool': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-600';
      case 'intermediate': return 'bg-yellow-100 text-yellow-600';
      case 'advanced': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <StudentNavigation>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Career Resources</h1>
          <p className="text-gray-600">Discover curated learning resources to boost your career</p>
        </div>

        {/* Featured Resources */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Featured Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredResources.map(resource => (
              <div key={resource.id} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getTypeColor(resource.type)}`}>
                    {getTypeIcon(resource.type)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-700">{resource.rating}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(resource.level)}`}>
                      {resource.level}
                    </span>
                    {resource.duration && (
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {resource.duration}
                      </span>
                    )}
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
                    Access <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select 
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">All Resources</h2>
            <span className="text-sm text-gray-600">{filteredResources.length} resources found</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map(resource => (
              <div key={resource.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                    {getTypeIcon(resource.type)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-700">{resource.rating}</span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{resource.description}</p>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(resource.level)}`}>
                    {resource.level}
                  </span>
                  <span className="text-xs text-gray-600">{resource.provider}</span>
                </div>

                <div className="flex items-center justify-between">
                  {resource.duration && (
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {resource.duration}
                    </span>
                  )}
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
                    View <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>
      </div>
    </StudentNavigation>
  );
}