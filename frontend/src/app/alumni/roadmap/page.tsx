
"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { Map, Target, BookOpen, Users, Plus, TrendingUp, X, Sparkles } from "lucide-react";
import AlumniNavigation from "../AluminaNavigation/AlumniNavigation";
import { useToast } from "@/hooks/use-toast";

/** --- TYPES --- **/
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
  updated_at?: string;
};

interface RoadmapFormData {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  phases: string;
  modules_link: string;
  tags: string;
}

/** --- STYLES (Matching Dashboard Image) --- **/
const inputCls = "w-full px-4 py-3 text-sm rounded-[16px] border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all shadow-sm";
const labelCls = "block text-[11px] font-black text-slate-400 mb-1.5 uppercase tracking-[0.05em]";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

/** --- SEPARATE FORM COMPONENT (Prevents typing lag) --- **/
interface FormProps {
  formData: RoadmapFormData;
  setFormData: (data: RoadmapFormData) => void;
  onSubmit: (e: FormEvent) => void;
  title: string;
  submitLabel: string;
  onClose: () => void;
}

const RoadmapFormModal = ({ formData, setFormData, onSubmit, title, submitLabel, onClose }: FormProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Roadmap Designer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Roadmap Title *</label>
              <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Senior SDE at Amazon Path" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="What will they learn?" rows={3} required className={`${inputCls} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} required className={inputCls}>
                  <option value="">Select...</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="datascience">Data Science</option>
                  <option value="product">Product</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Level *</label>
                <select name="level" value={formData.level} onChange={handleChange} required className={inputCls}>
                  <option value="">Select...</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Duration *</label>
                <input name="duration" value={formData.duration} onChange={handleChange} placeholder="6 months" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phases *</label>
                <input name="phases" type="number" value={formData.phases} onChange={handleChange} placeholder="8" required className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Resource Link</label>
              <input name="modules_link" type="url" value={formData.modules_link} onChange={handleChange} placeholder="https://..." className={inputCls} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
            <button type="submit" className="px-8 py-3 text-sm font-black bg-indigo-500 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/** --- MAIN PAGE --- **/
function RoadmapPage() {
  const { user, error, isLoading } = useUser();
  const { toast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<Roadmap | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState<RoadmapFormData>({
    title: "", description: "", category: "", level: "",
    duration: "", phases: "", modules_link: "", tags: ""
  });

  const resetForm = () => setFormData({
    title: "", description: "", category: "", level: "",
    duration: "", phases: "", modules_link: "", tags: ""
  });

  const publishedRoadmaps = roadmaps.filter((rm) => rm.is_published).length;
  const totalFollowers = roadmaps.reduce((sum, rm) => sum + Number(rm.followers || 0), 0);
  const averagePhases = roadmaps.length
    ? (roadmaps.reduce((sum, rm) => sum + Number(rm.phases || 0), 0) / roadmaps.length).toFixed(1)
    : "0.0";

  useEffect(() => {
    if (!user?.email) return;
    setLoadingList(true);
    fetch(`${API_BASE}/api/roadmaps?owner_email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => setRoadmaps(Array.isArray(data.roadmaps) ? data.roadmaps : []))
      .catch(() => { })
      .finally(() => setLoadingList(false));
  }, [user?.email]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/roadmaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          owner_email: user.email,
          phases: Number(formData.phases),
          is_published: true
        })
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setRoadmaps(prev => [created, ...prev]);
      setShowCreateModal(false);
      resetForm();
      toast({ title: "Roadmap Created!", className: "bg-indigo-500 text-white rounded-2xl" });
    } catch {
      toast({ title: "Error creating roadmap", variant: "destructive" });
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`${API_BASE}/api/roadmaps/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phases: Number(formData.phases) })
      });
      const updated = await res.json();
      setRoadmaps(prev => prev.map(r => r.id === updated.id ? updated : r));
      setShowEditModal(false);
      resetForm();
    } catch { }
  };

  const openEdit = (rm: Roadmap) => {
    setEditing(rm);
    setFormData({
      title: rm.title, description: rm.description, category: rm.category,
      level: rm.level, duration: rm.duration, phases: String(rm.phases),
      modules_link: rm.modules_link || "", tags: rm.tags || ""
    });
    setShowEditModal(true);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;

  return (
    <AlumniNavigation>
      <div className="space-y-8 max-w-7xl mx-auto pb-20">

        {/* Dashboard Header Style */}
        <div className="bg-gradient-to-r from-[#e7eaff] to-[#eaddff] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[15px] mb-3">
              <Sparkles className="w-5 h-5" /> <span>Career Nav</span>
            </div>
            <h1 className="text-4xl md:text-[44px] font-extrabold text-[#1e293b] mb-4 tracking-tight leading-tight">Career Roadmaps</h1>
            <p className="text-slate-600 text-[17px] font-medium opacity-90 mt-2">Create and share career paths to guide students and fellow alumni.</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="absolute top-1/2 right-8 md:right-12 -translate-y-1/2 bg-white/50 hover:bg-white text-indigo-500 p-4 rounded-2xl backdrop-blur-sm shadow-[0_8px_20px_rgb(0,0,0,0.03)] border border-white/60 transition-all duration-300 group"
            title="Create New Roadmap"
          >
            <Plus className="w-8 h-8 text-indigo-500 stroke-[2.5]" />
          </button>
        </div>

        {/* Stats Section matching Dashboard "Impact" style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Your Total</p>
              <h4 className="text-4xl font-black text-slate-800">{roadmaps.length}</h4>
              <p className="text-sm font-bold text-slate-500 mt-1">Roadmaps Created</p>
            </div>
            <div className="w-16 h-16 bg-[#f0edff] rounded-3xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] p-8 rounded-[32px] shadow-lg shadow-violet-500/20 text-white flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-white/80 uppercase tracking-widest mb-6">
              <TrendingUp className="w-4 h-4" /> PUBLISHED
            </div>
            <div>
              <h4 className="text-[64px] font-black leading-none mb-2">{publishedRoadmaps}</h4>
              <p className="text-sm font-bold text-white/90">Published Roadmaps</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Followers</p>
              <h4 className="text-4xl font-black text-slate-800">{totalFollowers}</h4>
              <p className="text-sm font-bold text-slate-500 mt-1">Across all roadmaps</p>
            </div>
            <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center">
              <Target className="w-8 h-8 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Average Phases</p>
            <p className="text-2xl font-black text-slate-800">{averagePhases}</p>
          </div>
          <p className="text-sm font-medium text-slate-500">Calculated from the roadmap records currently loaded for your account.</p>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
          <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Active Roadmaps</h3>

          <div className="grid grid-cols-1 gap-4">
            {roadmaps.map(rm => (
              <div key={rm.id} className="group p-6 rounded-[28px] border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-[20px] bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Map className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-lg font-black text-slate-800">{rm.title}</h4>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white rounded-full border border-slate-200 text-slate-500">{rm.level}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-full text-indigo-600">{rm.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/alumni/roadmap/${rm.id}`} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest">View</Link>
                  <button onClick={() => openEdit(rm)} className="px-6 py-3 bg-indigo-50 text-indigo-600 text-xs font-black rounded-2xl hover:bg-indigo-100 transition-all uppercase tracking-widest">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <RoadmapFormModal
          title="Create New Roadmap"
          submitLabel="Create Now"
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {showEditModal && (
        <RoadmapFormModal
          title="Update Roadmap"
          submitLabel="Save Changes"
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdate}
        />
      )}
    </AlumniNavigation>
  );
}

export default withPageAuthRequired(RoadmapPage);