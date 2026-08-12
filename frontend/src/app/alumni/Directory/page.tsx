"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlumniProfileDialog } from "../../../components/alumni/AlumniProfileDialog";
import { MessageDialog } from "../../../components/alumni/MessageDialog";
import { AdvancedFilters } from "../../../components/alumni/AdvancedFilters";

import { 
  Search, 
  Filter, 
  Users, 
  ArrowLeft, 
  MessageCircle, 
  UserPlus,
  Mail,
  Linkedin,
  MapPin,
  Building,
  GraduationCap,
  ChevronDown,
  X,
  Eye
} from "lucide-react";

interface ApiUser { id:number; auth0_id:string; email:string; name:string; picture?:string; bio?:string; user_type:string; graduation_year?:number; major?:string; current_job?:string; company?:string; job_title?:string; location?:string; skills?:string; is_mentor?:boolean }
interface ConnectionRecord { id:number; pair_key:string; requester_email:string; target_email:string; status:'pending'|'accepted'|'rejected'|'removed'; }
function apiRoot(){ const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'; return base.endsWith('/api')? base: base.replace(/\/$/,'')+'/api'; }
function pairKey(a:string,b:string){ const [x,y]=[a.toLowerCase().trim(),b.toLowerCase().trim()].sort(); return `${x}|${y}`; }

const industries = [
  "All Industries",
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Consulting",
  "Media & Entertainment",
  "Automotive",
  "E-commerce",
  "Non-profit"
];

const departments = [
  "All Departments",
  "Computer Science",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Business Administration",
  "Medicine",
  "Marketing",
  "Data Science",
  "Civil Engineering",
  "Physics",
  "Chemistry"
];

function AlumniDirectoryPage() {
  const { user, error, isLoading } = useUser();
  const { toast } = useToast();
  const myEmail = (user?.email as string) || '';
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All Industries");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [yearFrom, setYearFrom] = useState("2000");
  const [yearTo, setYearTo] = useState("2025");
  const [alumni, setAlumni] = useState<ApiUser[]>([]);
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<any>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});

  useEffect(() => {
    loadAlumni();
  }, []);
  useEffect(()=>{ if(myEmail) loadConnections(); },[myEmail]);
  const filteredAlumni = useMemo(()=> {
    return alumni.filter(a => {
      const skillsArr = (a.skills||'').split(',').map(s=>s.trim()).filter(Boolean);
      const matchesSearch = !searchTerm || [a.name||'', a.company||'', a.current_job||'', ...(skillsArr)].some(v=> v.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesIndustry = selectedIndustry === 'All Industries' || (a.company||'').toLowerCase().includes(selectedIndustry.toLowerCase());
      const matchesDepartment = selectedDepartment === 'All Departments' || (a.major||'') === selectedDepartment;
      const yr = a.graduation_year || 0;
      const matchesYear = yr >= parseInt(yearFrom) && yr <= parseInt(yearTo);
      return matchesSearch && matchesIndustry && matchesDepartment && matchesYear;
    });
  }, [alumni, searchTerm, selectedIndustry, selectedDepartment, yearFrom, yearTo]);

  async function loadAlumni(){
    try {
      const resp = await fetch(`${apiRoot()}/users?type=alumni&limit=200`);
      if(!resp.ok) throw new Error('Failed to load alumni');
      const data = await resp.json();
      setAlumni(data.users||[]);
    } catch(e:any){ toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }
  async function loadConnections(){
    try { const resp = await fetch(`${apiRoot()}/connections?user_email=${encodeURIComponent(myEmail)}`); if(resp.ok){ const data = await resp.json(); setConnections(data.connections||[]); } } catch {}
  }
  function getConnectionFor(a:ApiUser){ if(!myEmail) return undefined; const pk = pairKey(myEmail, a.email); return connections.find(c=> c.pair_key===pk); }
  const connectionStatus = (a:ApiUser)=> getConnectionFor(a)?.status;
  const isRequester = (a:ApiUser)=> { const c = getConnectionFor(a); return c && c.requester_email.toLowerCase()===myEmail.toLowerCase(); };
  async function requestConnect(a:ApiUser){ if(!myEmail) return; try { const resp = await fetch(`${apiRoot()}/connections/request`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requester_email: myEmail, target_email: a.email })}); if(!resp.ok) throw new Error('Request failed'); const data = await resp.json(); setConnections(prev=>[data.connection,...prev.filter(p=>p.pair_key!==data.connection.pair_key)]); toast({ title: 'Connection Requested', description: `Request sent to ${a.name||a.email}` }); } catch(e:any){ toast({ title:'Error', description: e.message, variant:'destructive'}); } }
  async function respond(a:ApiUser, action:'accept'|'reject'){ try { const resp = await fetch(`${apiRoot()}/connections/respond`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_email: myEmail, other_email: a.email, action })}); if(!resp.ok) throw new Error('Action failed'); const data= await resp.json(); setConnections(prev=> prev.map(c=> c.pair_key===data.connection.pair_key? data.connection: c)); toast({ title: action==='accept'?'Connected':'Request Declined', description: `${a.name||a.email}` }); } catch(e:any){ toast({ title:'Error', description: e.message, variant:'destructive'}); } }
  async function removeConn(a:ApiUser){ try { const resp = await fetch(`${apiRoot()}/connections/remove`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_email: myEmail, other_email: a.email })}); if(!resp.ok) throw new Error('Failed'); const data= await resp.json(); if(data.connection){ setConnections(prev=> prev.map(c=> c.pair_key===data.connection.pair_key? data.connection: c)); } toast({ title:'Connection Removed', description: a.name||a.email }); } catch(e:any){ toast({ title:'Error', description: e.message, variant:'destructive'}); } }

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedIndustry("All Industries");
    setSelectedDepartment("All Departments");
    setYearFrom("2000");
    setYearTo("2025");
    setAdvancedFilters({});
    loadAlumni();
  };

  const handleConnect = (id: number) => {
    const a = alumni.find(x=>x.id===id); if(!a)return; const status = connectionStatus(a); if(!status) requestConnect(a); else if(status==='accepted') removeConn(a); };
  const handleViewProfile = (a: ApiUser) => { setSelectedAlumni(a); setShowProfileDialog(true); };
  const handleSendMessage = (a: ApiUser) => { setSelectedAlumni(a); setShowMessageDialog(true); };

  const handleMessageSend = (alumniId: number, message: string, subject?: string) => {
    // In real app, this would send the message via API
    console.log('Sending message:', { alumniId, message, subject });
    // Show success notification here
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f3eb] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-teal-200 rounded-full animate-spin border-t-teal-600 mx-auto"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent rounded-full border-r-teal-600 animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Loading Alumni Directory</h2>
          <p className="text-gray-600 text-lg">Connecting you with fellow graduates...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#f6f3eb] flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/95 backdrop-blur-lg">
          <CardContent className="text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <X className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please log in to access the Alumni Directory and connect with fellow graduates</p>
            <a href="/api/auth/login">
              <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200">
                Login to Continue
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 bg-[#f6f3eb] min-h-screen">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <div className="bg-teal-950 rounded-2xl p-8 text-white relative overflow-hidden">
        <svg className="absolute right-0 bottom-0 w-[300px] h-full pointer-events-none opacity-50" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40,70 C60,70 70,30 90,30 C110,30 120,60 140,60 C160,60 170,20 190,20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <GraduationCap className="w-8 h-8 text-white" />
                    <h1 className="text-4xl font-bold">Alumni Directory</h1>
                  </div>
                  <p className="text-teal-100 text-lg">Connect with fellow graduates, expand your professional network, and discover new opportunities</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                  <Users className="w-5 h-5 text-white" />
                  <span className="text-lg font-semibold text-white">{filteredAlumni.length} Alumni</span>
                </div>
              </div>
            </div>
          </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by name, company, job title, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-lg border-gray-200 focus:ring-2 focus:ring-teal-500/20 rounded-xl bg-[#f6f3eb] focus:bg-white shadow-sm"
            />
          </div>

            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  Department
                </Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="h-12 border-gray-200 focus:ring-2 focus:ring-teal-500/20 rounded-xl bg-white shadow-sm text-gray-900">
                    <SelectValue className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept} className="text-gray-900 hover:bg-teal-50">{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-950" />
                  Industry
                </Label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="h-12 border-gray-200 focus:ring-2 focus:ring-teal-500/20 rounded-xl bg-white shadow-sm text-gray-900">
                    <SelectValue className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry} className="text-gray-900 hover:bg-teal-50">{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  Graduation Year
                </Label>
                <div className="flex gap-2">
                  <div className="relative group">
                    <Input
                      type="number"
                      placeholder="From"
                      value={yearFrom}
                      onChange={(e) => setYearFrom(e.target.value)}
                      min="2000"
                      max="2025"
                      className="h-12 border-gray-200 focus:ring-2 focus:ring-teal-500/20 rounded-xl bg-white shadow-sm text-gray-900 placeholder:text-gray-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={() => setYearFrom(String(Math.min(2025, parseInt(yearFrom) + 1)))}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-xs font-bold"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => setYearFrom(String(Math.max(2000, parseInt(yearFrom) - 1)))}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-xs font-bold"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                  <span className="self-center text-gray-400 font-medium">—</span>
                  <div className="relative group">
                    <Input
                      type="number"
                      placeholder="To"
                      value={yearTo}
                      onChange={(e) => setYearTo(e.target.value)}
                      min="2000"
                      max="2025"
                      className="h-12 border-gray-200 focus:ring-2 focus:ring-teal-500/20 rounded-xl bg-white shadow-sm text-gray-900 placeholder:text-gray-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={() => setYearTo(String(Math.min(2025, parseInt(yearTo) + 1)))}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-xs font-bold"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => setYearTo(String(Math.max(2000, parseInt(yearTo) - 1)))}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-xs font-bold"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            <div className="flex items-end justify-between w-full">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 h-12 border-gray-300 bg-white text-gray-700 hover:bg-[#f6f3eb] hover:border-gray-400 hover:text-gray-900 transition-all duration-200 rounded-xl shadow-sm"
              >
                <Filter className="w-4 h-4" />
                Advanced Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={clearFilters} 
                className="flex items-center gap-2 h-12 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl"
              >
                <X className="w-4 h-4" />
                Clear All
              </Button>
            </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between p-4 bg-[#f6f3eb] rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-700 font-medium">{filteredAlumni.length} alumni found</span>
              </div>
              {(searchTerm || selectedIndustry !== "All Industries" || selectedDepartment !== "All Departments") && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-slate-600 hover:text-slate-800 hover:bg-[#f6f3eb] transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          isOpen={showAdvancedFilters}
          onFiltersChange={setAdvancedFilters}
          onClearFilters={clearFilters}
        />

        {/* Alumni Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredAlumni.map((alumni:any) => {
            const c = getConnectionFor(alumni);
            const status = c?.status;
            const isRequester = c && c.requester_email.toLowerCase()===myEmail.toLowerCase();
            const connected = status==='accepted';
            return (
            <Card key={alumni.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-lg hover:scale-[1.02] overflow-hidden h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                {/* Card Header with Gradient - Fixed Height */}
                <div className="relative bg-gradient-to-br from-teal-500 via-teal-500 to-teal-600 p-6 text-white min-h-[160px] flex items-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative z-10 w-full">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 border-4 border-white/30 shadow-xl flex-shrink-0">
                        <AvatarImage src={alumni.profilePicture} alt={alumni.name} />
                        <AvatarFallback className="bg-white/20 text-white text-lg font-bold backdrop-blur-sm">
                          {alumni.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1 truncate">{alumni.name}</h3>
                        <p className="text-white/95 font-semibold text-base line-clamp-1">{alumni.currentPosition}</p>
                        <p className="text-white/85 font-medium line-clamp-1">{alumni.company}</p>
                        {connected && (
                          <Badge className="mt-2 bg-green-500/20 text-green-100 border-green-300/30 shadow-sm text-xs">Connected</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body - Flexible Height */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Alumni Details - Fixed Height Section */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-teal-50 to-teal-50 rounded-lg border border-teal-100">
                      <div className="p-1.5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-md shadow-sm flex-shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">Class of {alumni.graduation_year || '—'}</p>
                        <p className="text-gray-600 text-xs truncate">{alumni.major || '—'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-teal-50 to-teal-50 rounded-lg border border-teal-100">
                      <div className="p-1.5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-md shadow-sm flex-shrink-0">
                        <Building className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{alumni.company || alumni.current_job || '—'}</p>
                        <p className="text-gray-600 text-xs">Company / Role</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-teal-50 to-pink-50 rounded-lg border border-teal-100">
                      <div className="p-1.5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-md shadow-sm flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{(alumni.location||'').split(',')[0] || '—'}</p>
                        <p className="text-gray-600 text-xs truncate">Location</p>
                      </div>
                    </div>
                  </div>

                  {/* Bio - Fixed Height */}
                  <div className="bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-xl p-3 border border-gray-100 mb-4 h-[72px] overflow-hidden">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{alumni.bio || 'No bio yet.'}</p>
                  </div>

                  {/* Skills - Fixed Height */}
                  <div className="mb-5 h-[100px] overflow-hidden">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      Skills & Expertise
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(alumni.skills||'').split(',').filter(Boolean).slice(0, 4).map((skill:string, index:number) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-gradient-to-r from-teal-100 to-teal-100 text-teal-800 hover:from-teal-200 hover:to-teal-200 border-teal-200 shadow-sm">
                          {skill}
                        </Badge>
                      ))}
                      {(alumni.skills||'').split(',').filter(Boolean).length > 4 && (
                        <Badge variant="outline" className="text-xs text-gray-600 border-gray-300 hover:bg-[#f6f3eb]">
                          +{(alumni.skills||'').split(',').filter(Boolean).length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Fixed at Bottom */}
                  <div className="mt-auto space-y-3">
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button size="sm" className="flex-1 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200" onClick={() => handleSendMessage(alumni)}>
                        <MessageCircle className="w-4 h-4 mr-2" /> Message
                      </Button>
                      {!myEmail || myEmail.toLowerCase()===alumni.email.toLowerCase()? null : (
                        <>
                          {!status && <Button variant="outline" size="sm" onClick={()=>requestConnect(alumni)} className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-50 hover:border-teal-300 transition-all duration-200"><UserPlus className="w-4 h-4 mr-2" />Connect</Button>}
                          {status==='pending' && isRequester && <Badge className="bg-amber-100 text-amber-700">Pending</Badge>}
                          {status==='pending' && !isRequester && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={()=>respond(alumni,'accept')} className="bg-green-600 hover:bg-green-700">Accept</Button>
                              <Button size="sm" variant="destructive" onClick={()=>respond(alumni,'reject')}>Decline</Button>
                            </div>
                          )}
                          {status==='accepted' && <Button size="sm" variant="secondary" onClick={()=>removeConn(alumni)} className="bg-green-50 text-green-700 hover:bg-green-100">Connected</Button>}
                          {(status==='rejected' || status==='removed') && <Button size="sm" variant="outline" onClick={()=>requestConnect(alumni)}>Re-connect</Button>}
                        </>
                      )}
                    </div>

                    {/* Contact Links */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-100 transition-all duration-200 rounded-lg"
                        onClick={() => handleViewProfile(alumni)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">Profile</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all duration-200 rounded-lg"
                        onClick={() => window.open(`mailto:${alumni.email}`, '_blank')}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">Email</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-100 transition-all duration-200 rounded-lg"
                        onClick={() => alumni.linkedin && window.open(alumni.linkedin, '_blank')}
                      >
                        <Linkedin className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">LinkedIn</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* No Results */}
          {filteredAlumni.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-lg">
            <CardContent className="text-center py-20">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-teal-100 via-teal-100 to-teal-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Users className="w-16 h-16 text-gray-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Search className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">No Alumni Found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                We couldn't find any alumni matching your search criteria. Try adjusting your filters or search terms to discover more connections.
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
                <Button 
                  variant="outline"
                  className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-50 hover:border-teal-300 transition-all duration-200 px-8"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Browse All Alumni
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Dialog */}
        <AlumniProfileDialog
          alumni={selectedAlumni}
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
          onConnect={handleConnect}
          onMessage={(id:number)=>{ const a = alumni.find(u=>u.id===id); if(a) handleSendMessage(a); }}
        />

        {/* Message Dialog */}
        <MessageDialog
          alumni={selectedAlumni}
          open={showMessageDialog}
          onOpenChange={setShowMessageDialog}
          onSendMessage={handleMessageSend}
        />
        </div>
      </div>
    </>
  );
}

export default withPageAuthRequired(AlumniDirectoryPage);