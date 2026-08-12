"use client";

import React, { useState } from 'react';

import ProfilePhotoModal from '@/components/ProfilePhotoModal';
import {
  User, Bell, Lock, Shield, Smartphone, Mail, Globe, Moon, LogOut,
  Camera, Save, Briefcase, Linkedin, FileText, MapPin, ChevronRight
} from 'lucide-react';

const menuItems = [
  { id: 'profile', label: 'Edit Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Moon },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-teal-600" />
    </label>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [profileData, setProfileData] = useState({
    fullName: 'Ved Prakash', graduationYear: '2026', course: 'Information technology',
    email: 'ved.prakash@example.com', phone: '+91 98765 43210', currentCompany: 'MotorCorp',
    jobTitle: 'R&D', location: 'Mumbai', linkedin: 'https://linkedin.com/in/yourprofile',
    website: '', bio: 'Motivated Information Technology undergraduate seeking an entry-level opportunity.',
    skills: 'data analysis, SQL', isMentor: true,
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  });
  const [notifications, setNotifications] = useState({
    emailUpdates: true, jobAlerts: true, eventInvites: false,
    communityNews: true, mentorshipRequests: true
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public', showEmail: false, showPhone: false, allowMessages: true
  });
  const [appearance, setAppearance] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    compactMode: false,
    reduceMotion: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [passwordFields, setPasswordFields] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  React.useEffect(() => {
    fetchProfile();
  }, []);

  React.useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('alumni.theme') as 'light' | 'dark' | 'system' | null) || 'light';
      const compact = localStorage.getItem('alumni.compactMode') === 'true';
      const reduced = localStorage.getItem('alumni.reduceMotion') === 'true';
      setAppearance({ theme: savedTheme, compactMode: compact, reduceMotion: reduced });
      applyTheme(savedTheme);
    } catch {}
  }, []);

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const enableDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', enableDark);
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.user) {
        const nextStatus = (data.user.approval_status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected';
        setProfileData({
          fullName: data.user.name || '', graduationYear: String(data.user.graduation_year || ''),
          course: data.user.major || '', email: data.user.email || '', phone: data.user.phone || '',
          currentCompany: data.user.company || '', jobTitle: data.user.job_title || '',
          location: data.user.location || '', linkedin: data.user.linkedin_url || '',
          website: data.user.website_url || '', bio: data.user.bio || '', skills: data.user.skills || '',
          isMentor: !!data.user.is_mentor,
          profileImage: data.user.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        });
        setApprovalStatus(nextStatus);
        setApprovalReason(data.user.approval_reason || '');
        if (data.user.notification_preferences) setNotifications(p => ({ ...p, ...data.user.notification_preferences }));
        if (data.user.privacy_settings) setPrivacy(p => ({ ...p, ...data.user.privacy_settings }));
      }
    } catch {}
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setSaving(true); setMessage(null);
    const activeToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('cf_token') || localStorage.getItem('cf_jwt') : null;
    if (activeToken) {
      document.cookie = `cf_token=${activeToken}; path=/; max-age=900; SameSite=Lax`;
    }
    try {
      const payload = {
        name: profileData.fullName, phone: profileData.phone, email: profileData.email,
        location: profileData.location, graduationYear: profileData.graduationYear,
        course: profileData.course, currentCompany: profileData.currentCompany,
        jobTitle: profileData.jobTitle, linkedIn: profileData.linkedin,
        portfolio: profileData.website, bio: profileData.bio, skills: profileData.skills,
        isOpenToMentoring: profileData.isMentor, picture: profileData.profileImage,
        notification_preferences: notifications, privacy_settings: privacy
      };

      let res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        res = await fetch(`${backendUrl}/api/v2/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {})
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
        await fetchProfile();
      }
      else { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to save profile'); }
    } catch (e) { setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save profile.' }); }
    finally { setSaving(false); }
  };

  const savePreferencesOnly = async (contextLabel: string) => {
    setSaving(true); setMessage(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.fullName,
          email: profileData.email,
          notification_preferences: notifications,
          privacy_settings: privacy,
        })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `${contextLabel} saved successfully!` });
        setTimeout(() => setMessage(null), 2500);
      } else {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save settings');
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const saveAppearance = () => {
    try {
      localStorage.setItem('alumni.theme', appearance.theme);
      localStorage.setItem('alumni.compactMode', String(appearance.compactMode));
      localStorage.setItem('alumni.reduceMotion', String(appearance.reduceMotion));
      applyTheme(appearance.theme);
      setMessage({ type: 'success', text: 'Appearance settings saved!' });
      setTimeout(() => setMessage(null), 2500);
    } catch {
      setMessage({ type: 'error', text: 'Could not save appearance settings.' });
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('userType'); window.location.href = '/api/auth/logout'; };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProfileData(p => ({ ...p, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const r = new FileReader(); r.onloadend = () => setProfileData(p => ({ ...p, profileImage: r.result as string })); r.readAsDataURL(file); }
  };

  const handlePhotoSelect = (photoUrl: string) => {
    setProfileData(p => ({ ...p, profileImage: photoUrl }));
    setIsAvatarModalOpen(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFields(prev => ({ ...prev, [name]: value }));
  };

  const submitPasswordChange = async () => {
    setPwdMessage(null);
    if (!passwordFields.newPassword) {
      setPwdMessage({ type: 'error', text: 'New password is required.' });
      return;
    }
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      setPwdMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordFields.newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordFields.currentPassword,
          newPassword: passwordFields.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMessage({ type: 'success', text: 'Password reset successfully!' });
        setPasswordFields({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPwdMessage(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to update password');
      }
    } catch (e) {
      setPwdMessage({ type: 'error', text: e instanceof Error ? e.message : 'Error resetting password' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all";
  const labelCls = "block text-xs font-bold text-slate-600 mb-1.5";
  const isCompact = appearance.compactMode;
  const isReducedMotion = appearance.reduceMotion;

  if (loading) {
    return (
      <>
        <div className="space-y-6">
          <div className="bg-teal-950 rounded-[32px] border border-white/10 px-6 py-7 md:px-8 shadow-sm">
            <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Loading your preferences...</p>
          </div>
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex items-center justify-center text-slate-500 font-semibold">
            Loading settings...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`${isCompact ? 'space-y-4' : 'space-y-6'} ${isReducedMotion ? 'motion-reduce' : ''}`}>

        {/* Header */}
        <div className="bg-teal-950 rounded-[32px] border border-white/10 px-6 py-7 md:px-8 shadow-sm relative overflow-hidden text-white">
          <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Manage your profile, notifications, and privacy</p>
          </div>
        </div>

        {/* Layout */}
        <div className={`flex flex-col md:flex-row ${isCompact ? 'gap-4' : 'gap-5'}`}>

          {/* Sidebar */}
          <div className="w-full md:w-56 shrink-0 bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-3.5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 mb-2">Account</p>
            <nav className="flex md:block gap-2 md:gap-0 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
              {menuItems.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`min-w-fit md:w-full whitespace-nowrap flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeTab === id ? 'bg-teal-900 text-white shadow-md' : 'text-slate-600 hover:bg-[#f6f3eb]'}`}>
                  <Icon className="w-4 h-4" />{label}
                  {activeTab === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </nav>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 mb-2">Support</p>
              <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-950 transition-colors">
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isCompact ? 'p-4' : 'p-4 sm:p-5'}`}>

            {message && activeTab !== 'profile' && activeTab !== 'appearance' && (
              <div className={`mb-4 text-xs font-semibold ${message.type === 'success' ? 'text-teal-950' : 'text-teal-950'}`}>
                {message.text}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-teal-600" />Profile Details</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Complete your profile to connect with fellow alumni</p>
                  </div>
                  <div className="flex items-center flex-wrap gap-3">
                    {message && <span className={`text-xs font-semibold ${message.type === 'success' ? 'text-teal-950' : 'text-teal-950'}`}>{message.text}</span>}
                    <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-sm">
                      <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                {approvalStatus === 'rejected' && (
                  <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700 mb-1">Profile rejected</p>
                    <p className="text-sm font-medium text-red-900/90 leading-relaxed">
                      {approvalReason || 'Update the flagged profile details and save changes to resubmit your profile for review.'}
                    </p>
                  </div>
                )}

                <div className={`flex flex-col md:flex-row ${isCompact ? 'gap-4' : 'gap-6'}`}>
                  {/* Avatar */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-full"
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-slate-100 bg-[#f6f3eb]">
                        <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute inset-0 bg-teal-950/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </button>
                    <p className="text-[10px] text-slate-400 text-center">Click to change photo</p>
                  </div>

                  {/* Form */}
                  <div className={`flex-1 ${isCompact ? 'space-y-4' : 'space-y-5'}`}>
                    {/* Personal */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                        <User className="w-4 h-4 text-teal-600" />
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Personal Information</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={labelCls}>Full Name *</label><input name="fullName" value={profileData.fullName} onChange={handleProfileChange} className={inputCls} /></div>
                        <div><label className={labelCls}>Graduation Year *</label>
                          <select name="graduationYear" value={profileData.graduationYear} onChange={handleProfileChange} className={inputCls}>
                            {Array.from({ length: 15 }, (_, i) => 2030 - i).map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2"><label className={labelCls}>Course / Major *</label><input name="course" value={profileData.course} onChange={handleProfileChange} className={inputCls} /></div>
                      </div>
                    </div>

                    {/* Professional */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                        <Briefcase className="w-4 h-4 text-teal-600" />
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Professional Information</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={labelCls}>Current Company</label><input name="currentCompany" value={profileData.currentCompany} onChange={handleProfileChange} className={inputCls} /></div>
                        <div><label className={labelCls}>Job Title</label><input name="jobTitle" value={profileData.jobTitle} onChange={handleProfileChange} className={inputCls} /></div>
                        <div><label className={labelCls}>Location</label>
                          <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="location" value={profileData.location} onChange={handleProfileChange} className={`${inputCls} pl-9`} /></div>
                        </div>
                        <div><label className={labelCls}>LinkedIn</label>
                          <div className="relative"><Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="linkedin" value={profileData.linkedin} onChange={handleProfileChange} placeholder="https://linkedin.com/in/…" className={`${inputCls} pl-9`} /></div>
                        </div>
                        <div className="md:col-span-2"><label className={labelCls}>Portfolio / Website</label>
                          <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="website" value={profileData.website} onChange={handleProfileChange} placeholder="https://yourportfolio.com" className={`${inputCls} pl-9`} /></div>
                        </div>
                      </div>
                    </div>

                    {/* Additional */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                        <FileText className="w-4 h-4 text-teal-600" />
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Additional Information</p>
                      </div>
                      <div className="space-y-4">
                        <div><label className={labelCls}>Bio</label><textarea name="bio" rows={3} value={profileData.bio} onChange={handleProfileChange} className={`${inputCls} resize-none`} /></div>
                        <div><label className={labelCls}>Skills & Expertise</label><input name="skills" value={profileData.skills} onChange={handleProfileChange} className={inputCls} /><p className="text-[10px] text-slate-400 mt-1">Separate skills with commas</p></div>
                        <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
                          <input type="checkbox" name="isMentor" id="isMentor" checked={profileData.isMentor} onChange={handleProfileChange} className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
                          <label htmlFor="isMentor" className="text-sm font-semibold text-slate-700 cursor-pointer flex items-center gap-2"><User className="w-4 h-4 text-teal-600" />I'm open to mentoring students and junior alumni</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2"><Bell className="w-4 h-4 text-teal-600" />Notification Preferences</h2>
                    <p className="text-xs text-slate-400">Manage how and when you want to be notified</p>
                  </div>
                  <button onClick={() => savePreferencesOnly('Notification preferences')} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
                <div className="space-y-3">
                  {(Object.entries(notifications) as [string, boolean][]).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-[#f6f3eb] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                          {key.includes('email') ? <Mail className="w-4 h-4" /> : key.includes('job') ? <Shield className="w-4 h-4" /> : key.includes('event') ? <User className="w-4 h-4" /> : key.includes('mentorship') ? <Smartphone className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-xs text-slate-400">Receive notifications about {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
                        </div>
                      </div>
                      <Toggle checked={value} onChange={() => setNotifications(n => ({ ...n, [key]: !value }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRIVACY TAB */}
            {activeTab === 'privacy' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2"><Lock className="w-4 h-4 text-teal-600" />Privacy & Security</h2>
                    <p className="text-xs text-slate-400">Control who can see your information</p>
                  </div>
                  <button onClick={() => savePreferencesOnly('Privacy settings')} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div><p className="font-bold text-amber-800 text-sm">Security Recommendation</p><p className="text-xs text-amber-700 mt-0.5">Enable Two-Factor Authentication (2FA) for extra account security.</p></div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">Profile Visibility</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(['public', 'alumni-only', 'private'] as const).map(opt => (
                        <div key={opt} onClick={() => setPrivacy(p => ({ ...p, profileVisibility: opt }))} className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${privacy.profileVisibility === opt ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${privacy.profileVisibility === opt ? 'bg-teal-100 text-teal-700' : 'bg-[#f6f3eb] text-slate-500'}`}>
                            {opt === 'public' ? <Globe className="w-5 h-5" /> : opt === 'alumni-only' ? <User className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                          </div>
                          <p className="text-xs font-bold text-slate-900 capitalize">{opt.replace('-', ' ')}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{opt === 'public' ? 'Everyone can see' : opt === 'alumni-only' ? 'Verified alumni only' : 'Only you'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">Contact Info Visibility</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Show Email Address', key: 'showEmail' as const },
                        { label: 'Show Phone Number', key: 'showPhone' as const },
                        { label: 'Allow Direct Messages', key: 'allowMessages' as const },
                      ].map(({ label, key }) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-[#f6f3eb] transition-colors">
                          <span className="text-sm text-slate-700 font-medium">{label}</span>
                          <Toggle checked={privacy[key]} onChange={() => setPrivacy(p => ({ ...p, [key]: !p[key] }))} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">Reset Password</p>
                    <div className="space-y-4 max-w-md mt-4">
                      <div>
                        <label className={labelCls}>Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordFields.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordFields.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Confirm New Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordFields.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          className={inputCls}
                        />
                      </div>
                      {pwdMessage && (
                        <p className={`text-xs font-semibold ${pwdMessage.type === 'success' ? 'text-teal-950' : 'text-teal-950'}`}>
                          {pwdMessage.text}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={submitPasswordChange}
                        disabled={passwordSaving}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-sm"
                      >
                        {passwordSaving ? 'Updating…' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2"><Moon className="w-4 h-4 text-teal-600" />Appearance</h2>
                    <p className="text-xs text-slate-400">Customize your viewing preferences</p>
                  </div>
                  <button onClick={saveAppearance} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />Save Changes
                  </button>
                </div>

                {message && <p className={`text-xs font-semibold mb-3 ${message.type === 'success' ? 'text-teal-950' : 'text-teal-950'}`}>{message.text}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 p-4 bg-[#f6f3eb]/60">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Theme</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['light', 'dark', 'system'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setAppearance(a => ({ ...a, theme: mode }))}
                          className={`px-3 py-2 rounded-lg text-xs font-bold capitalize border transition-colors ${appearance.theme === mode ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-[#f6f3eb]'}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4 bg-[#f6f3eb]/60 space-y-3">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Display Options</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 font-medium">Compact mode</span>
                      <Toggle checked={appearance.compactMode} onChange={() => setAppearance(a => ({ ...a, compactMode: !a.compactMode }))} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 font-medium">Reduce motion</span>
                      <Toggle checked={appearance.reduceMotion} onChange={() => setAppearance(a => ({ ...a, reduceMotion: !a.reduceMotion }))} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-teal-100 bg-teal-50 p-4 flex items-start gap-3">
                  <Moon className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-teal-800">Appearance settings are now functional</p>
                    <p className="text-xs text-teal-700 mt-0.5">Theme and display preferences are saved locally for your next visit.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="mt-5 pt-4 border-t border-slate-100 sm:hidden sticky bottom-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        <ProfilePhotoModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          onSelect={handlePhotoSelect}
          currentPhoto={profileData.profileImage}
        />
      </div>
    </>
  );
}