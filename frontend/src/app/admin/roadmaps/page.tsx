"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth0Token } from '../../../hooks/useAuth0Token';
import AdminNavigation from '../AdminNavigation/AdminNavigation';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Globe,
  GraduationCap,
  Layers3,
  Loader2,
  Mic,
  PlayCircle,
  Save,
  Sparkles,
  Target,
  Youtube,
  Github,
  FileText,
  ListChecks,
  Rocket,
  CircleCheckBig,
  BarChart3,
  History,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type ResourceItem = { label: string; url: string };

type RoadmapMilestone = {
  order: number;
  title: string;
  description: string;
  subtopics: Array<{ title: string; description?: string; level?: string }>;
  learning_steps: string[];
  resources: {
    youtube: ResourceItem[];
    github: ResourceItem[];
    reading: ResourceItem[];
  };
};

type RoadmapDraft = {
  domain: string;
  specialization: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  phases: number;
  tags: string[];
  id?: number;
  milestones: RoadmapMilestone[];
  resources: {
    youtube: ResourceItem[];
    github: ResourceItem[];
    reading: ResourceItem[];
  };
  generation_meta: {
    stage: string;
    generated_at: string;
    provider: string;
    model: string;
  };
  owner_email?: string | null;
  is_published?: boolean;
};

const domainOptions = [
  'Software Engineering',
  'Data Science',
  'Product Management',
  'Cybersecurity',
  'Cloud Engineering',
  'UI/UX Design',
  'Mobile Development',
];

const specializationPresets: Record<string, string[]> = {
  'Software Engineering': ['MERN Stack', 'Frontend Engineering', 'Backend Engineering', 'System Design'],
  'Data Science': ['Machine Learning', 'Data Analytics', 'AI Engineering', 'MLOps'],
  'Product Management': ['Technical Product Management', 'Product Strategy', 'Growth Product Management'],
  'Cybersecurity': ['SOC Analyst', 'Penetration Testing', 'Cloud Security'],
  'Cloud Engineering': ['DevOps', 'AWS', 'Azure', 'Kubernetes'],
  'UI/UX Design': ['Product Design', 'Interaction Design', 'Design Systems'],
  'Mobile Development': ['Flutter', 'React Native', 'Android Development'],
};

const inputCls = 'w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-400 transition-all';
const labelCls = 'block text-xs font-black uppercase tracking-[0.16em] text-slate-500 mb-2';

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-white/80 text-slate-600 text-xs font-bold shadow-sm">{children}</span>;
}

function ResourceLink({ item, icon }: { item: ResourceItem; icon: React.ReactNode }) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all">
      <div className="mt-0.5 text-slate-500 group-hover:text-slate-700">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">{item.label}</p>
        <p className="text-[11px] text-slate-400 break-all">{item.url}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
    </a>
  );
}

export default function AdminRoadmapsPage() {
  const { user } = useUser();
  const { token: accessToken } = useAuth0Token();
  const [domain, setDomain] = useState('Software Engineering');
  const [specialization, setSpecialization] = useState('MERN Stack');
  const [customSpecialization, setCustomSpecialization] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [draft, setDraft] = useState<RoadmapDraft | null>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, published: 0 });
  const [library, setLibrary] = useState<RoadmapDraft[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);

  const effectiveSpecialization = useMemo(() => {
    if (specialization === '__custom__') return customSpecialization.trim();
    return customSpecialization.trim() || specialization;
  }, [customSpecialization, specialization]);
  const completionPercent = useMemo(() => {
    if (!draft?.milestones?.length) return 0;
    return Math.round((completedIds.length / draft.milestones.length) * 100);
  }, [completedIds.length, draft?.milestones?.length]);

  useEffect(() => {
    setExpandedIds([]);
    setCompletedIds([]);
  }, [draft?.title]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/roadmaps?limit=5`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });
      const data = await res.json();
      setStats({ total: data.totalCount || 0, published: data.publishedCount || 0 });
      setLibrary(data.roadmaps || []);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [accessToken, message]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError('You need to be signed in to generate roadmaps.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/roadmaps/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          domain,
          specialization: effectiveSpecialization,
          prompt: customPrompt.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to generate roadmap');
      }

      const data = await response.json();
      setDraft(data);
      const ids = Array.isArray(data?.milestones) ? data.milestones.map((milestone: RoadmapMilestone) => milestone.order) : [];
      setExpandedIds(ids.slice(0, 1));
      setCompletedIds([]);
      setMessage(`Roadmap generated successfully using ${data?.generation_meta?.provider || 'the AI engine'}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!draft || !accessToken) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/roadmaps/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          owner_email: user?.email,
          title: draft.title,
          description: draft.description,
          category: draft.category,
          level: draft.level,
          duration: draft.duration,
          phases: draft.phases,
          tags: draft.tags,
          modules_link: null,
          domain: draft.domain,
          specialization: draft.specialization,
          milestones: draft.milestones,
          resources: draft.resources,
          generation_meta: draft.generation_meta,
          is_published: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save roadmap');
      }

      const saved = await response.json();
      setDraft({ ...draft, ...saved });
      setMessage(`Saved roadmap #${saved?.id || 'new'} successfully.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save roadmap');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft || !accessToken || !draft.id) {
      setError('Save the roadmap first before publishing.');
      return;
    }
    setPublishing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/roadmaps/${draft.id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ is_published: true }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to publish roadmap');
      }

      const updated = await response.json();
      setDraft(updated);
      setMessage(`Roadmap #${updated.id} published successfully! It is now visible to students.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to publish roadmap');
    } finally {
      setPublishing(false);
    }
  };

  const speakMilestone = (milestone: RoadmapMilestone) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const summary = `${milestone.title}. ${milestone.description} Steps: ${milestone.learning_steps.join('. ')}`;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const toggleCompleted = (id: number) => {
    setCompletedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const expandAll = () => {
    if (!draft?.milestones) return;
    setExpandedIds(draft.milestones.map(milestone => milestone.order));
  };

  const collapseAll = () => setExpandedIds([]);

  return (
    <AdminNavigation>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-900 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.5),_transparent_40%)]" />
          <div className="relative p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Pill><Sparkles className="w-3.5 h-3.5" />AI Studio</Pill>
                <Pill><Brain className="w-3.5 h-3.5" />Gemini Flash</Pill>
              </div>
              <h1 className="text-4xl font-black tracking-tight">AI Roadmap Studio</h1>
              <p className="text-slate-400 max-w-xl text-lg">Generate, review, and publish structured learning paths for your students with automated resource discovery.</p>
            </div>
            <Link href="/admin/dashboard" className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-bold transition-all flex items-center gap-2 self-start lg:self-center">
              <ArrowLeft className="w-4 h-4" /> Exit Studio
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8 items-start">
          {/* Left Column: Configuration & Actions */}
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Created</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.total}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Paths</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.published}</p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Target className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Configuration</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={labelCls}>Learning Domain</label>
                  <select value={domain} onChange={e => {
                    setDomain(e.target.value);
                    const next = specializationPresets[e.target.value]?.[0] || '';
                    setSpecialization(next);
                    setCustomSpecialization('');
                  }} className={inputCls}>
                    {domainOptions.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={labelCls}>Focus / Specialization</label>
                  <select value={specialization} onChange={e => {
                    setSpecialization(e.target.value);
                    setCustomSpecialization('');
                  }} className={inputCls}>
                    {(specializationPresets[domain] || []).map(option => <option key={option} value={option}>{option}</option>)}
                    <option value="__custom__">Custom Focus...</option>
                  </select>
                </div>

                {specialization === '__custom__' && (
                  <div className="space-y-2">
                    <input
                      value={customSpecialization}
                      onChange={e => setCustomSpecialization(e.target.value)}
                      placeholder="e.g. MERN Stack, DevOps"
                      className={inputCls}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className={labelCls}>Guidance Prompt</label>
                  <textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder="Describe specific requirements (optional)..."
                    className={`${inputCls} min-h-[120px] resize-none`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                {loading ? 'Building Roadmap...' : 'Generate Roadmap'}
              </button>
            </form>

            {draft && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className={labelCls}>Current Draft</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${draft.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {draft.is_published ? 'Published' : 'Draft Mode'}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-900">{draft.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(draft.tags) ? draft.tags : ((draft.tags as any) || '').split(',')).filter(Boolean).map((tag: any) => (
                      <span key={tag} className="text-[10px] font-bold text-slate-500">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleSave} disabled={saving} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Draft
                  </button>
                  <button 
                    onClick={handlePublish} 
                    disabled={publishing || !draft.id || draft.is_published}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50 ${draft.is_published ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : (draft.is_published ? <CheckCircle2 className="w-4 h-4" /> : <Rocket className="w-4 h-4" />)}
                    {draft.is_published ? 'Live' : 'Publish'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 font-medium animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 font-medium animate-in fade-in slide-in-from-top-2">
                {message}
              </div>
            )}

            {/* Library / Recent Work */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <button 
                onClick={() => setShowLibrary(!showLibrary)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <History className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Recent Library</h2>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showLibrary ? 'rotate-180' : ''}`} />
              </button>

              {showLibrary && (
                <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                  {library.length > 0 ? library.map((item) => (
                    <button 
                      key={item.id} 
                      onClick={() => setDraft(item)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${draft?.id === item.id ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[13px] font-black text-slate-900 truncate pr-2">{item.title}</p>
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${item.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.is_published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.specialization}</p>
                    </button>
                  )) : (
                    <p className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">No Recent Roadmaps</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Roadmap Display */}
          <div className="min-w-0">
            {draft ? (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <p className={labelCls}>Milestones</p>
                    <p className="text-2xl font-black text-slate-900">{draft.milestones.length}</p>
                  </div>
                  <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <p className={labelCls}>Level</p>
                    <p className="text-sm font-black text-slate-900">{draft.level}</p>
                  </div>
                  <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <p className={labelCls}>Duration</p>
                    <p className="text-sm font-black text-slate-900">{draft.duration}</p>
                  </div>
                  <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <p className={labelCls}>Progress</p>
                    <p className="text-2xl font-black text-slate-900 text-indigo-600">{completionPercent}%</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-700" style={{ width: `${completionPercent}%` }} />
                </div>

                {/* Milestone Flow */}
                <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm space-y-8">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-200">
                        <ListChecks className="w-5 h-5" />
                      </div>
                      Learning Experience
                    </h2>
                    <div className="flex gap-2">
                       <button type="button" onClick={expandAll} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors">Expand All</button>
                       <button type="button" onClick={collapseAll} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors">Collapse All</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {draft.milestones.map((milestone) => {
                      const isExpanded = expandedIds.includes(milestone.order);
                      const isCompleted = completedIds.includes(milestone.order);

                      return (
                        <div key={milestone.order} className={`rounded-3xl border transition-all duration-300 ${isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4">
                            <div className="flex items-start gap-4 min-w-0">
                              <button 
                                type="button" 
                                onClick={() => toggleCompleted(milestone.order)} 
                                className={`mt-1 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-transparent hover:border-emerald-400'}`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Milestone {milestone.order}</span>
                                <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{milestone.title}</h3>
                                <p className="text-sm text-slate-600 line-clamp-2 mt-1">{milestone.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button type="button" onClick={() => speakMilestone(milestone)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                                <Mic className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => toggleExpanded(milestone.order)} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {isExpanded ? 'Collapse' : 'Details'}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-300">
                              <div className="space-y-4">
                                <div className="p-5 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm space-y-4">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Core Subtopics</h4>
                                  <div className="space-y-2">
                                    {milestone.subtopics.map((st, idx) => (
                                      <div key={idx} className="p-3 rounded-xl bg-slate-50/50 border border-slate-50">
                                        <p className="text-sm font-bold text-slate-800">{st.title}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{st.description || 'Focus on foundational concepts and practical implementation.'}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="p-5 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm space-y-4">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Action Steps</h4>
                                  <div className="space-y-3">
                                    {milestone.learning_steps.map((step, idx) => (
                                      <div key={idx} className="flex gap-3">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black shrink-0">{idx + 1}</div>
                                        <p className="text-[13px] text-slate-700 leading-relaxed">{step}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <Section title="Recommended Media" icon={<Youtube className="w-3.5 h-3.5 text-red-500" />} color="red">
                                  {milestone.resources.youtube.map(r => <ResourceLink key={r.url} item={r} icon={<PlayCircle className="w-3.5 h-3.5" />} />)}
                                </Section>
                                <Section title="Code Samples" icon={<Github className="w-3.5 h-3.5 text-slate-800" />} color="slate">
                                  {milestone.resources.github.map(r => <ResourceLink key={r.url} item={r} icon={<Github className="w-3.5 h-3.5" />} />)}
                                </Section>
                                <Section title="Documentation" icon={<FileText className="w-3.5 h-3.5 text-amber-500" />} color="amber">
                                  {milestone.resources.reading.map(r => <ResourceLink key={r.url} item={r} icon={<FileText className="w-3.5 h-3.5" />} />)}
                                </Section>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-indigo-50 text-indigo-600 mb-8 shadow-inner">
                  <Sparkles className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Await Generation</h2>
                <p className="mt-4 text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
                  Fill out the parameters on the left and click <b>Generate</b> to see AI-driven learning paths tailored to your specialization.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminNavigation>
  );
}

function Section({ title, icon, children, color }: { title: string; icon: React.ReactNode; children: React.ReactNode; color: string }) {
  return (
    <div className="p-5 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm space-y-4">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">{icon} {title}</h4>
      <div className="space-y-2">
        {React.Children.count(children) > 0 ? children : <p className="text-[11px] text-slate-400 italic py-2">No specific resources found in this category.</p>}
      </div>
    </div>
  );
}
