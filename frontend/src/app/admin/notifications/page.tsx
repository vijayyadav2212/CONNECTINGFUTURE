  "use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import AdminNavigation from '../AdminNavigation';
import { 
  Bell, BellRing, BellOff, Check, CheckCheck, Trash2, Eye, 
  EyeOff, Filter, Search, Send, X, AlertCircle, Info, 
  CheckCircle, XCircle, Users, Briefcase, Calendar, Award,
  Clock, ChevronDown, MoreVertical, Mail, MessageSquare,
  Settings, Plus, ArrowUpRight, TrendingUp
} from 'lucide-react';

// Interfaces
interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  category: 'approval' | 'system' | 'user' | 'job' | 'event' | 'message';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    link: string;
  };
  sender?: {
    name: string;
    avatar: string;
  };
}

interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
}

export default function NotificationsPage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [showNewNotification, setShowNewNotification] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState<number | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'info' as Notification['type'],
    category: 'system' as Notification['category'],
    priority: 'medium' as Notification['priority'],
    title: '',
    message: '',
    recipients: 'all'
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Mock data - Replace with actual API calls
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'warning',
      category: 'approval',
      title: 'Pending Alumni Approval',
      message: 'John Doe has registered as an alumni and is waiting for approval.',
      timestamp: '2 minutes ago',
      read: false,
      priority: 'high',
      action: { label: 'Review Now', link: '/admin/approvals/alumni' },
      sender: { name: 'John Doe', avatar: 'JD' }
    },
    {
      id: 2,
      type: 'success',
      category: 'user',
      title: 'New User Registration',
      message: 'Jane Smith has successfully registered as a student.',
      timestamp: '15 minutes ago',
      read: false,
      priority: 'medium',
      sender: { name: 'Jane Smith', avatar: 'JS' }
    },
    {
      id: 3,
      type: 'info',
      category: 'job',
      title: 'New Job Posting',
      message: 'A new job posting for "Senior Software Engineer" has been submitted.',
      timestamp: '1 hour ago',
      read: true,
      priority: 'medium',
      action: { label: 'View Job', link: '/admin/jobs' }
    },
    {
      id: 4,
      type: 'alert',
      category: 'event',
      title: 'Event Starting Soon',
      message: 'Tech Talk: AI in Industry starts in 2 hours.',
      timestamp: '2 hours ago',
      read: false,
      priority: 'high',
      action: { label: 'View Event', link: '/admin/events' }
    },
    {
      id: 5,
      type: 'error',
      category: 'system',
      title: 'System Alert',
      message: 'Database backup failed. Immediate attention required.',
      timestamp: '3 hours ago',
      read: false,
      priority: 'high'
    },
    {
      id: 6,
      type: 'success',
      category: 'approval',
      title: 'Job Posting Approved',
      message: 'The job posting "Full Stack Developer" has been approved and published.',
      timestamp: '5 hours ago',
      read: true,
      priority: 'low'
    },
    {
      id: 7,
      type: 'info',
      category: 'message',
      title: 'New Message',
      message: 'You have received a new message from Amit Patel.',
      timestamp: '1 day ago',
      read: true,
      priority: 'low',
      sender: { name: 'Amit Patel', avatar: 'AP' }
    },
    {
      id: 8,
      type: 'warning',
      category: 'user',
      title: 'Suspicious Activity Detected',
      message: 'Multiple failed login attempts detected from IP 192.168.1.100.',
      timestamp: '2 days ago',
      read: true,
      priority: 'high'
    }
  ]);

  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    today: notifications.filter(n => n.timestamp.includes('minutes') || n.timestamp.includes('hour')).length,
    thisWeek: notifications.filter(n => !n.timestamp.includes('month')).length
  };

  const getTypeIcon = (type: Notification['type']) => {
    const icons = {
      info: <Info className="w-5 h-5" />,
      success: <CheckCircle className="w-5 h-5" />,
      warning: <AlertCircle className="w-5 h-5" />,
      error: <XCircle className="w-5 h-5" />,
      alert: <BellRing className="w-5 h-5" />
    };
    return icons[type];
  };

  const getTypeColor = (type: Notification['type']) => {
    const colors = {
      info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: 'bg-blue-100' },
      success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', icon: 'bg-green-100' },
      warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', icon: 'bg-yellow-100' },
      error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', icon: 'bg-red-100' },
      alert: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', icon: 'bg-purple-100' }
    };
    return colors[type];
  };

  const getCategoryIcon = (category: Notification['category']) => {
    const icons = {
      approval: <CheckCircle className="w-4 h-4" />,
      system: <Settings className="w-4 h-4" />,
      user: <Users className="w-4 h-4" />,
      job: <Briefcase className="w-4 h-4" />,
      event: <Calendar className="w-4 h-4" />,
      message: <MessageSquare className="w-4 h-4" />
    };
    return icons[category];
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    const styles = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = 
      selectedFilter === 'all' ? true :
      selectedFilter === 'unread' ? !notification.read :
      notification.read;
    
    const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory;
    
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesCategory && matchesSearch;
  });

  const unreadNotifications = useMemo(
    () => filteredNotifications.filter(n => !n.read),
    [filteredNotifications]
  );

  const readNotifications = useMemo(
    () => filteredNotifications.filter(n => n.read),
    [filteredNotifications]
  );

  const categoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return 'All categories';
    return selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
  }, [selectedCategory]);

  const hasActiveFilters =
    selectedFilter !== 'all' || selectedCategory !== 'all' || searchQuery.trim().length > 0;

  const activeNotification = useMemo(() => {
    if (activeNotificationId == null) return null;
    return notifications.find(n => n.id === activeNotificationId) ?? null;
  }, [activeNotificationId, notifications]);

  useEffect(() => {
    if (activeNotificationId != null) return;
    if (filteredNotifications.length === 0) return;
    setActiveNotificationId(filteredNotifications[0].id);
  }, [activeNotificationId, filteredNotifications]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showFilterMenu) return;
      const target = e.target as Node;
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showFilterMenu]);

  const handleMarkAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAsUnread = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: false } : n
    ));
  };

  const handleDelete = (id: number) => {
    if (activeNotificationId === id) {
      const idx = notifications.findIndex(n => n.id === id);
      const next = notifications[idx + 1]?.id ?? notifications[idx - 1]?.id ?? null;
      setActiveNotificationId(next);
    }
    setNotifications(notifications.filter(n => n.id !== id));
    setSelectedNotifications(selectedNotifications.filter(nId => nId !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setSelectedNotifications([]);
  };

  const clearFilters = () => {
    setSelectedFilter('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const handleBulkAction = (action: 'read' | 'unread' | 'delete') => {
    if (action === 'delete') {
      const remaining = notifications.filter(n => !selectedNotifications.includes(n.id));
      setNotifications(remaining);
      if (activeNotificationId != null && selectedNotifications.includes(activeNotificationId)) {
        setActiveNotificationId(remaining[0]?.id ?? null);
      }
    } else {
      setNotifications(notifications.map(n => 
        selectedNotifications.includes(n.id) 
          ? { ...n, read: action === 'read' } 
          : n
      ));
    }
    setSelectedNotifications([]);
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const toggleSelectNotification = (id: number) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(nId => nId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const openNotification = (id: number) => {
    setActiveNotificationId(id);
    setMobileDetailOpen(true);
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendNotification = () => {
    if (!validateForm()) {
      return;
    }

    setIsSending(true);

    // Simulate API call
    setTimeout(() => {
      const newNotification: Notification = {
        id: notifications.length + 1,
        type: formData.type,
        category: formData.category,
        priority: formData.priority,
        title: formData.title,
        message: formData.message,
        timestamp: 'Just now',
        read: false,
        sender: {
          name: 'Admin User',
          avatar: 'AD'
        }
      };

      setNotifications([newNotification, ...notifications]);
      setIsSending(false);
      setShowNewNotification(false);
      setShowSuccessPopup(true);

      // Reset form
      setFormData({
        type: 'info',
        category: 'system',
        priority: 'medium',
        title: '',
        message: '',
        recipients: 'all'
      });
      setFormErrors({});

      // Hide success popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    }, 1500);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <AdminNavigation>
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-gray-600 mt-2">Manage and monitor all system notifications</p>
          </div>
          <button
            onClick={() => setShowNewNotification(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            <Send className="w-4 h-4" />
            <span>Send Notification</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-gray-500">TOTAL</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</p>
            <p className="text-sm text-gray-500">All notifications</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <BellRing className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                {stats.unread}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.unread}</p>
            <p className="text-sm text-gray-500">Unread messages</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-gray-500">TODAY</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.today}</p>
            <p className="text-sm text-gray-500">New today</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-gray-500">THIS WEEK</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.thisWeek}</p>
            <p className="text-sm text-gray-500">Last 7 days</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setSelectedFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedFilter === 'unread'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread ({stats.unread})
              </button>
              <button
                onClick={() => setSelectedFilter('read')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedFilter === 'read'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Read ({notifications.length - stats.unread})
              </button>
            </div>

            {/* Category Filter */}
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center space-x-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all bg-white"
              >
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-sm text-gray-700">{categoryLabel}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10">
                  {['all', 'approval', 'system', 'user', 'job', 'event', 'message'].map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium flex items-center space-x-2 ${
                        selectedCategory === category ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {category !== 'all' && getCategoryIcon(category as any)}
                      <span className="capitalize">{category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700"
                title="Mark all notifications as read"
              >
                Mark all read
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700"
                  title="Clear search and filters"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedNotifications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-700">
                  {selectedNotifications.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('read')}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark Read</span>
                </button>
                <button
                  onClick={() => handleBulkAction('unread')}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Mark Unread</span>
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedNotifications([])}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Inbox Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-6">
          {/* Left: List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Inbox</h2>
                <p className="text-sm text-gray-500">
                  {filteredNotifications.length} shown · {unreadNotifications.length} unread
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={filteredNotifications.length > 0 && selectedNotifications.length === filteredNotifications.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Select all
                </label>
              </div>
            </div>

            {selectedNotifications.length > 0 && (
              <div className="px-6 py-3 border-b border-gray-100 bg-blue-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedNotifications.length} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction('read')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-green-700 bg-white border border-green-200 hover:bg-green-50 rounded-xl transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark read
                  </button>
                  <button
                    onClick={() => handleBulkAction('unread')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-orange-700 bg-white border border-orange-200 hover:bg-orange-50 rounded-xl transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Mark unread
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>

                <button
                  onClick={() => setSelectedNotifications([])}
                  className="text-sm font-semibold text-gray-700 hover:text-gray-900"
                >
                  Clear
                </button>
              </div>
            )}

            {filteredNotifications.length === 0 ? (
              <div className="p-10">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <BellOff className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">No notifications found</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm">
                    {searchQuery || selectedCategory !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'You\'re all caught up. No new notifications right now.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-h-[720px] overflow-auto">
                {unreadNotifications.length > 0 && (
                  <div className="px-6 py-2 text-xs font-bold text-gray-500 bg-gray-50 border-b border-gray-100">
                    UNREAD
                  </div>
                )}

                <div className="divide-y divide-gray-100">
                {unreadNotifications.map((notification) => {
                  const colors = getTypeColor(notification.type);
                  const isSelected = selectedNotifications.includes(notification.id);
                  const isActive = activeNotificationId === notification.id;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => openNotification(notification.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openNotification(notification.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-selected={isActive}
                      className={
                        `w-full text-left px-6 py-4 transition-colors ` +
                        (isActive ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50 border-l-4 border-transparent')
                      }
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectNotification(notification.id);
                          }}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />

                        <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center flex-shrink-0 ${colors.text}`}>
                          {getTypeIcon(notification.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {!notification.read && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                                <p className={`text-sm font-semibold truncate ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                  {notification.title}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">{notification.timestamp}</span>
                              {getPriorityBadge(notification.priority)}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                              {getCategoryIcon(notification.category)}
                              <span className="capitalize">{notification.category}</span>
                            </span>
                            {notification.sender && (
                              <span className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                  {notification.sender.avatar}
                                </span>
                                <span className="font-medium text-gray-700">{notification.sender.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>

                {readNotifications.length > 0 && (
                  <div className="px-6 py-2 text-xs font-bold text-gray-500 bg-gray-50 border-y border-gray-100">
                    READ
                  </div>
                )}

                <div className="divide-y divide-gray-100">
                {readNotifications.map((notification) => {
                  const colors = getTypeColor(notification.type);
                  const isSelected = selectedNotifications.includes(notification.id);
                  const isActive = activeNotificationId === notification.id;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => openNotification(notification.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openNotification(notification.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-selected={isActive}
                      className={
                        `w-full text-left px-6 py-4 transition-colors ` +
                        (isActive ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50 border-l-4 border-transparent')
                      }
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectNotification(notification.id);
                          }}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />

                        <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center flex-shrink-0 ${colors.text}`}>
                          {getTypeIcon(notification.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-semibold truncate ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                  {notification.title}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">{notification.timestamp}</span>
                              {getPriorityBadge(notification.priority)}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                              {getCategoryIcon(notification.category)}
                              <span className="capitalize">{notification.category}</span>
                            </span>
                            {notification.sender && (
                              <span className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                  {notification.sender.avatar}
                                </span>
                                <span className="font-medium text-gray-700">{notification.sender.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Detail */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {!activeNotification ? (
              <div className="p-10">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Select a notification</h3>
                  <p className="text-sm text-gray-500 mt-1">Choose an item from the inbox to view details.</p>
                </div>
              </div>
            ) : (
              (() => {
                const colors = getTypeColor(activeNotification.type);
                return (
                  <>
                    <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 ${colors.icon} rounded-2xl flex items-center justify-center flex-shrink-0 ${colors.text}`}>
                          {getTypeIcon(activeNotification.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-gray-900">{activeNotification.title}</h2>
                            {getPriorityBadge(activeNotification.priority)}
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                              {getCategoryIcon(activeNotification.category)}
                              <span className="capitalize">{activeNotification.category}</span>
                            </span>
                            {!activeNotification.read && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                                Unread
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {activeNotification.timestamp}
                            </span>
                            {activeNotification.sender && (
                              <span className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {activeNotification.sender.avatar}
                                </span>
                                <span className="font-medium text-gray-700">{activeNotification.sender.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!activeNotification.read ? (
                          <button
                            onClick={() => handleMarkAsRead(activeNotification.id)}
                            className="px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                            title="Mark as read"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Check className="w-4 h-4" />
                              Mark read
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkAsUnread(activeNotification.id)}
                            className="px-3 py-2 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
                            title="Mark as unread"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Mark unread
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(activeNotification.id)}
                          className="px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                        <p className="text-sm text-gray-800 leading-relaxed">{activeNotification.message}</p>
                      </div>

                      {activeNotification.action && (
                        <div className="mt-4 flex items-center justify-end">
                          <Link
                            href={activeNotification.action.link}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold"
                          >
                            {activeNotification.action.label}
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>

        {/* Mobile detail overlay */}
        {mobileDetailOpen && activeNotification && (
          <div className="fixed inset-0 bg-white z-50 lg:hidden">
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setMobileDetailOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 text-sm font-semibold text-gray-700"
                >
                  Back
                </button>
                <div className="text-sm font-bold text-gray-900">Notification</div>
                <div className="w-14" />
              </div>

              <div className="flex-1 overflow-auto">
                {(() => {
                  const colors = getTypeColor(activeNotification.type);
                  return (
                    <>
                      <div className="px-5 py-5 border-b border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className={`w-11 h-11 ${colors.icon} rounded-2xl flex items-center justify-center flex-shrink-0 ${colors.text}`}>
                            {getTypeIcon(activeNotification.type)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-base font-bold text-gray-900">{activeNotification.title}</h2>
                              {getPriorityBadge(activeNotification.priority)}
                              {!activeNotification.read && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                                  Unread
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {activeNotification.timestamp}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                          <p className="text-sm text-gray-800 leading-relaxed">{activeNotification.message}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!activeNotification.read ? (
                            <button
                              onClick={() => handleMarkAsRead(activeNotification.id)}
                              className="px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Mark read
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsUnread(activeNotification.id)}
                              className="px-3 py-2 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Mark unread
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleDelete(activeNotification.id);
                              setMobileDetailOpen(false);
                            }}
                            className="px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </span>
                          </button>
                        </div>

                        {activeNotification.action && (
                          <Link
                            href={activeNotification.action.link}
                            className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold"
                          >
                            {activeNotification.action.label}
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Send Notification Modal */}
        {showNewNotification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Send New Notification</h3>
                <button
                  onClick={() => setShowNewNotification(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notification Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="system">System</option>
                    <option value="user">User</option>
                    <option value="approval">Approval</option>
                    <option value="job">Job</option>
                    <option value="event">Event</option>
                    <option value="message">Message</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => handleFormChange('priority', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="Enter notification title"
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 ${
                      formErrors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleFormChange('message', e.target.value)}
                    placeholder="Enter notification message"
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none ${
                      formErrors.message ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.message && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recipients</label>
                  <select 
                    value={formData.recipients}
                    onChange={(e) => handleFormChange('recipients', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="alumni">Alumni Only</option>
                    <option value="students">Students Only</option>
                    <option value="admins">Admins Only</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowNewNotification(false);
                      setFormErrors({});
                    }}
                    disabled={isSending}
                    className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendNotification}
                    disabled={isSending}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg rounded-xl transition-all font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Notification</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-200 p-6 max-w-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Successfully Sent!</h4>
                  <p className="text-sm text-gray-600">
                    Your notification has been sent to {formData.recipients === 'all' ? 'all users' : formData.recipients}.
                  </p>
                </div>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 animate-[shrink_3s_linear]"
                  style={{
                    animation: 'shrink 3s linear forwards'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminNavigation>
  );
}
