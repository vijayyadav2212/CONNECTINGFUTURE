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
import { Heart, MessageCircle, Share2, Calendar, MapPin, Camera, Plus, Search, Filter, Grid, List, ImageIcon, Video, Users, Trophy, BookOpen } from 'lucide-react';

// Static data for memories
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
    type: "photo"
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
    type: "photo"
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
    type: "photo"
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
    type: "photo"
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
  const [memories, setMemories] = useState(staticMemories);
  const [filteredMemories, setFilteredMemories] = useState(staticMemories);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [showComments, setShowComments] = useState<{[key: number]: boolean}>({});
  const [comments, setComments] = useState<{[key: number]: any[]}>({
    1: [
      { id: 1, author: 'John Doe', text: 'Congratulations! So proud of you! 🎉', time: '2 hours ago' },
      { id: 2, author: 'Jane Smith', text: 'Amazing achievement! 👏', time: '3 hours ago' }
    ],
    2: [
      { id: 1, author: 'Team Member', text: 'Great teamwork everyone! 🚀', time: '1 day ago' }
    ]
  });
  
  const [newMemory, setNewMemory] = useState({
    title: '',
    description: '',
    location: '',
    tags: '',
    category: 'friendship'
  });

  // Filter and search functionality
  useEffect(() => {
    let filtered = memories;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memory => memory.category === selectedCategory);
    }
    
    // Search functionality
    if (searchQuery) {
      filtered = filtered.filter(memory =>
        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        memory.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by tab selection
    if (activeTab === 'popular') {
      filtered = [...filtered].sort((a, b) => b.likes - a.likes);
    } else if (activeTab === 'recent') {
      filtered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    setFilteredMemories(filtered);
  }, [memories, selectedCategory, searchQuery, activeTab]);

  const handleLike = (memoryId: number) => {
    setMemories(memories.map(memory => 
      memory.id === memoryId 
        ? { 
            ...memory, 
            isLiked: !memory.isLiked,
            likes: memory.isLiked ? memory.likes - 1 : memory.likes + 1
          }
        : memory
    ));
  };

  const toggleComments = (memoryId: number) => {
    setShowComments(prev => ({
      ...prev,
      [memoryId]: !prev[memoryId]
    }));
  };

  const handleAddMemory = () => {
    if (newMemory.title && newMemory.description) {
      const memory = {
        id: memories.length + 1,
        author: {
          name: "You",
          avatar: "/placeholder-user.jpg",
          batch: "2020-2024",
          department: "Your Department"
        },
        title: newMemory.title,
        description: newMemory.description,
        image: "/placeholder.jpg",
        date: new Date().toISOString().split('T')[0],
        location: newMemory.location || "Campus",
        tags: newMemory.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        likes: 0,
        comments: 0,
        isLiked: false,
        category: newMemory.category,
        type: 'photo'
      };
      
      setMemories([memory, ...memories]);
      setNewMemory({ title: '', description: '', location: '', tags: '', category: 'friendship' });
      setShowAddForm(false);
    }
  };

  const MemoryCard = ({ memory, isGridView }: { memory: any, isGridView: boolean }) => {
    const CategoryIcon = categoryIcons[memory.category as keyof typeof categoryIcons] || Users;
    
    return (
      <Card 
        className={`overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
          isGridView ? 'h-fit' : 'flex flex-col sm:flex-row'
        } cursor-pointer group relative bg-white border border-slate-200 shadow-md`}
        onClick={() => setSelectedMemory(memory)}
      >
        
        <div className={`${isGridView ? '' : 'w-full sm:w-48 flex-shrink-0'}`}>
          <div className="relative overflow-hidden">
            <img 
              src={memory.image} 
              alt={memory.title}
              className={`${
                isGridView ? 'w-full h-48 sm:h-52 lg:h-48' : 'w-full h-48 sm:h-full'
              } object-cover group-hover:scale-105 transition-transform duration-300`}
            />
            
            {/* Enhanced badges with better visibility */}
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge 
                variant="secondary" 
                className="bg-white/95 backdrop-blur-sm text-xs flex items-center gap-1 shadow-md border-0 font-medium text-slate-700"
              >
                <CategoryIcon className="w-3 h-3" />
                {memory.category}
              </Badge>
              {memory.type === 'video' && (
                <Badge 
                  variant="secondary" 
                  className="bg-red-500 text-white backdrop-blur-sm text-xs flex items-center gap-1 shadow-md border-0 font-medium"
                >
                  <Video className="w-3 h-3" />
                  Video
                </Badge>
              )}
            </div>
            
            {/* Enhanced like button */}
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(memory.id);
                }}
                className={`bg-white/95 backdrop-blur-sm hover:bg-white shadow-md border-0 rounded-full w-9 h-9 p-0 transition-all duration-300 ${
                  memory.isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-slate-600 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${memory.isLiked ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* View count with better visibility */}
            <div className="absolute bottom-3 right-3">
              <div className="bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs flex items-center gap-1 font-medium">
                <span>👁️</span>
                {Math.floor(Math.random() * 500) + 100}
              </div>
            </div>
          </div>
        </div>
        
        <div className={`${isGridView ? 'p-4 sm:p-5' : 'flex-1 p-4 sm:p-5'} relative`}>
          {/* Author section with better contrast */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10 sm:w-11 sm:h-11 ring-2 ring-slate-200 shadow-sm">
                  <AvatarImage src={memory.author.avatar} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs sm:text-sm">
                    {memory.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base hover:text-blue-600 transition-colors duration-200 truncate">
                  {memory.author.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 flex items-center gap-1 font-medium">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  {memory.author.batch}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 font-medium truncate">{memory.author.department}</p>
              </div>
            </div>
            
            {/* Enhanced date display with better visibility */}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-800 bg-slate-200 rounded-full px-2 sm:px-3 py-1 sm:py-2 font-bold shadow-sm">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="hidden sm:inline">{new Date(memory.date).toLocaleDateString()}</span>
                <span className="sm:hidden">{new Date(memory.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Title with enhanced visibility */}
          <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2 sm:mb-3 line-clamp-2 hover:text-blue-600 transition-colors duration-200 leading-tight">
            {memory.title}
          </h4>
          
          {/* Description with enhanced contrast */}
          <p className={`text-slate-800 font-medium leading-relaxed mb-3 sm:mb-4 ${isGridView ? 'line-clamp-3' : 'line-clamp-2'} text-sm sm:text-base`}>
            {memory.description}
          </p>

          {/* Enhanced tags with better visibility */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {memory.tags.slice(0, isGridView ? 2 : 3).map((tag: string, index: number) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs sm:text-sm font-semibold text-slate-800 border-slate-400 bg-slate-50 hover:bg-blue-100 hover:border-blue-500 hover:text-blue-800 transition-all duration-200 cursor-pointer px-2 sm:px-3 py-1"
              >
                #{tag}
              </Badge>
            ))}
            {memory.tags.length > (isGridView ? 2 : 3) && (
              <Badge 
                variant="outline" 
                className="text-xs sm:text-sm font-semibold bg-slate-100 border-slate-400 text-slate-800 hover:bg-slate-200 transition-all duration-200 cursor-pointer px-2 sm:px-3 py-1"
              >
                +{memory.tags.length - (isGridView ? 2 : 3)} more
              </Badge>
            )}
          </div>

          {/* Enhanced interaction bar with better visibility */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-300">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-slate-800 hover:text-red-600 transition-colors duration-200 font-semibold">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{memory.likes}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComments(memory.id);
                }}
                className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-slate-800 hover:text-blue-600 transition-colors duration-200 font-semibold"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{memory.comments}</span>
              </button>
              <button className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-slate-800 hover:text-green-600 transition-colors duration-200 font-semibold">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden lg:inline">Share</span>
              </button>
            </div>
            
            {/* Enhanced location indicator with better visibility */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-800 bg-slate-200 rounded-full px-2 sm:px-3 py-1 sm:py-2 font-bold shadow-sm flex-shrink-0">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              <span className="truncate max-w-20 sm:max-w-none">{memory.location}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <AlumniNavigation>
      {/* Clean background matching your UI */}
      <div className="p-4 lg:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Clean Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 flex items-center gap-3">
                📸 Memories Wall
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                Share and relive your favorite college moments
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Memory
                <Camera className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Clean Search and Filter Bar */}
          <Card className="p-4 bg-white shadow-md border border-slate-200">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Enhanced Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="🔍 Search memories, tags, or names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full hover:bg-slate-100 text-slate-500"
                  >
                    ✕
                  </Button>
                )}
              </div>
              
              {/* Enhanced Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-56 h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="🎯 All Categories" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 shadow-lg">
                  <SelectItem value="all">🌟 All Categories</SelectItem>
                  <SelectItem value="achievement">🏆 Achievement</SelectItem>
                  <SelectItem value="friendship">👥 Friendship</SelectItem>
                  <SelectItem value="academic">📚 Academic</SelectItem>
                  <SelectItem value="sports">⚽ Sports</SelectItem>
                  <SelectItem value="event">🎉 Events</SelectItem>
                  <SelectItem value="competition">🏅 Competition</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Enhanced View Toggle */}
              <div className="flex rounded-lg border border-slate-300 bg-white p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-md transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Grid className="w-4 h-4 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-md transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </Button>
              </div>
            </div>
          </Card>

          {/* Clean Tabs for sorting */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full lg:w-auto grid-cols-2 bg-white border border-slate-200 shadow-sm">
              <TabsTrigger 
                value="recent" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Recent</span>
                <span className="sm:hidden">📅</span>
              </TabsTrigger>
              <TabsTrigger 
                value="popular" 
                className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Popular</span>
                <span className="sm:hidden">❤️</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-slate-600 font-medium">
                  {filteredMemories.length} memories found
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="popular" className="mt-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-slate-600 font-medium">
                  Showing most liked memories ({filteredMemories.length} total)
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Clean Add Memory Form */}
          {showAddForm && (
            <Card className="border border-blue-200 bg-blue-50/50 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3 font-bold text-slate-900">
                  <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                  Share a Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="✨ Memory title..."
                  value={newMemory.title}
                  onChange={(e) => setNewMemory({...newMemory, title: e.target.value})}
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <Textarea
                  placeholder="📝 Tell us about this memory..."
                  value={newMemory.description}
                  onChange={(e) => setNewMemory({...newMemory, description: e.target.value})}
                  rows={4}
                  className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Input
                    placeholder="📍 Location (optional)"
                    value={newMemory.location}
                    onChange={(e) => setNewMemory({...newMemory, location: e.target.value})}
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <Input
                    placeholder="🏷️ Tags (comma separated)"
                    value={newMemory.tags}
                    onChange={(e) => setNewMemory({...newMemory, tags: e.target.value})}
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <Select value={newMemory.category} onValueChange={(value) => setNewMemory({...newMemory, category: value})}>
                    <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 shadow-lg">
                      <SelectItem value="friendship">👥 Friendship</SelectItem>
                      <SelectItem value="achievement">🏆 Achievement</SelectItem>
                      <SelectItem value="academic">📚 Academic</SelectItem>
                      <SelectItem value="sports">⚽ Sports</SelectItem>
                      <SelectItem value="event">🎉 Events</SelectItem>
                      <SelectItem value="competition">🏅 Competition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleAddMemory} 
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Share Memory ✨
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    className="border-slate-300 hover:bg-slate-50 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Memory Feed */}
          {filteredMemories.length === 0 ? (
            <Card className="p-16 text-center bg-white shadow-md border border-slate-200">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">No memories found 🔍</h3>
              <p className="text-slate-600 mb-4">Try adjusting your search or filter criteria</p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                variant="outline"
                className="border-slate-300 hover:bg-slate-50"
              >
                Clear Filters ✨
              </Button>
            </Card>
          ) : (
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6' 
                : 'space-y-4 sm:space-y-6'
            }`}>
              {filteredMemories.map((memory, index) => (
                <div 
                  key={memory.id} 
                  className="animate-in fade-in-50 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MemoryCard memory={memory} isGridView={viewMode === 'grid'} />
                  
                  {/* Enhanced Comments Section */}
                  {showComments[memory.id] && (
                    <Card className="mt-4 ml-4 border-l-4 border-blue-500 bg-blue-50/50 shadow-md animate-in slide-in-from-left-2 duration-300">
                      <CardContent className="p-4">
                        <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-900 text-lg">
                          <MessageCircle className="w-5 h-5 text-blue-600" />
                          <span className="font-extrabold">Comments ({comments[memory.id]?.length || 0})</span>
                        </h4>
                        <div className="space-y-3">
                          {comments[memory.id]?.map((comment: any) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                                  {comment.author.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-white rounded-lg p-4 shadow-md border border-slate-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-base text-slate-900">{comment.author}</span>
                                    <span className="text-sm text-slate-700 bg-slate-200 rounded-full px-3 py-1 font-semibold">{comment.time}</span>
                                  </div>
                                  <p className="text-base text-slate-800 font-medium leading-relaxed">{comment.text}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Enhanced Add Comment */}
                          <div className="flex gap-3 pt-3 border-t border-slate-200">
                            <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs font-semibold">
                                You
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <Input 
                                placeholder="💬 Write a comment..." 
                                className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                              />
                              <Button 
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                Post
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Load More */}
          {filteredMemories.length > 0 && (
            <div className="text-center pt-6">
              <Button 
                variant="outline" 
                className="px-8 py-3 border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                Load More Memories
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Interactive Memory Detail Modal */}
      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 bg-white border-0 shadow-2xl">
          {selectedMemory && (
            <div className="flex flex-col h-full">
              {/* Enhanced Header */}
              <DialogHeader className="p-6 pb-4 border-b border-slate-200 bg-slate-50/50">
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12 ring-2 ring-white shadow-lg">
                        <AvatarImage src={selectedMemory.author.avatar} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                          {selectedMemory.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl text-slate-900">{selectedMemory.author.name}</h3>
                      <p className="text-base text-slate-800 flex items-center gap-2 font-semibold">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        {selectedMemory.author.batch} • {selectedMemory.author.department}
                      </p>
                    </div>
                  </div>
                  
                  {/* Category Badge */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-blue-100 text-blue-800 border-blue-200 font-medium"
                    >
                      {selectedMemory.category}
                    </Badge>
                    {selectedMemory.type === 'video' && (
                      <Badge className="bg-red-500 text-white">
                        <Video className="w-3 h-3 mr-1" />
                        Video
                      </Badge>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              {/* Enhanced Content Area */}
              <div className="flex-1 overflow-auto">
                <div className="grid lg:grid-cols-3 h-full">
                  {/* Image Section - Responsive */}
                  <div className="lg:col-span-2 relative bg-black">
                    <img 
                      src={selectedMemory.image} 
                      alt={selectedMemory.title}
                      className="w-full h-64 lg:h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Image overlay with stats */}
                    <div className="absolute bottom-4 left-4 flex gap-3">
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        {Math.floor(Math.random() * 1000) + 200} views
                      </div>
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm flex items-center gap-2">
                        📅 {new Date(selectedMemory.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                    
                    {/* Navigation arrows for multiple images */}
                    <div className="absolute inset-y-0 left-0 flex items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full w-10 h-10 p-0"
                      >
                        ←
                      </Button>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mr-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full w-10 h-10 p-0"
                      >
                        →
                      </Button>
                    </div>
                  </div>
                  
                  {/* Enhanced Content Panel */}
                  <div className="p-6 bg-slate-50/30 flex flex-col">
                    {/* Title and Description with enhanced visibility */}
                    <div className="flex-1">
                      <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-6 leading-tight">
                        {selectedMemory.title}
                      </h2>
                      
                      <div className="prose prose-slate max-w-none mb-8">
                        <p className="text-slate-800 leading-relaxed text-lg lg:text-xl font-medium">
                          {selectedMemory.description}
                        </p>
                      </div>
                      
                      {/* Enhanced Tags with better visibility */}
                      <div className="flex flex-wrap gap-3 mb-8">
                        {selectedMemory.tags.map((tag: string, index: number) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-base font-bold text-slate-800 border-slate-400 bg-slate-100 hover:bg-blue-100 hover:border-blue-500 hover:text-blue-800 transition-all duration-200 cursor-pointer px-4 py-2"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Location and Date Info with enhanced visibility */}
                      <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-4 text-slate-800">
                          <div className="p-3 bg-blue-200 rounded-xl shadow-sm">
                            <Calendar className="w-6 h-6 text-blue-700" />
                          </div>
                          <div>
                            <p className="font-bold text-base text-slate-900">Date</p>
                            <p className="text-base font-semibold text-slate-800">{new Date(selectedMemory.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-slate-800">
                          <div className="p-3 bg-red-200 rounded-xl shadow-sm">
                            <MapPin className="w-6 h-6 text-red-700" />
                          </div>
                          <div>
                            <p className="font-bold text-base text-slate-900">Location</p>
                            <p className="text-base font-semibold text-slate-800">{selectedMemory.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Interactive Actions */}
                    <div className="border-t border-slate-200 pt-6 mt-auto">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <Button
                          variant={selectedMemory.isLiked ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleLike(selectedMemory.id)}
                          className={`transition-all duration-300 ${
                            selectedMemory.isLiked 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 mr-2 ${selectedMemory.isLiked ? 'fill-current' : ''}`} />
                          {selectedMemory.likes}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleComments(selectedMemory.id)}
                          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-300"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          {comments[selectedMemory.id]?.length || selectedMemory.comments}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all duration-300"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1 text-xs">
                          📥 Save
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 text-xs">
                          🔗 Copy Link
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 text-xs">
                          📋 Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Comments Section in Modal */}
                {showComments[selectedMemory.id] && (
                  <div className="border-t border-slate-200 bg-white">
                    <div className="p-6">
                      <h4 className="font-extrabold text-2xl mb-6 flex items-center gap-4 text-slate-900">
                        <div className="p-3 bg-blue-200 rounded-xl shadow-sm">
                          <MessageCircle className="w-6 h-6 text-blue-700" />
                        </div>
                        Comments ({comments[selectedMemory.id]?.length || 0})
                      </h4>
                      
                      {/* Comments List */}
                      <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                        {comments[selectedMemory.id]?.map((comment: any) => (
                          <div key={comment.id} className="flex gap-3 animate-in fade-in-50 duration-300">
                            <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs font-semibold">
                                {comment.author.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-slate-100 rounded-xl p-5 hover:bg-slate-200 transition-colors duration-200 border border-slate-300">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-bold text-base text-slate-900">{comment.author}</span>
                                  <span className="text-sm text-slate-800 bg-white rounded-full px-3 py-2 shadow-sm font-bold">
                                    {comment.time}
                                  </span>
                                </div>
                                <p className="text-base text-slate-800 leading-relaxed font-medium">{comment.text}</p>
                                
                                {/* Comment Actions with enhanced visibility */}
                                <div className="flex items-center gap-6 mt-4 text-sm text-slate-700 font-semibold">
                                  <button className="hover:text-red-600 transition-colors font-bold">
                                    ❤️ Like
                                  </button>
                                  <button className="hover:text-blue-600 transition-colors font-bold">
                                    💬 Reply
                                  </button>
                                  <button className="hover:text-slate-900 transition-colors font-bold">
                                    📤 Share
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Enhanced Add Comment */}
                      <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs font-semibold">
                            You
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <Textarea 
                            placeholder="💬 Write a thoughtful comment..." 
                            className="min-h-[80px] border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none" 
                            rows={3}
                          />
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-700">
                                😀 Emoji
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-700">
                                📷 Photo
                              </Button>
                            </div>
                            <Button 
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              Post Comment ✨
                            </Button>
                          </div>
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
