"use client";

import React, { useState, useEffect } from 'react';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Calendar, MapPin, Camera, Plus, Search, Filter, Grid, List, Upload, X, Eye, TrendingUp, Clock, Sparkles, Send, Trophy, Users, BookOpen } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

const staticMemories = [
  { id: 1, author: { name: "Sarah Johnson", avatar: "", batch: "2018-2022", department: "Computer Science" }, title: "Graduation Day 2022", description: "What an incredible journey! Four years of hard work, late-night coding sessions, and amazing friendships.", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop", date: "2022-05-15", location: "Main Auditorium", tags: ["graduation", "achievement"], likes: 45, comments: 12, isLiked: false, category: "achievement", type: "photo", views: 234, saved: false },
  { id: 2, author: { name: "Mike Chen", avatar: "", batch: "2017-2021", department: "Electrical Engineering" }, title: "Tech Fest Victory", description: "Our team won first place in the annual tech fest! Months of preparation paid off.", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop", date: "2020-03-10", location: "Engineering Block", tags: ["techfest", "victory", "teamwork"], likes: 38, comments: 8, isLiked: true, category: "competition", type: "photo", views: 189, saved: false },
  { id: 3, author: { name: "Emily Davis", avatar: "", batch: "2019-2023", department: "Business Administration" }, title: "First Day Nostalgia", description: "Found this old photo from our first day! We were so nervous and excited. Look how far we've come!", image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=400&fit=crop", date: "2019-08-01", location: "Campus Entrance", tags: ["firstday", "nostalgia"], likes: 52, comments: 15, isLiked: false, category: "friendship", type: "photo", views: 312, saved: true },
  { id: 4, author: { name: "David Wilson", avatar: "", batch: "2016-2020", department: "Mechanical Engineering" }, title: "Late Night Lab Sessions", description: "3 AM in the robotics lab, working on our final project. These defined our college experience!", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop", date: "2020-01-25", location: "Robotics Lab", tags: ["lab", "project", "dedication"], likes: 31, comments: 6, isLiked: true, category: "academic", type: "photo", views: 145, saved: false },
  { id: 5, author: { name: "Jessica Rodriguez", avatar: "", batch: "2015-2019", department: "Arts & Design" }, title: "Annual Cultural Festival", description: "The energy, the performances, the crowd - our cultural fest was always the highlight of the year!", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop", date: "2018-11-20", location: "Main Stage", tags: ["cultural", "festival"], likes: 67, comments: 22, isLiked: false, category: "event", type: "video", views: 0, saved: false },
  { id: 6, author: { name: "Alex Thompson", avatar: "", batch: "2014-2018", department: "Sports Management" }, title: "Inter College Championship Win", description: "We did it! After months of training, our basketball team brought home the championship trophy!", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop", date: "2017-04-15", location: "Sports Complex", tags: ["sports", "championship"], likes: 89, comments: 18, isLiked: true, category: "sports", type: "photo", views: 0, saved: false },
];

const categoryIcons: Record<string, React.ComponentType<any>> = {
  achievement: Trophy, competition: Trophy, friendship: Users, academic: BookOpen, event: Calendar, sports: Trophy,
};

const normalizeMemory = (m: any) => {
  if (!m) return m;
  if (m.author && m.author.name) return m;
  return {
    id: m.id, title: m.title, description: m.description,
    image: m.image || m.image_url || '',
    date: m.date || m.created_at || new Date().toISOString().split('T')[0],
    location: m.location || '', category: m.category || 'friendship', type: m.type || 'photo',
    likes: m.likes ?? 0, comments: m.comments ?? m.comments_count ?? 0,
    isLiked: m.isLiked ?? m.is_liked ?? false, views: m.views ?? 0, saved: m.saved ?? false,
    tags: Array.isArray(m.tags) ? m.tags : (typeof m.tags === 'string' && m.tags.length ? m.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
    author: { name: m.author_name || 'Alumni', avatar: m.author_avatar || '', batch: m.author_batch || '', department: m.author_department || '' },
  };
};

const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all";

export default function MemoriesPage() {
  const { toast } = useToast();
  const [memories, setMemories] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [showComments, setShowComments] = useState<Record<number, boolean>>({});
  const [newComment, setNewComment] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [comments, setComments] = useState<Record<number, any[]>>({
    1: [{ id: 1, author: 'John Doe', text: 'Congratulations! So proud of you! 🎉', time: '2 hours ago', likes: 5 }, { id: 2, author: 'Jane Smith', text: 'Amazing achievement! 👏', time: '3 hours ago', likes: 3 }],
    2: [{ id: 1, author: 'Team Member', text: 'Great teamwork everyone! 🚀', time: '1 day ago', likes: 8 }],
  });
  const [newMemory, setNewMemory] = useState({ title: '', description: '', location: '', tags: '', category: 'friendship' });

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const q = encodeURIComponent(searchQuery || '');
        const resp = await apiClient.get(`/memories?q=${q}&category=${selectedCategory}&sort=${activeTab}&page=1&limit=50`);
        const rawList = resp?.memories || resp || [];
        const list = rawList.map((m: any) => normalizeMemory(m));
        setMemories(list);
      } catch {
        setMemories(staticMemories);
      }
    };
    fetchMemories();

    try {
      const streamUrl = (apiClient as any).baseURL.replace(/\/+$/, '') + '/memories/stream';
      const es = new EventSource(streamUrl);
      es.addEventListener('memory-like', (e: any) => {
        try { const d = JSON.parse(e.data); setMemories(p => p.map(m => m.id === d.id ? { ...m, likes: d.likes ?? m.likes, isLiked: d.is_liked ?? m.isLiked } : m)); } catch {}
      });
      es.addEventListener('memory-view', (e: any) => {
        try { const d = JSON.parse(e.data); setMemories(p => p.map(m => m.id === d.id ? { ...m, views: d.views ?? m.views } : m)); } catch {}
      });
      es.addEventListener('memory-comment', (e: any) => {
        try {
          const d = JSON.parse(e.data); const id = d.id; const c = d.comment;
          const mapped = { id: c.id, author: c.author_name || 'Alumni', text: c.text, time: c.created_at ? new Date(c.created_at).toLocaleString() : 'Just now', likes: c.likes || 0 };
          setComments(prev => { const list = prev[id] || []; const exists = list.some((x: any) => x.id === mapped.id); const next = exists ? list.map((x: any) => x.id === mapped.id ? mapped : x) : [...list, mapped]; if (!exists) setMemories(p => p.map(m => m.id === id ? { ...m, comments: (m.comments || 0) + 1 } : m)); return { ...prev, [id]: next }; });
        } catch {}
      });
      es.addEventListener('memory-create', (e: any) => {
        try { const d = JSON.parse(e.data); const nm = normalizeMemory(d); setMemories(p => [nm, ...p.filter(m => m.id !== nm.id)]); } catch {}
      });
    } catch {}
  }, [selectedCategory, searchQuery, activeTab]);

  const handleLike = async (memoryId: number) => {
    const m = memories.find(m => m.id === memoryId);
    try {
      setPendingLikeIds(prev => new Set(prev).add(memoryId));
      const resp = await apiClient.post(`/memories/${memoryId}/like`, { action: m?.isLiked ? 'unlike' : 'like' });
      setMemories(memories.map(mem => mem.id === memoryId ? { ...mem, isLiked: resp?.is_liked ?? !m?.isLiked, likes: resp?.likes ?? (m?.isLiked ? (m.likes - 1) : (m.likes + 1)) } : mem));
    } catch {}
    finally { setPendingLikeIds(prev => { const n = new Set(prev); n.delete(memoryId); return n; }); }
  };

  const toggleComments = async (memoryId: number) => {
    const open = !showComments[memoryId];
    setShowComments(prev => ({ ...prev, [memoryId]: open }));
    if (open) {
      try {
        const resp = await apiClient.get(`/memories/${memoryId}/comments`);
        setComments(prev => ({ ...prev, [memoryId]: (resp?.comments || []).map((c: any) => ({ id: c.id, author: c.author_name || 'Alumni', text: c.text, time: c.created_at ? new Date(c.created_at).toLocaleString() : 'Just now', likes: c.likes || 0 })) }));
      } catch {}
    }
  };

  const handleAddComment = async (memoryId: number) => {
    if (!newComment.trim()) return;
    try {
      const resp = await apiClient.post(`/memories/${memoryId}/comments`, { author_name: 'You', text: newComment });
      const newItem = { id: resp?.id, author: resp?.author_name || 'You', text: resp?.text || newComment, time: 'Just now', likes: 0 };
      setComments(prev => { const list = prev[memoryId] || []; const exists = list.some((x: any) => x.id === newItem.id); const next = exists ? list : [...list, newItem]; if (!exists) setMemories(p => p.map(m => m.id === memoryId ? { ...m, comments: (m.comments || 0) + 1 } : m)); return { ...prev, [memoryId]: next }; });
      setNewComment('');
    } catch {}
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result as string); setImageFile(file); reader.readAsDataURL(file); }
  };

  const handleAddMemory = async () => {
    if (!newMemory.title.trim()) { toast({ title: 'Title required', description: 'Please add a title.' }); return; }
    try {
      setIsSharing(true);
      let image_url: string | null = null;
      if (imageFile) {
        const fd = new FormData(); fd.append('image', imageFile);
        try { const up = await apiClient.postFormData('/uploads/memory-image', fd); image_url = up?.url || null; } catch {}
      }
      await apiClient.post('/memories', { author_name: 'You', author_avatar: null, author_batch: '2020-2024', author_department: 'Your Department', title: newMemory.title, description: newMemory.description || '', image_url, date: new Date().toISOString().split('T')[0], location: newMemory.location || 'Campus', tags: newMemory.tags.split(',').map(t => t.trim()).filter(Boolean), category: newMemory.category, type: 'photo' });
      toast({ title: 'Memory shared!', description: 'Your memory has been posted.' });
      setNewMemory({ title: '', description: '', location: '', tags: '', category: 'friendship' });
      setImagePreview(null); setImageFile(null); setShowAddForm(false);
      const resp = await apiClient.get(`/memories?q=&category=all&sort=recent&page=1&limit=50`);
      setMemories((resp?.memories || resp || []).map((m: any) => normalizeMemory(m)));
    } catch (e: any) { toast({ title: 'Unable to share memory', description: e?.message || 'Please try again.' }); }
    finally { setIsSharing(false); }
  };

  const filteredMemories = memories.filter(m => {
    const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchSearch = !searchQuery || m.title?.toLowerCase().includes(searchQuery.toLowerCase()) || m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const TABS = [
    { value: 'recent', label: 'Recent', icon: <Clock className="w-3.5 h-3.5" /> },
    { value: 'trending', label: 'Trending', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { value: 'popular', label: 'Popular', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  const CommentThread = ({ memoryId }: { memoryId: number }) => (
    <div className="mt-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
        <MessageCircle className="w-4 h-4 text-green-600" />
        Comments ({comments[memoryId]?.length || 0})
      </h4>
      <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
        {(comments[memoryId] || []).map((c: any, i: number) => (
          <div key={`${c.id}-${i}`} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">{c.author.charAt(0)}</div>
            <div className="flex-1 bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900">{c.author}</span>
                <span className="text-[10px] text-gray-400">{c.time}</span>
              </div>
              <p className="text-xs text-gray-600">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(memoryId); } }} placeholder="Write a comment…" className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200" />
        <button onClick={() => handleAddComment(memoryId)} className="px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const MemoryCard = ({ memory }: { memory: any }) => {
    const CatIcon = categoryIcons[memory.category] || Users;
    const a = memory.author || { name: 'Alumni', avatar: '', batch: '', department: '' };
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
        {memory.image && (
          <div className="relative h-44 overflow-hidden cursor-pointer" onClick={async () => { setSelectedMemory(memory); try { const v = await apiClient.post(`/memories/${memory.id}/view`, {}); setMemories(p => p.map(m => m.id === memory.id ? { ...m, views: v?.views ?? (m.views || 0) + 1 } : m)); } catch {} }}>
            <img src={memory.image} alt={memory.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute top-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-xs font-bold text-gray-700">
                <CatIcon className="w-3 h-3" />{memory.category}
              </span>
            </div>
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
              <span className="flex items-center gap-1 text-white text-xs bg-black/40 rounded-full px-2 py-1"><Eye className="w-3 h-3" />{memory.views || 0}</span>
            </div>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">{a.name.charAt(0)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 leading-none">{a.name}</p>
              <p className="text-[10px] text-gray-400">{a.batch}{a.department ? ` · ${a.department}` : ''}</p>
            </div>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />{new Date(memory.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h4 className="font-bold text-gray-900 text-sm mb-1 cursor-pointer hover:text-green-700 transition-colors" onClick={() => setSelectedMemory(memory)}>{memory.title}</h4>
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{memory.description}</p>
          {memory.location && <p className="flex items-center gap-1 text-[11px] text-gray-400 mb-2"><MapPin className="w-3 h-3" />{memory.location}</p>}
          {Array.isArray(memory.tags) && memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {memory.tags.slice(0, 3).map((t: string, i: number) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold">#{t}</span>)}
            </div>
          )}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button onClick={() => handleLike(memory.id)} disabled={pendingLikeIds.has(memory.id)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${memory.isLiked ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}>
              <Heart className={`w-3.5 h-3.5 ${memory.isLiked ? 'fill-current' : ''}`} />{memory.likes}
            </button>
            <button onClick={() => toggleComments(memory.id)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${showComments[memory.id] ? 'text-green-700 bg-green-50' : 'text-gray-500 hover:text-green-700 hover:bg-green-50'}`}>
              <MessageCircle className="w-3.5 h-3.5" />{memory.comments}
            </button>
          </div>
          {showComments[memory.id] && <CommentThread memoryId={memory.id} />}
        </div>
      </div>
    );
  };

  return (
    <AlumniNavigation>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Camera className="w-6 h-6 text-green-600" />Memories Wall</h1>
            <p className="text-gray-500 text-sm mt-1">Relive, share, and celebrate moments that defined your journey</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-3">
              <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-lg font-bold text-green-600">{memories.length}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Memories</p>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-lg font-bold text-red-500">{memories.reduce((s, m) => s + (m.likes || 0), 0)}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Total Likes</p>
              </div>
            </div>
            <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />Share Memory
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input placeholder="Search memories, people, tags…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>}
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl border-gray-200 bg-white text-sm text-gray-900">
                <Filter className="w-4 h-4 mr-2 text-gray-500" /><SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="achievement">🏆 Achievement</SelectItem>
                <SelectItem value="friendship">👥 Friendship</SelectItem>
                <SelectItem value="academic">📚 Academic</SelectItem>
                <SelectItem value="sports">⚽ Sports</SelectItem>
                <SelectItem value="event">🎉 Events</SelectItem>
                <SelectItem value="competition">🏅 Competition</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}><Grid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}><List className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {TABS.map(t => (
              <button key={t.value} onClick={() => setActiveTab(t.value)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === t.value ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Memory Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center"><Sparkles className="w-4 h-4 text-green-600" /></div>
              <h3 className="font-bold text-gray-900">Share a Memory</h3>
            </div>
            <div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="img-upload" />
              <label htmlFor="img-upload" className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all overflow-hidden">
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={e => { e.preventDefault(); setImagePreview(null); setImageFile(null); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-gray-600 hover:text-red-600"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <><Upload className="w-8 h-8 text-gray-300 mb-2" /><p className="text-sm text-gray-400">Click to upload photo</p></>
                )}
              </label>
            </div>
            <input placeholder="Memory Title *" value={newMemory.title} onChange={e => setNewMemory({ ...newMemory, title: e.target.value })} className={inputCls} />
            <textarea placeholder="Describe this memory…" value={newMemory.description} onChange={e => setNewMemory({ ...newMemory, description: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input placeholder="Location" value={newMemory.location} onChange={e => setNewMemory({ ...newMemory, location: e.target.value })} className={inputCls} />
              <input placeholder="Tags (comma separated)" value={newMemory.tags} onChange={e => setNewMemory({ ...newMemory, tags: e.target.value })} className={inputCls} />
              <select value={newMemory.category} onChange={e => setNewMemory({ ...newMemory, category: e.target.value })} className={inputCls}>
                <option value="friendship">👥 Friendship</option>
                <option value="achievement">🏆 Achievement</option>
                <option value="academic">📚 Academic</option>
                <option value="sports">⚽ Sports</option>
                <option value="event">🎉 Event</option>
                <option value="competition">🏅 Competition</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddMemory} disabled={isSharing} className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60">
                <Sparkles className="w-4 h-4 inline mr-2" />{isSharing ? 'Sharing…' : 'Share Memory'}
              </button>
              <button onClick={() => { setShowAddForm(false); setImagePreview(null); setImageFile(null); }} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Memory Grid/List */}
        {filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"><Search className="w-7 h-7 text-gray-400" /></div>
            <p className="font-bold text-gray-900 text-sm mb-1">No memories found</p>
            <p className="text-xs text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">Clear Filters</button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredMemories.map((memory, i) => <MemoryCard key={`${memory.id}-${i}`} memory={memory} />)}
          </div>
        )}
      </div>

      {/* Memory Detail Modal */}
      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-white rounded-2xl border border-gray-100 shadow-xl">
          {selectedMemory && (
            <div>
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center shrink-0">{(selectedMemory.author?.name || 'A').charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{selectedMemory.author?.name}</p>
                  <p className="text-xs text-gray-400">{selectedMemory.author?.batch}{selectedMemory.author?.department ? ` · ${selectedMemory.author.department}` : ''}</p>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">{selectedMemory.category}</span>
              </div>
              {selectedMemory.image && <div className="h-56 sm:h-72 overflow-hidden"><img src={selectedMemory.image} alt={selectedMemory.title} className="w-full h-full object-cover" /></div>}
              <div className="p-5 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedMemory.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedMemory.description}</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(selectedMemory.tags) ? selectedMemory.tags : []).map((t: string, i: number) => <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-semibold">#{t}</span>)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</p><p className="text-sm font-bold text-gray-900">{new Date(selectedMemory.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Location</p><p className="text-sm font-bold text-gray-900">{selectedMemory.location}</p></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => { handleLike(selectedMemory.id); setSelectedMemory({ ...selectedMemory, isLiked: !selectedMemory.isLiked, likes: selectedMemory.isLiked ? selectedMemory.likes - 1 : selectedMemory.likes + 1 }); }} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${selectedMemory.isLiked ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'}`}>
                    <Heart className={`w-4 h-4 ${selectedMemory.isLiked ? 'fill-current' : ''}`} />{selectedMemory.likes}
                  </button>
                  <button onClick={() => toggleComments(selectedMemory.id)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all">
                    <MessageCircle className="w-4 h-4" />{comments[selectedMemory.id]?.length || selectedMemory.comments}
                  </button>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto"><Eye className="w-3.5 h-3.5" />{selectedMemory.views || 0} views</span>
                </div>
                {showComments[selectedMemory.id] && <CommentThread memoryId={selectedMemory.id} />}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AlumniNavigation>
  );
}