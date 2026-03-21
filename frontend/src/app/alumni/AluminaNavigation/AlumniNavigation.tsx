// "use client";

// import React, { useEffect, useState } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import Link from 'next/link';
// import { GraduationCap, User, Users, Building, MessageSquare, Trophy, Settings, Heart, Calendar, Map, Camera, FileText, BarChart3, Bell } from 'lucide-react';
// import { useUser } from '@auth0/nextjs-auth0/client';
// import { profile } from 'console';

// // Interfaces
// interface NavItem {
//   id: string;
//   label: string;
//   icon: React.ReactNode;
//   route: string;
//   badge?: string;
// }

// interface AlumniData {
//   name: string;
//   graduationYear: string;
//   company: string;
//   position: string;
//   avatar: string | null;
//   verifiedBadge: boolean;
// }

// interface AlumniNavigationProps {
//   children: React.ReactNode;
// }

// export default function AlumniNavigation({ children }: AlumniNavigationProps) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [showPersonalizationModal, setShowPersonalizationModal] = useState<boolean>(false);
//   const [isAvailableForMentorship, setIsAvailableForMentorship] = useState<boolean>(true);
//   const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
//   const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
//   const { user } = useUser();
//   const [messageUnread, setMessageUnread] = useState<number>(0);
//   const [jobNewBadge, setJobNewBadge] = useState<number>(0);
//   const prevJobIdsRef = React.useRef<Set<number>>(new Set());
//   const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
//   const [profileLoading, setProfileLoading] = useState(true);
//   const [profile, setProfile] = useState<any>(null);

//   const API_ROOT = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '') + '/api';

//   // Fetch user profile to check approval status
//   useEffect(() => {
//     const loadProfile = async () => {
//       try {
//         setProfileLoading(true);
//         const resp = await fetch('/api/user/profile', { cache: 'no-store' });
//         if (resp.ok) {
//           const data = await resp.json();
//           const status = data?.user?.approval_status || 'pending';
//           setApprovalStatus(status);
//           setProfile(data?.user || null);
//         }
//       } catch (error) {
//         console.error('Error loading profile:', error);
//       } finally {
//         setProfileLoading(false);
//       }
//     };
//     if (user) {
//       loadProfile();
//     }
//   }, [user]);

//   // Alumni data synced from database
//   const alumniData: AlumniData = {
//     name: profileLoading ? 'Loading...' : (profile?.name || user?.name || 'Alumni'),
//     graduationYear: profileLoading ? '' : String(profile?.graduation_year || profile?.graduationYear || ''),
//     company: profileLoading ? 'Loading...' : (profile?.company || profile?.current_company || 'Not specified'),
//     position: profileLoading ? 'Loading...' : (profile?.job_title || profile?.position || profile?.current_job || 'Not specified'),
//     avatar: profileLoading ? null : (profile?.picture || user?.picture || null),
//     verifiedBadge: profile?.approval_status === 'approved'
//   };

//   const navigationItems: NavItem[] = [
//     { id: "dashboard", label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/alumni/dashboard" },
//     { id: "network", label: "Network", icon: <Users className="w-5 h-5" />, route: "/alumni/network" },
//     { id: "mentorship", label: "Mentorship", icon: <User className="w-5 h-5" />, badge: "3", route: "/alumni/mentorship" },
//     { id: "jobs", label: "Jobs & Internships", icon: <Building className="w-5 h-5" />, route: "/alumni/job-posting" },
//     { id: "events", label: "Events", icon: <Calendar className="w-5 h-5" />, route: "/alumni/events" },
//     { id: "roadmaps", label: "Roadmaps", icon: <Map className="w-5 h-5" />, route: "/alumni/roadmap" },
//     { id: "memories", label: "Memories", icon: <Camera className="w-5 h-5" />, route: "/alumni/memories" },
//     { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="w-5 h-5" />, route: "/alumni/leaderboard" },
//     { id: "messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, route: "/alumni/messages" },
//     { id: "donations", label: "Donations", icon: <Heart className="w-5 h-5" />, route: "/alumni/donation" },
//     { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/alumni/settings" },
//   ];

//   const isActiveRoute = (route: string): boolean => {
//     return pathname === route;
//   };

//   // Poll threads for unread count
//   useEffect(() => {
//     let timer: any;
//     const load = async () => {
//       try {
//         const email = String(user?.email || '');
//         if (!email) return;
//         const resp = await fetch(`${API_ROOT}/messages/threads?user=${encodeURIComponent(email)}`);
//         const isJson = resp.headers.get('content-type')?.includes('application/json');
//         const data = isJson ? await resp.json() : await resp.text();
//         if (!resp.ok || !isJson) return;
//         const threads = (data.threads || []) as Array<{ unread: number }>;
//         const total = threads.reduce((sum, t) => sum + Number(t.unread || 0), 0);
//         setMessageUnread(total);
//       } catch {
//         // silent
//       }
//     };
//     load();
//     timer = setInterval(load, 60000);
//     return () => clearInterval(timer);
//   }, [API_ROOT, user?.email]);

//   // Poll jobs for new postings count
//   useEffect(() => {
//     let timer: any;
//     const load = async () => {
//       try {
//         const resp = await fetch(`${API_ROOT}/jobs`);
//         const isJson = resp.headers.get('content-type')?.includes('application/json');
//         const data = isJson ? await resp.json() : await resp.text();
//         if (!resp.ok || !isJson) return;
//         const jobs = (data.jobs || []) as Array<{ id: number }>;
//         const latestIds = new Set<number>(jobs.map(j => Number(j.id)));
//         const prevIds = prevJobIdsRef.current;
//         let newCount = 0;
//         latestIds.forEach(id => { if (!prevIds.has(id)) newCount++; });
//         if (prevIds.size === 0) {
//           prevJobIdsRef.current = latestIds;
//           setJobNewBadge(0);
//         } else {
//           setJobNewBadge(newCount);
//           prevJobIdsRef.current = latestIds;
//         }
//       } catch {
//         // silent
//       }
//     };
//     load();
//     timer = setInterval(load, 60000);
//     return () => clearInterval(timer);
//   }, [API_ROOT]);

//   // Clear job badge when on jobs route
//   useEffect(() => {
//     if (isActiveRoute('/alumni/job-posting')) {
//       setJobNewBadge(0);
//     }
//   }, [pathname]);

//   // If approval is pending or rejected, show message instead of navigation
//   if (profileLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (approvalStatus === 'pending') {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
//         <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
//           <div className="text-center">
//             {/* Icon */}
//             <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
//               <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>

//             {/* Title */}
//             <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//               Application Under Review
//             </h1>

//             {/* Message */}
//             <p className="text-lg text-gray-600 mb-6">
//               Thank you for registering! Your alumni application is currently being reviewed by our admin team.
//             </p>

//             {/* Details */}
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
//               <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
//               <ul className="text-left text-blue-800 space-y-2">
//                 <li className="flex items-start">
//                   <span className="mr-2">•</span>
//                   <span>Our admin team will verify your information</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="mr-2">•</span>
//                   <span>You'll receive an email notification once approved</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="mr-2">•</span>
//                   <span>Approval typically takes 1-2 business days</span>
//                 </li>
//               </ul>
//             </div>

//             {/* Actions */}
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <button
//                 onClick={() => router.push('/alumni/settings')}
//                 className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
//               >
//                 Update Profile
//               </button>
//               <button
//                 onClick={() => router.push('/api/auth/logout')}
//                 className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (approvalStatus === 'rejected') {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
//         <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
//           <div className="text-center">
//             {/* Icon */}
//             <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
//               <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </div>

//             {/* Title */}
//             <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//               Application Not Approved
//             </h1>

//             {/* Message */}
//             <p className="text-lg text-gray-600 mb-6">
//               Unfortunately, your alumni application was not approved at this time.
//             </p>

//             {/* Details */}
//             <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
//               <h3 className="font-semibold text-red-900 mb-3">What can you do?</h3>
//               <ul className="text-left text-red-800 space-y-2">
//                 <li className="flex items-start">
//                   <span className="mr-2">•</span>
//                   <span>Review and update your profile information</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="mr-2">•</span>
//                   <span>Contact our admin team for more details</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="mr-2">•</span>
//                   <span>You may reapply after updating your information</span>
//                 </li>
//               </ul>
//             </div>

//             {/* Actions */}
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <button
//                 onClick={() => router.push('/alumni/settings')}
//                 className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
//               >
//                 Update Profile
//               </button>
//               <button
//                 onClick={() => {
//                   // Contact admin
//                   window.location.href = 'mailto:admin@vppcoe.ac.in';
//                 }}
//                 className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
//               >
//                 Contact Admin
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Only show navigation if approved
//   if (approvalStatus !== 'approved') {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <p className="text-gray-600">Unable to load your profile. Please try again.</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Navigation Sidebar */}
//       <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-white shadow-lg border-r border-gray-200">
//         {/* Scrollable Container for entire sidebar */}
//         <div className="h-full overflow-y-auto">
//           {/* Logo & Branding */}
//           <div className="p-4 border-b border-gray-200">
//             <div className="flex items-center space-x-3">
//               <div className="flex-shrink-0">
//                 <img
//                   src="/NEWCNLOGO.png"
//                   className="w-12 h-12 object-contain"
//                   alt="CF Logo"
//                 />
//               </div>
//               <div className="flex-1">
//                 <h1 className="text-base font-bold text-gray-900 leading-tight">Connecting Future</h1>
//                 <p className="text-xs text-gray-500 mt-0.5">VPPCOE & VA</p>
//               </div>
//             </div>
//           </div>

//           {/* Alumni Profile Summary */}
//           <div className="p-6 border-b border-gray-200">
//             <div className="flex items-center space-x-3 mb-4">
//               <div className="relative">
//                 {alumniData.avatar ? (
//                   <img
//                     src={alumniData.avatar}
//                     alt={alumniData.name}
//                     className="w-12 h-12 rounded-full object-cover"
//                   />
//                 ) : (
//                   <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
//                     <span className="text-white font-semibold text-lg">
//                       {alumniData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
//                     </span>
//                   </div>
//                 )}
//                 {alumniData.verifiedBadge && (
//                   <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
//                     <span className="text-white text-xs">✓</span>
//                   </div>
//                 )}
//               </div>
//               <div className="flex-1">
//                 <h3 className="font-semibold text-gray-900">{alumniData.name}</h3>
//                 <p className="text-sm text-gray-600">Class of {alumniData.graduationYear}</p>
//                 {!profileLoading && alumniData.position !== 'Not specified' && (
//                   <p className="text-xs text-gray-500 mt-0.5">{alumniData.position} {alumniData.company !== 'Not specified' && `at ${alumniData.company}`}</p>
//                 )}
//                 <div className="flex items-center mt-1">
//                   <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
//                     {alumniData.verifiedBadge ? 'Verified Alumni' : 'Alumni'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Navigation Menu */}
//           <nav className="p-4">
//             {navigationItems.map((item: NavItem) => (
//               <Link
//                 key={item.id}
//                 href={item.route}
//                 className={`w-full flex items-center justify-between px-4 py-3 mb-1 rounded-lg text-left transition-all duration-200 hover:bg-gray-50 group ${isActiveRoute(item.route)
//                     ? 'bg-blue-50 text-blue-700 border border-blue-200'
//                     : 'text-gray-700 hover:text-gray-900'
//                   }`}
//               >
//                 <div className="flex items-center space-x-3">
//                   <div className={`${isActiveRoute(item.route) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
//                     {item.icon}
//                   </div>
//                   <span className="font-medium">{item.label}</span>
//                 </div>
//                 {(item.id === 'messages' ? messageUnread : item.id === 'jobs' ? jobNewBadge : (item.badge ? Number(item.badge) : 0)) > 0 && (
//                   <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
//                     {item.id === 'messages' ? messageUnread : item.id === 'jobs' ? jobNewBadge : item.badge}
//                   </span>
//                 )}
//               </Link>
//             ))}
//           </nav>

//           {/* Mentorship Status */}
//           <div className="p-4 border-t border-gray-200">
//             {profile?.is_mentor ? (
//               <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
//                 <div className="flex items-center space-x-2">
//                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                   <span className="text-sm font-medium text-green-700">Available</span>
//                 </div>
//                 <span className="text-xs text-green-600">Mentorship</span>
//               </div>
//             ) : (
//               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
//                 <div className="flex items-center space-x-2">
//                   <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
//                   <span className="text-sm font-medium text-gray-600">Not Available</span>
//                 </div>
//                 <span className="text-xs text-gray-500">Mentorship</span>
//               </div>
//             )}
//           </div>
//         </div>
//       </aside>

//       {/* Main Content Area */}
//       <main className="ml-64 min-h-screen">
//         {children}
//       </main>

//       {/* Personalization Modal */}
//       {showPersonalizationModal && (
//         <PersonalizationModal
//           onClose={() => setShowPersonalizationModal(false)}
//           selectedDomains={selectedDomains}
//           setSelectedDomains={setSelectedDomains}
//           selectedActivities={selectedActivities}
//           setSelectedActivities={setSelectedActivities}
//         />
//       )}
//     </div>
//   );
// }

// // Personalization Modal Component
// interface PersonalizationModalProps {
//   onClose: () => void;
//   selectedDomains: string[];
//   setSelectedDomains: React.Dispatch<React.SetStateAction<string[]>>;
//   selectedActivities: string[];
//   setSelectedActivities: React.Dispatch<React.SetStateAction<string[]>>;
// }

// function PersonalizationModal({ onClose, selectedDomains, setSelectedDomains, selectedActivities, setSelectedActivities }: PersonalizationModalProps) {
//   const domains: string[] = [
//     "Frontend Development", "Backend Development", "Mobile Development",
//     "Data Science", "Machine Learning", "Cybersecurity", "DevOps",
//     "Product Management", "UI/UX Design", "Digital Marketing"
//   ];

//   const activities: string[] = [
//     "1-on-1 Mentorship", "Group Sessions", "Resume Reviews", "Mock Interviews",
//     "Career Guidance", "Technical Workshops", "Industry Insights",
//     "Networking Events", "Skill Development", "Job Referrals"
//   ];

//   const toggleDomain = (domain: string): void => {
//     setSelectedDomains(prev =>
//       prev.includes(domain)
//         ? prev.filter((d: string) => d !== domain)
//         : [...prev, domain]
//     );
//   };

//   const toggleActivity = (activity: string): void => {
//     setSelectedActivities(prev =>
//       prev.includes(activity)
//         ? prev.filter((a: string) => a !== activity)
//         : [...prev, activity]
//     );
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h2 className="text-3xl font-bold text-slate-900">🎯 Personalize Your Impact</h2>
//             <p className="text-slate-600 mt-2">Help us match you with the right opportunities</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors duration-200"
//           >
//             ✕
//           </button>
//         </div>

//         <div className="space-y-8">
//           {/* Expertise Domains */}
//           <div>
//             <h3 className="text-xl font-semibold text-slate-900 mb-4">🚀 Your Expertise Domains</h3>
//             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//               {domains.map((domain: string) => (
//                 <button
//                   key={domain}
//                   onClick={() => toggleDomain(domain)}
//                   className={`p-4 rounded-xl text-left transition-all duration-200 ${selectedDomains.includes(domain)
//                       ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105"
//                       : "bg-slate-100 hover:bg-slate-200 text-slate-700"
//                     }`}
//                 >
//                   <span className="font-medium">{domain}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Preferred Activities */}
//           <div>
//             <h3 className="text-xl font-semibold text-slate-900 mb-4">🎯 Activities You'd Love to Do</h3>
//             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//               {activities.map((activity: string) => (
//                 <button
//                   key={activity}
//                   onClick={() => toggleActivity(activity)}
//                   className={`p-4 rounded-xl text-left transition-all duration-200 ${selectedActivities.includes(activity)
//                       ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105"
//                       : "bg-slate-100 hover:bg-slate-200 text-slate-700"
//                     }`}
//                 >
//                   <span className="font-medium">{activity}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Save Button */}
//           <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
//             <button
//               onClick={onClose}
//               className="px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors duration-200"
//             >
//               Skip for now
//             </button>
//             <button
//               onClick={onClose}
//               className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
//             >
//               Save Preferences 🎉
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, Users, Building, MessageSquare,
  Trophy, Settings, Heart, Calendar, Map, Camera,
  Zap, ShieldCheck, Clock, XCircle, ChevronRight, LogOut
} from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  badge?: number | string;
}

interface AlumniNavigationProps {
  children: React.ReactNode;
}

export default function AlumniNavigation({ children }: AlumniNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  const [messageUnread, setMessageUnread] = useState<number>(0);
  const [jobNewBadge, setJobNewBadge] = useState<number>(0);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const prevJobIdsRef = useRef<Set<number>>(new Set());

  const API_ROOT = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '') + '/api';

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const resp = await fetch('/api/user/profile', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          setApprovalStatus(data?.user?.approval_status || 'pending');
          setProfile(data?.user || null);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    if (user) loadProfile();
  }, [user]);

  useEffect(() => {
    if (approvalStatus !== 'approved' || !user?.email) return;
    const poll = async () => {
      try {
        const msgResp = await fetch(`${API_ROOT}/messages/threads?user=${encodeURIComponent(user.email!)}`);
        if (msgResp.ok) {
          const data = await msgResp.json();
          const total = (data.threads || []).reduce((sum: number, t: any) => sum + Number(t.unread || 0), 0);
          setMessageUnread(total);
        }
        const jobResp = await fetch(`${API_ROOT}/jobs`);
        if (jobResp.ok) {
          const data = await jobResp.json();
          const jobs = data.jobs || [];
          if (prevJobIdsRef.current.size > 0) {
            const newOnes = jobs.filter((j: any) => !prevJobIdsRef.current.has(j.id)).length;
            setJobNewBadge(newOnes);
          }
          prevJobIdsRef.current = new Set(jobs.map((j: any) => j.id));
        }
      } catch (e) { }
    };
    poll();
    const timer = setInterval(poll, 60000);
    return () => clearInterval(timer);
  }, [approvalStatus, user?.email, API_ROOT]);

  const navigationItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutIcon />, route: "/alumni/dashboard" },
    { id: "network", label: "Network", icon: <Users size={20} />, route: "/alumni/network" },
    { id: "mentorship", label: "Mentorship", icon: <Zap size={20} />, route: "/alumni/mentorship" },
    { id: "jobs", label: "Careers", icon: <Building size={20} />, route: "/alumni/job-posting", badge: jobNewBadge },
    { id: "events", label: "Events", icon: <Calendar size={20} />, route: "/alumni/events" },
    { id: "roadmaps", label: "Roadmaps", icon: <Map size={20} />, route: "/alumni/roadmap" },
    { id: "memories", label: "Memories", icon: <Camera size={20} />, route: "/alumni/memories" },
    { id: "leaderboard", label: "Hall of Fame", icon: <Trophy size={20} />, route: "/alumni/leaderboard" },
    { id: "messages", label: "Messages", icon: <MessageSquare size={20} />, route: "/alumni/messages", badge: messageUnread },
    { id: "donations", label: "Donations", icon: <Heart size={20} />, route: "/alumni/donation" },
    { id: "settings", label: "Settings", icon: <Settings size={20} />, route: "/alumni/settings" },
  ];

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Zap className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (approvalStatus === 'pending') {
    return <StatusOverlay icon={<Clock className="text-amber-500" size={48} />} title="Review in Progress" message="We're currently verifying your alumni status." color="amber" />;
  }

  if (approvalStatus === 'rejected') {
    return <StatusOverlay icon={<XCircle className="text-rose-500" size={48} />} title="Verification Failed" message="We couldn't verify your alumni record." color="rose" isError />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-white shadow-lg border-r border-gray-200">
        <div className="h-full overflow-y-auto">
          {/* Logo & Branding */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Alumni Portal</h1>
                <p className="text-sm text-gray-500">VPPCOE & VA, Mumbai</p>
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-sky-400 rounded-full flex items-center justify-center overflow-hidden">
                  <img src={profile?.picture || user?.picture || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-full h-full object-cover" alt="" />
                </div>
                {approvalStatus === 'approved' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs leading-none">✓</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {profile?.name || user?.name || 'Alumni'}
                </h3>
                <p className="text-sm text-gray-600">Class of {profile?.graduation_year || '2026'}</p>
                {profile?.department && <p className="text-xs text-gray-500">{profile.department}</p>}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => router.push('/alumni/network')} className="flex items-center justify-center p-2 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
                <Users className="w-4 h-4 text-sky-600 mr-1" />
                <span className="text-xs font-medium text-sky-700">Network</span>
              </button>
              <button onClick={() => router.push('/alumni/mentorship')} className="flex items-center justify-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Zap className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-xs font-medium text-blue-600">Mentor</span>
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.route}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${pathname === item.route
                      ? 'bg-sky-50 text-sky-900 border-l-4 border-sky-400'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`${pathname === item.route ? 'text-sky-500' : 'text-gray-500'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 mt-auto">
            <div className="space-y-2">
              <Link
                href="/api/auth/logout"
                className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors group"
              >
                <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" />
                <span className="font-medium">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function StatusOverlay({ icon, title, message, color, isError }: any) {
  const router = useRouter();
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 relative overflow-hidden font-sans`}>
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-${color}-200/40 rounded-full blur-[100px] opacity-50 mix-blend-multiply pointer-events-none`} />
      <div className={`absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-${isError ? 'rose' : 'emerald'}-200/30 rounded-full blur-[120px] opacity-50 mix-blend-multiply pointer-events-none`} />

      <div className="max-w-xl w-full bg-white/60 backdrop-blur-2xl rounded-[3rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white p-12 text-center relative z-10">
        <div className={`w-28 h-28 bg-gradient-to-tr from-${color}-400 to-${color}-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-${color}-500/20 transform hover:scale-105 transition-transform duration-300 text-white`}>
          {React.cloneElement(icon, { size: 56, className: 'text-white' })}
        </div>
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">{title}</h1>
        <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/alumni/settings" className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform duration-300">Update Profile</Link>
          {isError && <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 hover:shadow-sm transition-all duration-300">Support</button>}
        </div>
      </div>
    </div>
  );
}

function LayoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}