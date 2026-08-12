"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Search, Bell, SlidersHorizontal, 
  ChevronLeft, ChevronRight, MessageCircle, Video, Clock, 
  CheckSquare, Square, Check, XCircle
} from 'lucide-react';
import Image from 'next/image';

export default function AlumniDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [isCalendarFlipped, setIsCalendarFlipped] = useState(false);
  const [isImpactFlipped, setIsImpactFlipped] = useState(false);

  const handleDateClick = (day: number) => {
    setSelectedDate(day);
    setIsCalendarFlipped(true);
  };

  // Mock events for specific days
  const eventsMap: Record<number, { title: string, time: string, type: string }> = {
    1: { title: "Alumni Meetup Mumbai", time: "6:00 PM - 8:00 PM", type: "Networking" },
    13: { title: "Guest Lecture: Tech Trends", time: "10:00 AM - 12:00 PM", type: "Webinar" },
    24: { title: "Resume Review Session", time: "4:00 PM - 5:30 PM", type: "Mentorship" }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await fetch('/api/user/profile', { cache: 'no-store' });
        if (!resp.ok) {
          if (resp.status === 401) {
            router.push('/api/auth/login?returnTo=/alumni/dashboard');
            return;
          }
          throw new Error(`Failed: ${resp.status}`);
        }
        const data = await resp.json();
        const p = data.user || data;
        setProfile(p);

        if (p && (p.user_type === 'alumni' || p.userType === 'alumni') && p.approval_status && p.approval_status !== 'approved') {
          setError('Your account is pending admin approval.');
          setLoading(false);
          return;
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading) return (
    <>
        <div className="flex h-full min-h-[60vh] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-black" />
        </div>
    </>
  );

  if (error) return (
    <>
      <div className="p-8 h-full">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-6 rounded-[20px] shadow-sm flex items-start gap-3">
          <XCircle className="text-red-500 mt-1 flex-shrink-0" />
          <div>
            <p className="font-bold text-lg mb-1">Error loading dashboard</p>
            <p className="text-sm font-medium opacity-90">{error}</p>
          </div>
        </div>
      </div>
    </>
  );

  const totalImpact = Number(profile?.impact_score ?? profile?.total_points ?? profile?.impactScore ?? 0);
  const impactBreakdown = profile?.impact_breakdown || {};
  
  return (
    <>
      <div className="max-w-[1400px] mx-auto text-[#111111]">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-10">
           <div className="flex-1 max-w-md relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-white rounded-[16px] py-3.5 pl-12 pr-4 text-[15px] font-medium focus:outline-none placeholder-gray-400 border border-transparent hover:border-gray-100"
              />
           </div>
           <div className="flex items-center gap-4">
              <button className="w-[46px] h-[46px] bg-white rounded-full flex items-center justify-center hover:bg-[#f6f3eb] relative border border-transparent hover:border-gray-100">
                 <Bell size={20} className="text-gray-700" strokeWidth={2} />
                 <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-teal-950 rounded-full border-2 border-white" />
              </button>
              <button className="w-[46px] h-[46px] bg-white rounded-full flex items-center justify-center hover:bg-[#f6f3eb] border border-transparent hover:border-gray-100">
                 <SlidersHorizontal size={20} className="text-gray-700" strokeWidth={2} />
              </button>
           </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Left Column (My Contributions + Tasks) */}
          <div className="xl:col-span-7 flex flex-col gap-10">
             
             {/* My Contributions Section */}
             <div>
                <h2 className="text-[28px] font-bold mb-6 tracking-tight">Community Contribution</h2>
                
                {/* Main Dark Card */}
                <div className="bg-teal-950 rounded-[32px] p-8 text-white mb-6 relative overflow-hidden shadow-lg">
                   <div className="relative z-10">
                     <h3 className="text-[17px] font-bold mb-1.5 tracking-wide">Welcome Back</h3>
                     <p className="text-[#8F93A3] text-[13px] font-medium max-w-[280px] leading-[1.6]">
                       Hello, {profile?.name || 'Vijay Yadav'}! Your community is growing. Ready to make an impact today?
                     </p>
                   </div>
                   {/* Abstract line art */}
                   <svg className="absolute right-0 bottom-0 w-[200px] h-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M40,70 C60,70 70,30 90,30 C110,30 120,60 140,60 C160,60 170,20 190,20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                   </svg>
                </div>

                {/* List Cards */}
                <div className="space-y-4">
                   <ContributionCard 
                     title="Post a Job" 
                     subtitle="Share opportunities with juniors" 
                     icon="book" 
                     onClick={() => router.push('/alumni/job-posting')}
                   />
                   <ContributionCard 
                     title="Upcoming Events" 
                     subtitle="Browse and create alumni events" 
                     icon="globe" 
                     onClick={() => router.push('/alumni/events')}
                   />
                   <ContributionCard 
                     title="Create Roadmap" 
                     subtitle="Guide students through a tech stack" 
                     icon="math" 
                     onClick={() => router.push('/alumni/roadmap')}
                   />
                </div>
             </div>

             {/* Today's Tasks */}
             <div>
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-[22px] font-bold tracking-tight">Quick Actions</h2>
                </div>

                <div className="space-y-6">
                   <TaskRow 
                     title="Browse Network" 
                     subtitle="Connect with other alumni" 
                     completed={false} 
                     icon="globe" 
                     onClick={() => router.push('/alumni/network')} 
                   />
                   <TaskRow 
                     title="Mentor Students" 
                     subtitle="Help juniors grow and succeed" 
                     completed={false} 
                     icon="handshake" 
                     onClick={() => router.push('/alumni/mentorship')} 
                   />
                   <TaskRow 
                     title="Donate" 
                     subtitle="Support your alma mater" 
                     completed={false} 
                     icon="book-open" 
                     onClick={() => router.push('/alumni/donation')} 
                   />
                </div>
             </div>
          </div>

          {/* Right Column (Calendar + Profile + Success) */}
          <div className="xl:col-span-5 flex flex-col gap-8">
             
             {/* Top row in Right Col */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                
                {/* Interactive Calendar Container */}
                <div className="bg-transparent flex flex-col relative" style={{ perspective: '1000px' }}>
                   
                   <div 
                     className="w-full transition-all duration-700 ease-in-out relative"
                     style={{ 
                       transformStyle: 'preserve-3d', 
                       transform: isCalendarFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                       minHeight: '340px'
                     }}
                   >
                     {/* FRONT FACE: Calendar Grid */}
                     <div 
                       className="w-full absolute top-0 left-0"
                       style={{ backfaceVisibility: 'hidden' }}
                     >
                       <h3 className="text-[18px] font-bold mb-6 tracking-tight">Upcoming Events</h3>
                       <div className="flex items-center justify-between mb-8">
                          <span className="text-[13px] font-bold tracking-widest uppercase text-gray-600">MAY 2022</span>
                          <div className="flex gap-2">
                            <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                               <ChevronLeft size={14} className="text-gray-400" />
                            </button>
                            <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                               <ChevronRight size={14} className="text-gray-400" />
                            </button>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-7 gap-y-6 text-center text-[10px] font-bold text-gray-400 mb-4 tracking-wider">
                         <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
                       </div>
                       
                       <div className="grid grid-cols-7 gap-y-5 text-center text-[14px] font-bold">
                         {[29, 30, 31].map(d => <div key={`prev-${d}`} className="text-gray-300">{d}</div>)}
                         
                         {Array.from({length: 31}, (_, i) => i + 1).map(day => {
                           const hasEvent = !!eventsMap[day];
                           const isPrimaryEvent = day === 13;
                           const isSecondaryEvent = day === 1;
                           
                           return (
                             <div 
                               key={`day-${day}`} 
                               onClick={() => handleDateClick(day)}
                               className={`relative flex justify-center items-center cursor-pointer mx-auto w-8 h-8 rounded-full transition-all ${
                                 !hasEvent ? 'hover:bg-gray-100 hover:text-black' : ''
                               }`}
                             >
                               <span className={`relative z-10 ${isPrimaryEvent ? 'text-white' : 'text-teal-950'}`}>
                                 {day}
                               </span>
                               {isPrimaryEvent && <div className="absolute w-8 h-8 bg-teal-950 rounded-full shadow-md" />}
                               {isSecondaryEvent && <div className="absolute w-8 h-8 border-2 border-black rounded-full" />}
                               {hasEvent && !isPrimaryEvent && !isSecondaryEvent && <div className="absolute bottom-0 w-1 h-1 bg-teal-500 rounded-full" />}
                             </div>
                           )
                         })}
                         
                         {[1, 2, 3].map(d => <div key={`next-${d}`} className="text-gray-300">{d}</div>)}
                       </div>
                     </div>

                     {/* BACK FACE: Event Details */}
                     <div 
                       className="w-full absolute top-0 left-0 h-full bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col"
                       style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                     >
                        <button 
                          onClick={() => setIsCalendarFlipped(false)}
                          className="w-8 h-8 rounded-full bg-[#f6f3eb] flex items-center justify-center hover:bg-gray-100 text-gray-600 mb-4 transition-colors"
                        >
                           <ChevronLeft size={16} />
                        </button>
                        
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                           <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center mb-4">
                              <span className="text-[24px] font-black">{selectedDate}</span>
                           </div>
                           
                           {eventsMap[selectedDate!] ? (
                             <>
                               <span className="text-[11px] font-bold tracking-widest text-teal-500 uppercase mb-2">
                                 {eventsMap[selectedDate!].type}
                               </span>
                               <h4 className="text-[18px] font-bold text-gray-900 mb-2 leading-tight">
                                 {eventsMap[selectedDate!].title}
                               </h4>
                               <p className="text-[14px] text-gray-500 font-medium mb-6">
                                 {eventsMap[selectedDate!].time}
                               </p>
                               <button className="px-6 py-2.5 bg-teal-950 text-white text-[14px] font-bold rounded-xl shadow-sm hover:bg-gray-800 transition-colors">
                                 View Event
                               </button>
                             </>
                           ) : (
                             <>
                               <div className="w-12 h-12 bg-[#f6f3eb] rounded-full flex items-center justify-center mb-3">
                                 <Clock size={20} className="text-gray-400" />
                               </div>
                               <h4 className="text-[16px] font-bold text-gray-900 mb-1">No events scheduled</h4>
                               <p className="text-[13px] text-gray-500">Take some time to rest or explore the network.</p>
                             </>
                           )}
                        </div>
                     </div>
                   </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm flex flex-col items-center">
                   <div className="w-[120px] h-[120px] rounded-[32px] bg-gray-100 overflow-hidden mb-6">
                     <img 
                       src={profile?.picture || "https://ui-avatars.com/api/?name=V+Y&background=000&color=fff"} 
                       alt="Profile" 
                       className="w-full h-full object-cover grayscale"
                     />
                   </div>
                   <h3 className="text-[20px] font-bold text-center leading-tight mb-2">
                     {profile?.name || 'Vijay Yadav'}
                   </h3>
                   <p className="text-[13px] text-gray-400 font-medium text-center mb-8">
                     {profile?.job_title || 'Software Engineer'} {profile?.company ? `at ${profile.company}` : ''}
                   </p>
                   
                   <div className="flex gap-4 mb-8 w-full justify-center">
                      <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-[#f6f3eb] transition-colors">
                        <MessageCircle size={18} className="text-gray-400" />
                      </button>
                      <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-[#f6f3eb] transition-colors">
                        <Video size={18} className="text-gray-400" />
                      </button>
                      <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-[#f6f3eb] transition-colors">
                        <Clock size={18} className="text-gray-400" />
                      </button>
                   </div>
                   
                   <button 
                     onClick={() => router.push('/alumni/settings')}
                     className="w-full bg-teal-950 text-white rounded-2xl py-4 font-semibold text-[15px] flex items-center justify-center gap-3 hover:bg-teal-900 transition-colors mt-auto shadow-md"
                   >
                     <div className="flex items-center gap-1.5">
                       <UserIcon />
                       Edit Profile
                     </div>
                   </button>
                </div>
             </div>

             {/* Your success section */}
             <div className="mt-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[13px] font-bold text-gray-500 tracking-wider">SEE DETAILS</h3>
                </div>
                
                <div className="relative flex-1 min-h-[360px]" style={{ perspective: '1000px' }}>
                   <div 
                     className="w-full h-full transition-all duration-700 ease-in-out relative"
                     style={{ 
                       transformStyle: 'preserve-3d', 
                       transform: isImpactFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                     }}
                   >
                     {/* FRONT FACE */}
                     <div 
                       className="w-full h-full absolute top-0 left-0 bg-teal-950 rounded-[32px] p-6 text-white flex flex-col shadow-xl cursor-pointer hover:shadow-2xl transition-all"
                       style={{ backfaceVisibility: 'hidden' }}
                       onClick={() => setIsImpactFlipped(true)}
                     >
                       <div className="flex items-center justify-between mb-6 px-2">
                         <h3 className="text-lg font-bold">Total Impact</h3>
                         <div className="w-8 h-8 rounded-full flex items-center justify-center">
                           <PieChartIcon />
                         </div>
                       </div>
                       
                       <div className="flex-1 grid grid-rows-2 gap-4">
                          {/* Top stat card */}
                          <div className="bg-white rounded-[24px] p-6 text-black flex flex-col justify-between pointer-events-none">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                     <DotsIcon />
                                  </div>
                                  <span className="text-[32px] font-bold leading-none tracking-tight">{totalImpact}</span>
                               </div>
                               <button className="text-[12px] font-bold text-gray-500 flex items-center gap-1">
                                 Last week <ChevronRight size={14} className="rotate-90" />
                               </button>
                             </div>
                             <div className="flex justify-between items-end mt-4">
                                <p className="text-[13px] text-gray-400 font-medium max-w-[100px] leading-snug">Contributions this year</p>
                                {/* Abstract chart */}
                                <div className="w-[140px] h-[40px] relative">
                                   <svg viewBox="0 0 140 40" fill="none" className="w-full h-full overflow-visible">
                                      <path d="M0,35 Q30,35 60,15 T100,25 T140,5" stroke="#042f2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                   </svg>
                                   <div className="absolute top-[20px] left-[70%] w-[20px] h-[44px] bg-teal-950 rounded-full -translate-y-1/2 flex items-center justify-center shadow-lg">
                                     <span className="text-white text-[10px] font-bold absolute -top-5">16</span>
                                     <div className="w-2.5 h-2.5 rounded-full border-2 border-white" />
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Bottom stat card */}
                          <div className="bg-white rounded-[24px] p-6 text-black flex flex-col justify-between pointer-events-none">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                   <FlameIcon />
                                </div>
                                <span className="text-[24px] font-bold leading-none tracking-tight">Active</span>
                             </div>
                             <div className="flex justify-between items-end mt-4">
                                <p className="text-[13px] text-gray-400 font-medium max-w-[130px] leading-snug">Your engagement over the week</p>
                                {/* Bar chart */}
                                <div className="flex items-end gap-[8px] h-[45px]">
                                   {['S','M','T','W','T','F','S'].map((day, i) => (
                                     <div key={i} className="flex flex-col items-center gap-2">
                                        <div className={`w-3 rounded-full ${i === 3 ? 'bg-teal-950 h-[35px]' : 'bg-gray-200 h-[15px]'}`} style={i !== 3 ? {height: `${12 + Math.random() * 20}px`} : {}} />
                                        <span className="text-[9px] font-bold text-gray-400">{day}</span>
                                     </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                     </div>

                     {/* BACK FACE */}
                     <div 
                       className="w-full h-full absolute top-0 left-0 bg-teal-950 rounded-[32px] p-8 text-white flex flex-col shadow-xl border border-[#2A2C33]"
                       style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                     >
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-lg font-bold text-white tracking-wide">Impact Breakdown</h3>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsImpactFlipped(false); }}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                          >
                             <ChevronLeft size={18} />
                          </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center space-y-6">
                           <div className="flex justify-between items-center border-b border-white/10 pb-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Check size={14} className="text-gray-400" /></div>
                                 <span className="text-[15px] text-gray-300 font-medium">Mentorships</span>
                              </div>
                              <span className="text-[24px] font-bold">{impactBreakdown.mentorships || 0}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-white/10 pb-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Check size={14} className="text-gray-400" /></div>
                                 <span className="text-[15px] text-gray-300 font-medium">Jobs Posted</span>
                              </div>
                              <span className="text-[24px] font-bold">{impactBreakdown.jobs || 0}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-white/10 pb-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Check size={14} className="text-gray-400" /></div>
                                 <span className="text-[15px] text-gray-300 font-medium">Roadmaps Shared</span>
                              </div>
                              <span className="text-[24px] font-bold">{impactBreakdown.roadmaps || 0}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Check size={14} className="text-gray-400" /></div>
                                 <span className="text-[15px] text-gray-300 font-medium">Events Hosted</span>
                              </div>
                              <span className="text-[24px] font-bold">{impactBreakdown.events || 0}</span>
                           </div>
                        </div>
                     </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </>
  );
}

function ContributionCard({ title, subtitle, icon, onClick }: { title: string; subtitle: string; icon: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-[28px] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer">
       <div className="pl-2">
         <h4 className="text-[18px] font-bold mb-1.5">{title}</h4>
         <p className="text-[13px] text-gray-500 font-bold">{subtitle}</p>
       </div>
       <div className="w-[60px] h-[60px] rounded-2xl bg-[#f6f3eb] flex items-center justify-center text-gray-600">
          {icon === 'math' ? (
            <div className="flex flex-col items-center leading-none text-sm font-bold tracking-widest -space-y-1">
              <span>+-</span>
              <span>x=</span>
            </div>
          ) : icon === 'book' ? (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          ) : (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          )}
       </div>
    </div>
  );
}

function TaskRow({ title, subtitle, completed, icon, onClick }: { title: string; subtitle: string; completed: boolean, icon: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-5 group cursor-pointer hover:bg-white/50 p-2 -m-2 rounded-xl transition-all">
       <div className="w-[54px] h-[54px] rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 text-black">
          {icon === 'globe' ? (
             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
          ) : icon === 'handshake' ? (
             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a2.12 2.12 0 1 0 3-3L15 9l-4.5 4.5"/><path d="M15 9l-5-5-2.5 2.5a2.12 2.12 0 1 0 3 3L13 7l-2 2"/><path d="m8 10-2.5 2.5a2.12 2.12 0 1 0 3 3L11 13l2-2"/></svg>
          ) : (
             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          )}
       </div>
       <div className="flex-1 min-w-0">
         <h4 className="text-[16px] font-bold mb-1 tracking-tight">{title}</h4>
         <p className="text-[13px] text-gray-400 font-bold">{subtitle}</p>
       </div>
       <div className="flex items-center gap-2.5 text-[14px] font-bold text-gray-600 shrink-0">
         {completed ? (
           <div className="w-[22px] h-[22px] bg-teal-950 rounded-md flex items-center justify-center">
             <Check size={14} className="text-white" strokeWidth={3} />
           </div>
         ) : (
           <div className="w-[22px] h-[22px] border-2 border-gray-300 rounded-md" />
         )}
       </div>
    </div>
  );
}

// Custom Icons
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const PieChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
);

const DotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="1.5" fill="black"/><circle cx="16" cy="8" r="1.5" fill="black"/><circle cx="8" cy="16" r="1.5" fill="black"/><circle cx="16" cy="16" r="1.5" fill="black"/></svg>
);

const FlameIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
);
