"use client";

import React, { useState, useEffect } from 'react';
import AlumniNavigation from '../AluminaNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, Share2, Calendar, MapPin, Camera, Plus, Search, Filter, Grid, List, ImageIcon, Video, Users, Trophy, BookOpen, Upload, X, Eye, Bookmark, TrendingUp, Clock, Sparkles, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/lib/apiClient';

// Static data for memories (fallback only)
const staticMemories = [
  {
    id: 1,
    author: {
      name: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616c6bfb10e?w=150&h=150&fit=crop&crop=face",
      batch: "2018-2022",
      department: "Computer Science"
    },
    title: "Graduation Day 2022",
    description: "What an incredible journey! Four years of hard work, late-night coding sessions, and amazing friendships. This day will forever be etched in my memory. 🎓",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop",
    date: "2022-05-15",
    location: "Main Auditorium",
    tags: ["graduation", "achievement", "friendship"],
    likes: 45,
    comments: 12,
    isLiked: false,
    category: "achievement",
    type: "photo",
    views: 234,
    saved: false
  },
  {
    id: 2,
    author: {
      name: "Mike Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      batch: "2017-2021",
      department: "Electrical Engineering"
    },
    title: "Tech Fest Victory",
    description: "Our team won first place in the annual tech fest! Months of preparation paid off. Shoutout to my amazing teammates! 🏆",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
    date: "2020-03-10",
    location: "Engineering Block",
    tags: ["techfest", "victory", "teamwork"],
    likes: 38,
    comments: 8,
    isLiked: true,
    category: "competition",
    type: "photo",
    views: 189,
    saved: false
  },
  {
    id: 3,
    author: {
      name: "Emily Davis",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      batch: "2019-2023",
      department: "Business Administration"
    },
    title: "First Day Nostalgia",
    description: "Found this old photo from our first day! We were so nervous and excited. Look how far we've all come! 📚",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=400&fit=crop",
    date: "2019-08-01",
    location: "Campus Entrance",
    tags: ["firstday", "nostalgia", "friendship"],
    likes: 52,
    comments: 15,
    isLiked: false,
    category: "friendship",
    type: "photo",
    views: 312,
    saved: true
  },
  {
    id: 4,
    author: {
      name: "David Wilson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      batch: "2016-2020",
      department: "Mechanical Engineering"
    },
    title: "Late Night Lab Sessions",
    description: "3 AM in the robotics lab, working on our final project. These were the moments that defined our college experience! 🤖",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop",
    date: "2020-01-25",
    location: "Robotics Lab",
    tags: ["lab", "project", "dedication"],
    likes: 31,
    comments: 6,
    isLiked: true,
    category: "academic",
    type: "photo",
    views: 145,
    saved: false
  },
  {
    id: 5,
    author: {
      name: "Jessica Rodriguez",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      batch: "2015-2019",
      department: "Arts & Design"
    },
    title: "Annual Cultural Festival",
    description: "The energy, the performances, the crowd - our cultural fest was always the highlight of the year! 🎭✨",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
    date: "2018-11-20",
    location: "Main Stage",
    tags: ["cultural", "performance", "festival"],
    likes: 67,
    comments: 22,
    isLiked: false,
    category: "event",
    type: "video"
  },
  {
    id: 6,
    author: {
      name: "Alex Thompson",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      batch: "2014-2018",
      department: "Sports Management"
    },
    title: "Inter College Championship Win",
    description: "We did it! After months of training, our basketball team brought home the championship trophy! 🏀🏆",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop",
    date: "2017-04-15",
    location: "Sports Complex",
    tags: ["sports", "championship", "teamwork"],
    likes: 89,
    comments: 18,
    isLiked: true,
    category: "sports",
    type: "photo"
  },
  {
    id: 7,
    author: {
      name: "Rachel Kim",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      batch: "2019-2023",
      department: "Psychology"
    },
    title: "Study Group Adventures",
    description: "Late night study sessions in the library turned into lifelong friendships. Coffee, textbooks, and endless laughs! ☕📖",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
    date: "2021-12-10",
    location: "Central Library",
    tags: ["study", "friendship", "library"],
    likes: 34,
    comments: 9,
    isLiked: false,
    category: "academic",
    type: "photo"
  },
  {
    id: 8,
    author: {
      name: "James Parker",
      avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face",
      batch: "2016-2020",
      department: "Environmental Science"
    },
    title: "Campus Green Initiative",
    description: "Planting trees around campus for our sustainability project. Small steps toward a greener future! 🌱🌍",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop",
    date: "2019-04-22",
    location: "Campus Gardens",
    tags: ["environment", "sustainability", "teamwork"],
    likes: 56,
    comments: 14,
    isLiked: true,
    category: "event",
    type: "photo"
  }
];

const categoryIcons = {
  achievement: Trophy,
  competition: Trophy,
  friendship: Users,
  academic: BookOpen,
  event: Calendar,
  sports: Trophy
};

export default function MemoriesPage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [showComments, setShowComments] = useState<{[key: number]: boolean}>({});
  const [newComment, setNewComment] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<{[key: number]: any[]}>({
    1: [
      { id: 1, author: 'John Doe', text: 'Congratulations! So proud of you! 🎉', time: '2 hours ago', likes: 5 },
      { id: 2, author: 'Jane Smith', text: 'Amazing achievement! 👏', time: '3 hours ago', likes: 3 }
    ],
    2: [
      { id: 1, author: 'Team Member', text: 'Great teamwork everyone! 🚀', time: '1 day ago', likes: 8 }
    ]
  });

  // Normalize a memory returned from backend to the UI shape used here
  const normalizeMemory = (m: any) => {
    if (!m) return m;
    if (m.author && m.author.name) return m; // already in UI shape
    return {
      id: m.id,
      author: {
        name: m.author_name || 'Alumni',
        avatar: m.author_avatar || '',
        batch: m.author_batch || '',
        department: m.author_department || ''
      },
      title: m.title,
      description: m.description,
      image: m.image || m.image_url || '',
      date: m.date || m.created_at || new Date().toISOString().split('T')[0],
      location: m.location || '',
      tags: Array.isArray(m.tags)
        ? m.tags
        : (typeof m.tags === 'string' && m.tags.length
            ? m.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
            : []),
      likes: m.likes ?? 0,
      comments: m.comments ?? m.comments_count ?? 0,
      isLiked: m.isLiked ?? m.is_liked ?? false,
      category: m.category || 'friendship',
      type: m.type || 'photo',
      views: m.views ?? 0,
      shareCount: m.share_count ?? 0,
      saved: m.saved ?? false,
    };
  };
  
  const [newMemory, setNewMemory] = useState({
    title: '',
    description: '',
    location: '',
    tags: '',
    category: 'friendship'
  });

  // Fetch memories from backend when filters change
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const q = encodeURIComponent(searchQuery || '');
        const cat = selectedCategory || 'all';
        const sort = activeTab; // recent | trending | popular
        const resp = await apiClient.get(`/memories?q=${q}&category=${cat}&sort=${sort}&page=1&limit=50`);
        const rawList = resp?.memories || resp || [];
        const list = rawList.map((m: any) => normalizeMemory(m));
        setMemories(list);
        setFilteredMemories(list);
      } catch (e) {
        // Fallback to static if backend not ready
        setMemories(staticMemories);
        setFilteredMemories(staticMemories);
      }
    };
    fetchMemories();
    // Subscribe to real-time updates via SSE
    try {
      const streamUrl = (apiClient as any).baseURL.replace(/\/+$/, '') + '/memories/stream';
      const es = new EventSource(streamUrl);
      es.addEventListener('memory-like', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          const id = data.id;
          setMemories(prev => prev.map(m => m.id === id ? { ...m, likes: data.likes ?? m.likes, isLiked: data.is_liked ?? m.isLiked } : m));
        } catch {}
      });
      es.addEventListener('memory-view', (e: any) => {
        try { const d = JSON.parse(e.data); const id = d.id; setMemories(prev => prev.map(m => m.id === id ? { ...m, views: d.views ?? m.views } : m)); } catch {}
      });
      es.addEventListener('memory-comment', (e: any) => {
        try {
          const d = JSON.parse(e.data);
          const id = d.id;
          const c = d.comment;
          const mapped = { id: c.id, author: c.author_name || 'Alumni', text: c.text, time: c.created_at ? new Date(c.created_at).toLocaleString() : 'Just now', likes: c.likes || 0 };
          setComments(prev => ({ ...prev, [id]: [...(prev[id] || []), mapped] }));
          setMemories(prev => prev.map(m => m.id === id ? { ...m, comments: (m.comments || 0) + 1 } : m));
        } catch {}
      });
      es.addEventListener('memory-create', (e: any) => {
        try { const d = JSON.parse(e.data); const nm = normalizeMemory(d); setMemories(prev => [nm, ...prev]); setFilteredMemories(prev => [nm, ...prev]); } catch {}
      });
      es.addEventListener('memory-share', (e: any) => {
        try { const d = JSON.parse(e.data); const id = d.id; setMemories(prev => prev.map(m => m.id === id ? { ...m, shareCount: d.share_count ?? m.shareCount } : m)); } catch {}
      });
    } catch {}
  }, [selectedCategory, searchQuery, activeTab]);

  const handleLike = async (memoryId: number) => {
    try {
      const m = memories.find(m => m.id === memoryId);
      const action = m?.isLiked ? 'unlike' : 'like';
      setPendingLikeIds(prev => new Set(prev).add(memoryId));
      const resp = await apiClient.post(`/memories/${memoryId}/like`, { action });
      setMemories(memories.map(memory => 
        memory.id === memoryId 
          ? { ...memory, isLiked: resp?.is_liked ?? !m?.isLiked, likes: resp?.likes ?? (m?.isLiked ? (m.likes - 1) : (m.likes + 1)) }
          : memory
      ));
    } catch {}
    finally {
      setPendingLikeIds(prev => { const next = new Set(prev); next.delete(memoryId); return next; });
    }
  };

  const toggleComments = async (memoryId: number) => {
    const open = !showComments[memoryId];
    setShowComments(prev => ({ ...prev, [memoryId]: open }));
    if (open) {
      try {
        const resp = await apiClient.get(`/memories/${memoryId}/comments`);
        const mapped = (resp?.comments || []).map((c: any) => ({
          id: c.id,
          author: c.author_name || 'Alumni',
          text: c.text,
          time: c.created_at ? new Date(c.created_at).toLocaleString() : 'Just now',
          likes: c.likes || 0,
        }));
        setComments(prev => ({ ...prev, [memoryId]: mapped }));
      } catch {}
    }
  };

  const handleAddComment = async (memoryId: number) => {
    if (newComment.trim()) {
      try {
        const resp = await apiClient.post(`/memories/${memoryId}/comments`, { author_name: 'You', text: newComment });
        setComments({
          ...comments,
          [memoryId]: [...(comments[memoryId] || []), { id: resp?.id, author: resp?.author_name || 'You', text: resp?.text || newComment, time: 'Just now', likes: resp?.likes || 0 }]
        });
        setMemories(memories.map(m => 
          m.id === memoryId ? { ...m, comments: (m.comments || m.comments_count || 0) + 1 } : m
        ));
        setNewComment('');
      } catch {}
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      setImageFile(file);
      reader.readAsDataURL(file);
    }
  };

  const handleAddMemory = async () => {
    if (newMemory.title && newMemory.description) {
      try {
        let image_url: string | null = null;
        if (imageFile) {
          const fd = new FormData();
          fd.append('image', imageFile);
          const up = await apiClient.postFormData('/uploads/memory-image', fd);
          image_url = up?.url || null;
        }
        const payload = {
          author_name: 'You',
          author_avatar: null,
          author_batch: '2020-2024',
          author_department: 'Your Department',
          title: newMemory.title,
          description: newMemory.description,
          image_url,
          date: new Date().toISOString().split('T')[0],
          location: newMemory.location || 'Campus',
          tags: newMemory.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          category: newMemory.category,
          type: 'photo'
        };
        await apiClient.post('/memories', payload);
        setNewMemory({ title: '', description: '', location: '', tags: '', category: 'friendship' });
        setImagePreview(null);
        setImageFile(null);
        setShowAddForm(false);
        // Refresh list
        const resp = await apiClient.get(`/memories?q=&category=all&sort=recent&page=1&limit=50`);
        const rawList = resp?.memories || resp || [];
        const list = rawList.map((m: any) => normalizeMemory(m));
        setMemories(list);
        setFilteredMemories(list);
      } catch {}
    }
  };

  const MemoryCard = ({ memory, isGridView }: { memory: any, isGridView: boolean }) => {
    const CategoryIcon = categoryIcons[memory.category as keyof typeof categoryIcons] || Users;
    const author = memory.author || { name: 'Alumni', avatar: '', batch: '', department: '' };
    
    return (
      <Card 
        className={`group overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
          isGridView ? 'h-full' : 'flex flex-col sm:flex-row'
        } cursor-pointer relative bg-white border-0 shadow-lg hover:shadow-2xl`}
        onClick={async () => {
          setSelectedMemory(memory);
          try {
            const v = await apiClient.post(`/memories/${memory.id}/view`, {});
            setMemories(memories.map(m => m.id === memory.id ? { ...m, views: v?.views ?? (m.views || 0) + 1 } : m));
          } catch {}
        }}
        onMouseEnter={() => setHoveredCard(memory.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
        
        <div className={`${isGridView ? '' : 'w-full sm:w-56 flex-shrink-0'} relative`}>
          <div className="relative overflow-hidden">
            <img 
              src={memory.image} 
              alt={memory.title}
              className={`${
                isGridView ? 'w-full h-56 sm:h-64' : 'w-full h-48 sm:h-full'
              } object-cover group-hover:scale-110 transition-transform duration-700`}
            />
            
            {/* Modern Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Category Badge - Floating */}
            <div className="absolute top-3 left-3 z-20">
              <Badge 
                className="bg-white/95 backdrop-blur-sm text-gray-800 hover:bg-white transition-all shadow-lg border-0 px-3 py-1.5"
              >
                <CategoryIcon className="w-3.5 h-3.5 mr-1.5" />
                {memory.category}
              </Badge>
            </div>
            {/* Media Type Indicator */}
            {memory.type === 'video' && (
              <div className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 shadow-xl animate-pulse z-20">
                <Video className="w-4 h-4" />
              </div>
            )}
            
            {/* Engagement Stats on Image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(memory.id); }}
                  className="flex items-center gap-1.5 text-white text-sm font-semibold bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-full hover:bg-black/50 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${memory.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  {memory.likes}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleComments(memory.id); }}
                  className="flex items-center gap-1.5 text-white text-sm font-semibold bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-full hover:bg-black/50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {memory.comments}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
                  <Eye className="w-3.5 h-3.5" />
                  {memory.views || 0}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); apiClient.post(`/memories/${memory.id}/share`, {}).catch(()=>{}); }}
                  className="flex items-center gap-1.5 text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-full hover:bg-black/50 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {memory.shareCount || 0}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`${isGridView ? 'p-5' : 'flex-1 p-5'} relative z-20`}>
          {/* Author section with better contrast */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-11 h-11 ring-2 ring-blue-500/20 shadow-md">
                  <AvatarImage src={author.avatar || undefined} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-sm">
                    {(author.name || 'A').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors duration-200 truncate">
                  {author.name}
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  {author.batch} • {author.department}
                </p>
              </div>
            </div>
            
            {/* Date with Modern Design */}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-2.5 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                {new Date(memory.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Memory Content */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
              {memory.title}
            </h3>
            <p className={`text-gray-700 leading-relaxed ${isGridView ? 'line-clamp-3' : 'line-clamp-2'} text-sm`}>
              {memory.description}
            </p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {(Array.isArray(memory.tags) ? memory.tags.slice(0, 3) : []).map((tag: string, idx: number) => (
                <Badge 
                  key={idx} 
                  variant="secondary"
                  className="text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all cursor-pointer"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span className="font-medium">{memory.location}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(memory.id);
              }}
              className={`flex-1 transition-all duration-300 ${
                memory.isLiked 
                  ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
              } ${pendingLikeIds.has(memory.id) ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <Heart className={`w-4 h-4 mr-1.5 ${memory.isLiked ? 'fill-current' : ''}`} />
              Like
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleComments(memory.id);
              }}
              className="flex-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Comment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-300"
              onClick={(e) => { e.stopPropagation(); apiClient.post(`/memories/${memory.id}/share`, {}).catch(()=>{}); }}
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              Share {memory.shareCount ? `(${memory.shareCount})` : ''}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <AlumniNavigation>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Hero Header with Stats */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 lg:p-12 shadow-2xl">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-bold text-white flex items-center gap-3">
                        Memories Wall
                        <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
                      </h1>
                    </div>
                    <p className="text-white/90 text-lg max-w-2xl font-medium">
                      Relive, share, and celebrate the moments that defined your journey. Every memory tells a story. 📸✨
                    </p>
                  </div>
                  
                  {/* Stats Cards */}
                  <div className="flex gap-4">
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-xl">
                      <div className="text-3xl font-bold text-white">{memories.length}</div>
                      <div className="text-white/80 text-sm font-medium">Total Memories</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-xl">
                      <div className="text-3xl font-bold text-white">{memories.reduce((sum, m) => sum + m.likes, 0)}</div>
                      <div className="text-white/80 text-sm font-medium">Total Likes</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <Card className="p-5 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search memories, people, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-500"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full lg:w-56 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white text-gray-900">
                    <Filter className="w-4 h-4 mr-2 text-gray-600" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-2xl">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="achievement">🏆 Achievement</SelectItem>
                    <SelectItem value="friendship">👥 Friendship</SelectItem>
                    <SelectItem value="academic">📚 Academic</SelectItem>
                    <SelectItem value="sports">⚽ Sports</SelectItem>
                    <SelectItem value="event">🎉 Events</SelectItem>
                    <SelectItem value="competition">🏅 Competition</SelectItem>
                  </SelectContent>
                </Select>
              
                {/* View Mode Toggle */}
                <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Add Memory Button */}
                <Button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6 rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Share Memory
                </Button>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5">
                <TabsList className="bg-gray-100 p-1.5 rounded-xl w-full lg:w-auto">
                  <TabsTrigger value="recent" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-700 font-medium">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-700 font-medium">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-700 font-medium">
                    <Eye className="w-4 h-4 mr-2" />
                    Popular
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </Card>

            {/* Add Memory Form */}
            {showAddForm && (
              <Card className="p-6 bg-white border-0 shadow-xl animate-in slide-in-from-top-4 duration-500">
                <CardHeader className="px-0 pt-0 pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    Create a New Memory
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-5">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Photo</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all"
                      >
                        {imagePreview ? (
                          <div className="relative w-full h-full">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setImagePreview(null);
                              }}
                              className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-lg rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 font-medium">Click to upload image</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <Input
                    placeholder="Memory Title"
                    value={newMemory.title}
                    onChange={(e) => setNewMemory({...newMemory, title: e.target.value})}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                  <Textarea
                    placeholder="Describe this wonderful memory..."
                    value={newMemory.description}
                    onChange={(e) => setNewMemory({...newMemory, description: e.target.value})}
                    rows={4}
                    className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none rounded-xl"
                  />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Input
                      placeholder="Location"
                      value={newMemory.location}
                      onChange={(e) => setNewMemory({...newMemory, location: e.target.value})}
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                    />
                    <Input
                      placeholder="Tags (comma separated)"
                      value={newMemory.tags}
                      onChange={(e) => setNewMemory({...newMemory, tags: e.target.value})}
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                    />
                    <Select value={newMemory.category} onValueChange={(value) => setNewMemory({...newMemory, category: value})}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendship">👥 Friendship</SelectItem>
                        <SelectItem value="achievement">🏆 Achievement</SelectItem>
                        <SelectItem value="academic">📚 Academic</SelectItem>
                        <SelectItem value="sports">⚽ Sports</SelectItem>
                        <SelectItem value="event">🎉 Event</SelectItem>
                        <SelectItem value="competition">🏅 Competition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={handleAddMemory} 
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 rounded-xl"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Share Memory
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false);
                        setImagePreview(null);
                      }}
                      className="h-12 border-gray-300 hover:bg-gray-50 transition-all duration-200 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Memories Feed */}
            {filteredMemories.length === 0 ? (
              <Card className="p-16 text-center bg-white border-0 shadow-xl">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No memories found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 rounded-xl"
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-6'
              }`}>
                {filteredMemories.map((memory, index) => (
                  <div 
                    key={memory.id} 
                    className="animate-in fade-in-50 duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                  <MemoryCard memory={memory} isGridView={viewMode === 'grid'} />
                    
                    {/* Comments Section */}
                    {showComments[memory.id] && (
                      <Card className="mt-4 ml-0 lg:ml-4 border-l-4 border-blue-500 bg-gradient-to-br from-blue-50/50 to-purple-50/30 shadow-xl animate-in slide-in-from-left-2 duration-300">
                        <CardContent className="p-5">
                          <h4 className="font-bold mb-5 flex items-center gap-3 text-gray-900 text-lg">
                            <div className="p-2 bg-blue-500 rounded-xl">
                              <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            Comments ({comments[memory.id]?.length || 0})
                          </h4>
                          <div className="space-y-4 mb-5 max-h-96 overflow-y-auto pr-2">
                            {comments[memory.id]?.map((comment: any) => (
                              <div key={comment.id} className="flex gap-3 animate-in fade-in-50">
                                <Avatar className="w-10 h-10 ring-2 ring-white shadow-md flex-shrink-0">
                                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs font-bold">
                                    {comment.author.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-bold text-sm text-gray-900">{comment.author}</span>
                                      <span className="text-xs text-gray-500 font-medium">{comment.time}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs">
                                      <button className="text-gray-600 hover:text-red-600 transition-colors font-semibold flex items-center gap-1">
                                        <Heart className="w-3.5 h-3.5" />
                                        {comment.likes > 0 && comment.likes}
                                      </button>
                                      <button className="text-gray-600 hover:text-blue-600 transition-colors font-semibold">
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Add Comment */}
                          <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <Avatar className="w-10 h-10 ring-2 ring-white shadow-md flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs font-bold">
                                You
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <Input 
                                placeholder="Write a comment..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(memory.id);
                                  }
                                }}
                                className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                              />
                              <Button 
                                size="sm"
                                onClick={() => handleAddComment(memory.id)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-5"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {filteredMemories.length > 0 && (
              <div className="text-center pt-6">
                <Button 
                  variant="outline" 
                  className="px-8 py-6 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold rounded-xl"
                >
                  Load More Memories
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Memory Detail Modal */}
      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 bg-white border-0 shadow-2xl rounded-3xl">
          {selectedMemory && (
            <div className="flex flex-col h-full max-h-[95vh]">
              {/* Header */}
              <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 ring-4 ring-white shadow-xl">
                      <AvatarImage src={selectedMemory.author.avatar} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg">
                        {selectedMemory.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">{selectedMemory.author.name}</h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {selectedMemory.author.batch} • {selectedMemory.author.department}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-4 py-2">
                      {selectedMemory.category}
                    </Badge>
                    {selectedMemory.type === 'video' && (
                      <Badge className="bg-red-500 text-white border-0">
                        <Video className="w-3 h-3 mr-1" />
                        Video
                      </Badge>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              {/* Content */}
              <div className="flex-1 overflow-auto">
                <div className="grid lg:grid-cols-2 gap-6 p-6">
                  {/* Image */}
                  <div className="relative bg-black rounded-2xl overflow-hidden">
                    <img 
                      src={selectedMemory.image} 
                      alt={selectedMemory.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex gap-2">
                        <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 text-white text-sm flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          {selectedMemory.views || 0} views
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">{selectedMemory.title}</h2>
                      <p className="text-gray-700 leading-relaxed text-lg">{selectedMemory.description}</p>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.tags.map((tag: string, idx: number) => (
                        <Badge 
                          key={idx} 
                          className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 px-4 py-2 text-sm font-semibold hover:from-blue-200 hover:to-purple-200 transition-all cursor-pointer"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-blue-600">Date</p>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(selectedMemory.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 border border-red-200">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                            <MapPin className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-red-600">Location</p>
                            <p className="text-sm font-bold text-gray-900">{selectedMemory.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant={selectedMemory.isLiked ? "default" : "outline"}
                          onClick={() => handleLike(selectedMemory.id)}
                          className={`transition-all duration-300 h-12 rounded-xl ${
                            selectedMemory.isLiked 
                              ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white' 
                              : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                          }`}
                        >
                          <Heart className={`w-5 h-5 mr-2 ${selectedMemory.isLiked ? 'fill-current' : ''}`} />
                          {selectedMemory.likes}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => toggleComments(selectedMemory.id)}
                          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-300 h-12 rounded-xl"
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          {comments[selectedMemory.id]?.length || selectedMemory.comments}
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all duration-300 h-12 rounded-xl"
                        >
                          <Share2 className="w-5 h-5 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Comments in Modal */}
                {showComments[selectedMemory.id] && (
                  <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
                    <h4 className="font-bold text-2xl mb-6 flex items-center gap-3 text-gray-900">
                      <div className="p-2 bg-blue-500 rounded-xl">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      Comments ({comments[selectedMemory.id]?.length || 0})
                    </h4>
                    
                    <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-2">
                      {comments[selectedMemory.id]?.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3 animate-in fade-in-50">
                          <Avatar className="w-11 h-11 ring-2 ring-white shadow-md flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-sm font-bold">
                              {comment.author.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-gray-900">{comment.author}</span>
                                <span className="text-sm text-gray-500 font-medium">{comment.time}</span>
                              </div>
                              <p className="text-gray-700 leading-relaxed">{comment.text}</p>
                              <div className="flex items-center gap-4 mt-3 text-sm">
                                <button className="text-gray-600 hover:text-red-600 transition-colors font-semibold flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  {comment.likes > 0 && comment.likes}
                                </button>
                                <button className="text-gray-600 hover:text-blue-600 transition-colors font-semibold">
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add Comment */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Avatar className="w-11 h-11 ring-2 ring-white shadow-md flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white font-bold">
                          You
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <Textarea 
                          placeholder="Write a thoughtful comment..." 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[80px] border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none rounded-xl" 
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => handleAddComment(selectedMemory.id)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AlumniNavigation>
  );
}
