"use client";

import React, { useState } from 'react';
import StudentNavigation from '../StudentNavigation/StudentNavigation';
import { Search, Filter, BookOpen, Video, FileText, ExternalLink, Star, Clock, Users, TrendingUp, Briefcase, GraduationCap, Code, X, Sparkles, ListChecks, Layers3, Github } from 'lucide-react';
import { useAuthToken } from '../../../../contexts/AuthTokenContext';
import tokenManager from '../../../../lib/auth/tokenManager';

interface Resource {
  id: string;
  roadmapDbId?: number;
  title: string;
  description: string;
  type: 'course' | 'article' | 'video' | 'tool' | 'book' | 'roadmap';
  category: string;
  rating: number;
  duration?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  url: string;
  provider: string;
  featured?: boolean;
  milestones?: any[];
  resources?: {
    youtube: any[];
    github: any[];
    reading: any[];
  };
  followers?: number;
}

interface RoadmapProgress {
  unlocked_milestone_order: number;
  completed_milestones: number[];
  last_quiz_score: number | null;
  followed: boolean;
  followers: number;
  loading?: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  explanation_hint?: string;
}

interface QuizPayload {
  quiz_token: string;
  pass_score: number;
  questions: QuizQuestion[];
}

interface StudentLeader {
  id: number;
  name: string;
  email: string;
  follow_count: number;
  passed_count: number;
  avg_quiz_score: number;
  total_points: number;
}

export default function CareerResources() {
  const { token } = useAuthToken();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [roadmaps, setRoadmaps] = useState<Resource[]>([]);
  const [roadmapProgress, setRoadmapProgress] = useState<Record<number, RoadmapProgress>>({});
  const [quizPayload, setQuizPayload] = useState<QuizPayload | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [activeQuizMilestoneOrder, setActiveQuizMilestoneOrder] = useState<number | null>(null);
  const [quizGenerating, setQuizGenerating] = useState<number | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [roadmapLeaders, setRoadmapLeaders] = useState<StudentLeader[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  React.useEffect(() => {
    fetch(`${backendUrl}/api/roadmaps?is_published=true`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.roadmaps && Array.isArray(data.roadmaps)) {
          const mapped: Resource[] = data.roadmaps.map((r: any) => ({
            id: `rm-${r.id}`,
            roadmapDbId: Number(r.id),
            title: r.title,
            description: r.description,
            type: 'roadmap',
            category: r.category || 'AI Learning Path',
            rating: 5.0,
            duration: r.duration,
            level: (r.level || 'beginner').toLowerCase(),
            url: r.modules_link?.startsWith('http') ? r.modules_link : `https://${r.modules_link || '#'}`,
            provider: 'AI Studio',
            featured: true,
            milestones: r.milestones || [],
            resources: r.resources || { youtube: [], github: [], reading: [] },
            followers: Number(r.followers || 0),
          }));
          setRoadmaps(mapped);
        }
      })
      .catch(err => {
        console.error('Failed to fetch roadmaps:', err);
      });
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
      case 'roadmap': return 'bg-indigo-100 text-indigo-600';
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

  const selectedProgress = selectedRoadmap?.roadmapDbId ? roadmapProgress[selectedRoadmap.roadmapDbId] : undefined;

  const initializePublicProgress = (resource: Resource) => {
    if (!resource.roadmapDbId) return;
    const roadmapId = resource.roadmapDbId;
    setRoadmapProgress(prev => ({
      ...prev,
      [roadmapId]: {
        unlocked_milestone_order: prev[roadmapId]?.unlocked_milestone_order || 1,
        completed_milestones: prev[roadmapId]?.completed_milestones || [],
        last_quiz_score: prev[roadmapId]?.last_quiz_score ?? null,
        followed: prev[roadmapId]?.followed || false,
        followers: prev[roadmapId]?.followers || resource.followers || 0,
        loading: false,
      }
    }));
  };

  const loadStudentLeaderboard = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/leaderboard/students/resources`);
      if (!response.ok) return;
      const data = await response.json();
      setRoadmapLeaders(Array.isArray(data?.leaders) ? data.leaders : []);
    } catch {
      // Silent fallback for non-critical UI
    }
  };

  const loadRoadmapProgress = async (resource: Resource) => {
    if (!resource.roadmapDbId) return;
    const roadmapId = resource.roadmapDbId;
    if (!token) {
      initializePublicProgress(resource);
      return;
    }

    setRoadmapProgress(prev => ({
      ...prev,
      [roadmapId]: {
        unlocked_milestone_order: prev[roadmapId]?.unlocked_milestone_order || 1,
        completed_milestones: prev[roadmapId]?.completed_milestones || [],
        last_quiz_score: prev[roadmapId]?.last_quiz_score ?? null,
        followed: prev[roadmapId]?.followed || false,
        followers: prev[roadmapId]?.followers || resource.followers || 0,
        loading: true,
      }
    }));

    try {
      // Ensure token is fresh before API call
      const freshToken = await tokenManager.ensureValidToken();
      if (!freshToken) {
        initializePublicProgress(resource);
        setStatusMessage('Sign in to track roadmap progress, follow resources, and unlock quizzes.');
        return;
      }

      const response = await fetch(`${backendUrl}/api/roadmaps/${roadmapId}/progress`, {
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
      });

      if (response.status === 401) {
        initializePublicProgress(resource);
        setStatusMessage('Sign in to track roadmap progress, follow resources, and unlock quizzes.');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const progress = await response.json();
      setRoadmapProgress(prev => ({
        ...prev,
        [roadmapId]: {
          unlocked_milestone_order: Number(progress?.unlocked_milestone_order || 1),
          completed_milestones: Array.isArray(progress?.completed_milestones) ? progress.completed_milestones.map((n: any) => Number(n)) : [],
          last_quiz_score: progress?.last_quiz_score !== null && progress?.last_quiz_score !== undefined ? Number(progress.last_quiz_score) : null,
          followed: !!progress?.followed,
          followers: Number(progress?.followers || 0),
          loading: false,
        }
      }));
    } catch (error: any) {
      initializePublicProgress(resource);
      setStatusMessage(error?.message || 'Sign in to track roadmap progress, follow resources, and unlock quizzes.');
    }
  };

  const toggleFollowResource = async () => {
    if (!selectedRoadmap?.roadmapDbId) return;
    if (!token) {
      setStatusMessage('Sign in to follow this roadmap and join the leaderboard.');
      return;
    }
    const roadmapId = selectedRoadmap.roadmapDbId;
    const currentlyFollowed = !!roadmapProgress[roadmapId]?.followed;

    try {
      // Ensure token is fresh before API call
      const freshToken = await tokenManager.ensureValidToken();
      if (!freshToken) {
        setStatusMessage('Sign in to follow this roadmap and join the leaderboard.');
        return;
      }

      const response = await fetch(`${backendUrl}/api/roadmaps/${roadmapId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({ follow: !currentlyFollowed }),
      });

      if (response.status === 401) {
        setStatusMessage('Sign in to follow this roadmap and join the leaderboard.');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      setRoadmapProgress(prev => ({
        ...prev,
        [roadmapId]: {
          ...(prev[roadmapId] || {
            unlocked_milestone_order: 1,
            completed_milestones: [],
            last_quiz_score: null,
            followed: false,
            followers: 0,
          }),
          followed: !!responseData?.followed,
          followers: Number(responseData?.followers || 0),
          loading: false,
        }
      }));
      setStatusMessage(responseData?.followed ? 'You are now following this resource path.' : 'You unfollowed this resource path.');
      loadStudentLeaderboard();
    } catch (error: any) {
      setStatusMessage(error?.message || 'Could not update follow status.');
    }
  };

  const getMilestoneOrder = (milestone: any, idx: number) => Number(milestone?.order || idx + 1);
  const isMilestoneUnlocked = (milestone: any, idx: number) => getMilestoneOrder(milestone, idx) <= Number(selectedProgress?.unlocked_milestone_order || 1);
  const isMilestoneCompleted = (milestone: any, idx: number) => (selectedProgress?.completed_milestones || []).includes(getMilestoneOrder(milestone, idx));

  const startMilestoneQuiz = async (milestoneOrder: number, silentGeneration: boolean = false) => {
    if (!selectedRoadmap?.roadmapDbId) return;
    if (!token) {
      setStatusMessage('Sign in to generate milestone quizzes and unlock the next step.');
      return;
    }
    if (!silentGeneration) {
      setQuizGenerating(milestoneOrder);
    }
    try {
      // Ensure token is fresh before API call
      const freshToken = await tokenManager.ensureValidToken();
      if (!freshToken) {
        setStatusMessage('Sign in to generate milestone quizzes and unlock the next step.');
        setQuizGenerating(null);
        return;
      }

      const response = await fetch(`${backendUrl}/api/roadmaps/${selectedRoadmap.roadmapDbId}/milestones/${milestoneOrder}/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({}),
      });

      if (response.status === 401) {
        setStatusMessage('Sign in to generate milestone quizzes and unlock the next step.');
        if (!silentGeneration) {
          setQuizGenerating(null);
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payload = await response.json();
      setQuizPayload({
        quiz_token: payload.quiz_token,
        pass_score: Number(payload.pass_score || 70),
        questions: Array.isArray(payload.questions) ? payload.questions : [],
      });
      setQuizAnswers((Array.isArray(payload.questions) ? payload.questions : []).map(() => -1));
      setActiveQuizMilestoneOrder(milestoneOrder);
      setStatusMessage('Quiz is ready. Submit to unlock your next milestone.');
    } catch (error: any) {
      setStatusMessage(error?.message || 'Could not generate quiz right now.');
    } finally {
      if (!silentGeneration) {
        setQuizGenerating(null);
      }
    }
  };

  const markMilestoneAchieved = async (milestoneOrder: number) => {
    if (!selectedRoadmap?.roadmapDbId) return;
    if (!token) {
      setStatusMessage('Sign in to record milestone progress.');
      return;
    }
    try {
      // Ensure token is fresh before API call
      const freshToken = await tokenManager.ensureValidToken();
      if (!freshToken) {
        setStatusMessage('Sign in to record milestone progress.');
        return;
      }

      const response = await fetch(`${backendUrl}/api/roadmaps/${selectedRoadmap.roadmapDbId}/milestones/${milestoneOrder}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({}),
      });

      if (response.status === 401) {
        setStatusMessage('Sign in to record milestone progress.');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      setRoadmapProgress(prev => ({
        ...prev,
        [selectedRoadmap.roadmapDbId as number]: {
          ...(prev[selectedRoadmap.roadmapDbId as number] || {
            unlocked_milestone_order: 1,
            completed_milestones: [],
            last_quiz_score: null,
            followed: false,
            followers: 0,
          }),
          completed_milestones: Array.isArray(responseData?.completed_milestones) ? responseData.completed_milestones.map((n: any) => Number(n)) : [],
          unlocked_milestone_order: Number(responseData?.unlocked_milestone_order || 1),
          loading: false,
        }
      }));
      await startMilestoneQuiz(milestoneOrder, true);
    } catch (error: any) {
      setStatusMessage(error?.message || 'Could not mark milestone as achieved.');
    }
  };

  const submitQuiz = async () => {
    if (!selectedRoadmap?.roadmapDbId || !quizPayload || activeQuizMilestoneOrder === null) return;
    if (!token) {
      setStatusMessage('Sign in to submit quizzes and unlock the next milestone.');
      return;
    }
    if (quizAnswers.some((a) => a < 0)) {
      setStatusMessage('Please answer all quiz questions before submitting.');
      return;
    }

    setQuizSubmitting(true);
    try {
      // Ensure token is fresh before API call
      const freshToken = await tokenManager.ensureValidToken();
      if (!freshToken) {
        setStatusMessage('Sign in to submit quizzes and unlock the next milestone.');
        setQuizSubmitting(false);
        return;
      }

      const response = await fetch(`${backendUrl}/api/roadmaps/${selectedRoadmap.roadmapDbId}/milestones/${activeQuizMilestoneOrder}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({
          quiz_token: quizPayload.quiz_token,
          answers: quizAnswers,
        }),
      });

      if (response.status === 401) {
        setStatusMessage('Sign in to submit quizzes and unlock the next milestone.');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Store quiz results for modal display
      setQuizResults({
        score: Number(result?.score || 0),
        passed: !!result?.passed,
        pass_score: quizPayload.pass_score,
        questions: quizPayload.questions,
        userAnswers: quizAnswers,
        correct_answers: Array.isArray(result?.correct_answers) ? result.correct_answers : [],
      });

      setRoadmapProgress(prev => ({
        ...prev,
        [selectedRoadmap.roadmapDbId as number]: {
          ...(prev[selectedRoadmap.roadmapDbId as number] || {
            unlocked_milestone_order: 1,
            completed_milestones: [],
            last_quiz_score: null,
            followed: false,
            followers: 0,
          }),
          unlocked_milestone_order: Number(result?.unlocked_milestone_order || 1),
          completed_milestones: Array.isArray(result?.completed_milestones) ? result.completed_milestones.map((n: any) => Number(n)) : [],
          last_quiz_score: Number(result?.score || 0),
          loading: false,
        }
      }));

      setStatusMessage(result?.passed
        ? `Great job. You scored ${result.score}% and unlocked the next milestone.`
        : `You scored ${result.score}%. Pass score is ${result.pass_score}%. Try again to unlock the next milestone.`);
      setQuizPayload(null);
      setActiveQuizMilestoneOrder(null);
      setQuizAnswers([]);
      loadStudentLeaderboard();
    } catch (error: any) {
      setStatusMessage(error?.message || 'Failed to submit quiz.');
    } finally {
      setQuizSubmitting(false);
    }
  };

  return (
    <StudentNavigation>
      <div className="min-h-screen bg-[#F5F6FA] p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="bg-[#0f0f12] rounded-[32px] p-8 lg:p-10 shadow-2xl border border-white/5 relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-[12px] uppercase tracking-[0.1em] mb-4">
                  <Sparkles size={16} />
                  <span>Curated Learning</span>
                </div>
                
                <h1 className="text-4xl lg:text-[48px] font-black text-white mb-3 tracking-[-0.02em]">
                  Career Resources
                </h1>
                
                <p className="text-gray-400 text-[16px] font-medium max-w-[600px] leading-relaxed mb-6">
                  Discover curated learning resources to boost your career, from alumni-recommended courses to professional roadmaps.
                </p>
                
                <div className="flex flex-wrap gap-4 text-[13px] font-bold text-gray-400">
                   <div className="bg-white/5 px-4 py-2 rounded-[14px] border border-white/10 flex items-center gap-2.5">
                     <BookOpen size={16} className="text-blue-500" />
                     <span>{allResources.length} Resources</span>
                   </div>
                   <div className="bg-white/5 px-4 py-2 rounded-[14px] border border-white/10 flex items-center gap-2.5">
                     <TrendingUp size={16} className="text-emerald-500" />
                     <span>Expert Verified</span>
                   </div>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-32 h-32 rounded-[40px] bg-white/5 flex items-center justify-center text-blue-400 border border-white/10">
                  <GraduationCap size={48} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Full Screen Immersive Roadmap Viewer */}
          {selectedRoadmap && selectedRoadmap.type === 'roadmap' && (
            <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in fade-in zoom-in-95 duration-500">
              <div className="min-h-screen flex flex-col">
                {/* Immersive Header */}
                <div className="bg-[#0f0f12] text-white p-8 lg:p-12 relative overflow-hidden border-b border-white/5">
                  <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
                  <div className="max-w-7xl mx-auto relative z-10">
                    <button 
                      onClick={() => {
                        setSelectedRoadmap(null);
                        setQuizPayload(null);
                        setActiveQuizMilestoneOrder(null);
                        setQuizAnswers([]);
                        setStatusMessage('');
                      }}
                      className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest"
                    >
                      <X className="w-5 h-5" /> Back to Resources
                    </button>
                    
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> AI Generated Path
                          </span>
                          <span className={`px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest`}>
                            {selectedRoadmap.level}
                          </span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight uppercase">{selectedRoadmap.title}</h1>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">{selectedRoadmap.description}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-sm min-w-[120px]">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Milestones</p>
                          <p className="text-xl font-black">{selectedRoadmap.milestones?.length || 0}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-sm min-w-[120px]">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Followers</p>
                          <p className="text-xl font-black">{selectedProgress?.followers ?? selectedRoadmap.followers ?? 0}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-sm min-w-[120px]">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Duration</p>
                          <p className="text-xl font-black truncate">{selectedRoadmap.duration || 'Flexible'}</p>
                        </div>
                        <button
                          onClick={toggleFollowResource}
                          className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${selectedProgress?.followed ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-white border-white/40 hover:border-white'}`}
                        >
                          {selectedProgress?.followed ? 'Following Resource' : 'Follow Resource'}
                        </button>
                      </div>
                    </div>
                    {statusMessage && (
                      <p className="mt-4 text-xs font-bold text-indigo-200 uppercase tracking-widest">{statusMessage}</p>
                    )}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-slate-50/50">
                  <div className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
                      {/* Left: Milestone Timeline */}
                      <div className="space-y-8">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-600 text-white">
                            <ListChecks className="w-6 h-6" />
                          </div>
                          Your Learning Journey
                        </h2>

                        <div className="space-y-4 relative ml-4 border-l-2 border-slate-200 pl-6 pb-4">
                          {selectedRoadmap.milestones?.map((m: any, idx: number) => {
                            const order = getMilestoneOrder(m, idx);
                            const unlocked = isMilestoneUnlocked(m, idx);
                            const completed = isMilestoneCompleted(m, idx);

                            return (
                              <div key={idx}>
                                <div className="relative group">
                                  <div className={`absolute -left-[45px] top-4 w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs shadow-sm transition-transform ${unlocked ? 'bg-white border-indigo-600 text-indigo-600 group-hover:scale-110' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>
                                    {order}
                                  </div>
                                  <div className={`rounded-[2.5rem] p-8 shadow-sm transition-all duration-300 border ${unlocked ? 'bg-white border-slate-200 hover:shadow-xl hover:border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-85'}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                      <h3 className={`text-xl font-black uppercase transition-colors ${unlocked ? 'text-slate-900 group-hover:text-indigo-600' : 'text-slate-500'}`}>{m.title}</h3>
                                      <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${completed ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : unlocked ? 'text-indigo-700 bg-indigo-50 border-indigo-100' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                                        <Clock className="w-3 h-3" /> {completed ? 'Milestone Achieved' : unlocked ? `Step ${order}` : 'Locked'}
                                      </span>
                                    </div>
                                    <p className={`font-medium leading-relaxed mb-3 text-sm ${unlocked ? 'text-slate-600' : 'text-slate-500'}`}>{m.description}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 underline decoration-indigo-200 underline-offset-4">Core Concepts</h4>
                                        <ul className="space-y-2">
                                          {(m.subtopics || []).map((st: any, sIdx: number) => (
                                            <li key={sIdx} className={`flex items-start gap-2 text-[13px] font-bold ${unlocked ? 'text-slate-700' : 'text-slate-500'}`}>
                                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${unlocked ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                                              {st.title}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 underline decoration-emerald-200 underline-offset-4">Action Steps</h4>
                                        <div className="space-y-3">
                                          {(m.learning_steps || []).map((step: string, lIdx: number) => (
                                            <div key={lIdx} className={`flex gap-3 text-[12px] leading-relaxed p-3 rounded-2xl border ${unlocked ? 'text-slate-600 bg-slate-50/50 border-slate-100' : 'text-slate-500 bg-slate-100/60 border-slate-200'}`}>
                                              <span className={`font-black shrink-0 ${unlocked ? 'text-indigo-400' : 'text-slate-400'}`}>{lIdx + 1}.</span>
                                              {step}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                                      {!unlocked ? (
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                                          Finish the current milestone quiz to unlock this step.
                                        </span>
                                      ) : !completed ? (
                                        <button
                                          onClick={() => markMilestoneAchieved(order)}
                                          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                                        >
                                          Mark Milestone Achieved
                                        </button>
                                      ) : null}
                                      {completed && Number(selectedProgress?.unlocked_milestone_order || 1) <= order && (
                                        <button
                                          onClick={() => startMilestoneQuiz(order)}
                                          disabled={quizGenerating === order}
                                          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                        >
                                          {quizGenerating === order ? 'Generating your quiz...' : 'Take Quiz To Unlock Next'}
                                        </button>
                                      )}
                                      {completed && Number(selectedProgress?.unlocked_milestone_order || 1) > order && (
                                        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                          Quiz Passed, Next Milestone Unlocked
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Quiz Section - Appears below respective milestone */}
                                {order === activeQuizMilestoneOrder && quizPayload && activeQuizMilestoneOrder !== null && (
                                  <div className="mt-6 ml-4 pl-8">
                                    {!quizResults ? (
                                      /* Quiz Form */
                                      <div className="bg-white rounded-[2.5rem] border border-indigo-100 p-8 shadow-sm space-y-4">
                                        <h3 className="text-sm font-black text-indigo-700 uppercase tracking-widest">Milestone {activeQuizMilestoneOrder} Quiz</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pass score: {quizPayload.pass_score}%</p>
                                        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                                          {quizPayload.questions.map((q, qIdx) => (
                                            <div key={qIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                              <p className="text-sm font-bold text-slate-800 mb-3">{qIdx + 1}. {q.question}</p>
                                              <div className="space-y-2">
                                                {q.options.map((option, oIdx) => (
                                                  <button
                                                    key={oIdx}
                                                    onClick={() => {
                                                      setQuizAnswers(prev => {
                                                        const next = [...prev];
                                                        next[qIdx] = oIdx;
                                                        return next;
                                                      });
                                                    }}
                                                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all ${quizAnswers[qIdx] === oIdx ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}
                                                  >
                                                    {option}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        <button
                                          onClick={submitQuiz}
                                          disabled={quizSubmitting}
                                          className="w-full px-5 py-3 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-60 transition-all"
                                        >
                                          {quizSubmitting ? 'Submitting Quiz...' : 'Submit Quiz'}
                                        </button>
                                      </div>
                                    ) : (
                                      /* Results Display */
                                      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Quiz Results</h3>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Milestone {activeQuizMilestoneOrder} Assessment</p>
                                          </div>
                                          <button
                                            onClick={() => setQuizResults(null)}
                                            className="p-2 hover:bg-slate-100 rounded-xl transition-all hover:text-red-600"
                                          >
                                            <X className="w-6 h-6" />
                                          </button>
                                        </div>

                                        {/* Score Summary */}
                                        <div className={`rounded-[28px] p-6 border-2 ${quizResults.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                                          <div className="flex items-center justify-between mb-3">
                                            <h3 className={`text-lg font-black uppercase tracking-widest ${quizResults.passed ? 'text-emerald-700' : 'text-orange-700'}`}>
                                              {quizResults.passed ? '✓ Quiz Passed!' : '✗ Quiz Not Passed'}
                                            </h3>
                                            <span className={`text-4xl font-black ${quizResults.passed ? 'text-emerald-700' : 'text-orange-700'}`}>
                                              {quizResults.score}%
                                            </span>
                                          </div>
                                          <p className={`text-sm font-bold ${quizResults.passed ? 'text-emerald-600' : 'text-orange-600'}`}>
                                            Pass Score Requirement: {quizResults.pass_score}%
                                          </p>
                                        </div>

                                        {/* Questions and Answers */}
                                        <div className="space-y-4">
                                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Question Breakdown</h3>
                                          {quizResults.questions.map((q: any, qIdx: number) => {
                                            const userAnswerIdx = quizResults.userAnswers[qIdx];
                                            const correctAnswerIdx = quizResults.correct_answers[qIdx];
                                            const isCorrect = userAnswerIdx === correctAnswerIdx;

                                            return (
                                              <div key={qIdx} className={`rounded-[24px] p-4 border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                                <p className="text-sm font-bold text-slate-800 mb-3">
                                                  {qIdx + 1}. {q.question}
                                                  <span className={`ml-2 text-xs font-black ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                                                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                  </span>
                                                </p>

                                                <div className="space-y-2 ml-4">
                                                  {q.options.map((option: string, oIdx: number) => {
                                                    const isUserAnswer = oIdx === userAnswerIdx;
                                                    const isCorrectAnswer = oIdx === correctAnswerIdx;

                                                    if (isUserAnswer && isCorrect) {
                                                      return (
                                                        <div key={oIdx} className="flex items-start gap-3 p-2 rounded-lg bg-emerald-100 border border-emerald-200">
                                                          <span className="text-emerald-700 font-black mt-0.5">✓</span>
                                                          <span className="text-sm font-bold text-emerald-900">{option}</span>
                                                          <span className="text-[10px] font-black text-emerald-700 uppercase ml-auto">Your Answer</span>
                                                        </div>
                                                      );
                                                    }

                                                    if (isCorrectAnswer && !isCorrect) {
                                                      return (
                                                        <div key={oIdx} className="flex items-start gap-3 p-2 rounded-lg bg-emerald-100 border border-emerald-200">
                                                          <span className="text-emerald-700 font-black mt-0.5">✓</span>
                                                          <span className="text-sm font-bold text-emerald-900">{option}</span>
                                                          <span className="text-[10px] font-black text-emerald-700 uppercase ml-auto">Correct Answer</span>
                                                        </div>
                                                      );
                                                    }

                                                    if (isUserAnswer && !isCorrect) {
                                                      return (
                                                        <div key={oIdx} className="flex items-start gap-3 p-2 rounded-lg bg-red-100 border border-red-200">
                                                          <span className="text-red-700 font-black mt-0.5">✗</span>
                                                          <span className="text-sm font-bold text-red-900">{option}</span>
                                                          <span className="text-[10px] font-black text-red-700 uppercase ml-auto">Your Answer</span>
                                                        </div>
                                                      );
                                                    }

                                                    return (
                                                      <div key={oIdx} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                        <span className="text-slate-400 font-black mt-0.5">○</span>
                                                        <span className="text-sm font-bold text-slate-600">{option}</span>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="border-t border-slate-100 pt-2 flex gap-3">
                                          <button
                                            onClick={() => setQuizResults(null)}
                                            className="flex-1 px-6 py-3 bg-slate-200 text-slate-900 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-300 transition-all"
                                          >
                                            Close Results
                                          </button>
                                          {!quizResults.passed && (
                                            <button
                                              onClick={() => {
                                                setQuizResults(null);
                                                setQuizPayload(null);
                                                setActiveQuizMilestoneOrder(null);
                                                setQuizAnswers([]);
                                              }}
                                              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all"
                                            >
                                              Try Again
                                            </button>
                                          )}
                                        </div>

                                        {/* Next Milestone Unlocked Notification */}
                                        {quizResults.passed && (
                                          <div className="mt-6 p-6 rounded-[24px] bg-gradient-to-r from-emerald-50 to-cyan-50 border-2 border-emerald-300 shadow-lg">
                                            <div className="flex items-center justify-between mb-4">
                                              <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center text-white">
                                                  <Sparkles className="w-6 h-6" />
                                                </div>
                                                <div>
                                                  <h3 className="text-lg font-black text-emerald-900 uppercase tracking-widest">🎉 Next Milestone Unlocked!</h3>
                                                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mt-0.5">Congratulations on your progress</p>
                                                </div>
                                              </div>
                                            </div>

                                            {selectedRoadmap.milestones && selectedRoadmap.milestones[activeQuizMilestoneOrder] && (
                                              <div className="p-4 rounded-[20px] bg-white border border-emerald-100 mt-4">
                                                <div className="mb-3">
                                                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">Milestone {activeQuizMilestoneOrder + 1}</span>
                                                </div>
                                                <h4 className="text-base font-black text-slate-900 mb-2 uppercase tracking-tight">{selectedRoadmap.milestones[activeQuizMilestoneOrder]?.title || 'Next Challenge'}</h4>
                                                <p className="text-sm font-bold text-slate-600 leading-relaxed">{selectedRoadmap.milestones[activeQuizMilestoneOrder]?.description || 'Start your next learning journey'}</p>
                                              </div>
                                            )}

                                            <div className="mt-4 p-3 rounded-lg bg-white/60 border border-emerald-100">
                                              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">📈 You&apos;ve completed {Number(selectedProgress?.unlocked_milestone_order || 1)} milestone{Number(selectedProgress?.unlocked_milestone_order || 1) !== 1 ? 's' : ''} so far</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Integrated Resource Hub */}
                      <div className="space-y-8">
                        <div className="sticky top-12 space-y-8">
                          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-500 text-white">
                              <Layers3 className="w-6 h-6" />
                            </div>
                            Resource Hub
                          </h2>

                          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                            <div className="flex items-center justify-between gap-4 mb-4">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Quiz Gate</p>
                                <h3 className="text-lg font-black uppercase tracking-tight">Unlock the next step</h3>
                              </div>
                              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                                <ListChecks className="w-6 h-6 text-emerald-300" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-[11px] font-black uppercase tracking-widest">
                              <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                                <p className="text-slate-400 mb-1">Unlocked</p>
                                <p className="text-white text-lg">{selectedProgress?.unlocked_milestone_order || 1}</p>
                              </div>
                              <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                                <p className="text-slate-400 mb-1">Last Score</p>
                                <p className="text-white text-lg">{selectedProgress?.last_quiz_score ?? '--'}%</p>
                              </div>
                            </div>
                            <p className="mt-4 text-[11px] leading-relaxed text-slate-300 font-medium">
                              Complete a milestone, answer the Gemini quiz, and the next milestone appears here automatically.
                            </p>
                          </div>

                          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Student Resource Leaderboard</h3>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Followers</span>
                            </div>
                            <div className="space-y-3">
                              {roadmapLeaders.slice(0, 5).map((leader, idx) => (
                                <div key={leader.id || leader.email || idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-900 truncate">#{idx + 1} {leader.name}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{leader.follow_count} follows • {leader.passed_count} passed quizzes</p>
                                  </div>
                                  <span className="text-xs font-black text-indigo-700">{Number(leader.total_points || 0).toFixed(1)}</span>
                                </div>
                              ))}
                              {roadmapLeaders.length === 0 && (
                                <p className="text-center py-3 text-xs font-bold text-slate-400 uppercase">No rankings yet</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            {/* YouTube Hub */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                                  <Video className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Video Tutorials</h3>
                              </div>
                              <div className="space-y-3">
                                {selectedRoadmap.resources?.youtube?.map((r: any, idx: number) => (
                                  <a key={idx} href={r.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 transition-all">
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-black text-slate-900 group-hover:text-rose-700 truncate">{r.label}</p>
                                      <p className="text-[10px] text-slate-400 font-bold tracking-tight">YouTube Library</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-rose-500" />
                                  </a>
                                ))}
                                {(!selectedRoadmap.resources?.youtube || selectedRoadmap.resources.youtube.length === 0) && (
                                  <p className="text-center py-4 text-xs font-bold text-slate-400 uppercase">No videos synced</p>
                                )}
                              </div>
                            </div>

                            {/* GitHub Hub */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-slate-900 text-white">
                                  <Github className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Code Repos</h3>
                              </div>
                              <div className="space-y-3">
                                {selectedRoadmap.resources?.github?.map((r: any, idx: number) => (
                                  <a key={idx} href={r.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-100 hover:border-slate-800 transition-all">
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-black group-hover:text-white truncate">{r.label}</p>
                                      <p className="text-[10px] text-slate-400 font-bold tracking-tight group-hover:text-slate-500">GitHub Open Source</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-white" />
                                  </a>
                                ))}
                                {(!selectedRoadmap.resources?.github || selectedRoadmap.resources.github.length === 0) && (
                                  <p className="text-center py-4 text-xs font-bold text-slate-400 uppercase">No code synced</p>
                                )}
                              </div>
                            </div>

                            {/* Documentation Hub */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Reading List</h3>
                              </div>
                              <div className="space-y-3">
                                {selectedRoadmap.resources?.reading?.map((r: any, idx: number) => (
                                  <a key={idx} href={r.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition-all">
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-black text-slate-900 group-hover:text-amber-700 truncate">{r.label}</p>
                                      <p className="text-[10px] text-slate-400 font-bold tracking-tight">Official Docs / Articles</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-amber-500" />
                                  </a>
                                ))}
                                {(!selectedRoadmap.resources?.reading || selectedRoadmap.resources.reading.length === 0) && (
                                  <p className="text-center py-4 text-xs font-bold text-slate-400 uppercase">No readings synced</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standard Resources Modal (Non-Roadmap) */}
          {selectedRoadmap && selectedRoadmap.type !== 'roadmap' && (
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
                    onClick={() => {
                      setSelectedRoadmap(null);
                      setQuizPayload(null);
                      setActiveQuizMilestoneOrder(null);
                      setQuizAnswers([]);
                      setStatusMessage('');
                    }}
                    className="p-3 hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="p-6 lg:p-8 space-y-6">
                  <div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</h3>
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

                  {selectedRoadmap.milestones && selectedRoadmap.milestones.length > 0 && (
                    <div className="pt-8 border-t border-slate-50">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-emerald-500" />
                        Learning Milestones
                      </h3>
                      <div className="space-y-4">
                        {selectedRoadmap.milestones.map((m: any, idx: number) => (
                           <div key={idx} className="p-5 rounded-3xl bg-slate-50/70 border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-300">
                             <div className="flex items-start gap-4">
                               <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 text-xs font-black shrink-0">
                                 {idx + 1}
                               </span>
                               <div className="flex-1">
                                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-emerald-600 transition-colors">
                                   {m.title}
                                 </h4>
                                 <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                   {m.description}
                                 </p>
                                 
                                 {/* Display subtopics or steps if needed */}
                                 {m.learning_steps && (
                                   <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-2">
                                      {m.learning_steps.slice(0, 3).map((step: string, sIdx: number) => (
                                        <div key={sIdx} className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                          <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                          {step}
                                        </div>
                                      ))}
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                    <button
                      onClick={() => {
                        setSelectedRoadmap(null);
                        setQuizPayload(null);
                        setActiveQuizMilestoneOrder(null);
                        setQuizAnswers([]);
                        setStatusMessage('');
                      }}
                      className="px-6 py-3 border border-slate-200 rounded-2xl text-[12px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Close
                    </button>
                    {selectedRoadmap.url && selectedRoadmap.url !== '#' && (
                      <a
                        href={selectedRoadmap.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-black text-[12px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3"
                      >
                        Access Full Content <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Search and Filters Section */}
          <div className="mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-[20px] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-sm text-slate-900 placeholder-slate-400 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[20px] bg-white focus:outline-none focus:border-emerald-500 font-medium text-sm text-slate-700 appearance-none cursor-pointer transition-all"
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
                  className="px-4 py-2.5 border border-slate-200 rounded-[20px] bg-white focus:outline-none focus:border-emerald-500 font-medium text-sm text-slate-700 appearance-none cursor-pointer transition-all"
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
          <div className="rounded-[24px] space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black">
                   <Filter size={16} />
                 </div>
                 <h2 className="text-base font-black text-slate-900 uppercase tracking-widest">Resources</h2>
              </div>
              <span className="bg-emerald-50 px-3 py-1 rounded-lg text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-200">{filteredResources.length} Found</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map(resource => (
                <div key={resource.id} className="bg-gradient-to-br from-emerald-50/30 via-white to-white rounded-[28px] p-5 border border-emerald-100/10 shadow-md hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className={`p-4 rounded-[24px] ${getTypeColor(resource.type)} shadow-inner border border-white/50`}>
                      {getTypeIcon(resource.type)}
                    </div>
                    <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-2xl shadow-sm border border-slate-50">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="text-[12px] font-black text-slate-900 tracking-tight">{resource.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight uppercase group-hover:text-emerald-600 transition-colors">{resource.title}</h3>
                  <p className="text-slate-500 font-medium text-sm mb-3 line-clamp-2 leading-relaxed">{resource.description}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px] font-black text-indigo-700 uppercase tracking-tight">{resource.followers || 0} following</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
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
                      onClick={() => {
                        setSelectedRoadmap(resource);
                        loadRoadmapProgress(resource);
                        loadStudentLeaderboard();
                      }}
                      className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <ExternalLink size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredResources.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-slate-100 mt-6">
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