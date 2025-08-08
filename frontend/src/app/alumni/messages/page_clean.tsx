'use client';

import { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import AlumniNavigation from '@/components/alumni/AlumniNavigation';
import { Search, MessageSquare, Users, Zap, TrendingUp, Send, Paperclip, Smile } from 'lucide-react';

function MessagesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedChat, setSelectedChat] = useState(1);
  const [newMessage, setNewMessage] = useState('');

  // Mock data for conversations
  const conversations = [
    {
      id: 1,
      name: 'Priya Sharma',
      lastMessage: 'Thank you for the mentoring session today! Your insights about the interview process were incredibly valuable.',
      time: '2h',
      unread: true,
      avatar: 'PS',
      status: 'online'
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      lastMessage: 'Could we schedule another meeting next week?',
      time: '4h',
      unread: true,
      avatar: 'RK',
      status: 'away'
    },
    {
      id: 3,
      name: 'Anita Patel',
      lastMessage: 'I got the job! Thanks for your guidance 🎉',
      time: '1d',
      unread: true,
      avatar: 'AP',
      status: 'offline'
    },
    {
      id: 4,
      name: 'Vikram Singh',
      lastMessage: 'Quick question about the project...',
      time: '2d',
      unread: false,
      avatar: 'VS',
      status: 'online'
    },
    {
      id: 5,
      name: 'Kavya Reddy',
      lastMessage: 'Would love to connect on LinkedIn!',
      time: '3d',
      unread: false,
      avatar: 'KR',
      status: 'offline'
    }
  ];

  // Mock messages for selected chat
  const messages = [
    {
      id: 1,
      senderId: 1,
      text: 'Hi! Thank you so much for the mentoring session today. Your insights about the interview process were incredibly valuable!',
      time: '2 hours ago',
      isOwn: false
    },
    {
      id: 2,
      senderId: 'me',
      text: "You're very welcome! I'm glad I could help. Remember to practice the STAR method for behavioral questions. You're going to do great!",
      time: '1 hour ago',
      isOwn: true
    },
    {
      id: 3,
      senderId: 1,
      text: "Absolutely! I'll practice those examples we discussed. Would it be possible to have a quick mock interview session before my actual interview next week?",
      time: '30 minutes ago',
      isOwn: false
    }
  ];

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <AlumniNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-3 bg-white/70 backdrop-blur-xl rounded-full px-6 py-3 shadow-lg border border-white/20">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-slate-900">Messages</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
              Stay <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Connected</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Connect with students, share knowledge, and build meaningful mentoring relationships
            </p>
          </div>

          {/* Messages Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              {/* Search and Tabs */}
              <div className="p-6 border-b border-slate-200/50 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-1 bg-slate-100 rounded-2xl p-1">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === 'all'
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('unread')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === 'unread'
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unread (3)
                  </button>
                </div>
              </div>

              {/* Conversations */}
              <div className="overflow-y-auto h-full">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedChat(conversation.id)}
                    className={`flex items-start space-x-4 p-4 cursor-pointer transition-all duration-300 ${
                      selectedChat === conversation.id
                        ? 'bg-blue-50 border-r-4 border-blue-500'
                        : 'hover:bg-blue-50'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">{conversation.avatar}</span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        conversation.status === 'online' ? 'bg-green-400' :
                        conversation.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 truncate">{conversation.name}</h4>
                        <span className="text-xs text-slate-500">{conversation.time}</span>
                      </div>
                      <p className="text-slate-600 text-sm truncate">{conversation.lastMessage}</p>
                      {conversation.unread && (
                        <div className="flex items-center mt-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="ml-2 text-xs text-blue-600 font-medium">Unread</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Content */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 flex flex-col">
              {/* Message Header */}
              {selectedConversation && (
                <div className="p-6 border-b border-slate-200/50">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">{selectedConversation.avatar}</span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                        selectedConversation.status === 'online' ? 'bg-green-400' :
                        selectedConversation.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-xl">{selectedConversation.name}</h3>
                      <p className="text-slate-600">Computer Science • Final Year</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedConversation.status === 'online' ? 'bg-green-400' :
                        selectedConversation.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        selectedConversation.status === 'online' ? 'text-green-600' :
                        selectedConversation.status === 'away' ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {selectedConversation.status.charAt(0).toUpperCase() + selectedConversation.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Thread */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`flex space-x-4 ${message.isOwn ? 'justify-end' : ''}`}>
                    {!message.isOwn && (
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">{selectedConversation?.avatar}</span>
                      </div>
                    )}
                    <div className={`flex-1 ${message.isOwn ? 'flex justify-end' : ''}`}>
                      <div className={`rounded-2xl p-4 max-w-md ${
                        message.isOwn
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                      }`}>
                        <p>{message.text}</p>
                      </div>
                      <span className="text-xs text-slate-500 mt-2 block">{message.time}</span>
                    </div>
                    {message.isOwn && (
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">You</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-slate-200/50">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <div className="bg-slate-100 rounded-2xl px-6 py-4 flex items-center space-x-4">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-500 focus:outline-none"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button className="text-slate-500 hover:text-slate-700 transition-colors">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button className="text-slate-500 hover:text-slate-700 transition-colors">
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">127</h3>
              <p className="text-slate-600 font-medium">Total Messages</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">23</h3>
              <p className="text-slate-600 font-medium">Active Chats</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">2.3h</h3>
              <p className="text-slate-600 font-medium">Avg Response</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">95%</h3>
              <p className="text-slate-600 font-medium">Response Rate</p>
            </div>
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}

export default withPageAuthRequired(MessagesPage);
