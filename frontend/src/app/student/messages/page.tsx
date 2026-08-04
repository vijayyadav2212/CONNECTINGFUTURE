"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import StudentNavigation from '../StudentNavigation/StudentNavigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Search, Send, Paperclip, User, Clock, Check, CheckCheck, FileText, Pencil, Trash2, X, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isFromMe: boolean;
  status: 'sent' | 'delivered' | 'read';
  editedAt?: Date | null;
  deletedAt?: Date | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  canEditDelete?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  email: string;
  displayName: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  role: 'alumni' | 'student' | 'mentor';
}

interface ThreadItem { thread_key:string; other:string; other_name?: string; last_message:string; last_at:string; unread:number }

interface ConnectionRecord {
  id: number;
  pair_key: string;
  requester_email: string;
  target_email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'removed';
}

const MessagesPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedOtherEmail, setSelectedOtherEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [actionMessageId, setActionMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editWindowMinutes, setEditWindowMinutes] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [connLoading, setConnLoading] = useState(false);
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '') + '/api';
  const currentUserEmail = (user?.email as string | undefined) || '';
  const prevUnreadRef = useRef<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayNameFor = (value: string) => value.includes('@') ? value.split('@')[0] : value;

  function buildPairKey(a:string,b:string) {
    const [x,y] = [a.toLowerCase().trim(), b.toLowerCase().trim()].sort();
    return `${x}|${y}`;
  }
  const currentConnection = useMemo(() => {
    if (!currentUserEmail || !selectedOtherEmail) return undefined;
    const pk = buildPairKey(currentUserEmail, selectedOtherEmail);
    return connections.find(c => c.pair_key === pk);
  }, [connections, currentUserEmail, selectedOtherEmail]);
  const connectionStatus = currentConnection?.status;

  useEffect(() => {
    if (!currentUserEmail) return; // placeholder always true
    (async () => {
      try {
        setConnLoading(true);
        const resp = await fetch(`${API_BASE}/connections?user_email=${encodeURIComponent(currentUserEmail)}`);
        if (resp.ok) {
          const data = await resp.json();
            setConnections(data.connections || []);
        }
      } finally { setConnLoading(false); }
    })();
  }, [currentUserEmail]);

  async function sendConnectionRequest() {
    if (!currentUserEmail || !selectedOtherEmail) return;
    setConnLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/connections/request`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requester_email: currentUserEmail, target_email: selectedOtherEmail }) });
      if (resp.ok) {
        const data = await resp.json();
        setConnections(prev => [data.connection, ...prev.filter(c => c.pair_key !== data.connection.pair_key)]);
      }
    } finally { setConnLoading(false); }
  }
  async function respond(action:'accept'|'reject') {
    if (!currentUserEmail || !selectedOtherEmail) return;
    setConnLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/connections/respond`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_email: currentUserEmail, other_email: selectedOtherEmail, action }) });
      if (resp.ok) {
        const data = await resp.json();
        setConnections(prev => prev.map(c => c.pair_key === data.connection.pair_key ? data.connection : c));
      }
    } finally { setConnLoading(false); }
  }
  async function removeConnection() {
    if (!currentUserEmail || !selectedOtherEmail) return;
    setConnLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/connections/remove`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_email: currentUserEmail, other_email: selectedOtherEmail }) });
      if (resp.ok) {
        const data = await resp.json();
        if (data.connection) {
          setConnections(prev => prev.map(c => c.pair_key === data.connection.pair_key ? data.connection : c));
        }
      }
    } finally { setConnLoading(false); }
  }

  // Mock data - replace with actual API calls
  const mockConversations: Conversation[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      displayName: 'Sarah Johnson',
      lastMessage: 'Thanks for your advice on the internship application!',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      unreadCount: 0,
      isOnline: true,
      role: 'alumni'
    },
    {
      id: '2',
      name: 'Michael Chen (Mentor)',
      email: 'michael.chen@example.com',
      displayName: 'Michael Chen (Mentor)',
      lastMessage: 'Let\'s schedule a call to discuss your career goals.',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unreadCount: 2,
      isOnline: false,
      role: 'mentor'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@example.com',
      displayName: 'Emily Rodriguez',
      lastMessage: 'I can share some resources for hardware engineering.',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      unreadCount: 1,
      isOnline: true,
      role: 'alumni'
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david.kim@example.com',
      displayName: 'David Kim',
      lastMessage: 'The data science project sounds interesting!',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      unreadCount: 0,
      isOnline: false,
      role: 'alumni'
    }
  ];

  const mockMessages: { [key: string]: Message[] } = {
    '1': [
      {
        id: '1',
        text: 'Hi Sarah! I hope you\'re doing well. I wanted to ask for some advice about internship applications.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isFromMe: true,
        status: 'read'
      },
      {
        id: '2',
        text: 'Hello! Of course, I\'d be happy to help. What specific questions do you have about the application process?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
        isFromMe: false,
        status: 'read'
      },
      {
        id: '3',
        text: 'I\'m particularly interested in software engineering roles at tech companies. Do you have any tips for standing out in the application?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        isFromMe: true,
        status: 'read'
      },
      {
        id: '4',
        text: 'Absolutely! Focus on personal projects that demonstrate your coding skills. Also, make sure to tailor your resume for each application. Companies really value specific examples of your work.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isFromMe: false,
        status: 'read'
      },
      {
        id: '5',
        text: 'Thanks for your advice on the internship application!',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        isFromMe: true,
        status: 'delivered'
      }
    ]
  };

  // Load threads and merge with accepted connections as conversations
  useEffect(() => {
    let timer: any;
    const load = async () => {
      try {
        if (!currentUserEmail) return;
        const resp = await fetch(`${API_BASE}/messages/threads?user=${encodeURIComponent(currentUserEmail)}`);
        const isJson = resp.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await resp.json() : await resp.text();
        if (!resp.ok) throw new Error(typeof data === 'string' ? data : data?.error || 'Failed to load threads');
        if (!isJson) throw new Error('Unexpected non-JSON response while loading threads');
        const threads: ThreadItem[] = data.threads || [];
        const mappedFromThreads: Conversation[] = threads.map(t => ({
          id: t.thread_key,
          name: t.other,
          email: t.other,
          displayName: t.other_name || displayNameFor(t.other),
          lastMessage: t.last_message,
          lastMessageTime: new Date(t.last_at),
          unreadCount: t.unread,
          isOnline: false,
          role: 'alumni'
        }));
        // Toast on new unread messages
        const prev = prevUnreadRef.current;
        threads.forEach(t => {
          const prevUnread = Number(prev[t.thread_key] || 0);
          const currUnread = Number(t.unread || 0);
          if (currUnread > prevUnread) {
            const delta = currUnread - prevUnread;
            toast({ title: 'New message', description: `${delta} new message${delta>1?'s':''} from ${displayNameFor(t.other_name || t.other)}` });
          }
        });
        // Merge in accepted connections as conversations if not in threads
        const accepted = connections.filter(c => c.status === 'accepted');
        const present = new Set(mappedFromThreads.map(m => m.email.toLowerCase()));
        const fromConnections: Conversation[] = accepted.map(c => {
          const other = c.requester_email.toLowerCase() === currentUserEmail.toLowerCase() ? c.target_email : c.requester_email;
          return {
            id: `conn|${other}`,
            name: other,
            email: other,
            displayName: displayNameFor(other),
            lastMessage: 'Connected • say hi!',
            lastMessageTime: new Date(),
            unreadCount: 0,
            isOnline: false,
            role: 'alumni'
          } as Conversation;
        }).filter(conv => !present.has(conv.name.toLowerCase()));
        const merged = [...mappedFromThreads, ...fromConnections]
          .sort((a,b) => (b.lastMessageTime?.getTime?.() || 0) - (a.lastMessageTime?.getTime?.() || 0));
        setConversations(merged);
        // snapshot unread counts
        const snap: Record<string, number> = {};
        threads.forEach(t => { snap[t.thread_key] = Number(t.unread || 0); });
        prevUnreadRef.current = snap;
        setLoading(false);
      } catch {
        // keep loading state minimal UI
        setLoading(false);
      }
    };
    load();
    timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [API_BASE, currentUserEmail, connections]);

  // Load messages for selected conversation from backend
  useEffect(() => {
    if (!selectedOtherEmail || !currentUserEmail) { setMessages([]); return; }
    let timer: any;
    const load = async () => {
      try {
        const resp = await fetch(`${API_BASE}/messages?user=${encodeURIComponent(currentUserEmail)}&with=${encodeURIComponent(selectedOtherEmail)}&markRead=1`);
        const isJson = resp.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await resp.json() : await resp.text();
        if (!resp.ok) throw new Error(typeof data === 'string' ? data : data?.error || 'Failed to load messages');
        if (!isJson) throw new Error('Unexpected non-JSON response while loading messages');
        const msgs = (data.messages || []) as Array<{
          id:number;
          sender_email:string;
          receiver_email:string;
          content:string;
          created_at:string;
          read_at:string|null;
          edited_at?: string | null;
          deleted_at?: string | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_size?: number | null;
          can_edit_delete?: boolean;
        }>;
        const mapped: Message[] = msgs.map(m => ({
          id: String(m.id),
          text: m.content,
          timestamp: new Date(m.created_at),
          isFromMe: m.sender_email?.toLowerCase() === currentUserEmail.toLowerCase(),
          status: m.read_at ? 'read' : 'delivered',
          editedAt: m.edited_at ? new Date(m.edited_at) : null,
          deletedAt: m.deleted_at ? new Date(m.deleted_at) : null,
          attachmentUrl: m.attachment_url || null,
          attachmentName: m.attachment_name || null,
          attachmentSize: m.attachment_size || null,
          canEditDelete: !!m.can_edit_delete,
        }));
        if (typeof data?.edit_window_minutes === 'number') setEditWindowMinutes(data.edit_window_minutes);
        setMessages(mapped);
      } catch {
        // ignore for now
      }
    };
    load();
    timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [API_BASE, currentUserEmail, selectedOtherEmail]);

  const filteredConversations = conversations.filter(conv =>
    conv.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !selectedOtherEmail || !currentUserEmail) return;
    if (connectionStatus !== 'accepted') return; // gate until connected
    const optimistic: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      timestamp: new Date(),
      isFromMe: true,
      status: 'sent',
      attachmentName: selectedFile?.name || null,
      attachmentSize: selectedFile?.size || null,
      canEditDelete: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');
    setSelectedFile(null);
    setSendingMessage(true);
    setConversations(prev => prev.map(conv => conv.id===selectedConversation ? { ...conv, lastMessage: optimistic.text, lastMessageTime: optimistic.timestamp } : conv));
    try {
      let attachmentPayload: any = null;
      if (selectedFile) {
        const fd = new FormData();
        fd.append('file', selectedFile);
        const uploadResp = await fetch(`${API_BASE}/upload/message-attachment`, { method: 'POST', body: fd });
        const uploadData = await uploadResp.json().catch(() => ({}));
        if (!uploadResp.ok) throw new Error(uploadData?.error || 'File upload failed');
        attachmentPayload = {
          attachment_url: uploadData.url,
          attachment_name: uploadData.filename,
          attachment_mime: uploadData.mimetype,
          attachment_size: uploadData.size,
        };
      }
      const resp = await fetch(`${API_BASE}/messages/connected`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ sender_email: currentUserEmail, receiver_email: selectedOtherEmail, content: optimistic.text, ...(attachmentPayload || {}) })
      });
      if (!resp.ok) {
        // Optionally revert or mark error
      }
    } catch {}
    finally { setSendingMessage(false); }
  };

  const startEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setActionMessageId(message.id);
    setEditingText(message.text || '');
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const saveEditMessage = async (messageId: string) => {
    if (!editingText.trim() || !currentUserEmail) return;
    try {
      const resp = await fetch(`${API_BASE}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: currentUserEmail, content: editingText.trim() }),
      });
      if (!resp.ok) return;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: editingText.trim(), editedAt: new Date(), canEditDelete: false } : m));
      cancelEditMessage();
    } catch {}
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentUserEmail) return;
    try {
      const resp = await fetch(`${API_BASE}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: currentUserEmail }),
      });
      if (!resp.ok) return;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: '', deletedAt: new Date(), canEditDelete: false } : m));
    } catch {}
  };

  const formatFileSize = (size?: number | null) => {
    if (!size || size <= 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPreviewUrl = (url?: string | null, fileName?: string | null) => {
    if (!url) return '';
    const safeName = fileName && fileName.trim() ? fileName.trim() : 'attachment';
    return `/api/files/preview?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeName)}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 1000 * 60) return 'Just now';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered': return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read': return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <StudentNavigation>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
              <div className="bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </StudentNavigation>
    );
  }

  return (
    <StudentNavigation>
      <div className="min-h-screen bg-[#F5F6FA] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="relative bg-gradient-to-br from-blue-100/60 via-green-100/50 to-orange-100/40 backdrop-blur-lg rounded-3xl p-8 lg:p-10 shadow-xl border border-white/30 overflow-hidden">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-700 font-semibold text-sm">Student Network</span>
                  </div>
                  <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3">Messages</h1>
                  <p className="text-gray-700 text-base lg:text-lg max-w-2xl mb-4">Connect with alumni, mentors, and peers to build your professional network.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-220px)] min-h-[520px]">
            <div className="lg:col-span-1 bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-0 flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                <p className="text-sm font-bold text-slate-900 mb-3 tracking-tight">Conversations</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {filteredConversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-36 text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                      <Search className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No conversations found</p>
                    <p className="text-xs text-slate-400 mt-1">Try another keyword</p>
                  </div>
                )}
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => { setSelectedConversation(conv.id); setSelectedOtherEmail(conv.email); }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 flex items-center gap-3 hover:bg-slate-50 transition-colors ${selectedConversation === conv.id ? 'bg-indigo-50/70 border-l-2 border-l-indigo-500' : ''}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${selectedConversation === conv.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                      {conv.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="text-xs font-bold text-slate-900 truncate">{conv.displayName}</h3>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-500 truncate flex-1">{conv.lastMessage}</p>
                        {conv.unreadCount > 0 && <span className="ml-2 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{conv.unreadCount}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden min-h-0">
              {selectedConversation ? (
                <div className="flex flex-col h-full min-h-0">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center shrink-0">
                          {conversations.find((c) => c.id === selectedConversation)?.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 leading-none">{conversations.find((c) => c.id === selectedConversation)?.displayName || selectedOtherEmail}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">{selectedOtherEmail}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {connLoading && <span className="text-[11px] text-slate-400">Checking…</span>}
                        {!connLoading && (
                          <>
                            {connectionStatus === 'accepted' && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Connected</span>}
                            {connectionStatus === 'pending' && currentConnection?.requester_email.toLowerCase() === currentUserEmail.toLowerCase() && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending</span>}
                            {connectionStatus === 'pending' && currentConnection?.target_email.toLowerCase() === currentUserEmail.toLowerCase() && (
                              <div className="flex gap-1.5">
                                <button onClick={() => respond('accept')} disabled={connLoading} className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60">Accept</button>
                                <button onClick={() => respond('reject')} disabled={connLoading} className="text-[11px] px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 font-semibold hover:bg-red-100 disabled:opacity-60">Reject</button>
                              </div>
                            )}
                            {!connectionStatus && <button onClick={sendConnectionRequest} disabled={connLoading} className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60">Connect</button>}
                            {connectionStatus === 'accepted' && <button onClick={removeConnection} disabled={connLoading} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 disabled:opacity-60">Remove</button>}
                            {(connectionStatus === 'rejected' || connectionStatus === 'removed') && <button onClick={sendConnectionRequest} disabled={connLoading} className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60">Re-connect</button>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-slate-50/60" onClick={() => setActionMessageId(null)}>
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[72%] ${message.isFromMe ? 'order-last' : ''}`}>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${message.isFromMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'}`}
                            onDoubleClick={() => {
                              if (message.isFromMe && message.canEditDelete && !message.deletedAt) setActionMessageId(message.id);
                            }}
                            onContextMenu={(e) => {
                              if (!(message.isFromMe && message.canEditDelete && !message.deletedAt)) return;
                              e.preventDefault();
                              setActionMessageId(message.id);
                            }}
                          >
                            {message.deletedAt ? (
                              <p className="text-xs italic opacity-80">This message was deleted</p>
                            ) : (
                              <>
                                {message.text ? <p>{message.text}</p> : null}
                                {message.attachmentUrl ? (
                                  <a href={getPreviewUrl(message.attachmentUrl, message.attachmentName)} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl ${message.isFromMe ? 'bg-white/15 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'} transition-colors`}>
                                    <FileText className="w-4 h-4" />
                                    <span className="text-xs font-semibold max-w-[180px] truncate">{message.attachmentName || 'Attachment'}</span>
                                    {message.attachmentSize ? <span className="text-[10px] opacity-80">({formatFileSize(message.attachmentSize)})</span> : null}
                                  </a>
                                ) : null}
                              </>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] ${message.isFromMe ? 'justify-end text-indigo-600' : 'justify-start text-slate-400'}`}>
                            <span>{formatTime(message.timestamp)}</span>
                            {message.editedAt && !message.deletedAt && <span>(edited)</span>}
                            {message.isFromMe && <div className={`${message.status === 'read' ? 'text-blue-600' : 'text-gray-400'}`}>{getStatusIcon(message.status)}</div>}
                          </div>
                          {message.isFromMe && message.canEditDelete && !message.deletedAt && actionMessageId === message.id && (
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <button onClick={() => startEditMessage(message)} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"><Pencil className="w-3 h-3" />Edit</button>
                              <button onClick={() => deleteMessage(message.id)} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"><Trash2 className="w-3 h-3" />Delete</button>
                            </div>
                          )}
                          {message.isFromMe && editingMessageId === message.id && (
                            <div className="mt-2 flex items-center gap-2">
                              <input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300" />
                              <button onClick={() => saveEditMessage(message.id)} className="px-2.5 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
                              <button onClick={cancelEditMessage} className="px-2 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 p-4">
                    <p className="text-[11px] text-gray-500 mb-2">Double-click or right-click your sent message to edit/delete for {editWindowMinutes} minutes.</p>
                    {selectedFile && (
                      <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs text-gray-700">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="max-w-[220px] truncate">{selectedFile.name}</span>
                        <span className="text-gray-500">({formatFileSize(selectedFile.size)})</span>
                        <button onClick={() => setSelectedFile(null)}><X className="w-3.5 h-3.5 text-gray-500" /></button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                      <button onClick={() => fileInputRef.current?.click()} disabled={connectionStatus !== 'accepted'} className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:bg-slate-100/60 disabled:text-slate-400 shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder={connectionStatus === 'accepted' ? 'Type your message…' : 'Connect to start messaging'}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                          disabled={connectionStatus !== 'accepted'}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 disabled:bg-gray-50 disabled:text-gray-400 pr-14"
                        />
                      </div>
                      <button onClick={sendMessage} disabled={(!newMessage.trim() && !selectedFile) || connectionStatus !== 'accepted' || sendingMessage} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${(newMessage.trim() || selectedFile) && connectionStatus === 'accepted' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4 border border-indigo-100">
                    <User className="w-7 h-7 text-indigo-300" />
                  </div>
                  <p className="font-bold text-slate-900 text-sm mb-1">No conversation selected</p>
                  <p className="text-xs text-slate-400">Choose a conversation from the list to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentNavigation>
  );
};

export default MessagesPage;