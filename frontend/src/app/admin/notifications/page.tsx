"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import {
  Bell, BellRing, BellOff, Check, CheckCheck, Trash2,
  Filter, Search, Send, X, AlertCircle, Info,
  CheckCircle, XCircle, Users, Briefcase, Calendar,
  Clock, ChevronDown, Mail, MessageSquare, Settings,
  ArrowUpRight, TrendingUp
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  category: 'approval' | 'system' | 'user' | 'job' | 'event' | 'message';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  action?: { label: string; link: string };
  sender?: { name: string; avatar: string };
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const typeIcon = (type: Notification['type']) => ({
  info:    <Info className="w-4 h-4" />,
  success: <CheckCircle className="w-4 h-4" />,
  warning: <AlertCircle className="w-4 h-4" />,
  error:   <XCircle className="w-4 h-4" />,
  alert:   <BellRing className="w-4 h-4" />,
}[type]);

const typeColor = (type: Notification['type']) => ({
  info:    { bg: 'bg-teal-100',   text: 'text-teal-700'   },
  success: { bg: 'bg-teal-100',   text: 'text-red-700'   },
  warning: { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  error:   { bg: 'bg-red-100',    text: 'text-red-700'    },
  alert:   { bg: 'bg-teal-100', text: 'text-teal-700' },
}[type]);

const catIcon = (cat: Notification['category']) => ({
  approval: <CheckCircle className="w-3.5 h-3.5" />,
  system:   <Settings className="w-3.5 h-3.5" />,
  user:     <Users className="w-3.5 h-3.5" />,
  job:      <Briefcase className="w-3.5 h-3.5" />,
  event:    <Calendar className="w-3.5 h-3.5" />,
  message:  <MessageSquare className="w-3.5 h-3.5" />,
}[cat]);

const priorityStyle = (p: Notification['priority']) => ({
  high:   'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low:    'bg-[#f6f3eb] text-teal-800 border-teal-900/10',
}[p]);

const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-teal-900/10 bg-white text-teal-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400";

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED: Notification[] = [
  { id:1, type:'warning', category:'approval', title:'Pending Alumni Approval',     message:'John Doe has registered as an alumni and is waiting for approval.',                      timestamp:'2 minutes ago',  read:false, priority:'high',   action:{ label:'Review Now', link:'/admin/approvals/alumni' }, sender:{ name:'John Doe',    avatar:'JD' } },
  { id:2, type:'success', category:'user',     title:'New User Registration',       message:'Jane Smith has successfully registered as a student.',                                    timestamp:'15 minutes ago', read:false, priority:'medium',                                                               sender:{ name:'Jane Smith',  avatar:'JS' } },
  { id:3, type:'info',    category:'job',      title:'New Job Posting',             message:'A new job posting for "Senior Software Engineer" has been submitted.',                    timestamp:'1 hour ago',     read:true,  priority:'medium', action:{ label:'View Job',   link:'/admin/jobs'            } },
  { id:4, type:'alert',   category:'event',    title:'Event Starting Soon',         message:'Tech Talk: AI in Industry starts in 2 hours.',                                            timestamp:'2 hours ago',    read:false, priority:'high',   action:{ label:'View Event', link:'/admin/events'          } },
  { id:5, type:'error',   category:'system',   title:'System Alert',               message:'Database backup failed. Immediate attention required.',                                    timestamp:'3 hours ago',    read:false, priority:'high'   },
  { id:6, type:'success', category:'approval', title:'Job Posting Approved',        message:'The job posting "Full Stack Developer" has been approved and published.',                 timestamp:'5 hours ago',    read:true,  priority:'low'    },
  { id:7, type:'info',    category:'message',  title:'New Message',                message:'You have received a new message from Amit Patel.',                                        timestamp:'1 day ago',      read:true,  priority:'low',                                                                 sender:{ name:'Amit Patel',  avatar:'AP' } },
  { id:8, type:'warning', category:'user',     title:'Suspicious Activity Detected',message:'Multiple failed login attempts detected from IP 192.168.1.100.',                        timestamp:'2 days ago',     read:true,  priority:'high'   },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [notifications, setNotifications]         = useState<Notification[]>(SEED);
  const [selectedFilter, setSelectedFilter]       = useState<'all'|'unread'|'read'>('all');
  const [selectedCategory, setSelectedCategory]   = useState('all');
  const [searchQuery, setSearchQuery]             = useState('');
  const [selectedIds, setSelectedIds]             = useState<number[]>([]);
  const [showModal, setShowModal]                 = useState(false);
  const [showCatMenu, setShowCatMenu]             = useState(false);
  const [activeId, setActiveId]                   = useState<number|null>(null);
  const [mobileOpen, setMobileOpen]               = useState(false);
  const [showSuccess, setShowSuccess]             = useState(false);
  const [isSending, setIsSending]                 = useState(false);
  const catMenuRef = useRef<HTMLDivElement|null>(null);

  const [form, setForm] = useState({ type:'info' as Notification['type'], category:'system' as Notification['category'], priority:'medium' as Notification['priority'], title:'', message:'', recipients:'all' });
  const [formErrors, setFormErrors] = useState<Record<string,string>>({});

  // close category dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) setShowCatMenu(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  // stats
  const unreadCount = notifications.filter(n => !n.read).length;
  const todayCount  = notifications.filter(n => n.timestamp.includes('minutes') || n.timestamp.includes('hour')).length;
  const weekCount   = notifications.filter(n => !n.timestamp.includes('month')).length;

  // filter
  const filtered = useMemo(() => notifications.filter(n => {
    const fOk = selectedFilter === 'all' ? true : selectedFilter === 'unread' ? !n.read : n.read;
    const cOk = selectedCategory === 'all' || n.category === selectedCategory;
    const q   = searchQuery.toLowerCase();
    const sOk = !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    return fOk && cOk && sOk;
  }), [notifications, selectedFilter, selectedCategory, searchQuery]);

  const unread = filtered.filter(n => !n.read);
  const read   = filtered.filter(n =>  n.read);

  const activeNotif = useMemo(() => notifications.find(n => n.id === activeId) ?? null, [notifications, activeId]);

  useEffect(() => {
    if (activeId != null) return;
    if (filtered.length > 0) setActiveId(filtered[0].id);
  }, [activeId, filtered]);

  // actions
  const markRead   = (id: number) => setNotifications(ns => ns.map(n => n.id === id ? {...n, read:true}  : n));
  const markUnread = (id: number) => setNotifications(ns => ns.map(n => n.id === id ? {...n, read:false} : n));
  const del        = (id: number) => {
    if (activeId === id) { const i = notifications.findIndex(n => n.id === id); setActiveId(notifications[i+1]?.id ?? notifications[i-1]?.id ?? null); }
    setNotifications(ns => ns.filter(n => n.id !== id));
    setSelectedIds(s => s.filter(x => x !== id));
  };
  const markAllRead = () => { setNotifications(ns => ns.map(n => ({...n, read:true}))); setSelectedIds([]); };

  const bulk = (action: 'read'|'unread'|'delete') => {
    if (action === 'delete') {
      const rem = notifications.filter(n => !selectedIds.includes(n.id));
      setNotifications(rem);
      if (activeId != null && selectedIds.includes(activeId)) setActiveId(rem[0]?.id ?? null);
    } else setNotifications(ns => ns.map(n => selectedIds.includes(n.id) ? {...n, read: action==='read'} : n));
    setSelectedIds([]);
  };

  const toggleAll = () => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(n => n.id));
  const toggleOne = (id: number) => setSelectedIds(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);

  const validateForm = () => {
    const e: Record<string,string> = {};
    if (!form.title.trim() || form.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    if (!form.message.trim() || form.message.trim().length < 10) e.message = 'Message must be at least 10 characters';
    setFormErrors(e); return Object.keys(e).length === 0;
  };

  const handleSend = () => {
    if (!validateForm()) return;
    setIsSending(true);
    setTimeout(() => {
      const n: Notification = { id: Date.now(), type: form.type, category: form.category, priority: form.priority, title: form.title, message: form.message, timestamp: 'Just now', read: false, sender: { name:'Admin User', avatar:'AD' } };
      setNotifications(prev => [n, ...prev]);
      setIsSending(false); setShowModal(false); setShowSuccess(true);
      setForm({ type:'info', category:'system', priority:'medium', title:'', message:'', recipients:'all' }); setFormErrors({});
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const formChange = (field: string, value: string) => {
    setForm(f => ({...f, [field]: value}));
    if (formErrors[field]) setFormErrors(prev => { const e = {...prev}; delete e[field]; return e; });
  };

  // ─── row component ────────────────────────────────────────────────────────
  const NotifRow = ({ n }: { n: Notification }) => {
    const c = typeColor(n.type);
    const isActive = activeId === n.id;
    return (
      <div role="button" tabIndex={0} onClick={() => { setActiveId(n.id); setMobileOpen(true); }} onKeyDown={e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); setActiveId(n.id); setMobileOpen(true); }}}
        className={`px-4 py-3.5 flex items-start gap-3 cursor-pointer transition-colors border-l-2 ${isActive ? 'bg-teal-950/10 border-red-500' : 'hover:bg-[#f6f3eb] border-transparent'}`}>
        <input type="checkbox" checked={selectedIds.includes(n.id)} onChange={e => { e.stopPropagation(); toggleOne(n.id); }} className="mt-0.5 w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-400" />
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${c.bg} ${c.text}`}>{typeIcon(n.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
            <p className={`text-xs font-bold truncate ${n.read ? 'text-teal-800' : 'text-teal-950'}`}>{n.title}</p>
          </div>
          <p className="text-[11px] text-teal-700 line-clamp-2">{n.message}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${priorityStyle(n.priority)}`}>{n.priority}</span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[#f6f3eb] text-teal-700 text-[10px] font-semibold rounded-full capitalize">{catIcon(n.category)}{n.category}</span>
            <span className="text-[10px] text-teal-600 ml-auto">{n.timestamp}</span>
          </div>
        </div>
      </div>
    );
  };

  // ─── detail panel ─────────────────────────────────────────────────────────
  const DetailPanel = ({ n, onClose }: { n: Notification; onClose?:()=>void }) => {
    const c = typeColor(n.type);
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-4 border-b border-teal-900/10 flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.bg} ${c.text}`}>{typeIcon(n.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-black text-teal-950">{n.title}</p>
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${priorityStyle(n.priority)}`}>{n.priority}</span>
              {!n.read && <span className="px-1.5 py-0.5 bg-teal-950/10 text-red-700 border border-teal-200 text-[10px] font-bold rounded-full">Unread</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-teal-700">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{n.timestamp}</span>
              {n.sender && <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">{n.sender.avatar}</span>{n.sender.name}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!n.read
              ? <button onClick={() => markRead(n.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-700 bg-teal-950/10 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"><Check className="w-3 h-3" />Mark read</button>
              : <button onClick={() => markUnread(n.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"><Mail className="w-3 h-3" />Unread</button>}
            <button onClick={() => { del(n.id); onClose?.(); }} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"><Trash2 className="w-3 h-3" />Delete</button>
          </div>
        </div>
        <div className="p-5 flex-1 overflow-auto">
          <div className="bg-[#f6f3eb] border border-teal-900/10 rounded-2xl p-4"><p className="text-sm text-teal-900 leading-relaxed">{n.message}</p></div>
          {n.action && (
            <div className="mt-4 flex justify-end">
              <Link href={n.action.link} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors shadow-sm">
                {n.action.label}<ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  const hasFilters = selectedFilter !== 'all' || selectedCategory !== 'all' || !!searchQuery;

  return (
    <>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-teal-950/10 rounded-[20px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-teal-900/10 gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-red-500 font-semibold mb-2">
              <Bell className="w-[18px] h-[18px]" />
              <span className="text-sm tracking-wide">Admin Actions</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-950 tracking-tight mb-2">Notifications</h1>
            <p className="text-teal-800 text-[15px] sm:text-base">Manage and monitor all system notifications</p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label:'Unread', value: unreadCount,         bg:'bg-white/60 border-teal-950/100 shadow-sm', txt:'text-teal-950'   },
              { label:'Today',  value: todayCount,           bg:'bg-white/60 border-teal-950/100 shadow-sm', txt:'text-amber-700'  },
              { label:'Week',   value: weekCount,            bg:'bg-white/60 border-teal-950/100 shadow-sm', txt:'text-teal-700'   },
              { label:'Total',  value: notifications.length, bg:'bg-white/60 border-teal-950/100 shadow-sm', txt:'text-teal-900'   },
            ].map(s => (
              <div key={s.label} className={`px-5 py-3 rounded-2xl border ${s.bg} text-center min-w-[70px] hidden sm:block`}>
                <p className={`text-2xl font-black ${s.txt}`}>{s.value}</p>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${s.txt} opacity-70 mt-0.5`}>{s.label}</p>
              </div>
            ))}
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors shadow-sm">
              <Send className="w-4 h-4" />Send
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
            <input type="text" placeholder="Search notifications…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputCls} pl-9`} />
          </div>

          {/* Read filter pills */}
          <div className="flex gap-1.5">
            {([['all','All'], ['unread','Unread'], ['read','Read']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setSelectedFilter(v)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${selectedFilter===v ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-[#f6f3eb] text-teal-800 hover:bg-teal-100'}`}>
                {l}{v==='all' ? ` (${notifications.length})` : v==='unread' ? ` (${unreadCount})` : ` (${notifications.length-unreadCount})`}
              </button>
            ))}
          </div>

          {/* Category dropdown */}
          <div className="relative" ref={catMenuRef}>
            <button onClick={() => setShowCatMenu(s => !s)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-teal-900/10 bg-white text-teal-900 hover:bg-[#f6f3eb] transition-colors">
              <Filter className="w-3.5 h-3.5" /><span className="capitalize">{selectedCategory === 'all' ? 'Category' : selectedCategory}</span><ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showCatMenu && (
              <div className="absolute left-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-teal-900/10 py-1.5 z-20">
                {['all','approval','system','user','job','event','message'].map(cat => (
                  <button key={cat} onClick={() => { setSelectedCategory(cat); setShowCatMenu(false); }}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2 text-xs font-bold hover:bg-[#f6f3eb] transition-colors capitalize ${selectedCategory===cat ? 'text-red-700 bg-teal-950/10' : 'text-teal-900'}`}>
                    {cat !== 'all' && catIcon(cat as any)}{cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mark all / clear */}
          <div className="flex gap-1.5 ml-auto">
            <button onClick={markAllRead} className="px-3 py-1.5 text-xs font-bold rounded-xl border border-teal-900/10 text-teal-900 hover:bg-[#f6f3eb] transition-colors flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" />Mark all read</button>
            {hasFilters && <button onClick={() => { setSelectedFilter('all'); setSelectedCategory('all'); setSearchQuery(''); }} className="px-3 py-1.5 text-xs font-bold rounded-xl border border-teal-900/10 text-teal-900 hover:bg-[#f6f3eb] transition-colors flex items-center gap-1"><X className="w-3.5 h-3.5" />Clear</button>}
          </div>
        </div>

        {/* Bulk bar */}
        {selectedIds.length > 0 && (
          <div className="bg-teal-950/10 border border-teal-200 rounded-2xl px-4 py-2.5 flex items-center gap-3 flex-wrap text-xs font-bold">
            <span className="text-red-800">{selectedIds.length} selected</span>
            <button onClick={() => bulk('read')}   className="flex items-center gap-1 px-3 py-1.5 bg-white border border-teal-200 text-red-700 rounded-xl hover:bg-teal-100 transition-colors"><CheckCheck className="w-3.5 h-3.5" />Mark read</button>
            <button onClick={() => bulk('unread')} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-50 transition-colors"><Mail className="w-3.5 h-3.5" />Mark unread</button>
            <button onClick={() => bulk('delete')} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
            <button onClick={() => setSelectedIds([])} className="ml-auto text-teal-700 hover:text-teal-950 transition-colors">Clear</button>
          </div>
        )}

        {/* Inbox + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">

          {/* Left: List */}
          <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-teal-900/10 flex items-center justify-between">
              <div><p className="text-sm font-black text-teal-950">Inbox</p><p className="text-[11px] text-teal-600">{filtered.length} shown · {unread.length} unread</p></div>
              <label className="flex items-center gap-2 text-xs font-bold text-teal-800 cursor-pointer">
                <input type="checkbox" checked={filtered.length>0 && selectedIds.length===filtered.length} onChange={toggleAll} className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-400" />Select all
              </label>
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-10 h-10 rounded-full bg-[#f6f3eb] flex items-center justify-center mb-2"><BellOff className="w-5 h-5 text-gray-300" /></div>
                <p className="text-sm font-bold text-teal-950">No notifications found</p>
                <p className="text-xs text-teal-600 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="max-h-[640px] overflow-auto divide-y divide-gray-50">
                {unread.length > 0 && <div className="px-4 py-1.5 bg-[#f6f3eb] text-[10px] font-black text-teal-600 tracking-widest">UNREAD</div>}
                {unread.map(n => <NotifRow key={n.id} n={n} />)}
                {read.length > 0 && <div className="px-4 py-1.5 bg-[#f6f3eb] text-[10px] font-black text-teal-600 tracking-widest border-t border-teal-900/10">READ</div>}
                {read.map(n => <NotifRow key={n.id} n={n} />)}
              </div>
            )}
          </div>

          {/* Right: Detail (desktop) */}
          <div className="hidden lg:flex flex-col bg-white rounded-2xl border border-teal-900/10 shadow-sm overflow-hidden min-h-[400px]">
            {activeNotif
              ? <DetailPanel n={activeNotif} />
              : <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#f6f3eb] flex items-center justify-center mb-2"><Bell className="w-5 h-5 text-gray-300" /></div>
                  <p className="text-sm font-bold text-teal-950">Select a notification</p>
                  <p className="text-xs text-teal-600 mt-1">Choose an item from the inbox to view details</p>
                </div>}
          </div>
        </div>

        {/* Mobile detail overlay */}
        {mobileOpen && activeNotif && (
          <div className="fixed inset-0 bg-white z-50 lg:hidden flex flex-col">
            <div className="px-4 py-3 border-b border-teal-900/10 flex items-center gap-3">
              <button onClick={() => setMobileOpen(false)} className="text-sm font-bold text-teal-800 hover:text-teal-950">← Back</button>
              <p className="text-sm font-black text-teal-950 flex-1 text-center">Notification</p>
              <div className="w-12" />
            </div>
            <div className="flex-1 overflow-auto"><DetailPanel n={activeNotif} onClose={() => setMobileOpen(false)} /></div>
          </div>
        )}

        {/* Send modal */}
        {showModal && (
          <div className="fixed inset-0 bg-teal-950/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-teal-900/10">
              <div className="sticky top-0 bg-white border-b border-teal-900/10 px-5 py-4 flex items-center justify-between">
                <p className="text-sm font-black text-teal-950">Send Notification</p>
                <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg bg-[#f6f3eb] flex items-center justify-center text-teal-700 hover:bg-teal-100 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-[11px] font-bold text-teal-800 mb-1.5">Type</label>
                    <select value={form.type} onChange={e => formChange('type', e.target.value)} className={inputCls}>
                      {['info','success','warning','error','alert'].map(v => <option key={v} value={v} className="capitalize">{v}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-[11px] font-bold text-teal-800 mb-1.5">Category</label>
                    <select value={form.category} onChange={e => formChange('category', e.target.value)} className={inputCls}>
                      {['system','user','approval','job','event','message'].map(v => <option key={v} value={v} className="capitalize">{v}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-[11px] font-bold text-teal-800 mb-1.5">Priority</label>
                    <select value={form.priority} onChange={e => formChange('priority', e.target.value)} className={inputCls}>
                      {['low','medium','high'].map(v => <option key={v} value={v} className="capitalize">{v}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="block text-[11px] font-bold text-teal-800 mb-1.5">Title *</label>
                  <input type="text" value={form.title} onChange={e => formChange('title', e.target.value)} placeholder="Notification title" className={`${inputCls} ${formErrors.title ? 'border-red-400 focus:ring-red-200' : ''}`} />
                  {formErrors.title && <p className="flex items-center gap-1 text-[10px] text-red-600 mt-1"><AlertCircle className="w-3 h-3" />{formErrors.title}</p>}
                </div>
                <div><label className="block text-[11px] font-bold text-teal-800 mb-1.5">Message *</label>
                  <textarea rows={4} value={form.message} onChange={e => formChange('message', e.target.value)} placeholder="Notification message" className={`${inputCls} resize-none ${formErrors.message ? 'border-red-400 focus:ring-red-200' : ''}`} />
                  {formErrors.message && <p className="flex items-center gap-1 text-[10px] text-red-600 mt-1"><AlertCircle className="w-3 h-3" />{formErrors.message}</p>}
                </div>
                <div><label className="block text-[11px] font-bold text-teal-800 mb-1.5">Recipients</label>
                  <select value={form.recipients} onChange={e => formChange('recipients', e.target.value)} className={inputCls}>
                    <option value="all">All Users</option><option value="alumni">Alumni Only</option><option value="students">Students Only</option><option value="admins">Admins Only</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-teal-900/10">
                  <button onClick={() => { setShowModal(false); setFormErrors({}); }} disabled={isSending} className="px-4 py-2.5 text-sm font-bold rounded-xl border border-teal-900/10 text-teal-900 hover:bg-[#f6f3eb] disabled:opacity-50 transition-colors">Cancel</button>
                  <button onClick={handleSend} disabled={isSending} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors">
                    {isSending ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</> : <><Send className="w-4 h-4" />Send</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-[60]">
            <div className="bg-white rounded-2xl shadow-2xl border border-teal-200 p-4 flex items-center gap-3 max-w-sm">
              <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0"><CheckCircle className="w-4 h-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-black text-teal-950">Sent successfully!</p>
                <p className="text-xs text-teal-700">Notification sent to {form.recipients === 'all' ? 'all users' : form.recipients}.</p>
              </div>
              <button onClick={() => setShowSuccess(false)} className="text-teal-600 hover:text-teal-800 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
