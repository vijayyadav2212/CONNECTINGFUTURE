"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AlumniNavigation from "../AluminaNavigation/AlumniNavigation";
import { useUser } from "@auth0/nextjs-auth0/client";

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
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [selectedOther, setSelectedOther] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string>("");

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
      const resp = await fetch(`${API_ROOT}/messages`, {
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
      <div className="p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 min-h-screen">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-4xl">💬</span>
                    <h1 className="text-4xl font-black">Messages</h1>
                  </div>
                  <p className="text-cyan-100 text-xl">Stay connected with your network</p>
                </div>
                <button
                  onClick={() => setSelectedOther(null)}
                  className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/30 transition-all duration-300 shadow-lg border border-white/20"
                >
                  New Message
                </button>
              </div>
            </div>
          </div>

          {/* Message Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Threads list */}
            <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20">
              {/* Tab Navigation */}
              <div className="p-6 border-b border-slate-200/50">
                <div className="flex space-x-1 bg-slate-100 rounded-2xl p-1">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === "all" ? "bg-white text-blue-600 shadow-lg" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab("unread")}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === "unread" ? "bg-white text-blue-600 shadow-lg" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Unread
                  </button>
                </div>
              </div>

              {/* Threads */}
              <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                {loadingThreads && <p className="text-sm text-slate-500">Loading...</p>}
                {threads
                  .filter((t) => (activeTab === "unread" ? t.unread > 0 : true))
                  .map((t) => (
                    <button
                      key={t.thread_key}
                      onClick={() => setSelectedOther(t.other)}
                      className={`w-full text-left p-4 rounded-2xl hover:bg-blue-50 transition-all duration-300 border ${
                        selectedOther === t.other ? "border-blue-400 bg-blue-50" : "border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-900 truncate">{t.other}</div>
                        {t.unread > 0 && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">{t.unread}</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 truncate">{t.last_message}</div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(t.last_at).toLocaleString()}</div>
                    </button>
                  ))}
                {!loadingThreads && threads.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">No conversations yet. Start one:</p>
                    {DEMO_CONTACTS.map((email) => (
                      <button
                        key={email}
                        onClick={() => setSelectedOther(email)}
                        className={`w-full text-left p-3 rounded-xl border hover:bg-blue-50 ${
                          selectedOther === email ? "border-blue-400 bg-blue-50" : "border-slate-200"
                        }`}
                      >
                        <span className="font-medium text-slate-800">{email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Conversation */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-200/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">{selectedOther ?? "Select a conversation"}</h3>
                  {selectedOther && <p className="text-slate-600">Secure conversation (AES-256-GCM)</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                {loadingMessages && <p className="text-sm text-slate-500">Loading...</p>}
                {messages.map((m) => {
                  const mine = m.sender_email.toLowerCase() === currentUserEmail.toLowerCase();
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl shadow ${
                          mine ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                        <div className={`text-[10px] mt-1 ${mine ? "text-blue-100" : "text-slate-500"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {mine && m.read_at && <span className="ml-2">✓✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-slate-200/50 flex items-center gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  placeholder={selectedOther ? "Type a message..." : "Select or start a conversation"}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedOther}
                />
                <button
                  onClick={sendMessage}
                  disabled={!canSend}
                  className="px-6 py-3 rounded-2xl font-semibold text-white bg-blue-600 disabled:bg-blue-300 hover:bg-blue-700"
                >
                  Send
                </button>
              </div>

              {error && <div className="px-6 pb-4 text-sm text-red-600">{error}</div>}
            </div>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}
