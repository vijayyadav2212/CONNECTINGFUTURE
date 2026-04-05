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
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

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
  const [draft, setDraft] = useState<RoadmapDraft | null>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setMessage(`Saved roadmap #${saved?.id || 'new'} successfully.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save roadmap');
    } finally {
      setSaving(false);
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
      <div className="space-y-6 pb-12">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl shadow-slate-900/20">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.4),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.24),_transparent_30%)]" />
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Pill><Sparkles className="w-3.5 h-3.5" />AI Roadmap Studio</Pill>
                  <Pill><Layers3 className="w-3.5 h-3.5" />Sequential generation</Pill>
                  <Pill><Target className="w-3.5 h-3.5" />Resource-rich learning paths</Pill>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Build AI-powered learning roadmaps for any domain.</h1>
                  <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl">Select a domain and specialization, generate milestones first, then expand each step into a guided roadmap with subtopics, learning steps, YouTube videos, GitHub repositories, and reading links.</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                  <Pill><Brain className="w-3.5 h-3.5" />AI milestone expansion</Pill>
                  <Pill><Mic className="w-3.5 h-3.5" />Voice explanations</Pill>
                  <Pill><CircleCheckBig className="w-3.5 h-3.5" />Progress tracking</Pill>
                  <Pill><Save className="w-3.5 h-3.5" />Save roadmap</Pill>
                </div>
              </div>
              <Link href="/admin/dashboard" className="inline-flex items-center gap-2 self-start px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" />Back to dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6 items-start">
          <form onSubmit={handleGenerate} className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-600" />Roadmap input</h2>
              <p className="text-sm text-slate-500 mt-1">Generate a structured roadmap from the chosen learning path.</p>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Domain</label>
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
              <label className={labelCls}>Specialization</label>
              <select value={specialization} onChange={e => {
                setSpecialization(e.target.value);
                setCustomSpecialization('');
              }} className={inputCls}>
                {(specializationPresets[domain] || []).map(option => <option key={option} value={option}>{option}</option>)}
                <option value="__custom__">Custom specialization</option>
              </select>
            </div>

            {specialization === '__custom__' && (
              <div className="space-y-2">
                <label className={labelCls}>Custom specialization</label>
                <input
                  value={customSpecialization}
                  onChange={e => setCustomSpecialization(e.target.value)}
                  placeholder="e.g. MERN Stack, DevOps, Flutter"
                  className={inputCls}
                />
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Globe className="w-4 h-4 text-indigo-600" />Current selection</div>
              <div className="flex flex-wrap gap-2">
                <Pill>{domain}</Pill>
                <Pill>{effectiveSpecialization}</Pill>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-black shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {loading ? 'Generating roadmap...' : 'Generate roadmap'}
            </button>

            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 font-medium">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
                {error}
              </div>
            )}
          </form>

          <div className="space-y-6">
            {draft ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Generated roadmap</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{draft.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{draft.description}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Milestones</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{draft.milestones.length}</p>
                    <p className="mt-1 text-sm text-slate-500">Generated in sequence</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Progress</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{completionPercent}%</p>
                    <p className="mt-1 text-sm text-slate-500">{completedIds.length} completed</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Resources</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{draft.resources.youtube.length + draft.resources.github.length + draft.resources.reading.length}</p>
                    <p className="mt-1 text-sm text-slate-500">Curated links attached</p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><ListChecks className="w-5 h-5 text-indigo-600" />Sequential roadmap flow</h2>
                      <p className="text-sm text-slate-500 mt-1">Generate milestones first, then expand and track each one individually.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={expandAll} className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors">Expand all</button>
                      <button type="button" onClick={collapseAll} className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors">Collapse all</button>
                      <button onClick={handleSave} disabled={saving} type="button" className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-black hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-60 inline-flex items-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save roadmap'}
                      </button>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all" style={{ width: `${completionPercent}%` }} />
                  </div>

                  <div className="space-y-4">
                    {draft.milestones.map((milestone) => {
                      const expanded = expandedIds.includes(milestone.order);
                      const completed = completedIds.includes(milestone.order);

                      return (
                        <div key={milestone.order} className={`rounded-[1.75rem] border ${completed ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/70'} overflow-hidden transition-all`}>
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              <button type="button" onClick={() => toggleCompleted(milestone.order)} className={`mt-1 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-transparent'}`} aria-label={`Mark ${milestone.title} as completed`}>
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-[0.14em]">Milestone {milestone.order}</span>
                                  {completed && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-[0.14em]"><CircleCheckBig className="w-3 h-3" />Completed</span>}
                                </div>
                                <h3 className="mt-2 text-lg font-black text-slate-900">{milestone.title}</h3>
                                <p className="mt-1 text-sm text-slate-600 max-w-3xl">{milestone.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start lg:self-auto">
                              <button type="button" onClick={() => speakMilestone(milestone)} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors">
                                <Mic className="w-4 h-4" />Voice
                              </button>
                              <button type="button" onClick={() => toggleExpanded(milestone.order)} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">
                                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {expanded ? 'Collapse' : 'Expand'}
                              </button>
                            </div>
                          </div>

                          {expanded && (
                            <div className="px-5 pb-5 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5">
                              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 space-y-5">
                                <div>
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600" />Subtopics</h4>
                                  <div className="mt-3 space-y-3">
                                    {milestone.subtopics.map((subtopic, index) => (
                                      <div key={`${milestone.order}-${index}`} className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                                        <p className="text-sm font-bold text-slate-900">{subtopic.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">{subtopic.description || 'Core learning objective'}</p>
                                        {subtopic.level && <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-indigo-600">{subtopic.level}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2"><ListChecks className="w-4 h-4 text-indigo-600" />Learning steps</h4>
                                  <ol className="mt-3 space-y-3">
                                    {milestone.learning_steps.map((step, index) => (
                                      <li key={`${milestone.order}-step-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-3">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-black shrink-0">{index + 1}</span>
                                        <p className="text-sm text-slate-700">{step}</p>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2"><Youtube className="w-4 h-4 text-red-500" />YouTube videos</h4>
                                  <div className="mt-3 space-y-3">
                                    {milestone.resources.youtube.map(item => <ResourceLink key={item.url} item={item} icon={<PlayCircle className="w-4 h-4 text-red-500" />} />)}
                                    {milestone.resources.youtube.length === 0 && <p className="text-sm text-slate-500">No YouTube resources available.</p>}
                                  </div>
                                </div>

                                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2"><Github className="w-4 h-4 text-slate-800" />GitHub repositories</h4>
                                  <div className="mt-3 space-y-3">
                                    {milestone.resources.github.map(item => <ResourceLink key={item.url} item={item} icon={<Github className="w-4 h-4 text-slate-700" />} />)}
                                    {milestone.resources.github.length === 0 && <p className="text-sm text-slate-500">No GitHub repositories available.</p>}
                                  </div>
                                </div>

                                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500" />Reading material</h4>
                                  <div className="mt-3 space-y-3">
                                    {milestone.resources.reading.map(item => <ResourceLink key={item.url} item={item} icon={<FileText className="w-4 h-4 text-amber-500" />} />)}
                                    {milestone.resources.reading.length === 0 && <p className="text-sm text-slate-500">No reading material available.</p>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Target className="w-5 h-5 text-indigo-600" />Roadmap summary</h2>
                    <p className="text-sm text-slate-500">{draft.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                      <Pill><Layers3 className="w-3.5 h-3.5" />{draft.phases} milestones</Pill>
                      <Pill><Brain className="w-3.5 h-3.5" />{draft.generation_meta.provider}</Pill>
                      <Pill><BookOpen className="w-3.5 h-3.5" />{draft.level}</Pill>
                      <Pill><GraduationCap className="w-3.5 h-3.5" />{draft.duration}</Pill>
                    </div>
                    <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Tags</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {draft.tags.map(tag => <span key={tag} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-bold">{tag}</span>)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" />Aggregate resources</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 mb-2">YouTube</p>
                        <div className="space-y-2">
                          {draft.resources.youtube.map(item => <ResourceLink key={item.url} item={item} icon={<Youtube className="w-4 h-4 text-red-500" />} />)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 mb-2">GitHub</p>
                        <div className="space-y-2">
                          {draft.resources.github.map(item => <ResourceLink key={item.url} item={item} icon={<Github className="w-4 h-4 text-slate-700" />} />)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 mb-2">Reading</p>
                        <div className="space-y-2">
                          {draft.resources.reading.map(item => <ResourceLink key={item.url} item={item} icon={<FileText className="w-4 h-4 text-amber-500" />} />)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="mt-4 text-2xl font-black text-slate-900">No roadmap generated yet</h2>
                <p className="mt-2 text-sm text-slate-500 max-w-2xl mx-auto">Use the input form to generate a roadmap. The backend will first create milestone titles, then expand each one into a full learning path with resources.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminNavigation>
  );
}
