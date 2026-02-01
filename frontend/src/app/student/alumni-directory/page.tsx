"use client";

import React, { useState, useEffect } from 'react';
import StudentNavigation from '../StudentNavigation';
import { Search, Filter, MapPin, Building, GraduationCap, Linkedin, Mail, MessageSquare, Star, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from '@/hooks/use-toast';

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
  rating: number;
  responseTime: string;
  linkedinUrl?: string;
  avatar?: string;
}

const AlumniDirectoryPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExpertise, setFilterExpertise] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '') + '/api';
  const currentUserEmail = (user?.email as string | undefined) || '';
  const [connections, setConnections] = useState<Array<{ id:number; pair_key:string; requester_email:string; target_email:string; status:'pending'|'accepted'|'rejected'|'removed'; }>>([]);
  const [connLoading, setConnLoading] = useState(false);
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, { name?:string; major?:string; graduation_year?:number }>>({});
  function buildPairKey(a:string,b:string){ const [x,y]=[a.toLowerCase().trim(), b.toLowerCase().trim()].sort(); return `${x}|${y}`; }
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
            expertise: skills.length ? skills : ['General Mentoring'],
            isOpenToMentoring: Boolean(u.is_mentor),
            rating: 4.8,
            responseTime: '< 48 hours',
            linkedinUrl: undefined,
            avatar: u.picture || undefined,
          } as Alumni;
        });
        setAlumni(mapped);
      } catch (e:any) {
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
    const incoming = connections.filter(c => c.status==='pending' && c.target_email.toLowerCase()===currentUserEmail.toLowerCase());
    const emails = Array.from(new Set(incoming.map(c => c.requester_email.toLowerCase())));
    const missing = emails.filter(e => !requesterProfiles[e]);
    if (missing.length===0) return;
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

  async function respondRequest(otherEmail: string, action: 'accept'|'reject') {
    if (!currentUserEmail || !otherEmail) return;
    setConnLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/connections/respond`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_email: currentUserEmail, other_email: otherEmail, action }) });
      const isJson = resp.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await resp.json() : await resp.text();
      if (resp.ok && isJson && data.connection) {
        setConnections(prev => prev.map(c => c.pair_key === data.connection.pair_key ? data.connection : c));
        toast({ title: action==='accept' ? 'Request accepted' : 'Request declined', description: otherEmail });
      }
    } catch (e:any) {
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
    } catch (e:any) {
      toast({ title: 'Request failed', description: e.message || String(e), variant: 'destructive' });
    }
  }

  const expertiseOptions = ['all', 'Software Engineering', 'Data Science', 'Machine Learning', 'Business Development', 'Strategy Consulting', 'Hardware Design'];

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
      <StudentNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              {/* Header Skeleton */}
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              
              {/* Search Bar Skeleton */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-12 bg-gray-200 rounded-xl w-48"></div>
                  <div className="h-12 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl w-36"></div>
                </div>
              </div>
              
              {/* Results Summary Skeleton */}
              <div className="bg-white rounded-xl shadow-md p-4 lg:p-6 border border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              
              {/* Alumni Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl mb-6">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="mb-6">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-14"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="h-12 bg-gray-200 rounded-lg"></div>
                      <div className="h-12 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 h-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl"></div>
                      <div className="h-10 bg-gray-200 rounded-xl w-12"></div>
                      <div className="h-10 bg-gray-200 rounded-xl w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </StudentNavigation>
    );
  }

  return (
    <StudentNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center lg:text-left">
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Alumni Directory
              </h1>
              <p className="text-base lg:text-lg text-gray-700 font-medium max-w-2xl mx-auto lg:mx-0 mb-4">
                Connect with successful alumni and find experienced mentors in your field of interest
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{alumni.length} Alumni</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">{alumni.filter(alum => alum.isOpenToMentoring).length} Mentors Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="font-medium">Instant Connect</span>
                </div>
              </div>
            </div>
          </div>

          {/* My Requests (incoming pending) */}
          {connections.length > 0 && currentUserEmail && (() => {
            const incoming = connections.filter(c => c.status === 'pending' && c.target_email.toLowerCase() === currentUserEmail.toLowerCase());
            if (!incoming.length) return null;
            return (
              <div className="mb-8">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    My Requests
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {incoming.map(req => {
                      const email = req.requester_email;
                      const info = requesterProfiles[email.toLowerCase()] || {};
                      const displayName = info.name || email;
                      const initials = (displayName||'').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                      return (
                        <div key={req.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">{initials}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                              <p className="text-xs text-gray-600 truncate">{email}</p>
                              {(info.major || info.graduation_year) && (
                                <p className="text-xs text-gray-500 truncate">{info.major || '—'}{info.graduation_year? ` • Class of ${info.graduation_year}`:''}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2 justify-end">
                            <Button onClick={() => respondRequest(email, 'accept')} disabled={connLoading} className="px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-60">Accept</Button>
                            <Button onClick={() => respondRequest(email, 'reject')} disabled={connLoading} className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-semibold hover:from-red-600 hover:to-rose-700 disabled:opacity-60">Decline</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Search and Filter Bar */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Find Your Perfect Mentor
              </h2>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, company, position, or expertise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-medium text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterExpertise}
                    onChange={(e) => setFilterExpertise(e.target.value)}
                    className="pl-12 pr-8 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white min-w-[220px] font-medium text-gray-900 transition-all duration-200"
                  >
                    {expertiseOptions.map(option => (
                      <option key={option} value={option}>
                        {option === 'all' ? 'All Expertise Areas' : option}
                      </option>
                    ))}
                  </select>
                </div>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Alumni
                </Button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 lg:p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {filteredAlumni.length} Alumni Found
                    </p>
                    <p className="text-sm text-gray-600">
                      Out of {alumni.length} registered alumni
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-green-800">
                      {alumni.filter(alum => alum.isOpenToMentoring).length} Available Mentors
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Advanced Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Alumni Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {filteredAlumni.length === 0 ? (
              <div className="col-span-full">
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No Alumni Found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    We couldn't find any alumni matching your criteria. Try adjusting your search terms or filters.
                  </p>
                  <Button 
                    onClick={() => {setSearchTerm(''); setFilterExpertise('all');}}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            ) : (
              filteredAlumni.map(alum => (
                <div key={alum.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group relative overflow-hidden">
                  {/* Status Badge */}
                  {alum.isOpenToMentoring && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Available 🟢
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6 lg:p-8">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg lg:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {alum.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg lg:text-xl group-hover:text-blue-600 transition-colors duration-200 mb-1">
                          {alum.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <GraduationCap className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Class of {alum.graduationYear}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {alum.degree}
                        </div>
                      </div>
                    </div>

                    {/* Professional Info */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl mb-6 border border-gray-100">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Building className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Role</p>
                            <p className="font-bold text-gray-900 text-sm">{alum.position}</p>
                            <p className="text-blue-600 font-medium text-sm">{alum.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <MapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                            <p className="font-semibold text-gray-900 text-sm">{alum.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expertise Tags */}
                    <div className="mb-6">
                      <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Expertise Areas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {alum.expertise.slice(0, 3).map((exp, index) => (
                          <span key={index} className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-purple-800 text-xs font-semibold rounded-lg hover:from-purple-100 hover:to-blue-100 transition-colors duration-200">
                            {exp}
                          </span>
                        ))}
                        {alum.expertise.length > 3 && (
                          <span className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200">
                            +{alum.expertise.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating and Response Time */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-bold text-yellow-800">{alum.rating}</span>
                        </div>
                        <p className="text-xs text-yellow-700 font-medium">Rating</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="mb-1">
                          <span className="font-bold text-blue-800 text-sm">{alum.responseTime}</span>
                        </div>
                        <p className="text-xs text-blue-700 font-medium">Response Time</p>
                      </div>
                    </div>

                    {/* Mentoring Status */}
                    {alum.isOpenToMentoring ? (
                      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="text-green-800 font-bold text-sm">Available for Mentoring</p>
                            <p className="text-green-700 text-xs">Ready to guide and support you</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <div>
                            <p className="text-gray-700 font-bold text-sm">Currently Unavailable</p>
                            <p className="text-gray-600 text-xs">Not taking mentorship requests</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {(() => {
                        const conn: { id:number; pair_key:string; requester_email:string; target_email:string; status:'pending'|'accepted'|'rejected'|'removed' } | undefined = alum.email ? connections.find(c => c.pair_key === buildPairKey(currentUserEmail, alum.email!)) : undefined;
                        const status = conn?.status;
                        const isRequester = conn && conn.requester_email.toLowerCase() === String(currentUserEmail).toLowerCase();
                        if (!alum.email || !status) {
                          return (
                            <Button 
                              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                                alum.email
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                                  : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                              }`}
                              disabled={!alum.email}
                              onClick={() => alum.email && connectToAlumni(alum.email)}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Connect
                            </Button>
                          );
                        }
                        if (status === 'pending' && isRequester) {
                          return (
                            <Button disabled className="flex-1 px-4 py-3 rounded-xl font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-2 justify-center">
                              <Clock className="w-4 h-4" />
                              Request Sent
                            </Button>
                          );
                        }
                        if (status === 'pending' && !isRequester) {
                          return (
                            <div className="flex gap-2 flex-1">
                              <Button onClick={() => alum.email && respondRequest(alum.email, 'accept')} disabled={connLoading} className="flex-1 text-sm px-3 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow hover:shadow-md disabled:opacity-60">Accept</Button>
                              <Button onClick={() => alum.email && respondRequest(alum.email, 'reject')} disabled={connLoading} className="flex-1 text-sm px-3 py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow hover:shadow-md disabled:opacity-60">Decline</Button>
                            </div>
                          );
                        }
                        if (status === 'accepted') {
                          return (
                            <Button variant="outline" disabled className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700">Connected</Button>
                          );
                        }
                        if (status === 'rejected' || status === 'removed') {
                          return (
                            <Button 
                              onClick={() => alum.email && connectToAlumni(alum.email)}
                              className="flex-1 px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-60 text-sm"
                            >
                              Re-connect
                            </Button>
                          );
                        }
                        return null;
                      })()}
                      {alum.linkedinUrl && (
                        <Button 
                          variant="outline" 
                          className="px-4 py-3 rounded-xl border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-all duration-200 group"
                        >
                          <Linkedin className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="px-4 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-500 transition-all duration-200 group"
                      >
                        <Mail className="w-4 h-4 text-gray-600 group-hover:text-gray-700" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More Button */}
          {filteredAlumni.length > 0 && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 rounded-xl font-semibold border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Load More Alumni
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                Showing {filteredAlumni.length} of {alumni.length} total alumni
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentNavigation>
  );
};

export default AlumniDirectoryPage;