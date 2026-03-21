"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthToken } from '../../../../contexts/AuthTokenContext';
import AlumniNavigation from '../AluminaNavigation/AlumniNavigation';
import {
  User, Bell, Lock, Shield, Eye, Smartphone, Mail, Globe, Moon, LogOut,
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
      <div className="w-10 h-5.5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-green-600" />
    </label>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
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

  const { token, tokenLoading: authLoading } = useAuthToken();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (!authLoading && token) fetchProfile();
    else if (!authLoading && !token) setLoading(false);
  }, [authLoading, token]);

  const fetchProfile = async () => {
    try {
      if (!token) return;
      const res = await fetch('http://localhost:4000/api/users/profile', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.user) {
        setProfileData({
          fullName: data.user.name || '', graduationYear: String(data.user.graduation_year || ''),
          course: data.user.major || '', email: data.user.email || '', phone: data.user.phone || '',
          currentCompany: data.user.company || '', jobTitle: data.user.job_title || '',
          location: data.user.location || '', linkedin: data.user.linkedin_url || '',
          website: data.user.website_url || '', bio: data.user.bio || '', skills: data.user.skills || '',
          isMentor: !!data.user.is_mentor,
          profileImage: data.user.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        });
        if (data.user.notification_preferences) setNotifications(p => ({ ...p, ...data.user.notification_preferences }));
        if (data.user.privacy_settings) setPrivacy(p => ({ ...p, ...data.user.privacy_settings }));
      }
    } catch {}
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setSaving(true); setMessage(null);
    try {
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('http://localhost:4000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profileData.fullName, phone: profileData.phone, email: profileData.email,
          location: profileData.location, graduationYear: profileData.graduationYear,
          course: profileData.course, currentCompany: profileData.currentCompany,
          jobTitle: profileData.jobTitle, linkedIn: profileData.linkedin,
          portfolio: profileData.website, bio: profileData.bio, skills: profileData.skills,
          isOpenToMentoring: profileData.isMentor, picture: profileData.profileImage,
          notification_preferences: notifications, privacy_settings: privacy
        })
      });
      if (res.ok) { setMessage({ type: 'success', text: 'Profile updated successfully!' }); setTimeout(() => setMessage(null), 3000); }
      else { const d = await res.json(); throw new Error(d.error || 'Failed to save'); }
    } catch (e) { setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save profile.' }); }
    finally { setSaving(false); }
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

  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400";
  const labelCls = "block text-xs font-bold text-gray-600 mb-1.5";

  return (
    <AlumniNavigation>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your profile, notifications, and privacy</p>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-4">

          {/* Sidebar */}
          <div className="w-full md:w-52 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2 mb-2">Account</p>
            <nav className="space-y-0.5">
              {menuItems.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeTab === id ? 'bg-green-50 text-green-700 border border-green-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className="w-4 h-4" />{label}
                  {activeTab === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </nav>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2 mb-2">Support</p>
              <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-green-600" />Profile Details</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Complete your profile to connect with fellow alumni</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {message && <span className={`text-xs font-semibold ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</span>}
                    <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors shadow-sm">
                      <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-100 bg-gray-100">
                        <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">*.jpeg, *.jpg, *.png<br />max 3 MB</p>
                  </div>

                  {/* Form */}
                  <div className="flex-1 space-y-5">
                    {/* Personal */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                        <User className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Personal Information</p>
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
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                        <Briefcase className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Professional Information</p>
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
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                        <FileText className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Additional Information</p>
                      </div>
                      <div className="space-y-4">
                        <div><label className={labelCls}>Bio</label><textarea name="bio" rows={3} value={profileData.bio} onChange={handleProfileChange} className={`${inputCls} resize-none`} /></div>
                        <div><label className={labelCls}>Skills & Expertise</label><input name="skills" value={profileData.skills} onChange={handleProfileChange} className={inputCls} /><p className="text-[10px] text-gray-400 mt-1">Separate skills with commas</p></div>
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                          <input type="checkbox" name="isMentor" id="isMentor" checked={profileData.isMentor} onChange={handleProfileChange} className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500" />
                          <label htmlFor="isMentor" className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-2"><User className="w-4 h-4 text-green-600" />I'm open to mentoring students and junior alumni</label>
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
                <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2"><Bell className="w-4 h-4 text-green-600" />Notification Preferences</h2>
                <p className="text-xs text-gray-400 mb-5">Manage how and when you want to be notified</p>
                <div className="space-y-3">
                  {(Object.entries(notifications) as [string, boolean][]).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                          {key.includes('email') ? <Mail className="w-4 h-4" /> : key.includes('job') ? <Shield className="w-4 h-4" /> : key.includes('event') ? <User className="w-4 h-4" /> : key.includes('mentorship') ? <Smartphone className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-xs text-gray-400">Receive notifications about {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
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
                <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2"><Lock className="w-4 h-4 text-green-600" />Privacy & Security</h2>
                <p className="text-xs text-gray-400 mb-4">Control who can see your information</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div><p className="font-bold text-amber-800 text-sm">Security Recommendation</p><p className="text-xs text-amber-700 mt-0.5">Enable Two-Factor Authentication (2FA) for extra account security.</p></div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-black text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Profile Visibility</p>
                    <div className="grid grid-cols-3 gap-3">
                      {(['public', 'alumni-only', 'private'] as const).map(opt => (
                        <div key={opt} onClick={() => setPrivacy(p => ({ ...p, profileVisibility: opt }))} className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${privacy.profileVisibility === opt ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${privacy.profileVisibility === opt ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {opt === 'public' ? <Globe className="w-5 h-5" /> : opt === 'alumni-only' ? <User className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                          </div>
                          <p className="text-xs font-bold text-gray-900 capitalize">{opt.replace('-', ' ')}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{opt === 'public' ? 'Everyone can see' : opt === 'alumni-only' ? 'Verified alumni only' : 'Only you'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Contact Info Visibility</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Show Email Address', key: 'showEmail' as const },
                        { label: 'Show Phone Number', key: 'showPhone' as const },
                        { label: 'Allow Direct Messages', key: 'allowMessages' as const },
                      ].map(({ label, key }) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                          <span className="text-sm text-gray-700 font-medium">{label}</span>
                          <Toggle checked={privacy[key]} onChange={() => setPrivacy(p => ({ ...p, [key]: !p[key] }))} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-4"><Moon className="w-7 h-7 text-purple-400" /></div>
                <p className="font-bold text-gray-900 text-base mb-1">Dark Mode Coming Soon</p>
                <p className="text-sm text-gray-400 max-w-sm">We're working on a sleek dark theme for those late-night sessions. Stay tuned!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AlumniNavigation>
  );
}