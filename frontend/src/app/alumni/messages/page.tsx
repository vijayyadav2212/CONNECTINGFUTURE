"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AlumniNavigation from "../AluminaNavigation/AlumniNavigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Search, Send, User as UserIcon, MessageCircle, CheckCheck, Paperclip, Pencil, Trash2, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function buildApiRoot() {
  const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  return base.endsWith("/api") ? base : `${base.replace(/\/$/, "")}/api`;
}
const API_ROOT = buildApiRoot();

interface Message {
  id: number;
  sender_email: string;
  receiver_email: string;
  content: string;
  created_at: string;
  read_at: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  attachment_size?: number | null;
  can_edit_delete?: boolean;
}

interface ThreadItem {
  thread_key: string;
  other: string;
  last_message: string;
  last_at: string;
  unread: number;
}

interface ConnectionRecord {
  id: number;
  pair_key: string;
  requester_email: string;
  target_email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'removed';
  message?: string;
  accepted_at?: string;
  updated_at?: string;
}

export default function MessagesPage() {
  const { user } = useUser();
  const currentUserEmail = (user?.email as string | undefined) || "";
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [selectedOther, setSelectedOther] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string>("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [actionMessageId, setActionMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editWindowMinutes, setEditWindowMinutes] = useState(15);
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connectionActionLoading, setConnectionActionLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canSend = useMemo(() => (input.trim().length > 0 || !!selectedFile) && !!selectedOther, [input, selectedFile, selectedOther]);
  const prevUnreadRef = useRef<Record<string, number>>({});

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Load threads every 10s
  useEffect(() => {
    let timer: any;
    const load = async () => {
      if (!currentUserEmail) return;
      try {
        setLoadingThreads(true);
        const resp = await fetch(`${API_ROOT}/messages/threads?user=${encodeURIComponent(currentUserEmail)}`);
        const isJson = resp.headers.get("content-type")?.includes("application/json");
        const data = isJson ? await resp.json() : await resp.text();
        if (!resp.ok) throw new Error(typeof data === "string" ? data.slice(0, 200) : data?.error || "Failed");
        if (!isJson) throw new Error("Non-JSON response");
        const latest = (data.threads || []) as ThreadItem[];
        const prev = prevUnreadRef.current;
        latest.forEach(t => {
          const delta = Number(t.unread || 0) - Number(prev[t.thread_key] || 0);
          if (delta > 0) toast({ title: 'New message', description: `${delta} new message${delta > 1 ? 's' : ''} from ${t.other}` });
        });
        setThreads(latest);
        const snap: Record<string, number> = {};
        latest.forEach(t => { snap[t.thread_key] = Number(t.unread || 0); });
        prevUnreadRef.current = snap;
      } catch (e: any) { setError(e.message); }
      finally { setLoadingThreads(false); }
    };
    load();
    timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [currentUserEmail]);

  // Load connections every 20s
  useEffect(() => {
    if (!currentUserEmail) return;
    let timer: any;
    const load = async () => {
      try {
        setLoadingConnections(true);
        const resp = await fetch(`${API_ROOT}/connections?user_email=${encodeURIComponent(currentUserEmail)}`);
        if (!resp.ok) throw new Error('Failed');
        const data = await resp.json();
        setConnections(data.connections || []);
      } catch {}
      finally { setLoadingConnections(false); }
    };
    load(); timer = setInterval(load, 20000); return () => clearInterval(timer);
  }, [currentUserEmail]);

  function buildPairKey(a: string, b: string) {
    const [x, y] = [a.toLowerCase().trim(), b.toLowerCase().trim()].sort();
    return `${x}|${y}`;
  }

  const currentConnection = useMemo(() => {
    if (!currentUserEmail || !selectedOther) return undefined;
    return connections.find(c => c.pair_key === buildPairKey(currentUserEmail, selectedOther));
  }, [connections, currentUserEmail, selectedOther]);

  const connectionStatus = currentConnection?.status;

  async function sendConnectionRequest() {
    if (!currentUserEmail || !selectedOther) return;
    setConnectionActionLoading(true);
    try {
      const resp = await fetch(`${API_ROOT}/connections/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requester_email: currentUserEmail, target_email: selectedOther }) });
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();
      setConnections(prev => [data.connection, ...prev.filter(p => p.pair_key !== data.connection.pair_key)]);
    } catch (e: any) { setError(e.message); }
    finally { setConnectionActionLoading(false); }
  }

  async function respondConnection(action: 'accept' | 'reject') {
    if (!currentUserEmail || !selectedOther) return;
    setConnectionActionLoading(true);
    try {
      const resp = await fetch(`${API_ROOT}/connections/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: currentUserEmail, other_email: selectedOther, action }) });
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();
      setConnections(prev => prev.map(c => c.pair_key === data.connection.pair_key ? data.connection : c));
    } catch (e: any) { setError(e.message); }
    finally { setConnectionActionLoading(false); }
  }

  async function removeConnection() {
    if (!currentUserEmail || !selectedOther) return;
    setConnectionActionLoading(true);
    try {
      const resp = await fetch(`${API_ROOT}/connections/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: currentUserEmail, other_email: selectedOther }) });
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();
      if (data.connection) setConnections(prev => prev.map(c => c.pair_key === data.connection.pair_key ? data.connection : c));
    } catch (e: any) { setError(e.message); }
    finally { setConnectionActionLoading(false); }
  }

  const mergedThreads = useMemo<ThreadItem[]>(() => {
    if (!currentUserEmail) return threads;
    const present = new Set(threads.map(t => t.other.toLowerCase()));
    const synthetic: ThreadItem[] = connections.filter(c => c.status === 'accepted').map(c => {
      const other = c.requester_email.toLowerCase() === currentUserEmail.toLowerCase() ? c.target_email : c.requester_email;
      return { thread_key: `conn|${other}`, other, last_message: 'Connected · say hi!', last_at: c.accepted_at || c.updated_at || new Date().toISOString(), unread: 0 };
    }).filter(t => !present.has(t.other.toLowerCase()));
    return [...threads, ...synthetic].sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
  }, [threads, connections, currentUserEmail]);

  // Load messages for selected thread every 5s
  useEffect(() => {
    if (!selectedOther) return;
    let timer: any;
    const load = async () => {
      if (!currentUserEmail) return;
      try {
        setLoadingMessages(true);
        const resp = await fetch(`${API_ROOT}/messages?user=${encodeURIComponent(currentUserEmail)}&with=${encodeURIComponent(selectedOther)}&markRead=1`);
        const isJson = resp.headers.get("content-type")?.includes("application/json");
        const data = isJson ? await resp.json() : await resp.text();
        if (!resp.ok) throw new Error(typeof data === "string" ? data.slice(0, 200) : data?.error || "Failed");
        setMessages(data.messages || []);
        if (typeof data?.edit_window_minutes === 'number') setEditWindowMinutes(data.edit_window_minutes);
      } catch (e: any) { setError(e.message); }
      finally { setLoadingMessages(false); }
    };
    load(); timer = setInterval(load, 5000); return () => clearInterval(timer);
  }, [selectedOther, currentUserEmail]);

  const sendMessage = async () => {
    if (!canSend || !selectedOther || !currentUserEmail) return;
    if (connectionStatus !== 'accepted') { setError('You must be connected to send messages'); return; }
    const optimistic: Message = {
      id: Date.now(),
      sender_email: currentUserEmail,
      receiver_email: selectedOther,
      content: input.trim(),
      created_at: new Date().toISOString(),
      read_at: null,
      attachment_name: selectedFile?.name || null,
      attachment_mime: selectedFile?.type || null,
      attachment_size: selectedFile?.size || null,
      can_edit_delete: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput("");
    setSelectedFile(null);
    setSendingMessage(true);
    try {
      let attachmentPayload: any = null;
      if (selectedFile) {
        const fd = new FormData();
        fd.append('file', selectedFile);
        const uploadResp = await fetch(`${API_ROOT}/uploads/message-file`, { method: 'POST', body: fd });
        const uploadData = await uploadResp.json().catch(() => ({}));
        if (!uploadResp.ok) throw new Error(uploadData?.error || 'Failed to upload file');
        attachmentPayload = {
          attachment_url: uploadData.url,
          attachment_name: uploadData.filename,
          attachment_mime: uploadData.mimetype,
          attachment_size: uploadData.size,
        };
      }

      const resp = await fetch(`${API_ROOT}/messages/connected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_email: currentUserEmail,
          receiver_email: selectedOther,
          content: optimistic.content,
          ...(attachmentPayload || {}),
        })
      });
      if (!resp.ok) { const d = await resp.json().catch(() => ({})); throw new Error(d?.error || "Failed to send"); }
    } catch (e: any) { setError(e.message); }
    finally { setSendingMessage(false); }
  };

  const startEditMessage = (m: Message) => {
    setEditingMessageId(m.id);
    setActionMessageId(m.id);
    setEditingText(m.content || '');
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const saveEditMessage = async (messageId: number) => {
    if (!currentUserEmail || !editingText.trim()) return;
    try {
      const resp = await fetch(`${API_ROOT}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: currentUserEmail, content: editingText.trim() }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.error || 'Failed to edit message');
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: editingText.trim(), edited_at: new Date().toISOString(), can_edit_delete: false } : m));
      cancelEditMessage();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!currentUserEmail) return;
    try {
      const resp = await fetch(`${API_ROOT}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: currentUserEmail }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.error || 'Failed to delete message');
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted_at: new Date().toISOString(), content: '', can_edit_delete: false } : m));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const formatFileSize = (size?: number | null) => {
    if (!size || size <= 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const initials = (email: string) => email.split('@')[0].slice(0, 2).toUpperCase();

  const filteredThreads = mergedThreads.filter(t =>
    t.other.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AlumniNavigation>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-500 text-xs mt-0.5">Connect and chat with your alumni network</p>
          </div>
          {error && <p className="ml-auto text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">{error}</p>}
        </div>

        {/* Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">

          {/* Thread List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-3">Conversations</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingThreads && filteredThreads.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-gray-400">Loading…</div>
              )}
              {filteredThreads.length === 0 && !loadingThreads && (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <MessageCircle className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400">No conversations yet</p>
                </div>
              )}
              {filteredThreads.map(t => (
                <button key={t.thread_key} onClick={() => setSelectedOther(t.other)} className={`w-full text-left px-4 py-3 border-b border-gray-50 flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedOther === t.other ? 'bg-green-50 border-l-2 border-l-green-500' : ''}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${selectedOther === t.other ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {initials(t.other)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold text-gray-900 truncate">{t.other.split('@')[0]}</p>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">{new Date(t.last_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-gray-400 truncate flex-1">{t.last_message}</p>
                      {t.unread > 0 && <span className="ml-2 w-4 h-4 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{t.unread}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {selectedOther ? (
              <>
                {/* Chat header */}
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 text-sm font-bold flex items-center justify-center shrink-0">
                    {initials(selectedOther)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-none">{selectedOther.split('@')[0]}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{selectedOther}</p>
                  </div>
                  {/* Connection status + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {loadingConnections && <span className="text-[11px] text-gray-400">Checking…</span>}
                    {!loadingConnections && (
                      <>
                        {connectionStatus === 'accepted' && (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Connected</span>
                        )}
                        {connectionStatus === 'pending' && currentConnection?.requester_email.toLowerCase() === currentUserEmail.toLowerCase() && (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending</span>
                        )}
                        {connectionStatus === 'pending' && currentConnection?.target_email.toLowerCase() === currentUserEmail.toLowerCase() && (
                          <div className="flex gap-1.5">
                            <button onClick={() => respondConnection('accept')} disabled={connectionActionLoading} className="text-[11px] px-2.5 py-1 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60">Accept</button>
                            <button onClick={() => respondConnection('reject')} disabled={connectionActionLoading} className="text-[11px] px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 font-semibold hover:bg-red-100 disabled:opacity-60">Reject</button>
                          </div>
                        )}
                        {!connectionStatus && (
                          <button onClick={sendConnectionRequest} disabled={connectionActionLoading} className="text-[11px] px-2.5 py-1 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60">{connectionActionLoading ? '…' : 'Connect'}</button>
                        )}
                        {connectionStatus === 'accepted' && (
                          <button onClick={removeConnection} disabled={connectionActionLoading} className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 disabled:opacity-60">Remove</button>
                        )}
                        {(connectionStatus === 'rejected' || connectionStatus === 'removed') && (
                          <button onClick={sendConnectionRequest} disabled={connectionActionLoading} className="text-[11px] px-2.5 py-1 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60">{connectionActionLoading ? '…' : 'Re-connect'}</button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-gray-50/50" onClick={() => setActionMessageId(null)}>
                  {loadingMessages && messages.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-gray-400">Loading messages…</div>
                  )}
                  {messages.map(m => {
                    const mine = m.sender_email.toLowerCase() === currentUserEmail.toLowerCase();
                    const canRevealActions = mine && !!m.can_edit_delete && !m.deleted_at;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[72%]">
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${mine ? 'bg-green-600 text-white rounded-br-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'}`}
                            onDoubleClick={() => { if (canRevealActions) setActionMessageId(m.id); }}
                            onContextMenu={(e) => {
                              if (!canRevealActions) return;
                              e.preventDefault();
                              setActionMessageId(m.id);
                            }}
                          >
                            {m.deleted_at ? (
                              <p className={`${mine ? 'text-green-100' : 'text-gray-400'} italic text-xs`}>This message was deleted</p>
                            ) : (
                              <>
                                {m.content ? <p>{m.content}</p> : null}
                                {m.attachment_url ? (
                                  <a
                                    href={m.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl ${mine ? 'bg-white/15 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'} transition-colors`}
                                  >
                                    <FileText className="w-4 h-4" />
                                    <span className="text-xs font-semibold truncate max-w-[180px]">{m.attachment_name || 'Attachment'}</span>
                                    {m.attachment_size ? <span className="text-[10px] opacity-80">({formatFileSize(m.attachment_size)})</span> : null}
                                  </a>
                                ) : null}
                              </>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] ${mine ? 'justify-end text-green-600' : 'justify-start text-gray-400'}`}>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {m.edited_at && !m.deleted_at && <span>(edited)</span>}
                            {mine && m.read_at && <CheckCheck className="w-3 h-3" />}
                          </div>
                          {mine && m.can_edit_delete && !m.deleted_at && actionMessageId === m.id && (
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                              <button
                                onClick={() => startEditMessage(m)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => deleteMessage(m.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          )}
                          {mine && editingMessageId === m.id && (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300"
                                placeholder="Edit message"
                              />
                              <button onClick={() => saveEditMessage(m.id)} className="px-2.5 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700">Save</button>
                              <button onClick={cancelEditMessage} className="px-2 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-100 p-4">
                  {connectionStatus !== 'accepted' && (
                    <p className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-xl py-2 mb-3">You must be connected to send messages</p>
                  )}
                  <p className="text-[11px] text-gray-400 mb-2">Double-click or right-click your sent message to edit/delete for {editWindowMinutes} minutes.</p>
                  {selectedFile && (
                    <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs text-gray-700">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="max-w-[220px] truncate">{selectedFile.name}</span>
                      <span className="text-gray-500">({formatFileSize(selectedFile.size)})</span>
                      <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-gray-700"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={connectionStatus !== 'accepted'}
                      className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:bg-gray-100/60 disabled:text-gray-400 shrink-0"
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      placeholder={connectionStatus === 'accepted' ? 'Type a message…' : 'Connect to start messaging'}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                      disabled={connectionStatus !== 'accepted'}
                      className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <button onClick={sendMessage} disabled={!canSend || connectionStatus !== 'accepted' || sendingMessage} className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <UserIcon className="w-7 h-7 text-green-300" />
                </div>
                <p className="font-bold text-gray-900 text-sm mb-1">No conversation selected</p>
                <p className="text-xs text-gray-400">Choose a conversation from the list to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}