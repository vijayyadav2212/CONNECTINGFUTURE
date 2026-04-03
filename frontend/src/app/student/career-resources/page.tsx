"use client";

import React, { useState } from 'react';
import StudentNavigation from '../StudentNavigation';
import { Search, Filter, BookOpen, Video, FileText, ExternalLink, Star, Clock, Users, TrendingUp, Briefcase, GraduationCap, Code, X, Sparkles } from 'lucide-react';

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
  const [roadmaps, setRoadmaps] = useState<Resource[]>([]);
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  React.useEffect(() => {
    fetch(`${backendUrl}/api/roadmaps?is_published=true`)
      .then(res => res.json())
      .then(data => {
        if (data.roadmaps && Array.isArray(data.roadmaps)) {
          const mapped: Resource[] = data.roadmaps.map((r: any) => ({
            id: `rm-${r.id}`,
            title: r.title,
            description: r.description,
            type: 'course', // Mapping roadmaps to 'course' type for now
            category: r.category || 'career-guidance',
            rating: 5.0, // Default rating for maps until dynamic
            duration: r.duration,
            level: (r.level || 'beginner').toLowerCase(),
            url: r.modules_link?.startsWith('http') ? r.modules_link : `https://${r.modules_link || '#'}`,
            provider: 'Alumni Community',
            featured: false
          }));
          setRoadmaps(mapped);
        }
      })
      .catch(err => console.error('Failed to fetch roadmaps:', err));
  }, []);

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

  const [selectedRoadmap, setSelectedRoadmap] = useState<Resource | null>(null);

  const allResources = [...roadmaps];

  const filteredResources = allResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || resource.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const featuredResources = allResources.filter(resource => resource.featured);

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-white p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-emerald-50/50 via-white to-white rounded-[40px] p-10 lg:p-12 border border-emerald-100/20 shadow-[0_20px_50px_rgba(0,0,0,0.03)] mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl opacity-60" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-emerald-600 font-black text-[11px] mb-4 uppercase tracking-[0.2em]">
                  <Sparkles size={16} className="text-emerald-500 animate-pulse" />
                  <span>Curated Learning</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight uppercase">
                  Career Resources
                </h1>
                
                <p className="text-slate-600 text-lg font-medium max-w-[600px] leading-relaxed mb-8">
                  Discover curated learning resources to boost your career, from alumni-recommended courses to professional roadmaps.
                </p>
                
                <div className="flex flex-wrap gap-3">
                   <div className="bg-white/90 px-5 py-2.5 rounded-full text-[12px] font-black text-slate-500 border border-slate-50 shadow-sm flex items-center gap-2.5 uppercase tracking-widest">
                     <BookOpen size={16} className="text-emerald-500" />
                     {allResources.length} Resources
                   </div>
                   <div className="bg-white/90 px-5 py-2.5 rounded-full text-[12px] font-black text-slate-500 border border-slate-50 shadow-sm flex items-center gap-2.5 uppercase tracking-widest">
                     <TrendingUp size={16} className="text-blue-500" />
                     Expert Verified
                   </div>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner border border-white">
                  <GraduationCap size={48} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Details Modal */}
          {selectedRoadmap && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300">
                <div className="p-8 lg:p-10 border-b border-slate-50 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight uppercase">{selectedRoadmap.title}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getLevelColor(selectedRoadmap.level)} border border-current opacity-80`}>
                        {selectedRoadmap.level}
                      </span>
                      <span className="text-slate-300 text-sm">•</span>
                      <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{selectedRoadmap.category}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRoadmap(null)}
                    className="p-3 hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="p-8 lg:p-10 space-y-8">
                  <div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Description</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">{selectedRoadmap.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-emerald-500" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                      </div>
                      <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{selectedRoadmap.duration || 'Self-paced'}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Star className="w-5 h-5 text-amber-500" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rating</span>
                      </div>
                      <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{selectedRoadmap.rating}/5.0</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-8 border-t border-slate-50">
                    <button
                      onClick={() => setSelectedRoadmap(null)}
                      className="px-6 py-3 border border-slate-200 rounded-2xl text-[12px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Close
                    </button>
                    <a
                      href={selectedRoadmap.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-black text-[12px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3"
                    >
                      Access Resource <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Featured Resources Section */}
          {featuredResources.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-widest">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                Featured Picks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredResources.map(resource => (
                  <div key={resource.id} className="bg-gradient-to-br from-emerald-50/50 via-white to-white rounded-[40px] p-8 border border-emerald-100/20 shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                    
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className={`p-4 rounded-[24px] ${getTypeColor(resource.type)} shadow-inner border border-white/50`}>
                        {getTypeIcon(resource.type)}
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-2xl shadow-sm border border-slate-50">
                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                        <span className="text-[12px] font-black text-slate-900 tracking-tight">{resource.rating}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight uppercase group-hover:text-emerald-600 transition-colors">{resource.title}</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 line-clamp-2 leading-relaxed">{resource.description}</p>
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getLevelColor(resource.level)} border border-current opacity-80`}>
                          {resource.level}
                        </span>
                        {resource.duration && (
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            {resource.duration}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedRoadmap(resource)}
                        className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        <ExternalLink size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and Filters Section */}
          <div className="bg-white rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 mb-10">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative group">
                <Search className="w-5 h-5 text-slate-400 absolute left-5 top-1/2 transform -translate-y-1/2 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search resources by title, skill, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 border border-slate-200 rounded-[28px] bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 font-medium text-slate-900 placeholder-slate-400 transition-all shadow-inner"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-8 py-4 border border-slate-200 rounded-[28px] bg-white focus:outline-none focus:border-emerald-500/30 font-bold text-slate-700 min-w-[200px] appearance-none cursor-pointer transition-all shadow-inner"
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
                  className="px-8 py-4 border border-slate-200 rounded-[28px] bg-white focus:outline-none focus:border-emerald-500/30 font-bold text-slate-700 min-w-[180px] appearance-none cursor-pointer transition-all shadow-inner"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resources Grid Wrapper */}
          <div className="bg-white rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100/50">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black">
                   <Filter size={20} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">All Resources</h2>
              </div>
              <span className="bg-slate-50 px-4 py-2 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{filteredResources.length} Found</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredResources.map(resource => (
                <div key={resource.id} className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 rounded-[20px] ${getTypeColor(resource.type)} shadow-sm`}>
                      {getTypeIcon(resource.type)}
                    </div>
                    <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-xl shadow-sm border border-slate-50">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="text-[12px] font-black text-slate-900 tracking-tight">{resource.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mb-3 tracking-tight uppercase group-hover:text-emerald-600 transition-colors">{resource.title}</h3>
                  <p className="text-slate-500 font-medium text-sm mb-6 line-clamp-2 leading-relaxed">{resource.description}</p>

                  <div className="flex flex-wrap items-center gap-3 mb-8">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getLevelColor(resource.level)} border border-current opacity-80`}>
                      {resource.level}
                    </span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">by {resource.provider}</span>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    {resource.duration && (
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        {resource.duration}
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedRoadmap(resource)}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 active:scale-95 flex items-center gap-2"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredResources.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-slate-100 mt-10">
                <div className="bg-white w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm grayscale opacity-50">
                   <BookOpen size={36} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">No Resources Found</h3>
                <p className="text-slate-400 font-medium">Try adjusting your filters or search keywords</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentNavigation>
  );
}