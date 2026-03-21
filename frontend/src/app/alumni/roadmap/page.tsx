"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Map, Target, BookOpen, Users, Plus, TrendingUp, X, Sparkles } from "lucide-react";
import AlumniNavigation from "../AluminaNavigation/AlumniNavigation";
import { useToast } from "@/hooks/use-toast";

type Roadmap = {
  id: number;
  owner_email: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  phases: number;
  modules_link?: string | null;
  tags?: string | null;
  followers?: number;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all";
const labelCls = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

function RoadmapPage() {
  const { user, error, isLoading } = useUser();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<Roadmap | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    title: "", description: "", category: "", level: "",
    duration: "", phases: "", modules_link: "", tags: ""
  });

  const resetForm = () => setFormData({
    title: "", description: "", category: "", level: "",
    duration: "", phases: "", modules_link: "", tags: ""
  });

  useEffect(() => {
    if (!user?.email) return;
    setLoadingList(true);
    fetch(`${API_BASE}/api/roadmaps?owner_email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => setRoadmaps(Array.isArray(data.roadmaps) ? data.roadmaps : []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [user?.email]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this roadmap? This can't be undone.")) return;
    try {
      setDeletingIds(prev => new Set(prev).add(id));
      const res = await fetch(`${API_BASE}/api/roadmaps/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setRoadmaps(prev => prev.filter(r => r.id !== id));
    } catch {}
    finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/roadmaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_email: user.email,
          title: formData.title, description: formData.description,
          category: formData.category, level: formData.level,
          duration: formData.duration, phases: Number(formData.phases),
          modules_link: formData.modules_link, tags: formData.tags, is_published: true
        })
      });
      if (!res.ok) throw new Error('Failed to create');
      const created = await res.json();
      setRoadmaps(prev => [created, ...prev]);
      setShowCreateModal(false);
      resetForm();
      toast({ title: "Roadmap Created", description: "Your roadmap has been published.", className: "bg-green-50 border-green-200 text-green-900" });
    } catch {}
  };

  const openEdit = (rm: Roadmap) => {
    setEditing(rm);
    setFormData({
      title: rm.title || "", description: rm.description || "", category: rm.category || "",
      level: rm.level || "", duration: rm.duration || "", phases: String(rm.phases ?? ""),
      modules_link: rm.modules_link || "", tags: rm.tags || ""
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`${API_BASE}/api/roadmaps/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title, description: formData.description, category: formData.category,
          level: formData.level, duration: formData.duration, phases: Number(formData.phases),
          modules_link: formData.modules_link, tags: formData.tags
        })
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setRoadmaps(prev => prev.map(r => r.id === updated.id ? updated : r));
      setShowEditModal(false);
      setEditing(null);
      resetForm();
    } catch {}
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500" />
    </div>
  );

  if (error || !user) return (
    <div className="flex items-center justify-center min-h-screen">
      <a href="/api/auth/login" className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700">Login</a>
    </div>
  );

  const levelColor = (l: string) => {
    switch (l?.toLowerCase()) {
      case 'beginner': return 'bg-green-50 text-green-700 border-green-200';
      case 'intermediate': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'advanced': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'expert': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const RoadmapForm = ({ onSubmit, title, submitLabel, onClose }: { onSubmit: (e: React.FormEvent) => void; title: string; submitLabel: string; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Share your expertise and guide others</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Roadmap Title *</label>
            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Full Stack Developer Journey" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe what this roadmap covers and who it's for..." rows={3} required className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category *</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required className={inputCls}>
                <option value="">Select category</option>
                <option value="frontend">Frontend Development</option>
                <option value="backend">Backend Development</option>
                <option value="fullstack">Full Stack Development</option>
                <option value="mobile">Mobile Development</option>
                <option value="datascience">Data Science</option>
                <option value="devops">DevOps</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="product">Product Management</option>
                <option value="design">UI/UX Design</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Difficulty Level *</label>
              <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} required className={inputCls}>
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Duration *</label>
              <input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g., 6–12 months" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Number of Phases *</label>
              <input type="number" value={formData.phases} onChange={e => setFormData({ ...formData, phases: e.target.value })} placeholder="e.g., 8" min="1" max="20" required className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Modules / Resource Link</label>
            <input value={formData.modules_link} onChange={e => setFormData({ ...formData, modules_link: e.target.value })} placeholder="https://youtube.com/playlist?list=..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tags (comma separated)</label>
            <input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="e.g., JavaScript, React, Node.js" className={inputCls} />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <AlumniNavigation>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Career Roadmaps</h1>
            <p className="text-gray-500 text-sm mt-1">Create and share career paths to guide students and fellow alumni</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />Create New Roadmap
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Roadmaps Created', value: roadmaps.length, icon: <Map className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Students Helped', value: 156, icon: <Users className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Total Views', value: '2.1K', icon: <Target className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', color: 'text-purple-600' },
            { label: 'Avg. Rating', value: '4.8', icon: <TrendingUp className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50', color: 'text-orange-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My Roadmaps */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-gray-900">My Career Roadmaps</h3>
            <span className="ml-auto text-xs font-semibold text-gray-400">
              {loadingList ? 'Loading…' : `${roadmaps.length} active`}
            </span>
          </div>

          {loadingList && <p className="text-sm text-gray-400 text-center py-6">Loading your roadmaps…</p>}
          {!loadingList && roadmaps.length === 0 && (
            <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Map className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">No roadmaps yet</p>
              <p className="text-xs text-gray-500">Click "Create New Roadmap" to share your expertise.</p>
            </div>
          )}

          <div className="space-y-3">
            {roadmaps.map((rm) => (
              <div key={rm.id} className="rounded-xl border border-gray-100 hover:shadow-md transition-all p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-sm">{rm.title}</h4>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${levelColor(rm.level)}`}>{rm.level}</span>
                      {rm.category && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">{rm.category}</span>}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{rm.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-3">
                      <span>{rm.phases} phases</span>
                      <span>{rm.duration}</span>
                      <span>{rm.followers ?? 0} followers</span>
                      {rm.updated_at && <span>Updated {new Date(rm.updated_at).toLocaleDateString()}</span>}
                    </div>
                    {rm.tags && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {rm.tags.split(',').map((t, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.trim()}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Link href={`/alumni/roadmap/${rm.id}`}>
                        <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">View</button>
                      </Link>
                      <button onClick={() => openEdit(rm)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">Edit</button>
                      <button onClick={() => handleDelete(rm.id)} disabled={deletingIds.has(rm.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50">
                        {deletingIds.has(rm.id) ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-xl px-4 py-3 text-center shrink-0">
                    <p className="text-xl font-bold text-green-600">{rm.followers ?? 0}</p>
                    <p className="text-[11px] text-green-600 font-semibold">followers</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Roadmaps */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900">Popular Community Roadmaps</h3>
          </div>
          <div className="space-y-3">
            {[
              { initials: 'RK', name: 'Rajesh Kumar', batch: '2018', title: 'Mobile App Development (Flutter)', desc: 'Complete guide to Flutter development with real-world projects and industry best practices', tags: ['Flutter', 'Mobile', 'Dart'], followers: 127, color: 'bg-blue-100 text-blue-700' },
              { initials: 'PS', name: 'Priya Sharma', batch: '2017', title: 'Product Management Transition', desc: 'From engineering to product management — a practical guide with real transition stories', tags: ['Product', 'Strategy', 'Management'], followers: 95, color: 'bg-green-100 text-green-700' },
            ].map((c, i) => (
              <div key={i} className="rounded-xl border border-gray-100 hover:shadow-md transition-all p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${c.color} font-bold text-sm flex items-center justify-center shrink-0`}>{c.initials}</div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm mb-0.5">{c.title}</h4>
                      <p className="text-[11px] text-gray-400 mb-2">By {c.name} · Class of {c.batch}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{c.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {c.tags.map((t, j) => (
                          <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="bg-green-50 rounded-xl px-3 py-2 mb-2">
                      <p className="text-lg font-bold text-green-600">{c.followers}</p>
                      <p className="text-[11px] text-green-600 font-semibold">followers</p>
                    </div>
                    <button className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">Follow</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <RoadmapForm
          title="Create New Roadmap"
          submitLabel="Create Roadmap"
          onSubmit={handleSubmit}
          onClose={() => { setShowCreateModal(false); resetForm(); }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <RoadmapForm
          title="Edit Roadmap"
          submitLabel="Save Changes"
          onSubmit={handleUpdate}
          onClose={() => { setShowEditModal(false); setEditing(null); resetForm(); }}
        />
      )}
    </AlumniNavigation>
  );
}

export default withPageAuthRequired(RoadmapPage);