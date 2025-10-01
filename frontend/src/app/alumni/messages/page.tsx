"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AlumniNavigation from "../AluminaNavigation/AlumniNavigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Search, Paperclip, Smile, Phone, Video, MoreHorizontal, User as UserIcon } from "lucide-react";

// API root (ensure it includes '/api')
function buildApiRoot() {
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:4000";
  // Normalize to include /api exactly once
  const url = base.endsWith("/api") ? base : `${base.replace(/\/$/, "")}/api`;
  return url;
}
const API_ROOT = buildApiRoot();

interface Message {
  id: number;
  sender_email: string;
  receiver_email: string;
  content: string;
  created_at: string;
  read_at: string | null;
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

const DEMO_CONTACTS = [
  "alex.wong@example.com",
  "nisha.patel@example.com",
  "rahul.verma@example.com",
  "emily.chen@example.com",
];

export default function MessagesPage() {
  const { user } = useUser();
  const currentUserEmail = (user?.email as string | undefined) || "";

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [selectedOther, setSelectedOther] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string>("");
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connectionActionLoading, setConnectionActionLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const canSend = useMemo(() => input.trim().length > 0 && !!selectedOther, [input, selectedOther]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load threads on mount and every 10s
  useEffect(() => {
    let timer: any;
    const load = async () => {
      try {
        setLoadingThreads(true);
        if (!currentUserEmail) return; // wait for user
        const resp = await fetch(
          `${API_ROOT}/messages/threads?user=${encodeURIComponent(currentUserEmail)}`
        );
        const isJson = resp.headers.get("content-type")?.includes("application/json");
        const data = isJson ? await resp.json() : await resp.text();
        if (!resp.ok) {
          const msg = typeof data === "string" ? data.slice(0, 200) : data?.error;
          throw new Error(msg || "Failed to load threads");
        }
        if (!isJson) throw new Error("Unexpected non-JSON response while loading threads");
        setThreads(data.threads || []);
      } catch (e: any) {
        setError(e.message || "Error loading threads");
      } finally {
        setLoadingThreads(false);
      }
    };
    load();
    timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [currentUserEmail]);

  // Load connections list
  useEffect(() => {
    if (!currentUserEmail) return;
    let timer: any;
    const loadConnections = async () => {
      try {
        setLoadingConnections(true);
        const resp = await fetch(`${API_ROOT}/connections?user_email=${encodeURIComponent(currentUserEmail)}`);
        if (!resp.ok) throw new Error('Failed to load connections');
        const data = await resp.json();
        setConnections(data.connections || []);
      } catch (e:any) {
        // swallow silently for now
      } finally {
        setLoadingConnections(false);
      }
    };
    loadConnections();
    timer = setInterval(loadConnections, 20000);
    return () => clearInterval(timer);
  }, [currentUserEmail]);

  function buildPairKey(a:string,b:string) {
    const [x,y] = [a.toLowerCase().trim(), b.toLowerCase().trim()].sort();
    return `${x}|${y}`;
  }

  const currentConnection = useMemo(() => {
    if (!currentUserEmail || !selectedOther) return undefined;
    const pk = buildPairKey(currentUserEmail, selectedOther);
    return connections.find(c => c.pair_key === pk);
  }, [connections, currentUserEmail, selectedOther]);

  const connectionStatus = currentConnection?.status; // undefined | pending | accepted | rejected | removed

  async function sendConnectionRequest() {
    if (!currentUserEmail || !selectedOther) return;
    setConnectionActionLoading(true);
    try {
      const resp = await fetch(`${API_ROOT}/connections/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_email: currentUserEmail, target_email: selectedOther })
      });
      if (!resp.ok) throw new Error('Failed to request connection');
      const data = await resp.json();
      setConnections(prev => {
        const others = prev.filter(p => p.pair_key !== data.connection.pair_key);
        return [data.connection, ...others];
      });
    } catch (e:any) {
      setError(e.message || 'Connection request failed');
    } finally {
      setConnectionActionLoading(false);
    }
  }

  async function respondConnection(action:'accept'|'reject') {
    if (!currentUserEmail || !selectedOther) return;
    setConnectionActionLoading(true);
    try {
      const resp = await fetch(`${API_ROOT}/connections/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: currentUserEmail, other_email: selectedOther, action })
      });
      if (!resp.ok) throw new Error('Failed to update request');
      const data = await resp.json();
      setConnections(prev => prev.map(c => c.pair_key === data.connection.pair_key ? data.connection : c));
    } catch (e:any) {
      setError(e.message || 'Failed to update request');
    } finally {
      setConnectionActionLoading(false);
    }
  }

  async function removeConnection() {
    if (!currentUserEmail || !selectedOther) return;
    setConnectionActionLoading(true);
    try {
      const resp = await fetch(`${API_ROOT}/connections/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: currentUserEmail, other_email: selectedOther })
      });
      if (!resp.ok) throw new Error('Failed to remove');
      const data = await resp.json();
      if (data.connection) {
        setConnections(prev => prev.map(c => c.pair_key === data.connection.pair_key ? data.connection : c));
      }
    } catch (e:any) {
      setError(e.message || 'Failed to remove connection');
    } finally {
      setConnectionActionLoading(false);
    }
  }

  // Merge accepted connections as synthetic threads so "All" shows connected accounts
  const mergedThreads = useMemo<ThreadItem[]>(() => {
    const base = threads || [];
    if (!currentUserEmail) return base;
    const present = new Set(base.map(t => t.other.toLowerCase()));
    const accepted = (connections || []).filter(c => c.status === 'accepted');
    const synthetic: ThreadItem[] = accepted.map(c => {
      const other = c.requester_email.toLowerCase() === currentUserEmail.toLowerCase() ? c.target_email : c.requester_email;
      return {
        thread_key: `conn|${other}`,
        other,
        last_message: 'Connected • say hi!',
        last_at: (c.accepted_at || c.updated_at || new Date().toISOString()),
        unread: 0,
      } as ThreadItem;
    }).filter(t => !present.has(t.other.toLowerCase()));
    return [...base, ...synthetic].sort((a,b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
  }, [threads, connections, currentUserEmail]);

  // Load messages for selected thread and poll every 5s
  useEffect(() => {
    if (!selectedOther) return;
    let timer: any;
    const load = async () => {
      try {
        setLoadingMessages(true);
        if (!currentUserEmail) return;
        const url = `${API_ROOT}/messages?user=${encodeURIComponent(
          currentUserEmail
        )}&with=${encodeURIComponent(selectedOther)}&markRead=1`;
        const resp = await fetch(url);
        const isJson = resp.headers.get("content-type")?.includes("application/json");
        const data = isJson ? await resp.json() : await resp.text();
        if (!resp.ok) {
          const msg = typeof data === "string" ? data.slice(0, 200) : data?.error;
          throw new Error(msg || "Failed to load messages");
        }
        if (!isJson) throw new Error("Unexpected non-JSON response while loading messages");
        setMessages(data.messages || []);
      } catch (e: any) {
        setError(e.message || "Error loading messages");
      } finally {
        setLoadingMessages(false);
      }
    };
    load();
    timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [selectedOther, currentUserEmail]);

  const sendMessage = async () => {
    if (!canSend || !selectedOther || !currentUserEmail) return;
    if (connectionStatus !== 'accepted') {
      setError('You must be connected to send messages');
      return;
    }
    const optimistic: Message = {
      id: Date.now(),
      sender_email: currentUserEmail,
      receiver_email: selectedOther,
      content: input.trim(),
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      const endpoint = `${API_ROOT}/messages/connected`;
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_email: currentUserEmail, receiver_email: selectedOther, content: optimistic.content }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to send message");
      }
    } catch (e: any) {
      setError(e.message || "Error sending message");
    }
  };

  return (
    <AlumniNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              💬 Messages
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with your network and mentors to build meaningful conversations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px] min-h-0">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden min-h-0 flex flex-col">
              <div className="p-6 border-b border-white/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  Conversations
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm text-gray-900 placeholder-gray-500 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="p-0">
                <div className="max-h-[580px] overflow-y-auto min-h-0">
                  {mergedThreads
                    .filter((t) => (activeTab === 'unread' ? t.unread > 0 : true))
                    .filter((t) => t.other.toLowerCase().includes(searchTerm.toLowerCase()) || t.last_message.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((t) => (
                      <div
                        key={t.thread_key}
                        onClick={() => setSelectedOther(t.other)}
                        className={`p-5 border-b border-white/20 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 hover:transform hover:scale-[1.02] ${
                          selectedOther === t.other 
                            ? 'bg-gradient-to-r from-blue-100/70 to-purple-100/70 border-blue-200 shadow-md' 
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {t.other.split('@')[0].slice(0,2).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-gray-900 truncate text-lg">{t.other}</h3>
                              <span className="text-xs font-medium bg-gradient-to-r from-gray-500 to-gray-600 bg-clip-text text-transparent">
                                {new Date(t.last_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm text-gray-600 truncate flex-1 leading-relaxed">{t.last_message}</p>
                              {t.unread > 0 && (
                                <span className="ml-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full px-3 py-1 min-w-[24px] text-center font-semibold shadow-lg">
                                  {t.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 flex flex-col overflow-hidden min-h-0">
              {selectedOther ? (
                <div className="flex flex-col h-full min-h-0">
                  {/* Chat Header */}
                  <div className="p-6 border-b border-white/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          {selectedOther.split('@')[0].slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-gray-900">{selectedOther}</h3>
                          <p className="text-sm font-medium">
                            <span className="inline-flex items-center gap-2 text-gray-500">
                              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                              Offline
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-110 transition-all duration-300">
                          <Phone className="w-5 h-5" />
                        </button>
                        <button className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-110 transition-all duration-300">
                          <Video className="w-5 h-5" />
                        </button>
                        <button className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:shadow-lg hover:scale-110 transition-all duration-300">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {/* Connection badges */}
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      {loadingConnections && <span className="text-xs text-gray-500">Checking connection...</span>}
                      {!loadingConnections && (
                        <>
                          {connectionStatus === 'accepted' && <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Connected</span>}
                          {connectionStatus === 'pending' && currentConnection?.requester_email.toLowerCase() === currentUserEmail.toLowerCase() && (
                            <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Request Pending</span>
                          )}
                          {connectionStatus === 'pending' && currentConnection?.target_email.toLowerCase() === currentUserEmail.toLowerCase() && (
                            <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Incoming Request</span>
                          )}
                          {connectionStatus === 'rejected' && <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Rejected</span>}
                          {connectionStatus === 'removed' && <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Removed</span>}
                        </>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        {!connectionStatus && (
                          <button onClick={sendConnectionRequest} disabled={connectionActionLoading} className="text-xs px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{connectionActionLoading ? '...' : 'Connect'}</button>
                        )}
                        {connectionStatus === 'pending' && currentConnection?.target_email.toLowerCase() === currentUserEmail.toLowerCase() && (
                          <>
                            <button onClick={() => respondConnection('accept')} disabled={connectionActionLoading} className="text-xs px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">Accept</button>
                            <button onClick={() => respondConnection('reject')} disabled={connectionActionLoading} className="text-xs px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">Reject</button>
                          </>
                        )}
                        {connectionStatus === 'accepted' && (
                          <button onClick={removeConnection} disabled={connectionActionLoading} className="text-xs px-3 py-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-60">Remove</button>
                        )}
                        {(connectionStatus === 'rejected' || connectionStatus === 'removed') && (
                          <button onClick={sendConnectionRequest} disabled={connectionActionLoading} className="text-xs px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Re-connect</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/30 to-blue-50/30">
                    {messages.map((m) => {
                      const mine = m.sender_email.toLowerCase() === currentUserEmail.toLowerCase();
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] ${mine ? 'order-last' : ''}`}>
                            <div className={`p-4 rounded-2xl shadow-md ${mine ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>
                              <p className="text-sm leading-relaxed">{m.content}</p>
                            </div>
                            <div className={`flex items-center gap-2 mt-2 text-xs font-medium ${mine ? 'justify-end text-blue-600' : 'justify-start text-gray-500'}`}>
                              <span> {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {mine && m.read_at && <span>✓✓</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-white/20 p-6 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                    <div className="flex items-center gap-4">
                      <button className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:shadow-lg hover:scale-110 transition-all duration-300">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder={connectionStatus === 'accepted' ? 'Type your message...' : 'Connect to start messaging'}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                          disabled={connectionStatus !== 'accepted'}
                          className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black placeholder-gray-500 pr-14 disabled:opacity-60"
                        />
                        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                          <Smile className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                      <button 
                        onClick={sendMessage} 
                        disabled={!input.trim() || connectionStatus !== 'accepted'}
                        className={`p-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
                          input.trim() && connectionStatus === 'accepted'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:scale-110'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <UserIcon className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent mb-3">
                      Select a conversation
                    </h3>
                    <p className="text-lg text-gray-600">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}
