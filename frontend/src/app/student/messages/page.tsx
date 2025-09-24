"use client";

import React, { useState, useEffect } from 'react';
import StudentNavigation from '../StudentNavigation';
import { Search, Send, Paperclip, Smile, Phone, Video, MoreHorizontal, User, Clock, Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isFromMe: boolean;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  role: 'alumni' | 'student' | 'mentor';
}

const MessagesPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  const mockConversations: Conversation[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      lastMessage: 'Thanks for your advice on the internship application!',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      unreadCount: 0,
      isOnline: true,
      role: 'alumni'
    },
    {
      id: '2',
      name: 'Michael Chen (Mentor)',
      lastMessage: 'Let\'s schedule a call to discuss your career goals.',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unreadCount: 2,
      isOnline: false,
      role: 'mentor'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      lastMessage: 'I can share some resources for hardware engineering.',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      unreadCount: 1,
      isOnline: true,
      role: 'alumni'
    },
    {
      id: '4',
      name: 'David Kim',
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

  useEffect(() => {
    setTimeout(() => {
      setConversations(mockConversations);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (selectedConversation && mockMessages[selectedConversation]) {
      setMessages(mockMessages[selectedConversation]);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      timestamp: new Date(),
      isFromMe: true,
      status: 'sent'
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Update conversation last message
    setConversations(conversations.map(conv =>
      conv.id === selectedConversation
        ? { ...conv, lastMessage: message.text, lastMessageTime: message.timestamp }
        : conv
    ));
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              💬 Messages
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with alumni, mentors, and fellow students to build your professional network
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
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
                <div className="max-h-[580px] overflow-y-auto">
                  {filteredConversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-5 border-b border-white/20 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 hover:transform hover:scale-[1.02] ${
                        selectedConversation === conv.id 
                          ? 'bg-gradient-to-r from-blue-100/70 to-purple-100/70 border-blue-200 shadow-md' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {conv.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {conv.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 border-3 border-white rounded-full shadow-lg"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-900 truncate text-lg">{conv.name}</h3>
                            <span className="text-xs font-medium bg-gradient-to-r from-gray-500 to-gray-600 bg-clip-text text-transparent">
                              {formatTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-gray-600 truncate flex-1 leading-relaxed">{conv.lastMessage}</p>
                            {conv.unreadCount > 0 && (
                              <span className="ml-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full px-3 py-1 min-w-[24px] text-center font-semibold shadow-lg">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                              conv.role === 'alumni' 
                                ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700'
                                : conv.role === 'mentor'
                                ? 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700'
                                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                            }`}>
                              {conv.role.toUpperCase()}
                            </span>
                            {conv.isOnline && (
                              <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full font-medium">
                                • Online
                              </span>
                            )}
                          </div>
                        </div>
                    </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>            {/* Chat Area */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 flex flex-col overflow-hidden">
              {selectedConversation ? (
                  <div>
                  {/* Chat Header */}
                  <div className="p-6 border-b border-white/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          {conversations.find(c => c.id === selectedConversation)?.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-gray-900">
                            {conversations.find(c => c.id === selectedConversation)?.name}
                          </h3>
                          <p className="text-sm font-medium">
                            <span className={`inline-flex items-center gap-2 ${
                              conversations.find(c => c.id === selectedConversation)?.isOnline 
                                ? 'text-green-600' 
                                : 'text-gray-500'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                conversations.find(c => c.id === selectedConversation)?.isOnline 
                                  ? 'bg-green-500' 
                                  : 'bg-gray-400'
                              }`}></div>
                              {conversations.find(c => c.id === selectedConversation)?.isOnline ? 'Online' : 'Offline'}
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
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/30 to-blue-50/30">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${message.isFromMe ? 'order-last' : ''}`}>
                          <div
                            className={`p-4 rounded-2xl shadow-md ${
                              message.isFromMe
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.text}</p>
                          </div>
                          <div className={`flex items-center gap-2 mt-2 text-xs font-medium ${
                            message.isFromMe ? 'justify-end text-blue-600' : 'justify-start text-gray-500'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(message.timestamp)}</span>
                            {message.isFromMe && (
                              <div className={`${
                                message.status === 'read' ? 'text-blue-600' : 'text-gray-400'
                              }`}>
                                {getStatusIcon(message.status)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500 pr-14"
                        />
                        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                          <Smile className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                      <button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim()}
                        className={`p-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
                          newMessage.trim()
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:scale-110'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <User className="w-20 h-20 mx-auto mb-6 text-gray-300" />
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
    </StudentNavigation>
  );
};

export default MessagesPage;