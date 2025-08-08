'use client';
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useAuth0 } from '@auth0/nextjs-auth0/client';
import { 
  MessageCircle, Search, Send, Users, Clock, Star, 
  CheckCheck, Paperclip, Smile, Check
} from 'lucide-react';
import { 
  Card, Button, Input, Avatar, AvatarImage, AvatarFallback, 
  Badge, Textarea, Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, Select, SelectContent, 
  SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui';
import { AlumniNavigation } from '@/components/alumni';

export default function MessagesPage() {
  // WebSocket Integration
  const { 
    socket, 
    isConnected, 
    sendMessage, 
    onlineUsers,
    typingUsers,
    startTyping, 
    stopTyping
  } = useWebSocket();
  const { user } = useAuth0();
  
  // State Management
  const [messages, setMessages] = useState([
    {
      id: 'msg_001',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332b331?w=150&h=150&fit=crop&crop=face',
      role: 'Alumni',
      batch: '2022-2023',
      status: 'online',
      lastMessage: 'Thank you for the mentoring session today!',
      time: '2h',
      unread: 2,
      isRead: false,
      isPinned: true,
      messages: [
        {
          id: 'submsg_001',
          sender: 'Sarah Chen',
          content: 'Hi! Thank you so much for the mentoring session today. Your insights about the interview process were incredibly valuable!',
          time: '2:30 PM',
          isOwn: false,
          status: 'delivered'
        },
        {
          id: 'submsg_002',
          sender: 'You',
          content: "You're very welcome! I'm glad I could help. Remember to practice the STAR method for behavioral questions. You're going to do great!",
          time: '2:45 PM',
          isOwn: true,
          status: 'read'
        },
        {
          id: 'submsg_003',
          sender: 'Sarah Chen',
          content: 'Absolutely! I\'ll practice those examples we discussed. Would it be possible to have a quick mock interview session before my actual interview next week?',
          time: '3:15 PM',
          isOwn: false,
          status: 'delivered'
        }
      ]
    },
    {
      id: 'msg_002',
      name: 'Michael Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      role: 'Student',
      batch: '2023-2024',
      status: 'online',
      lastMessage: 'Could we schedule another meeting next week?',
      time: '4h',
      unread: 1,
      isRead: false,
      isPinned: false,
      messages: [
        {
          id: 'submsg_004',
          sender: 'Michael Rodriguez',
          content: 'Hi! Could we schedule another meeting next week? I have some questions about the project we discussed.',
          time: '11:30 AM',
          isOwn: false,
          status: 'delivered'
        }
      ]
    },
    {
      id: 'msg_003',
      name: 'Jennifer Park',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      role: 'Alumni',
      batch: '2021-2022',
      status: 'offline',
      lastMessage: 'I got the job! Thanks for your guidance 🎉',
      time: '1d',
      unread: 0,
      isRead: true,
      isPinned: false,
      messages: [
        {
          id: 'submsg_005',
          sender: 'Jennifer Park',
          content: 'I got the job! Thanks for your guidance 🎉',
          time: 'Yesterday',
          isOwn: false,
          status: 'delivered'
        },
        {
          id: 'submsg_006',
          sender: 'You',
          content: 'Congratulations! I knew you could do it. Your preparation really paid off!',
          time: 'Yesterday',
          isOwn: true,
          status: 'read'
        }
      ]
    },
    {
      id: 'msg_004',
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'Student',
      batch: '2023-2024',
      status: 'offline',
      lastMessage: 'Quick question about the project...',
      time: '2d',
      unread: 0,
      isRead: true,
      isPinned: false,
      messages: [
        {
          id: 'submsg_007',
          sender: 'David Kim',
          content: 'Quick question about the project structure we discussed. Should I use Redux for state management?',
          time: '2 days ago',
          isOwn: false,
          status: 'delivered'
        },
        {
          id: 'submsg_008',
          sender: 'You',
          content: 'For a project of this size, React Context might be sufficient. Redux adds complexity that might not be needed.',
          time: '2 days ago',
          isOwn: true,
          status: 'read'
        }
      ]
    },
    {
      id: 'msg_005',
      name: 'Emma Wilson',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      role: 'Alumni',
      batch: '2020-2021',
      status: 'online',
      lastMessage: 'Would love to connect on LinkedIn!',
      time: '3d',
      unread: 0,
      isRead: true,
      isPinned: false,
      messages: [
        {
          id: 'submsg_009',
          sender: 'Emma Wilson',
          content: 'Hi! I saw your profile and would love to connect on LinkedIn. We have similar backgrounds!',
          time: '3 days ago',
          isOwn: false,
          status: 'delivered'
        }
      ]
    }
  ]);

  const [selectedChat, setSelectedChat] = useState(messages[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactMessage, setNewContactMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Refs for auto-scroll and textarea
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat.messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[placeholder*="Search"]')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Simulate message status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(prev => prev.map(msg => ({
        ...msg,
        messages: msg.messages.map(submsg => 
          submsg.isOwn && submsg.status === 'sent' 
            ? { ...submsg, status: Math.random() > 0.7 ? 'read' : 'delivered' }
            : submsg
        )
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // WebSocket Event Handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data) => {
      const { senderId, content, timestamp, conversationId } = data;
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === conversationId 
            ? {
                ...msg,
                messages: [...msg.messages, {
                  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  sender: senderId,
                  content,
                  time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isOwn: senderId === user?.sub,
                  status: 'delivered'
                }],
                lastMessage: content,
                time: 'now',
                unread: senderId !== user?.sub ? msg.unread + 1 : msg.unread
              }
            : msg
        )
      );

      // Show notification for new messages
      if (senderId !== user?.sub) {
        setNotification(`New message from ${senderId}`);
        setTimeout(() => setNotification(null), 3000);
      }
    };

    const handleTypingStart = (data) => {
      if (data.conversationId === selectedChat.id && data.userId !== user?.sub) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = (data) => {
      if (data.conversationId === selectedChat.id && data.userId !== user?.sub) {
        setIsTyping(false);
      }
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [socket, isConnected, selectedChat.id, user?.sub]);

  // Message filtering logic
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'unread' && message.unread > 0) ||
                      (activeTab === 'pinned' && message.isPinned);
    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    
    return matchesSearch && matchesTab && matchesStatus;
  });

  // Utility functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <Check className="w-3 h-3 text-slate-400" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-slate-400" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed': return <span className="text-red-500 text-xs">!</span>;
      default: return null;
    }
  };

  // Message handling
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    const messageContent = newMessage.trim();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Optimistic update
    const newMsg = {
      id: messageId,
      sender: 'You',
      content: messageContent,
      time: timestamp,
      isOwn: true,
      status: 'sent'
    };

    setSelectedChat(prev => ({
      ...prev,
      messages: [...prev.messages, newMsg]
    }));

    setMessages(prev => prev.map(msg => 
      msg.id === selectedChat.id 
        ? { 
            ...msg, 
            messages: [...msg.messages, newMsg],
            lastMessage: messageContent,
            time: 'now'
          }
        : msg
    ));

    setNewMessage('');

    try {
      // Send via WebSocket if connected
      if (isConnected && socket) {
        await sendMessage({
          conversationId: selectedChat.id,
          content: messageContent,
          recipientId: selectedChat.name,
          timestamp: new Date().toISOString()
        });

        // Update message status to delivered
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === selectedChat.id 
              ? {
                  ...msg,
                  messages: msg.messages.map(submsg => 
                    submsg.id === messageId ? { ...submsg, status: 'delivered' } : submsg
                  )
                }
              : msg
          ));
        }, 1000);
      } else {
        // Fallback: simulate message sending
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === selectedChat.id 
              ? {
                  ...msg,
                  messages: msg.messages.map(submsg => 
                    submsg.id === messageId ? { ...submsg, status: 'delivered' } : submsg
                  )
                }
              : msg
          ));
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === selectedChat.id 
          ? {
              ...msg,
              messages: msg.messages.map(submsg => 
                submsg.id === messageId ? { ...submsg, status: 'failed' } : submsg
              )
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryMessage = async (messageId, content) => {
    // Retry logic for failed messages
    setMessages(prev => prev.map(msg => 
      msg.id === selectedChat.id 
        ? {
            ...msg,
            messages: msg.messages.map(submsg => 
              submsg.id === messageId ? { ...submsg, status: 'sent' } : submsg
            )
          }
        : msg
    ));

    // Simulate retry
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === selectedChat.id 
          ? {
              ...msg,
              messages: msg.messages.map(submsg => 
                submsg.id === messageId ? { ...submsg, status: 'delivered' } : submsg
              )
            }
          : msg
      ));
    }, 1000);
  };

  const togglePin = (messageId) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
    ));
  };

  const handleSendNewMessage = () => {
    if (newContactMessage.trim() && newContactName) {
      // Generate unique IDs
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newConversation = {
        id: conversationId,
        name: newContactName,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
        role: "Alumni",
        batch: "2023-2024",
        status: "online",
        lastMessage: newContactMessage.trim(),
        time: "now",
        unread: 0,
        isRead: true,
        isPinned: false,
        messages: [{
          id: messageId,
          sender: "You",
          content: newContactMessage.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: true,
          status: "sent"
        }]
      };
      
      setMessages([newConversation, ...messages]);
      setSelectedChat(newConversation);
      setShowMobileChat(true);
      setShowNewMessageDialog(false);
      setNewContactName('');
      setNewContactMessage('');
      
      // Show success notification
      setNotification(`Started new conversation with ${newContactName}`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleChatSelect = (message) => {
    setSelectedChat(message);
    setShowMobileChat(true);
    
    // Mark as read
    if (message.unread > 0) {
      const updatedMessages = messages.map(msg => 
        msg.id === message.id ? { ...msg, unread: 0, isRead: true } : msg
      );
      setMessages(updatedMessages);
    }
  };

  return (
    <AlumniNavigation>
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-2 duration-300">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            {notification}
          </div>
        </div>
      )}

      {/* Clean background matching your UI */}
      <div className="p-4 lg:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Clean Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 flex items-center gap-3">
                💬 Messages
                {/* Connection Status Indicator */}
                <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full ${
                  isConnected 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-orange-100 text-orange-700 border border-orange-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-500 animate-pulse'
                  }`}></div>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </div>
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                Stay connected with your network
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    New Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Start New Conversation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Contact Name</label>
                      <Input
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Enter contact name..."
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Select Existing Contact</label>
                      <Select value={newContactName} onValueChange={setNewContactName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a contact..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alex Thompson">Alex Thompson - Software Engineer</SelectItem>
                          <SelectItem value="Jessica Rodriguez">Jessica Rodriguez - Product Manager</SelectItem>
                          <SelectItem value="James Parker">James Parker - Data Scientist</SelectItem>
                          <SelectItem value="Maria Garcia">Maria Garcia - UX Designer</SelectItem>
                          <SelectItem value="Robert Kim">Robert Kim - Marketing Specialist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Message</label>
                      <Textarea 
                        value={newContactMessage}
                        onChange={(e) => setNewContactMessage(e.target.value)}
                        placeholder="Type your message..." 
                        rows={4} 
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleSendNewMessage}
                        disabled={!newContactName || !newContactMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Sending...
                          </div>
                        ) : (
                          'Send Message'
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewMessageDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {/* Enhanced Search and Filter Bar */}
          <Card className="p-4 bg-white shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="🔍 Search messages, contacts... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-48 h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    <SelectItem value="online">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Online ({messages.filter(m => m.status === 'online').length})
                      </div>
                    </SelectItem>
                    <SelectItem value="offline">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Offline ({messages.filter(m => m.status === 'offline').length})
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Filter Results Summary */}
            {(searchQuery || filterStatus !== 'all') && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Showing {filteredMessages.length} of {messages.length} conversations
                  {searchQuery && <span className="ml-1">for "{searchQuery}"</span>}
                  {filterStatus !== 'all' && <span className="ml-1">({filterStatus})</span>}
                </p>
              </div>
            )}
          </Card>

          {/* Responsive Message Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message List - Hidden on mobile when chat is open */}
            <div className={`lg:col-span-1 bg-white rounded-xl shadow-md border border-slate-200 transition-all duration-300 ${
              showMobileChat ? 'hidden lg:block' : 'block'
            }`}>
              {/* Tab Navigation */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-2 px-3 rounded-md font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'all'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({messages.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('unread')}
                    className={`flex-1 py-2 px-3 rounded-md font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'unread'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Unread 
                      {messages.filter(m => m.unread > 0).length > 0 && (
                        <Badge className="bg-red-500 text-white text-xs min-w-4 h-4 rounded-full flex items-center justify-center">
                          {messages.filter(m => m.unread > 0).length}
                        </Badge>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('pinned')}
                    className={`flex-1 py-2 px-3 rounded-md font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'pinned'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <Star className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="max-h-96 lg:max-h-[500px] overflow-y-auto">
                {filteredMessages.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No conversations found</p>
                    <p className="text-slate-400 text-sm mt-1">
                      {searchQuery ? 'Try a different search term' : 'Start a new conversation'}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div 
                      key={message.id} 
                      onClick={() => handleChatSelect(message)}
                      className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-all duration-200 group ${
                        selectedChat.id === message.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12 ring-2 ring-white shadow-sm">
                            <AvatarImage src={message.avatar} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {message.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(message.status)} border-2 border-white rounded-full transition-all duration-200`}>
                            {onlineUsers.has(message.name) && (
                              <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{message.name}</h4>
                              {message.isPinned && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                              {onlineUsers.has(message.name) && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">{message.time}</span>
                              {message.unread > 0 && (
                                <Badge className="bg-blue-500 text-white text-xs min-w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                  {message.unread}
                                </Badge>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(message.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-6 w-6"
                              >
                                <Star className={`w-3 h-3 ${message.isPinned ? 'text-yellow-500 fill-current' : 'text-slate-400'}`} />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-500 mb-1">{message.role} • {message.batch}</p>
                          
                          <p className={`text-sm truncate ${!message.isRead ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                            {message.lastMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Message Content - Full width on mobile when open */}
            <div className={`lg:col-span-2 bg-white rounded-xl shadow-md border border-slate-200 transition-all duration-300 ${
              showMobileChat ? 'block' : 'hidden lg:block'
            }`}>
              {/* Message Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  {/* Mobile Back Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowMobileChat(false)}
                    className="lg:hidden mr-2 p-2"
                  >
                    ←
                  </Button>
                  
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative">
                      <Avatar className="w-12 h-12 ring-2 ring-white shadow-sm">
                        <AvatarImage src={selectedChat.avatar} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {selectedChat.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(selectedChat.status)} border-2 border-white rounded-full`}>
                        {onlineUsers.has(selectedChat.name) && (
                          <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-lg truncate">{selectedChat.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-600 text-sm truncate">{selectedChat.role} • {selectedChat.batch}</p>
                        {onlineUsers.has(selectedChat.name) && (
                          <span className="text-green-600 text-xs font-medium animate-pulse">• Active now</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="p-4 space-y-4 h-80 lg:h-96 overflow-y-auto bg-slate-50/50 scroll-smooth">
                {selectedChat.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Start the conversation</h3>
                    <p className="text-slate-500">Send a message to {selectedChat.name} to get started.</p>
                  </div>
                ) : (
                  <>
                    {selectedChat.messages.map((msg) => (
                      <div key={msg.id} className={`flex space-x-3 animate-in slide-in-from-bottom-2 duration-300 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          {msg.isOwn ? (
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs font-semibold">
                              You
                            </AvatarFallback>
                          ) : (
                            <AvatarImage src={selectedChat.avatar} className="object-cover" />
                          )}
                        </Avatar>
                        
                        <div className={`flex flex-col max-w-xs sm:max-w-sm lg:max-w-md ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-2xl px-4 py-3 transition-all duration-200 hover:shadow-md ${
                            msg.isOwn 
                              ? 'bg-blue-600 text-white rounded-br-sm hover:bg-blue-700' 
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm hover:shadow-md'
                          }`}>
                            <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                          </div>
                          
                          <div className={`flex items-center gap-2 mt-1 text-xs text-slate-500 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                            <span>{msg.time}</span>
                            {msg.isOwn && (
                              <div className="flex items-center gap-1">
                                {getMessageStatusIcon(msg.status)}
                                {msg.status === 'failed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRetryMessage(msg.id, msg.content)}
                                    className="text-red-500 hover:text-red-700 h-4 px-1 text-xs"
                                    title="Retry sending message"
                                  >
                                    Retry
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Dynamic Typing Indicator */}
                    {isTyping && (
                      <div className="flex space-x-3 animate-in slide-in-from-bottom-2 duration-300">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={selectedChat.avatar} className="object-cover" />
                        </Avatar>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Message Input */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center space-x-3 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                      <Textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          // Start typing indicator
                          if (e.target.value.trim() && isConnected) {
                            startTyping(selectedChat.id);
                          }
                        }}
                        onBlur={() => {
                          // Stop typing indicator when focus is lost
                          if (isConnected) {
                            stopTyping(selectedChat.id);
                          }
                        }}
                        placeholder={isConnected ? "Type your message..." : "Connecting..."}
                        className="flex-1 bg-transparent border-0 resize-none focus:ring-0 text-slate-900 placeholder-slate-500 min-h-[2.5rem] max-h-32 transition-all duration-200"
                        disabled={!isConnected}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (isConnected) {
                              stopTyping(selectedChat.id);
                              handleSendMessage();
                            }
                          }
                        }}
                        rows={1}
                      />
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-500 hover:text-slate-700 p-2 transition-all duration-200 hover:bg-slate-200 rounded-lg"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-500 hover:text-slate-700 p-2 transition-all duration-200 hover:bg-slate-200 rounded-lg"
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isLoading || !isConnected}
                    className={`p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isConnected 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
                    title={!isConnected ? 'Connecting to server...' : 'Send message'}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : !isConnected ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Responsive Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 lg:p-6 bg-white shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-slate-600">Total Messages</p>
                  <p className="text-xl lg:text-2xl font-bold text-slate-900">
                    {messages.reduce((total, msg) => total + msg.messages.length, 0)}
                  </p>
                </div>
                <div className="p-2 lg:p-3 bg-blue-100 rounded-xl">
                  <MessageCircle className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 lg:p-6 bg-white shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-slate-600">Active Chats</p>
                  <p className="text-xl lg:text-2xl font-bold text-slate-900">
                    {messages.filter(m => m.unread > 0 || onlineUsers.has(m.name)).length}
                  </p>
                </div>
                <div className="p-2 lg:p-3 bg-green-100 rounded-xl">
                  <Users className="w-4 h-4 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 lg:p-6 bg-white shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-slate-600">Online Now</p>
                  <p className="text-xl lg:text-2xl font-bold text-slate-900">
                    {onlineUsers.size}
                  </p>
                </div>
                <div className="p-2 lg:p-3 bg-purple-100 rounded-xl">
                  <Clock className="w-4 h-4 lg:w-6 lg:h-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 lg:p-6 bg-white shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-slate-600">Unread</p>
                  <p className="text-xl lg:text-2xl font-bold text-slate-900">
                    {messages.reduce((total, msg) => total + msg.unread, 0)}
                  </p>
                </div>
                <div className="p-2 lg:p-3 bg-orange-100 rounded-xl">
                  <CheckCheck className="w-4 h-4 lg:w-6 lg:h-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}

export default withPageAuthRequired(MessagesPage);
