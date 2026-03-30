"use client";

import React, { useState, useEffect } from 'react';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Calendar, MapPin, Camera, Search, Filter, Grid, List, Upload, X, Eye, TrendingUp, Clock, Sparkles, Send, Trophy, Users, BookOpen } from 'lucide-react';
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

const inputCls = "w-full px-4 py-3 text-[14px] rounded-[16px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all shadow-sm";

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
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [comments, setComments] = useState<Record<number, any[]>>({
    1: [{ id: 1, author: 'John Doe', text: 'Congratulations! So proud of you! 🎉', time: '2 hours ago', likes: 5 }, { id: 2, author: 'Jane Smith', text: 'Amazing achievement! 👏', time: '3 hours ago', likes: 3 }],
    2: [{ id: 1, author: 'Team Member', text: 'Great teamwork everyone! 🚀', time: '1 day ago', likes: 8 }],
  });
  const [newMemory, setNewMemory] = useState({ title: '', description: '', location: '', tags: '', category: 'friendship' });

  const fetchCommentsForMemory = async (memoryId: number) => {
    try {
      const resp = await apiClient.get(`/memories/${memoryId}/comments`);
      const fetched = (resp?.comments || []).map((c: any) => ({
        id: c.id,
        author: c.author_name || 'Alumni',
        text: c.text,
        time: c.created_at ? new Date(c.created_at).toLocaleString() : 'Just now',
        likes: c.likes || 0,
      }));
      setComments(prev => ({ ...prev, [memoryId]: fetched }));
      setMemories(p => p.map(m => m.id === memoryId ? { ...m, comments: fetched.length } : m));
      setSelectedMemory((prev: any) => prev?.id === memoryId ? { ...prev, comments: fetched.length } : prev);
    } catch {}
  };

  useEffect(() => {
    if (!selectedMemory?.id) return;
    fetchCommentsForMemory(selectedMemory.id);
  }, [selectedMemory?.id]);

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
          setComments(prev => { 
            const list = prev[id] || []; 
            const exists = list.some((x: any) => x.id === mapped.id || (x.text === mapped.text && x.author === mapped.author)); 
            const next = exists ? list.map((x: any) => (x.id === mapped.id || (x.text === mapped.text && x.author === mapped.author)) ? mapped : x) : [...list, mapped]; 
            if (!exists) { setMemories(p => p.map(m => m.id === id ? { ...m, comments: (m.comments || 0) + 1 } : m)); }
            return { ...prev, [id]: next }; 
          });
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
      await fetchCommentsForMemory(memoryId);
    }
  };

  const handleAddComment = async (memoryId: number) => {
    if (!newComment.trim()) return;
    try {
      const resp = await apiClient.post(`/memories/${memoryId}/comments`, { author_name: 'You', text: newComment });
      const newItem = { id: resp?.id || Date.now(), author: resp?.author_name || 'You', text: resp?.text || newComment, time: 'Just now', likes: 0 };
      setComments(prev => { 
        const list = prev[memoryId] || []; 
        const exists = list.some((x: any) => x.id === newItem.id || (x.text === newItem.text && x.author === newItem.author)); 
        const next = exists ? list : [...list, newItem]; 
        if (!exists) setMemories(p => p.map(m => m.id === memoryId ? { ...m, comments: (m.comments || 0) + 1 } : m)); 
        return { ...prev, [memoryId]: next }; 
      });
      setNewComment('');
    } catch {}
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result as string); setImageFile(file); reader.readAsDataURL(file); }
  };

  const handleAddMemory = async () => {
    if (!newMemory.title.trim()) { toast({ title: 'Title required', description: 'Please add a title.', variant: 'destructive' }); return; }
    try {
      setIsSharing(true);
      let image_url: string | null = null;
      if (imageFile) {
        const fd = new FormData(); fd.append('image', imageFile);
        try { const up = await apiClient.postFormData('/uploads/memory-image', fd); image_url = up?.url || null; } catch {}
      }
      await apiClient.post('/memories', { author_name: 'You', author_avatar: null, author_batch: '2020-2024', author_department: 'Your Department', title: newMemory.title, description: newMemory.description || '', image_url, date: new Date().toISOString().split('T')[0], location: newMemory.location || 'Campus', tags: newMemory.tags.split(',').map(t => t.trim()).filter(Boolean), category: newMemory.category, type: 'photo' });
      toast({ title: 'Memory shared!', description: 'Your memory has been posted.', className: "bg-indigo-500 text-white rounded-2xl border-none" });
      setNewMemory({ title: '', description: '', location: '', tags: '', category: 'friendship' });
      setImagePreview(null); setImageFile(null); setShowAddForm(false);
      const resp = await apiClient.get(`/memories?q=&category=all&sort=recent&page=1&limit=50`);
      setMemories((resp?.memories || resp || []).map((m: any) => normalizeMemory(m)));
    } catch (e: any) { toast({ title: 'Unable to share memory', description: e?.message || 'Please try again.', variant: "destructive" }); }
    finally { setIsSharing(false); }
  };

  const filteredMemories = memories.filter(m => {
    const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchSearch = !searchQuery || m.title?.toLowerCase().includes(searchQuery.toLowerCase()) || m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalLikes = filteredMemories.reduce((sum, m) => sum + (m.likes || 0), 0);
  const totalComments = filteredMemories.reduce((sum, m) => sum + (m.comments || 0), 0);
  const activeAuthors = new Set(filteredMemories.map(m => m.author?.name || 'Alumni')).size;
  const categoryCount = filteredMemories.reduce((acc: Record<string, number>, m) => {
    const cat = m.category || 'friendship';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'friendship';

  const TABS = [
    { value: 'recent', label: 'Recent', icon: <Clock className="w-3.5 h-3.5" /> },
    { value: 'trending', label: 'Trending', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { value: 'popular', label: 'Popular', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  const renderCommentThread = (memoryId: number) => (
    <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
      <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 mb-4 tracking-wider uppercase">
        <MessageCircle className="w-4 h-4 text-indigo-500" />
        Comments ({comments[memoryId]?.length ?? memories.find((m: any) => m.id === memoryId)?.comments ?? 0})
      </h4>
      <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-1">
        {(comments[memoryId] || []).map((c: any, i: number) => (
          <div key={`${c.id}-${i}`} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-black flex items-center justify-center shrink-0">{c.author.charAt(0)}</div>
            <div className="flex-1 bg-slate-50/70 rounded-[16px] p-4 border border-slate-100/60">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <span className="text-[13px] font-black text-slate-800 leading-none shrink-0">{c.author}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 text-right leading-tight break-words">{c.time}</span>
              </div>
              <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <input id={`comment-input-${memoryId}`} value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(memoryId); } }} placeholder="Write a comment..." className="min-w-0 w-full px-4 py-2.5 text-[14px] rounded-[16px] border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm" />
        <button onClick={() => handleAddComment(memoryId)} className="w-11 h-11 inline-flex items-center justify-center bg-indigo-500 text-white rounded-[14px] text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-200 shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderMemoryCard = (memory: any, i: number) => {
    const CatIcon = categoryIcons[memory.category] || Users;
    const a = memory.author || { name: 'Alumni', avatar: '', batch: '', department: '' };
    return (
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgb(79,70,229,0.15)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
        {memory.image && (
          <div className="relative h-52 overflow-hidden cursor-pointer bg-slate-100" onClick={async () => { setSelectedMemory(memory); try { const v = await apiClient.post(`/memories/${memory.id}/view`, {}); setMemories(p => p.map(m => m.id === memory.id ? { ...m, views: v?.views ?? (m.views || 0) + 1 } : m)); } catch {} }}>
            <img src={memory.image} alt={memory.title} className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-slate-900/5 to-transparent" />
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-white/95 backdrop-blur-md text-[10px] uppercase font-black tracking-widest text-slate-800 shadow-sm border border-white/20">
                <CatIcon className="w-3.5 h-3.5 text-indigo-500" />{memory.category}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-white/90 text-xs font-bold bg-slate-900/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10"><Eye className="w-3.5 h-3.5" />{memory.views || 0} views</span>
            </div>
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button onClick={() => setSelectedMemory(memory)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-white/90 text-slate-700 border border-white/30 backdrop-blur-md hover:bg-white">
                Open
              </button>
            </div>
          </div>
        )}
        <div className="p-6 flex flex-col min-h-[242px]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0 w-full">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-[12px] font-black flex items-center justify-center shrink-0 shadow-sm">{a.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] sm:text-[14px] font-black text-slate-800 leading-tight break-words sm:truncate">{a.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 break-words sm:truncate">{a.batch}{a.department ? ` · ${a.department}` : ''}</p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
              <Clock className="w-3 h-3" />
              {new Date(memory.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <h4 className="font-extrabold text-slate-800 text-[16px] mb-2 cursor-pointer hover:text-indigo-600 transition-colors line-clamp-2 min-h-[44px]" onClick={() => setSelectedMemory(memory)}>{memory.title}</h4>
          <p className="text-[13px] font-medium text-slate-500 line-clamp-2 min-h-[40px] mb-4 leading-relaxed">{memory.description}</p>
          
          {memory.location ? (
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 min-h-[16px] line-clamp-1"><MapPin className="w-3.5 h-3.5 text-slate-300" />{memory.location}</p>
          ) : (
            <div className="mb-4 min-h-[16px]" />
          )}
          
          {Array.isArray(memory.tags) && memory.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-5 min-h-[30px]">
              {memory.tags.slice(0, 3).map((t: string, i: number) => <span key={i} className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-[8px] bg-slate-50 border border-slate-100 text-slate-500">#{t}</span>)}
            </div>
          ) : (
            <div className="mb-5 min-h-[30px]" />
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3 mt-auto">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Open to like and comment</span>
            <button
              onClick={() => setSelectedMemory(memory)}
              className="px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-sm"
            >
              View Details
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-indigo-400/0 via-indigo-400 to-indigo-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    );
  };

  return (
    <AlumniNavigation>
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans px-2 md:px-4">

        {/* Alumni Hero */}
        <div className="rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-indigo-100/60 bg-[radial-gradient(circle_at_top_left,_#eef2ff_0,_#f8faff_42%,_#ffffff_100%)]">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-indigo-200/35 blur-3xl" />
          <div className="absolute -bottom-10 left-1/3 w-56 h-56 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-indigo-700 font-bold text-[12px] mb-4 uppercase tracking-[0.15em] bg-white/70 border border-indigo-100 px-3 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4" />
              Alumni Memories Hub
            </div>
            <h1 className="text-4xl md:text-[46px] font-extrabold text-slate-800 mb-4 tracking-tight leading-[1.05]">
              Preserve Campus Stories,
              <span className="text-indigo-600"> Professionally</span>
            </h1>
            <p className="text-slate-600 text-[16px] md:text-[17px] font-medium opacity-95 mt-2 max-w-2xl">
              Relive milestones, celebrate achievements, and keep every alumni memory discoverable through one consistent and modern experience.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="absolute top-1/2 right-8 md:right-12 -translate-y-1/2 bg-white/80 hover:bg-white text-indigo-500 p-4 rounded-2xl backdrop-blur-sm shadow-[0_12px_24px_rgb(79,70,229,0.2)] border border-indigo-100/60 transition-all duration-300 group hidden sm:block hover:scale-105"
            title="Share Memory"
          >
            <Camera className="w-8 h-8 text-indigo-500 stroke-[2.5]" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Visible Memories</p>
            <p className="text-2xl font-extrabold text-slate-800">{filteredMemories.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Community Likes</p>
            <p className="text-2xl font-extrabold text-rose-600">{totalLikes}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Active Authors</p>
            <p className="text-2xl font-extrabold text-emerald-600">{activeAuthors}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Top Category</p>
            <p className="text-xl font-extrabold text-indigo-600 capitalize">{topCategory}</p>
            <p className="text-[11px] font-bold text-slate-400 mt-1">{totalComments} comments</p>
          </div>
        </div>
        
        {/* Mobile FAB */}
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 z-[90] hover:bg-indigo-600 transition-colors hover:scale-105"
        >
          <Camera className="w-6 h-6" />
        </button>

        {/* Controls */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white flex flex-col gap-6 sticky top-4 z-20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input placeholder="Search memories, people, tags…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-10 py-3.5 text-[15px] font-medium rounded-[16px] border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all shadow-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 bg-white rounded-full p-1 shadow-sm border border-slate-100"><X className="w-3.5 h-3.5" /></button>}
            </div>
            
            <div className="flex gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-52 h-[52px] rounded-[16px] border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-[14px] font-bold text-slate-700 shadow-sm transition-colors">
                  <Filter className="w-4 h-4 mr-2 text-indigo-500" /><SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl font-medium">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="achievement">🏆 Achievement</SelectItem>
                  <SelectItem value="friendship">👥 Friendship</SelectItem>
                  <SelectItem value="academic">📚 Academic</SelectItem>
                  <SelectItem value="sports">⚽ Sports</SelectItem>
                  <SelectItem value="event">🎉 Events</SelectItem>
                  <SelectItem value="competition">🏅 Competition</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="hidden sm:flex gap-1.5 bg-slate-50 border border-slate-100 p-1.5 rounded-[16px] shrink-0">
                <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-[12px] transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-400 hover:text-slate-800 hover:bg-white/50'}`}><Grid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-[12px] transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-400 hover:text-slate-800 hover:bg-white/50'}`}><List className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-2 border border-slate-100">
            {TABS.map(t => (
              <button key={t.value} onClick={() => setActiveTab(t.value)} className={`flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === t.value ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Memory Form */}
        {showAddForm && (
          <div className="bg-white rounded-[32px] p-6 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100"><Sparkles className="w-5 h-5 text-indigo-500" /></div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">Share a Memory</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mt-1">Upload and Inspire</p>
                </div>
              </div>
              <button onClick={() => setShowAddForm(false)} className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="img-upload" />
                <label htmlFor="img-upload" className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-slate-200 rounded-[28px] cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all overflow-hidden group relative">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                        <span className="text-white font-bold text-sm bg-slate-900/60 border border-white/20 px-5 py-2.5 rounded-full shadow-lg">Change Photo</span>
                      </div>
                      <button onClick={e => { e.preventDefault(); setImagePreview(null); setImageFile(null); }} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-600 hover:text-rose-600 hover:scale-110 transition-all z-10"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold">Click to upload photo</p>
                      <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mt-1.5">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
              
              <div className="space-y-4">
                <input placeholder="Memory Title *" value={newMemory.title} onChange={e => setNewMemory({ ...newMemory, title: e.target.value })} className={inputCls} />
                <textarea placeholder="Describe this memory in detail…" value={newMemory.description} onChange={e => setNewMemory({ ...newMemory, description: e.target.value })} rows={4} className={`${inputCls} resize-none`} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => { setShowAddForm(false); setImagePreview(null); setImageFile(null); }} className="px-6 py-3.5 text-sm font-black rounded-[16px] bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest text-center">Cancel</button>
                <button onClick={handleAddMemory} disabled={isSharing} className="px-8 py-3.5 bg-indigo-500 text-white text-sm font-black rounded-[16px] hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-60 uppercase tracking-widest text-center">
                  {isSharing ? 'Sharing…' : 'Post Memory'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Memory Grid/List */}
        {filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5"><Search className="w-8 h-8 text-indigo-300" /></div>
            <p className="font-extrabold text-slate-800 text-xl mb-2">No memories found</p>
            <p className="text-[15px] font-medium text-slate-500 mb-6 max-w-sm mx-auto">Try adjusting your search or filter criteria to see more memories from the community.</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="px-6 py-3 text-[12px] font-black rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest shadow-sm">Clear Filters</button>
          </div>
        ) : (
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6 max-w-4xl mx-auto'}`}>
            {filteredMemories.map((memory, i) => React.cloneElement(renderMemoryCard(memory, i) as React.ReactElement, { key: `${memory.id}-${i}` }))}
          </div>
        )}
      </div>

      {/* Memory Detail Modal */}
      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="max-w-[980px] max-h-[92vh] overflow-hidden p-0 bg-white rounded-[32px] border border-slate-100 shadow-2xl flex flex-col md:flex-row">
          <DialogTitle className="sr-only">
            {selectedMemory ? `${selectedMemory.title || 'Memory'} details` : 'Memory details'}
          </DialogTitle>
          {selectedMemory && (
            <>
              {selectedMemory.image ? (
                <div className="w-full md:w-1/2 h-72 md:h-auto bg-slate-100 relative overflow-hidden flex items-center justify-center border-r border-slate-100">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${selectedMemory.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                  <img
                    src={selectedMemory.image}
                    alt={selectedMemory.title}
                    onDoubleClick={() => setExpandedImage(selectedMemory.image)}
                    className="w-full h-full object-contain p-4 relative z-10 drop-shadow-xl transition-transform duration-500 hover:scale-[1.02] cursor-zoom-in"
                    title="Double-click to view full image"
                  />
                  <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/90 text-slate-700 border border-white/40">
                      <Eye className="w-3.5 h-3.5 text-indigo-500" />
                      {selectedMemory.views || 0} views
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/90 text-slate-700 border border-white/40 capitalize">
                      {(selectedMemory.category || 'friendship')}
                    </span>
                  </div>
                  <span className="absolute bottom-4 right-4 z-20 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-slate-900/60 text-white border border-white/20 backdrop-blur-sm">
                    Double-click to expand
                  </span>
                </div>
              ) : (
                <div className="hidden md:flex w-[45%] bg-indigo-50 items-center justify-center border-r border-indigo-100">
                  <Camera className="w-20 h-20 text-indigo-200" />
                </div>
              )}
              
              <div className="w-full flex-1 flex flex-col max-h-[92vh] overflow-y-auto bg-white">
                <div className="p-5 sm:p-6 md:p-8 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10 shrink-0">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[16px] bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-[16px] sm:text-[18px] flex items-center justify-center shrink-0 shadow-sm">{(selectedMemory.author?.name || 'A').charAt(0)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-800 text-[16px] sm:text-[18px] leading-tight break-words">{selectedMemory.author?.name}</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 break-words">{selectedMemory.author?.batch}{selectedMemory.author?.department ? ` · ${selectedMemory.author.department}` : ''}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 shadow-sm">{selectedMemory.category}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">{selectedMemory.type || 'photo'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <div className="flex-grow">
                    <h2 className="text-[30px] md:text-[34px] font-extrabold text-slate-800 tracking-tight leading-[1.1] mb-3 break-words">{selectedMemory.title}</h2>
                    <p className="text-[15px] text-slate-600 leading-relaxed font-medium whitespace-pre-line mb-6">{selectedMemory.description}</p>
                  
                    {Array.isArray(selectedMemory.tags) && selectedMemory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 mb-6">
                        {selectedMemory.tags.map((t: string, i: number) => <span key={i} className="text-[10px] uppercase tracking-[0.1em] font-black px-3 py-1 rounded-[8px] bg-slate-50 border border-slate-100 text-slate-500 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition-colors">#{t}</span>)}
                      </div>
                    )}
                  
                    
                  </div>
                  
                  <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { handleLike(selectedMemory.id); setSelectedMemory({ ...selectedMemory, isLiked: !selectedMemory.isLiked, likes: selectedMemory.isLiked ? selectedMemory.likes - 1 : selectedMemory.likes + 1 }); }} className={`h-12 flex items-center justify-center gap-2.5 text-[12px] font-bold uppercase tracking-widest rounded-[14px] transition-all ${selectedMemory.isLiked ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 shadow-sm shadow-rose-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}>
                        <Heart className={`w-4 h-4 ${selectedMemory.isLiked ? 'fill-current' : ''}`} />
                        <span>{selectedMemory.likes || 0}</span>
                      </button>
                      <button
                        onClick={() => document.getElementById(`comment-input-${selectedMemory.id}`)?.focus()}
                        className="h-12 flex items-center justify-center gap-2.5 text-[12px] font-bold uppercase tracking-widest rounded-[14px] bg-slate-50 text-slate-600 border border-slate-100 shadow-sm hover:bg-slate-100 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-indigo-500" />
                        <span>{comments[selectedMemory.id]?.length || selectedMemory.comments || 0}</span>
                      </button>
                    </div>
                    
                    <div>{renderCommentThread(selectedMemory.id)}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {expandedImage && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition-colors"
            aria-label="Close image preview"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img
              src={expandedImage}
              alt="Expanded memory"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              onDoubleClick={() => setExpandedImage(null)}
            />
          </div>
        </div>
      )}
    </AlumniNavigation>
  );
}