"use client";

import React, { useState, useEffect, useMemo } from 'react';

import { Search, Filter, MapPin, Building, GraduationCap, Linkedin, Mail, MessageSquare, Star, Users, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface Alumni {
  id: string;
  email?: string;
  name: string;
  graduationYear: string;
  degree: string;
  company: string;
  position: string;
  location: string;
  expertise: string[];
  isOpenToMentoring: boolean;
  rating?: number;
  responseTime?: string;
  linkedinUrl?: string;
  avatar?: string;
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const AlumniDirectoryPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExpertise, setFilterExpertise] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const rawApi = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const API_BASE = rawApi.replace(/\/$/, '').replace(/\/api$/, '') + '/api';
  const currentUserEmail = (user?.email as string | undefined) || '';
  const [connections, setConnections] = useState<Array<{ id: number; pair_key: string; requester_email: string; target_email: string; status: 'pending' | 'accepted' | 'rejected' | 'removed'; }>>([]);
  const [connLoading, setConnLoading] = useState(false);
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, { name?: string; major?: string; graduation_year?: number }>>({});
  function buildPairKey(a: string, b: string) { const [x, y] = [a.toLowerCase().trim(), b.toLowerCase().trim()].sort(); return `${x}|${y}`; }

  // Load alumni from backend
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${API_BASE}/users?type=alumni&limit=50`);
        const isJson = resp.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await resp.json() : await resp.text();
        if (!resp.ok) throw new Error(typeof data === 'string' ? data : data?.error || 'Failed to load alumni');
        if (!isJson) throw new Error('Unexpected non-JSON response while loading alumni');
        const users = (data.users || []) as Array<any>;
        const mapped: Alumni[] = users.map(u => {
          const skills = Array.isArray(u.skills)
            ? u.skills
            : typeof u.skills === 'string'
              ? String(u.skills).split(',').map((s: string) => s.trim()).filter(Boolean)
              : [];
          return {
            id: String(u.id ?? u.email ?? u.auth0_id ?? Math.random()),
            email: u.email,
            name: u.name || (u.email || 'Unknown'),
            graduationYear: u.graduation_year ? String(u.graduation_year) : '',
            degree: u.major || '',
            company: u.company || '',
            position: u.job_title || u.current_job || '',
            location: u.location || '',
            expertise: skills,
            isOpenToMentoring: Boolean(u.is_mentor),
            rating: typeof u.rating === 'number' ? u.rating : undefined,
            responseTime: u.response_time || u.responseTime || undefined,
            linkedinUrl: undefined,
            avatar: u.picture || undefined,
          } as Alumni;
        });
        setAlumni(mapped);
      } catch (e: any) {
        toast({ title: 'Failed to load alumni', description: e.message || String(e), variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [API_BASE, toast]);

  // Load connections for current user
  useEffect(() => {
    if (!currentUserEmail) return;
    (async () => {
      try {
        setConnLoading(true);
        const resp = await fetch(`${API_BASE}/connections?user_email=${encodeURIComponent(currentUserEmail)}`);
        const isJson = resp.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await resp.json() : await resp.text();
        if (resp.ok && isJson) {
          setConnections(data.connections || []);
        }
      } finally { setConnLoading(false); }
    })();
  }, [API_BASE, currentUserEmail]);

  // Hydrate requester profiles for incoming pending requests
  useEffect(() => {
    if (!currentUserEmail) return;
    const incoming = connections.filter(c => c.status === 'pending' && c.target_email.toLowerCase() === currentUserEmail.toLowerCase());
    const emails = Array.from(new Set(incoming.map(c => c.requester_email.toLowerCase())));
    const missing = emails.filter(e => !requesterProfiles[e]);
    if (missing.length === 0) return;
    (async () => {
      try {
        const results = await Promise.all(missing.map(async (email) => {
          try {
            const resp = await fetch(`${API_BASE}/users/by-email?email=${encodeURIComponent(email)}`);
            if (!resp.ok) return { email } as any;
            const data = await resp.json();
            const u = data.user || {};
            return { name: u.name, major: u.major, graduation_year: u.graduation_year };
          } catch { return { email } as any; }
        }));
        setRequesterProfiles(prev => {
          const next = { ...prev };
          emails.forEach((e, idx) => { const info = results[idx]; if (info) next[e] = info; });
          return next;
        });
      } catch { /* silent */ }
    })();
  }, [API_BASE, connections, currentUserEmail, requesterProfiles]);

  async function respondRequest(otherEmail: string, action: 'accept' | 'reject') {
    if (!currentUserEmail || !otherEmail) return;
    setConnLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/connections/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: currentUserEmail, other_email: otherEmail, action }) });
      const isJson = resp.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await resp.json() : await resp.text();
      if (resp.ok && isJson && data.connection) {
        setConnections(prev => prev.map(c => c.pair_key === data.connection.pair_key ? data.connection : c));
        toast({ title: action === 'accept' ? 'Request accepted' : 'Request declined', description: otherEmail });
      }
    } catch (e: any) {
      toast({ title: 'Action failed', description: e.message || String(e), variant: 'destructive' });
    } finally { setConnLoading(false); }
  }

  async function connectToAlumni(targetEmail?: string) {
    if (!targetEmail) return;
    if (!currentUserEmail) {
      toast({ title: 'Sign in required', description: 'Please sign in to send connection requests.' });
      return;
    }
    try {
      const resp = await fetch(`${API_BASE}/connections/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_email: currentUserEmail, target_email: targetEmail })
      });
      const isJson = resp.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await resp.json() : await resp.text();
      if (!resp.ok) throw new Error(typeof data === 'string' ? data : data?.error || 'Failed to send request');
      toast({ title: 'Connection request sent', description: `Requested to connect with ${targetEmail}.` });
    } catch (e: any) {
      toast({ title: 'Request failed', description: e.message || String(e), variant: 'destructive' });
    }
  }

  const expertiseOptions = useMemo(() => {
    const allExpertise = alumni.flatMap((alum) => alum.expertise || []);
    return ['all', ...Array.from(new Set(allExpertise)).sort()];
  }, [alumni]);

  const filteredAlumni = alumni.filter(alum => {
    const matchesSearch = alum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alum.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alum.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alum.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesExpertise = filterExpertise === 'all' || alum.expertise.includes(filterExpertise);
    return matchesSearch && matchesExpertise;
  });

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-[#f6f3eb] p-8">
          <div className="animate-pulse max-w-7xl mx-auto">
            <div className="h-32 bg-white rounded-[24px] shadow-sm border border-gray-100 w-full mb-8"></div>
            <div className="h-20 bg-white rounded-2xl shadow-sm border border-gray-100 w-full mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white h-[360px] rounded-3xl shadow-sm border border-gray-100"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#f6f3eb] p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section (Black Rounded) */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="bg-teal-950 rounded-[24px] p-8 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-3xl font-bold text-white mb-2">Alumni Directory</h1>
                <p className="text-sm text-gray-400">Connect with successful alumni and find experienced mentors.</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-[#2a2a35] text-white px-4 py-2 rounded-full border border-white/10">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span className="font-medium">{alumni.length} Registered</span>
                </div>
                <div className="flex items-center gap-2 bg-[#2a2a35] text-white px-4 py-2 rounded-full border border-white/10">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{alumni.filter((alum: any) => alum.isOpenToMentoring).length} Mentors Available</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* My Requests (incoming pending) */}
          {connections.length > 0 && currentUserEmail && (() => {
            const incoming = connections.filter((c: any) => c.status === 'pending' && c.target_email.toLowerCase() === currentUserEmail.toLowerCase());
            if (!incoming.length) return null;
            return (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-8"
              >
                <div>
                  <h2 className="text-lg font-bold text-[#16161c] mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" /> Pending Requests
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {incoming.map((req: any, idx: number) => {
                      const email = req.requester_email;
                      const info = requesterProfiles[email.toLowerCase()] || {};
                      const displayName = info.name || email;
                      const initials = (displayName || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-teal-950 flex items-center justify-center text-white font-bold">{initials}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#16161c] truncate">{displayName}</p>
                              <p className="text-xs text-gray-500 truncate">{email}</p>
                              {(info.major || info.graduation_year) && (
                                <p className="text-[11px] text-gray-400 truncate mt-1 uppercase tracking-wider font-semibold">
                                  {info.major || 'N/A'} {info.graduation_year ? `• '`+info.graduation_year.toString().slice(2) : ''}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => respondRequest(email, 'accept')} disabled={connLoading} className="flex-1 py-2 rounded-xl bg-teal-950 text-white text-xs font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors">Accept</button>
                            <button onClick={() => respondRequest(email, 'reject')} disabled={connLoading} className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-colors">Decline</button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* Search and Filter Bar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, company, position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#f6f3eb] rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#16161c]/20 transition-all font-medium text-[#16161c] placeholder-gray-400"
                />
              </div>
              <div className="relative w-full lg:w-auto">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterExpertise}
                  onChange={(e) => setFilterExpertise(e.target.value)}
                  className="w-full lg:w-auto pl-12 pr-8 py-3 bg-[#f6f3eb] rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#16161c]/20 font-medium text-[#16161c] transition-all"
                >
                  {expertiseOptions.map((option: string) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All Expertise' : option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-xl text-[#16161c]">
              {filteredAlumni.length} Results
            </h2>
          </div>

          {/* Alumni Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredAlumni.length === 0 ? (
              <div className="col-span-full">
                <div className="bg-white rounded-[32px] p-12 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-[#f6f3eb] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-[#16161c] mb-2">No Alumni Found</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    We couldn't find anyone matching your criteria. Try adjusting your search or filters.
                  </p>
                  <button
                    onClick={() => { setSearchTerm(''); setFilterExpertise('all'); }}
                    className="px-6 py-2.5 bg-teal-950 text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              filteredAlumni.map((alum: any) => (
                <motion.div
                  key={alum.id}
                  variants={fadeInUp}
                  className="bg-white rounded-[32px] p-8 flex flex-col shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 relative group"
                >
                  {/* Mentoring Status Badge */}
                  {alum.isOpenToMentoring && (
                    <div className="absolute top-6 right-6">
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Mentor</span>
                      </div>
                    </div>
                  )}

                  {/* Profile Header */}
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-16 h-16 rounded-full bg-teal-950 flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                      {alum.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="font-bold text-xl text-[#16161c] truncate">{alum.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-500">Class of {alum.graduationYear}</span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div className="space-y-4 mb-6 flex-1">
                    <div className="bg-[#f6f3eb] p-4 rounded-2xl border border-gray-100/50">
                      <div className="flex items-start gap-3 mb-3">
                        <Building className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Role</p>
                          <p className="font-bold text-sm text-[#16161c]">{alum.position}</p>
                          <p className="text-sm font-medium text-gray-500">{alum.company}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Location</p>
                          <p className="font-bold text-sm text-[#16161c]">{alum.location || 'Remote'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expertise Areas */}
                    {alum.expertise && alum.expertise.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Expertise</p>
                        <div className="flex flex-wrap gap-2">
                          {alum.expertise.slice(0, 3).map((exp: string, index: number) => (
                            <span key={index} className="px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg">
                              {exp}
                            </span>
                          ))}
                          {alum.expertise.length > 3 && (
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">
                              +{alum.expertise.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                    {(() => {
                      const conn = alum.email ? connections.find((c: any) => c.pair_key === buildPairKey(currentUserEmail, alum.email!)) : undefined;
                      const status = conn?.status;
                      const isRequester = conn && conn.requester_email.toLowerCase() === String(currentUserEmail).toLowerCase();
                      
                      if (!alum.email || !status) {
                        return (
                          <button
                            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                              alum.email
                                ? 'bg-teal-950 text-white hover:bg-gray-800'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!alum.email}
                            onClick={() => alum.email && connectToAlumni(alum.email)}
                          >
                            <MessageSquare className="w-4 h-4" /> Connect
                          </button>
                        );
                      }
                      if (status === 'pending' && isRequester) {
                        return (
                          <button disabled className="flex-1 py-3 rounded-2xl font-bold text-sm bg-gray-100 text-gray-500 flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" /> Pending
                          </button>
                        );
                      }
                      if (status === 'pending' && !isRequester) {
                        return (
                          <div className="flex gap-2 flex-1">
                            <button onClick={() => alum.email && respondRequest(alum.email, 'accept')} disabled={connLoading} className="flex-1 py-3 rounded-2xl font-bold text-xs bg-teal-950 text-white hover:bg-gray-800 disabled:opacity-50">Accept</button>
                            <button onClick={() => alum.email && respondRequest(alum.email, 'reject')} disabled={connLoading} className="flex-1 py-3 rounded-2xl font-bold text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50">Decline</button>
                          </div>
                        );
                      }
                      if (status === 'accepted') {
                        return (
                          <button disabled className="flex-1 py-3 rounded-2xl font-bold text-sm bg-green-50 text-green-700 border border-green-200 flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Connected
                          </button>
                        );
                      }
                      if (status === 'rejected' || status === 'removed') {
                        return (
                          <button
                            onClick={() => alum.email && connectToAlumni(alum.email)}
                            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-teal-950 text-white hover:bg-gray-800 flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" /> Connect
                          </button>
                        );
                      }
                      return null;
                    })()}
                    
                    {alum.linkedinUrl && (
                      <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5]/20 transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Load More Button */}
          {filteredAlumni.length > 0 && (
            <div className="text-center mt-12 mb-8">
              <button className="px-8 py-3 bg-white border-2 border-gray-100 rounded-full font-bold text-sm text-[#16161c] hover:border-[#16161c] hover:bg-[#f6f3eb] transition-all shadow-sm">
                Load More Alumni
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};


export default AlumniDirectoryPage;
