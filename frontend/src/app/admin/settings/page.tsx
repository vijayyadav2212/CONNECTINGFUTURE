"use client";

import React, { useState } from 'react';
import AdminNavigation from '../AdminNavigation/AdminNavigation';
import {
  Settings, Save, RefreshCw, Shield, Bell, Users,
  Mail, Database, Globe, Lock, Eye, EyeOff,
  Upload, Download, Trash2, CheckCircle, AlertCircle,
  Server, Key, Zap, Clock, Calendar, FileText,
  Image, Palette, Code, Link2, Send
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400";
const iconInputCls = (icon: boolean) => `w-full ${icon ? 'pl-9' : 'px-3'} pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400`;
const labelCls = "block text-xs font-bold text-gray-600 mb-1.5";

const InputField = ({ label, value, onChange, type = 'text', placeholder = '', icon, readOnly }: any) => (
  <div>
    <label className={labelCls}>{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
      <input type={type} value={value} onChange={onChange ? (e: any) => onChange(e.target.value) : undefined}
        placeholder={placeholder} readOnly={readOnly}
        className={iconInputCls(!!icon)} />
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options }: any) => (
  <div>
    <label className={labelCls}>{label}</label>
    <select value={value} onChange={onChange ? (e: any) => onChange(e.target.value) : undefined} className={inputCls}>
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Toggle = ({ checked, onChange, label, description, setDirty }: any) => (
  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
    <div className="flex-1 mr-4">
      <p className="text-xs font-bold text-gray-900">{label}</p>
      {description && <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button type="button" onClick={() => { onChange(!checked); setDirty?.(); }}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-emerald-600' : 'bg-gray-300'}`}>
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const SectionHead = ({ icon, title, desc, iconBg }: any) => (
  <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
    <div><p className="text-sm font-black text-gray-900">{title}</p><p className="text-xs text-gray-400">{desc}</p></div>
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab]         = useState('general');
  const [showPassword, setShowPassword]   = useState(false);
  const [unsaved, setUnsaved]             = useState(false);
  const [saved, setSaved]                 = useState(false);

  const dirty = () => setUnsaved(true);

  // State blobs
  const [gen, setGen] = useState({ siteName:'AlumNex', siteDescription:'Alumni and Student Connection Platform', adminEmail:'admin@alumnex.com', timezone:'Asia/Kolkata', dateFormat:'DD/MM/YYYY', language:'en' });
  const [notif, setNotif] = useState({ emailNotifications:true, pushNotifications:true, approvalNotifications:true, newUserNotifications:true, jobPostingNotifications:true, eventNotifications:true, messageNotifications:false, weeklyDigest:true, notificationSound:true });
  const [sec, setSec] = useState({ twoFactorAuth:false, sessionTimeout:'30', passwordExpiry:'90', loginAttempts:'5', requireStrongPassword:true, allowMultipleSessions:false, ipWhitelist:'', maintenanceMode:false });
  const [usr, setUsr] = useState({ autoApproveAlumni:false, autoApproveStudents:false, requireEmailVerification:true, allowSelfRegistration:true, defaultUserRole:'user', profileVisibility:'public', maxProfileSize:'5' });
  const [email, setEmail] = useState({ smtpHost:'smtp.gmail.com', smtpPort:'587', smtpUsername:'', smtpPassword:'', smtpEncryption:'tls', fromEmail:'noreply@alumnex.com', fromName:'AlumNex' });
  const [appear, setAppear] = useState({ primaryColor:'#16a34a', secondaryColor:'#8B5CF6', darkMode:false, compactMode:false, animationsEnabled:true });

  const handleSave = () => { setSaved(true); setUnsaved(false); setTimeout(() => setSaved(false), 3000); };
  const handleReset = () => { if (confirm('Reset all settings to default?')) console.log('reset'); };

  const tabs = [
    { id:'general',       label:'General',       icon:<Settings className="w-4 h-4" /> },
    { id:'security',      label:'Security',       icon:<Shield className="w-4 h-4" />, badge:2 },
    { id:'notifications', label:'Notifications',  icon:<Bell className="w-4 h-4" /> },
    { id:'users',         label:'Users',          icon:<Users className="w-4 h-4" /> },
    { id:'email',         label:'Email',          icon:<Mail className="w-4 h-4" /> },
    { id:'appearance',    label:'Appearance',     icon:<Palette className="w-4 h-4" /> },
    { id:'database',      label:'Database',       icon:<Database className="w-4 h-4" /> },
    { id:'advanced',      label:'Advanced',       icon:<Code className="w-4 h-4" /> },
  ];

  return (
    <AdminNavigation>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-emerald-50 rounded-[20px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-emerald-100 gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold mb-2">
              <Settings className="w-[18px] h-[18px]" />
              <span className="text-sm tracking-wide">Admin Actions</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Settings</h1>
            <p className="text-gray-600 text-[15px] sm:text-base">Manage your platform configuration and preferences</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"><RefreshCw className="w-3.5 h-3.5" />Reset</button>
            <button onClick={handleSave} disabled={!unsaved}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-colors shadow-sm ${unsaved ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              <Save className="w-3.5 h-3.5" />Save Changes
            </button>
          </div>
        </div>

        {/* Alerts */}
        {saved && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700">
            <CheckCircle className="w-4 h-4 shrink-0" />Settings saved successfully!
          </div>
        )}
        {unsaved && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700">
            <AlertCircle className="w-4 h-4 shrink-0" />You have unsaved changes. Don't forget to save.
          </div>
        )}

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">

          {/* Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-6 h-fit">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-0.5 transition-colors text-left ${activeTab===t.id ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-gray-700 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2.5">{t.icon}<span className="text-xs font-bold">{t.label}</span></div>
                {t.badge && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab===t.id ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>{t.badge}</span>}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            {/* ── General ── */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <SectionHead icon={<Settings className="w-4 h-4 text-emerald-600" />} title="General Settings" desc="Configure basic platform information" iconBg="bg-emerald-50" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Site Name" value={gen.siteName} onChange={(v:string) => { setGen(g=>({...g,siteName:v})); dirty(); }} placeholder="Site name" icon={<Globe className="w-4 h-4" />} />
                  <InputField label="Admin Email" value={gen.adminEmail} onChange={(v:string) => { setGen(g=>({...g,adminEmail:v})); dirty(); }} type="email" placeholder="admin@example.com" icon={<Mail className="w-4 h-4" />} />
                  <SelectField label="Timezone" value={gen.timezone} onChange={(v:string) => { setGen(g=>({...g,timezone:v})); dirty(); }} options={[{label:'Asia/Kolkata (IST)',value:'Asia/Kolkata'},{label:'America/New_York (EST)',value:'America/New_York'},{label:'Europe/London (GMT)',value:'Europe/London'},{label:'Asia/Tokyo (JST)',value:'Asia/Tokyo'}]} />
                  <SelectField label="Date Format" value={gen.dateFormat} onChange={(v:string) => { setGen(g=>({...g,dateFormat:v})); dirty(); }} options={[{label:'DD/MM/YYYY',value:'DD/MM/YYYY'},{label:'MM/DD/YYYY',value:'MM/DD/YYYY'},{label:'YYYY-MM-DD',value:'YYYY-MM-DD'}]} />
                </div>
                <div><label className={labelCls}>Site Description</label><textarea value={gen.siteDescription} onChange={e => { setGen(g=>({...g,siteDescription:e.target.value})); dirty(); }} rows={3} className={`${inputCls} resize-none`} /></div>
              </div>
            )}

            {/* ── Security ── */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <SectionHead icon={<Shield className="w-4 h-4 text-emerald-600" />} title="Security Settings" desc="Protect your platform with advanced security features" iconBg="bg-emerald-50" />
                <div className="space-y-2">
                  <Toggle checked={sec.twoFactorAuth}           onChange={(v:boolean) => setSec(s=>({...s,twoFactorAuth:v}))}           label="Two-Factor Authentication"  description="Require 2FA for all admin accounts"                   setDirty={dirty} />
                  <Toggle checked={sec.requireStrongPassword}   onChange={(v:boolean) => setSec(s=>({...s,requireStrongPassword:v}))}   label="Strong Password Policy"     description="Enforce min 8 chars with special characters"      setDirty={dirty} />
                  <Toggle checked={sec.allowMultipleSessions}   onChange={(v:boolean) => setSec(s=>({...s,allowMultipleSessions:v}))}   label="Allow Multiple Sessions"    description="Users can log in from multiple devices"           setDirty={dirty} />
                  <Toggle checked={sec.maintenanceMode}         onChange={(v:boolean) => setSec(s=>({...s,maintenanceMode:v}))}         label="Maintenance Mode"           description="Temporarily disable public access"                setDirty={dirty} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <InputField label="Session Timeout (min)" value={sec.sessionTimeout} onChange={(v:string)=>{setSec(s=>({...s,sessionTimeout:v}));dirty();}} type="number" icon={<Clock className="w-4 h-4" />} />
                  <InputField label="Password Expiry (days)" value={sec.passwordExpiry} onChange={(v:string)=>{setSec(s=>({...s,passwordExpiry:v}));dirty();}} type="number" icon={<Calendar className="w-4 h-4" />} />
                  <InputField label="Max Login Attempts" value={sec.loginAttempts} onChange={(v:string)=>{setSec(s=>({...s,loginAttempts:v}));dirty();}} type="number" icon={<Lock className="w-4 h-4" />} />
                </div>
                <div><label className={labelCls}>IP Whitelist (one per line)</label><textarea value={sec.ipWhitelist} onChange={e=>{setSec(s=>({...s,ipWhitelist:e.target.value}));dirty();}} rows={3} placeholder="192.168.1.1" className={`${inputCls} resize-none font-mono`} /></div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <SectionHead icon={<Bell className="w-4 h-4 text-emerald-600" />} title="Notification Settings" desc="Manage how you receive notifications" iconBg="bg-emerald-50" />
                <div className="space-y-2">
                  <Toggle checked={notif.emailNotifications}        onChange={(v:boolean)=>setNotif(n=>({...n,emailNotifications:v}))}        label="Email Notifications"       description="Receive notifications via email"                    setDirty={dirty} />
                  <Toggle checked={notif.pushNotifications}         onChange={(v:boolean)=>setNotif(n=>({...n,pushNotifications:v}))}         label="Push Notifications"        description="Browser push notifications"                         setDirty={dirty} />
                  <Toggle checked={notif.notificationSound}         onChange={(v:boolean)=>setNotif(n=>({...n,notificationSound:v}))}         label="Notification Sound"        description="Play sound on receiving notifications"              setDirty={dirty} />
                  <Toggle checked={notif.weeklyDigest}              onChange={(v:boolean)=>setNotif(n=>({...n,weeklyDigest:v}))}              label="Weekly Digest Email"       description="Weekly summary of platform activity"                setDirty={dirty} />
                </div>
                <div className="pt-3 border-t border-gray-100"><p className="text-xs font-black text-gray-700 mb-2">Notification Types</p>
                  <div className="space-y-2">
                    <Toggle checked={notif.approvalNotifications}   onChange={(v:boolean)=>setNotif(n=>({...n,approvalNotifications:v}))}   label="Approval Requests"         description="When approvals are pending"                         setDirty={dirty} />
                    <Toggle checked={notif.newUserNotifications}    onChange={(v:boolean)=>setNotif(n=>({...n,newUserNotifications:v}))}    label="New User Registrations"    description="When users register"                                setDirty={dirty} />
                    <Toggle checked={notif.jobPostingNotifications} onChange={(v:boolean)=>setNotif(n=>({...n,jobPostingNotifications:v}))} label="Job Postings"              description="When new jobs are submitted"                        setDirty={dirty} />
                    <Toggle checked={notif.eventNotifications}      onChange={(v:boolean)=>setNotif(n=>({...n,eventNotifications:v}))}      label="Event Updates"             description="When events are created or modified"                setDirty={dirty} />
                    <Toggle checked={notif.messageNotifications}    onChange={(v:boolean)=>setNotif(n=>({...n,messageNotifications:v}))}    label="Direct Messages"           description="When you receive messages"                          setDirty={dirty} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Users ── */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <SectionHead icon={<Users className="w-4 h-4 text-emerald-600" />} title="User Settings" desc="Configure user registration and permissions" iconBg="bg-emerald-50" />
                <div className="space-y-2">
                  <Toggle checked={usr.allowSelfRegistration}       onChange={(v:boolean)=>setUsr(u=>({...u,allowSelfRegistration:v}))}       label="Allow Self Registration"    description="Users can register without admin approval" setDirty={dirty} />
                  <Toggle checked={usr.requireEmailVerification}    onChange={(v:boolean)=>setUsr(u=>({...u,requireEmailVerification:v}))}    label="Require Email Verification" description="Users must verify email before access"     setDirty={dirty} />
                  <Toggle checked={usr.autoApproveAlumni}           onChange={(v:boolean)=>setUsr(u=>({...u,autoApproveAlumni:v}))}           label="Auto-Approve Alumni"        description="Skip manual approval for alumni"           setDirty={dirty} />
                  <Toggle checked={usr.autoApproveStudents}         onChange={(v:boolean)=>setUsr(u=>({...u,autoApproveStudents:v}))}         label="Auto-Approve Students"      description="Skip manual approval for students"         setDirty={dirty} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <SelectField label="Default User Role" value={usr.defaultUserRole} onChange={(v:string)=>{setUsr(u=>({...u,defaultUserRole:v}));dirty();}} options={[{label:'User',value:'user'},{label:'Moderator',value:'moderator'},{label:'Admin',value:'admin'}]} />
                  <SelectField label="Profile Visibility" value={usr.profileVisibility} onChange={(v:string)=>{setUsr(u=>({...u,profileVisibility:v}));dirty();}} options={[{label:'Public',value:'public'},{label:'Members Only',value:'members'},{label:'Private',value:'private'}]} />
                  <InputField label="Max Profile Image (MB)" value={usr.maxProfileSize} onChange={(v:string)=>{setUsr(u=>({...u,maxProfileSize:v}));dirty();}} type="number" icon={<Image className="w-4 h-4" />} />
                </div>
              </div>
            )}

            {/* ── Email ── */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <SectionHead icon={<Mail className="w-4 h-4 text-emerald-600" />} title="Email Configuration" desc="Configure SMTP settings for outgoing emails" iconBg="bg-emerald-50" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="SMTP Host"     value={email.smtpHost}     onChange={(v:string)=>{setEmail(e=>({...e,smtpHost:v}));dirty();}}     placeholder="smtp.gmail.com"           icon={<Server className="w-4 h-4" />} />
                  <InputField label="SMTP Port"     value={email.smtpPort}     onChange={(v:string)=>{setEmail(e=>({...e,smtpPort:v}));dirty();}}     type="number" placeholder="587"        icon={<Link2 className="w-4 h-4" />} />
                  <InputField label="SMTP Username" value={email.smtpUsername} onChange={(v:string)=>{setEmail(e=>({...e,smtpUsername:v}));dirty();}} placeholder="your@gmail.com"           icon={<Mail className="w-4 h-4" />} />
                  <div>
                    <label className={labelCls}>SMTP Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPassword?'text':'password'} value={email.smtpPassword} onChange={e=>{setEmail(em=>({...em,smtpPassword:e.target.value}));dirty();}} placeholder="••••••••" className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400" />
                      <button type="button" onClick={()=>setShowPassword(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <SelectField label="Encryption" value={email.smtpEncryption} onChange={(v:string)=>{setEmail(e=>({...e,smtpEncryption:v}));dirty();}} options={[{label:'TLS',value:'tls'},{label:'SSL',value:'ssl'},{label:'None',value:'none'}]} />
                  <InputField label="From Email" value={email.fromEmail} onChange={(v:string)=>{setEmail(e=>({...e,fromEmail:v}));dirty();}} type="email" placeholder="noreply@example.com" icon={<Mail className="w-4 h-4" />} />
                  <InputField label="From Name"  value={email.fromName}  onChange={(v:string)=>{setEmail(e=>({...e,fromName:v}));dirty();}}  placeholder="AlumNex"             icon={<FileText className="w-4 h-4" />} />
                </div>
                <div className="pt-3 border-t border-gray-100"><button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"><Send className="w-4 h-4" />Send Test Email</button></div>
              </div>
            )}

            {/* ── Appearance ── */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <SectionHead icon={<Palette className="w-4 h-4 text-emerald-600" />} title="Appearance Settings" desc="Customize the look and feel of your platform" iconBg="bg-emerald-50" />
                <div className="space-y-2">
                  <Toggle checked={appear.darkMode}          onChange={(v:boolean)=>setAppear(a=>({...a,darkMode:v}))}          label="Dark Mode"         description="Enable dark theme across the platform"          setDirty={dirty} />
                  <Toggle checked={appear.compactMode}       onChange={(v:boolean)=>setAppear(a=>({...a,compactMode:v}))}       label="Compact Mode"      description="Reduce spacing for more content"                setDirty={dirty} />
                  <Toggle checked={appear.animationsEnabled} onChange={(v:boolean)=>setAppear(a=>({...a,animationsEnabled:v}))} label="Animations"        description="Enable smooth transitions and animations"       setDirty={dirty} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  {[['Primary Color','primaryColor'],['Secondary Color','secondaryColor']].map(([l,k]) => (
                    <div key={k}><label className={labelCls}>{l}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={(appear as any)[k]} onChange={e=>{setAppear(a=>({...a,[k]:e.target.value}));dirty();}} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5" />
                        <input type="text" value={(appear as any)[k]} onChange={e=>{setAppear(a=>({...a,[k]:e.target.value}));dirty();}} className={`${inputCls} font-mono flex-1`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  {[['Platform Logo','CF','bg-red-600'],['Favicon','?','bg-gray-100 text-gray-400']].map(([l,t,bg]) => (
                    <div key={l}><label className={labelCls}>{l}</label>
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0`}>{t}</div>
                        <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"><Upload className="w-3.5 h-3.5" />Upload</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Database ── */}
            {activeTab === 'database' && (
              <div className="space-y-4">
                <SectionHead icon={<Database className="w-4 h-4 text-emerald-600" />} title="Database Management" desc="Backup and maintain your database" iconBg="bg-emerald-50" />
                <div className="grid grid-cols-3 gap-3">
                  {[{icon:<Database className="w-5 h-5 text-emerald-600"/>,label:'DB Size',val:'2.4 GB',bg:'bg-emerald-50 border-emerald-100 text-emerald-900'},
                    {icon:<CheckCircle className="w-5 h-5 text-emerald-600"/>,label:'Last Backup',val:'2 hrs ago',bg:'bg-emerald-50 border-emerald-100 text-emerald-900'},
                    {icon:<Zap className="w-5 h-5 text-emerald-600"/>,label:'Total Records',val:'24,891',bg:'bg-emerald-50 border-emerald-100 text-emerald-900'}].map(s=>(
                    <div key={s.label} className={`p-4 rounded-xl border-2 ${s.bg}`}>{s.icon}<p className="text-[10px] font-bold text-gray-600 mt-2">{s.label}</p><p className="text-xl font-black mt-0.5">{s.val}</p></div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"><Download className="w-4 h-4" />Backup Database</button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"><Upload className="w-4 h-4" />Restore Backup</button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"><RefreshCw className="w-4 h-4" />Optimize DB</button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"><Trash2 className="w-4 h-4" />Clear Cache</button>
                </div>
                <div className="pt-3 border-t border-gray-100"><p className="text-xs font-black text-gray-700 mb-2">Automatic Backups</p>
                  <div className="space-y-3">
                    <Toggle checked={true} onChange={()=>{}} label="Enable Automatic Backups" description="Create database backups automatically" />
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField label="Frequency" value="daily" onChange={()=>{}} options={[{label:'Hourly',value:'hourly'},{label:'Daily',value:'daily'},{label:'Weekly',value:'weekly'},{label:'Monthly',value:'monthly'}]} />
                      <InputField label="Retention (days)" value="30" onChange={()=>{}} type="number" icon={<Calendar className="w-4 h-4" />} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Advanced ── */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <SectionHead icon={<Code className="w-4 h-4 text-emerald-600" />} title="Advanced Settings" desc="Developer and system configuration" iconBg="bg-emerald-50" />
                <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-amber-800">Warning: modifying these settings may affect platform performance and stability. Proceed with caution.</p>
                </div>
                <div className="space-y-4">
                  <div><label className={labelCls}>API Endpoint</label><input type="text" value="https://api.alumnex.com/v1" readOnly className={`${inputCls} font-mono bg-gray-50`} /></div>
                  <div><label className={labelCls}>API Key</label>
                    <div className="flex items-center gap-2">
                      <input type="password" value="sk_live_51234567890abcdefghijk" readOnly className={`${inputCls} font-mono flex-1`} />
                       <button className="px-4 py-2.5 text-sm font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0">Regenerate</button>
                    </div>
                  </div>
                  <div><label className={labelCls}>Custom CSS</label><textarea placeholder="/* Add your custom CSS here */" rows={5} className={`${inputCls} resize-none font-mono`} /></div>
                  <div><label className={labelCls}>Custom JavaScript</label><textarea placeholder="// Add your custom JavaScript here" rows={5} className={`${inputCls} resize-none font-mono`} /></div>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"><Trash2 className="w-4 h-4" />Reset All Settings to Default</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminNavigation>
  );
}
