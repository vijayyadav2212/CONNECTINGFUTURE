"use client";

import React, { useState } from 'react';
import AdminNavigation from '../AdminNavigation';
import { 
  Settings, Save, RefreshCw, Shield, Bell, Users, 
  Mail, Database, Globe, Lock, Eye, EyeOff, 
  Upload, Download, Trash2, Check, X, AlertCircle,
  Server, Key, Zap, Clock, Calendar, FileText,
  Image, Palette, Code, Link2, ChevronRight,
  ToggleLeft, ToggleRight, Info, CheckCircle, Send
} from 'lucide-react';

// Interfaces
interface SettingsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SettingItem {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'input' | 'select' | 'textarea' | 'file';
  value: any;
  options?: { label: string; value: string }[];
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'ConnectingFuture',
    siteDescription: 'Alumni and Student Connection Platform',
    adminEmail: 'admin@connectingfuture.com',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    language: 'en'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    approvalNotifications: true,
    newUserNotifications: true,
    jobPostingNotifications: true,
    eventNotifications: true,
    messageNotifications: false,
    weeklyDigest: true,
    notificationSound: true
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    loginAttempts: '5',
    requireStrongPassword: true,
    allowMultipleSessions: false,
    ipWhitelist: '',
    maintenanceMode: false
  });

  // User Settings
  const [userSettings, setUserSettings] = useState({
    autoApproveAlumni: false,
    autoApproveStudents: false,
    requireEmailVerification: true,
    allowSelfRegistration: true,
    defaultUserRole: 'user',
    profileVisibility: 'public',
    maxProfileSize: '5'
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    fromEmail: 'noreply@connectingfuture.com',
    fromName: 'ConnectingFuture'
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    logo: null,
    favicon: null,
    darkMode: false,
    compactMode: false,
    animationsEnabled: true
  });

  const tabs: SettingsTab[] = [
    { id: 'general', label: 'General', icon: <Settings className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" />, badge: 2 },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'email', label: 'Email', icon: <Mail className="w-5 h-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-5 h-5" /> },
    { id: 'database', label: 'Database', icon: <Database className="w-5 h-5" /> },
    { id: 'advanced', label: 'Advanced', icon: <Code className="w-5 h-5" /> }
  ];

  const handleSaveSettings = () => {
    // Implement save logic here
    console.log('Saving settings...');
    setShowSaveSuccess(true);
    setUnsavedChanges(false);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      // Reset logic here
      console.log('Resetting settings...');
    }
  };

  const ToggleSwitch = ({ checked, onChange, label, description }: any) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <label className="text-sm font-semibold text-gray-900 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => {
          onChange(!checked);
          setUnsavedChanges(true);
        }}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '', icon }: any) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setUnsavedChanges(true);
          }}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
        />
      </div>
    </div>
  );

  const SelectField = ({ label, value, onChange, options }: any) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setUnsavedChanges(true);
        }}
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer"
      >
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <AdminNavigation>
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 mt-2">Manage your platform configuration and preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetSettings}
              className="flex items-center space-x-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={!unsavedChanges}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all font-medium ${
                unsavedChanges
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSaveSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">Settings saved successfully!</p>
              <p className="text-xs text-green-700">Your changes have been applied.</p>
            </div>
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {unsavedChanges && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm font-medium text-yellow-900">
              You have unsaved changes. Don't forget to save before leaving this page.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 sticky top-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all mb-1 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {tab.icon}
                    <span className="font-medium text-sm">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">General Settings</h2>
                  <p className="text-sm text-gray-500">Configure basic platform information</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Site Name"
                    value={generalSettings.siteName}
                    onChange={(val: string) => setGeneralSettings({ ...generalSettings, siteName: val })}
                    placeholder="Enter site name"
                    icon={<Globe className="w-4 h-4" />}
                  />
                  <InputField
                    label="Admin Email"
                    value={generalSettings.adminEmail}
                    onChange={(val: string) => setGeneralSettings({ ...generalSettings, adminEmail: val })}
                    type="email"
                    placeholder="admin@example.com"
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <SelectField
                    label="Timezone"
                    value={generalSettings.timezone}
                    onChange={(val: string) => setGeneralSettings({ ...generalSettings, timezone: val })}
                    options={[
                      { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
                      { label: 'America/New_York (EST)', value: 'America/New_York' },
                      { label: 'Europe/London (GMT)', value: 'Europe/London' },
                      { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' }
                    ]}
                  />
                  <SelectField
                    label="Date Format"
                    value={generalSettings.dateFormat}
                    onChange={(val: string) => setGeneralSettings({ ...generalSettings, dateFormat: val })}
                    options={[
                      { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
                      { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
                      { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Site Description</label>
                  <textarea
                    value={generalSettings.siteDescription}
                    onChange={(e) => {
                      setGeneralSettings({ ...generalSettings, siteDescription: e.target.value });
                      setUnsavedChanges(true);
                    }}
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Security Settings</h2>
                    <p className="text-sm text-gray-500">Protect your platform with advanced security features</p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <ToggleSwitch
                    checked={securitySettings.twoFactorAuth}
                    onChange={(val: boolean) => setSecuritySettings({ ...securitySettings, twoFactorAuth: val })}
                    label="Two-Factor Authentication"
                    description="Require 2FA for all admin accounts"
                  />
                  <ToggleSwitch
                    checked={securitySettings.requireStrongPassword}
                    onChange={(val: boolean) => setSecuritySettings({ ...securitySettings, requireStrongPassword: val })}
                    label="Strong Password Policy"
                    description="Enforce minimum 8 characters with special characters"
                  />
                  <ToggleSwitch
                    checked={securitySettings.allowMultipleSessions}
                    onChange={(val: boolean) => setSecuritySettings({ ...securitySettings, allowMultipleSessions: val })}
                    label="Allow Multiple Sessions"
                    description="Users can log in from multiple devices"
                  />
                  <ToggleSwitch
                    checked={securitySettings.maintenanceMode}
                    onChange={(val: boolean) => setSecuritySettings({ ...securitySettings, maintenanceMode: val })}
                    label="Maintenance Mode"
                    description="Temporarily disable public access to the platform"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                  <InputField
                    label="Session Timeout (minutes)"
                    value={securitySettings.sessionTimeout}
                    onChange={(val: string) => setSecuritySettings({ ...securitySettings, sessionTimeout: val })}
                    type="number"
                    icon={<Clock className="w-4 h-4" />}
                  />
                  <InputField
                    label="Password Expiry (days)"
                    value={securitySettings.passwordExpiry}
                    onChange={(val: string) => setSecuritySettings({ ...securitySettings, passwordExpiry: val })}
                    type="number"
                    icon={<Calendar className="w-4 h-4" />}
                  />
                  <InputField
                    label="Max Login Attempts"
                    value={securitySettings.loginAttempts}
                    onChange={(val: string) => setSecuritySettings({ ...securitySettings, loginAttempts: val })}
                    type="number"
                    icon={<Lock className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">IP Whitelist</label>
                  <textarea
                    value={securitySettings.ipWhitelist}
                    onChange={(e) => {
                      setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value });
                      setUnsavedChanges(true);
                    }}
                    placeholder="Enter IP addresses (one per line)"
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Only these IPs will be able to access the admin panel</p>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Notification Settings</h2>
                    <p className="text-sm text-gray-500">Manage how you receive notifications</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Bell className="w-6 h-6 text-orange-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <ToggleSwitch
                    checked={notificationSettings.emailNotifications}
                    onChange={(val: boolean) => setNotificationSettings({ ...notificationSettings, emailNotifications: val })}
                    label="Email Notifications"
                    description="Receive notifications via email"
                  />
                  <ToggleSwitch
                    checked={notificationSettings.pushNotifications}
                    onChange={(val: boolean) => setNotificationSettings({ ...notificationSettings, pushNotifications: val })}
                    label="Push Notifications"
                    description="Browser push notifications for real-time updates"
                  />
                  <ToggleSwitch
                    checked={notificationSettings.notificationSound}
                    onChange={(val: boolean) => setNotificationSettings({ ...notificationSettings, notificationSound: val })}
                    label="Notification Sound"
                    description="Play sound when receiving notifications"
                  />
                  <ToggleSwitch
                    checked={notificationSettings.weeklyDigest}
                    onChange={(val: boolean) => setNotificationSettings({ ...notificationSettings, weeklyDigest: val })}
                    label="Weekly Digest Email"
                    description="Receive weekly summary of platform activity"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Notification Types</h3>
                  <div className="space-y-3">
                    <ToggleSwitch
                      checked={notificationSettings.approvalNotifications}
                      onChange={(val: boolean) => setNotificationSettings({ ...notificationSettings, approvalNotifications: val })}
                      label="Approval Requests"
                      description="When new approvals are pending"
                    />
                    <ToggleSwitch
                      checked={notificationSettings.newUserNotifications}
                      onChange={(val: boolean) => setNotificationSettings({ ...notificationSettings, newUserNotifications: val })}
                      label="New User Registrations"
                      description="When users register on the platform"
                    />
                    <ToggleSwitch
                      checked={notificationSettings.jobPostingNotifications}
                      onChange={(val: boolean) => setNotificationSettings({ ...notificationSettings, jobPostingNotifications: val })}
                      label="Job Postings"
                      description="When new jobs are submitted"
                    />
                    <ToggleSwitch
                      checked={notificationSettings.eventNotifications}
                      onChange={(val: boolean) => setNotificationSettings({ ...notificationSettings, eventNotifications: val })}
                      label="Event Updates"
                      description="When events are created or modified"
                    />
                    <ToggleSwitch
                      checked={notificationSettings.messageNotifications}
                      onChange={(val: boolean) => setNotificationSettings({ ...notificationSettings, messageNotifications: val })}
                      label="Direct Messages"
                      description="When you receive messages"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* User Settings */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">User Settings</h2>
                    <p className="text-sm text-gray-500">Configure user registration and permissions</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <ToggleSwitch
                    checked={userSettings.allowSelfRegistration}
                    onChange={(val: boolean) => setUserSettings({ ...userSettings, allowSelfRegistration: val })}
                    label="Allow Self Registration"
                    description="Users can register without admin approval"
                  />
                  <ToggleSwitch
                    checked={userSettings.requireEmailVerification}
                    onChange={(val: boolean) => setUserSettings({ ...userSettings, requireEmailVerification: val })}
                    label="Require Email Verification"
                    description="Users must verify their email before accessing the platform"
                  />
                  <ToggleSwitch
                    checked={userSettings.autoApproveAlumni}
                    onChange={(val: boolean) => setUserSettings({ ...userSettings, autoApproveAlumni: val })}
                    label="Auto-Approve Alumni"
                    description="Automatically approve alumni registrations"
                  />
                  <ToggleSwitch
                    checked={userSettings.autoApproveStudents}
                    onChange={(val: boolean) => setUserSettings({ ...userSettings, autoApproveStudents: val })}
                    label="Auto-Approve Students"
                    description="Automatically approve student registrations"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  <SelectField
                    label="Default User Role"
                    value={userSettings.defaultUserRole}
                    onChange={(val: string) => setUserSettings({ ...userSettings, defaultUserRole: val })}
                    options={[
                      { label: 'User', value: 'user' },
                      { label: 'Moderator', value: 'moderator' },
                      { label: 'Admin', value: 'admin' }
                    ]}
                  />
                  <SelectField
                    label="Profile Visibility"
                    value={userSettings.profileVisibility}
                    onChange={(val: string) => setUserSettings({ ...userSettings, profileVisibility: val })}
                    options={[
                      { label: 'Public', value: 'public' },
                      { label: 'Members Only', value: 'members' },
                      { label: 'Private', value: 'private' }
                    ]}
                  />
                  <InputField
                    label="Max Profile Image Size (MB)"
                    value={userSettings.maxProfileSize}
                    onChange={(val: string) => setUserSettings({ ...userSettings, maxProfileSize: val })}
                    type="number"
                    icon={<Image className="w-4 h-4" />}
                  />
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Email Configuration</h2>
                    <p className="text-sm text-gray-500">Configure SMTP settings for outgoing emails</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="SMTP Host"
                    value={emailSettings.smtpHost}
                    onChange={(val: string) => setEmailSettings({ ...emailSettings, smtpHost: val })}
                    placeholder="smtp.gmail.com"
                    icon={<Server className="w-4 h-4" />}
                  />
                  <InputField
                    label="SMTP Port"
                    value={emailSettings.smtpPort}
                    onChange={(val: string) => setEmailSettings({ ...emailSettings, smtpPort: val })}
                    type="number"
                    placeholder="587"
                    icon={<Link2 className="w-4 h-4" />}
                  />
                  <InputField
                    label="SMTP Username"
                    value={emailSettings.smtpUsername}
                    onChange={(val: string) => setEmailSettings({ ...emailSettings, smtpUsername: val })}
                    placeholder="your-email@gmail.com"
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Password</label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={emailSettings.smtpPassword}
                        onChange={(e) => {
                          setEmailSettings({ ...emailSettings, smtpPassword: e.target.value });
                          setUnsavedChanges(true);
                        }}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <SelectField
                    label="Encryption"
                    value={emailSettings.smtpEncryption}
                    onChange={(val: string) => setEmailSettings({ ...emailSettings, smtpEncryption: val })}
                    options={[
                      { label: 'TLS', value: 'tls' },
                      { label: 'SSL', value: 'ssl' },
                      { label: 'None', value: 'none' }
                    ]}
                  />
                  <InputField
                    label="From Email"
                    value={emailSettings.fromEmail}
                    onChange={(val: string) => setEmailSettings({ ...emailSettings, fromEmail: val })}
                    type="email"
                    placeholder="noreply@example.com"
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <InputField
                    label="From Name"
                    value={emailSettings.fromName}
                    onChange={(val: string) => setEmailSettings({ ...emailSettings, fromName: val })}
                    placeholder="ConnectingFuture"
                    icon={<FileText className="w-4 h-4" />}
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-medium">
                    <Send className="w-4 h-4" />
                    <span>Send Test Email</span>
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Appearance Settings</h2>
                    <p className="text-sm text-gray-500">Customize the look and feel of your platform</p>
                  </div>
                  <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center">
                    <Palette className="w-6 h-6 text-pink-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <ToggleSwitch
                    checked={appearanceSettings.darkMode}
                    onChange={(val: boolean) => setAppearanceSettings({ ...appearanceSettings, darkMode: val })}
                    label="Dark Mode"
                    description="Enable dark theme across the platform"
                  />
                  <ToggleSwitch
                    checked={appearanceSettings.compactMode}
                    onChange={(val: boolean) => setAppearanceSettings({ ...appearanceSettings, compactMode: val })}
                    label="Compact Mode"
                    description="Reduce spacing and padding for more content"
                  />
                  <ToggleSwitch
                    checked={appearanceSettings.animationsEnabled}
                    onChange={(val: boolean) => setAppearanceSettings({ ...appearanceSettings, animationsEnabled: val })}
                    label="Animations"
                    description="Enable smooth transitions and animations"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={appearanceSettings.primaryColor}
                        onChange={(e) => {
                          setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value });
                          setUnsavedChanges(true);
                        }}
                        className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={appearanceSettings.primaryColor}
                        onChange={(e) => {
                          setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value });
                          setUnsavedChanges(true);
                        }}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Secondary Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={appearanceSettings.secondaryColor}
                        onChange={(e) => {
                          setAppearanceSettings({ ...appearanceSettings, secondaryColor: e.target.value });
                          setUnsavedChanges(true);
                        }}
                        className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={appearanceSettings.secondaryColor}
                        onChange={(e) => {
                          setAppearanceSettings({ ...appearanceSettings, secondaryColor: e.target.value });
                          setUnsavedChanges(true);
                        }}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Logo</label>
                    <div className="flex items-center space-x-3">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        CF
                      </div>
                      <button className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium text-gray-700">
                        <Upload className="w-4 h-4" />
                        <span>Upload Logo</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Favicon</label>
                    <div className="flex items-center space-x-3">
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                      <button className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium text-gray-700">
                        <Upload className="w-4 h-4" />
                        <span>Upload Favicon</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Database Settings */}
            {activeTab === 'database' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Database Management</h2>
                    <p className="text-sm text-gray-500">Backup and maintain your database</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-green-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-100">
                    <Database className="w-8 h-8 text-blue-600 mb-3" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Database Size</p>
                    <p className="text-2xl font-bold text-blue-900">2.4 GB</p>
                  </div>
                  <div className="p-6 bg-green-50 rounded-xl border-2 border-green-100">
                    <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Last Backup</p>
                    <p className="text-2xl font-bold text-green-900">2 hrs ago</p>
                  </div>
                  <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-100">
                    <Zap className="w-8 h-8 text-purple-600 mb-3" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Total Records</p>
                    <p className="text-2xl font-bold text-purple-900">24,891</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg">
                    <Download className="w-5 h-5" />
                    <span>Backup Database</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium">
                    <Upload className="w-5 h-5" />
                    <span>Restore from Backup</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 px-6 py-4 border-2 border-orange-200 text-orange-600 rounded-xl hover:bg-orange-50 transition-all font-medium">
                    <RefreshCw className="w-5 h-5" />
                    <span>Optimize Database</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 px-6 py-4 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-medium">
                    <Trash2 className="w-5 h-5" />
                    <span>Clear Cache</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Automatic Backups</h3>
                  <div className="space-y-3">
                    <ToggleSwitch
                      checked={true}
                      onChange={() => {}}
                      label="Enable Automatic Backups"
                      description="Create database backups automatically"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SelectField
                        label="Backup Frequency"
                        value="daily"
                        onChange={() => {}}
                        options={[
                          { label: 'Hourly', value: 'hourly' },
                          { label: 'Daily', value: 'daily' },
                          { label: 'Weekly', value: 'weekly' },
                          { label: 'Monthly', value: 'monthly' }
                        ]}
                      />
                      <InputField
                        label="Retention Period (days)"
                        value="30"
                        onChange={() => {}}
                        type="number"
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            {activeTab === 'advanced' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Advanced Settings</h2>
                    <p className="text-sm text-gray-500">Developer and system configuration</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Code className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900">Warning: Advanced Settings</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Modifying these settings may affect platform performance and stability. Proceed with caution.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Endpoint</label>
                    <input
                      type="text"
                      value="https://api.connectingfuture.com/v1"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="password"
                        value="sk_live_51234567890abcdefghijk"
                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                        readOnly
                      />
                      <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium">
                        Regenerate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Custom CSS</label>
                    <textarea
                      placeholder="/* Add your custom CSS here */"
                      rows={6}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Custom JavaScript</label>
                    <textarea
                      placeholder="// Add your custom JavaScript here"
                      rows={6}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium">
                    <Trash2 className="w-4 h-4" />
                    <span>Reset All Settings to Default</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminNavigation>
  );
}
