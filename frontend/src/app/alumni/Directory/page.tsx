"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useState, useEffect } from "react";
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
import { AlumniProfileDialog } from "@/components/alumni/AlumniProfileDialog";
import { MessageDialog } from "@/components/alumni/MessageDialog";
import { AdvancedFilters } from "@/components/alumni/AdvancedFilters";
import AlumniNavigation from '../AluminaNavigation';
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

// Mock data for alumni - in real app, this would come from API
const mockAlumni = [
  {
    id: 1,
    name: "Sarah Chen",
    profilePicture: "/placeholder-user.jpg",
    graduationYear: 2018,
    degree: "Bachelor of Science",
    branch: "Computer Science",
    currentPosition: "Senior Software Engineer",
    company: "Google",
    industry: "Technology",
    location: "San Francisco, California",
    country: "United States",
    skills: ["React", "Python", "Machine Learning", "AI/ML", "Software Development"],
    bio: "Passionate software engineer focused on building scalable web applications and exploring AI/ML technologies.",
    email: "sarah.chen@gmail.com",
    linkedin: "https://linkedin.com/in/sarahchen",
    isConnected: false,
    domain: "Engineering"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    profilePicture: "/placeholder-user.jpg",
    graduationYear: 2020,
    degree: "Master of Business Administration",
    branch: "Business",
    currentPosition: "Product Manager",
    company: "Microsoft",
    industry: "Technology",
    location: "Seattle, Washington",
    country: "United States",
    skills: ["Product Management", "Data Analysis", "Agile", "Product Strategy"],
    bio: "Product manager with a passion for building user-centric solutions and mentoring early-stage startups.",
    email: "marcus.r@microsoft.com",
    linkedin: "https://linkedin.com/in/marcusrodriguez",
    isConnected: true,
    domain: "Product Management"
  },
  {
    id: 3,
    name: "Dr. Priya Patel",
    profilePicture: "/placeholder-user.jpg",
    graduationYear: 2015,
    degree: "Doctor of Medicine",
    branch: "Medical School",
    currentPosition: "Cardiologist",
    company: "Mayo Clinic",
    industry: "Healthcare",
    location: "Rochester, Minnesota",
    country: "United States",
    skills: ["Cardiology", "Medical Research", "Patient Care", "Healthcare"],
    bio: "Dedicated cardiologist committed to advancing heart health through innovative treatments and research.",
    email: "priya.patel@mayo.edu",
    linkedin: "https://linkedin.com/in/priyapatel",
    isConnected: false,
    domain: "Medicine"
  },
  {
    id: 4,
    name: "James Kim",
    profilePicture: "/placeholder-user.jpg",
    graduationYear: 2019,
    degree: "Bachelor of Science",
    branch: "Mechanical Engineering",
    currentPosition: "Design Engineer",
    company: "Tesla",
    industry: "Automotive",
    location: "Austin, Texas",
    country: "United States",
    skills: ["CAD Design", "Manufacturing", "Renewable Energy", "Automotive"],
    bio: "Mechanical engineer passionate about sustainable transportation and clean energy solutions.",
    email: "james.kim@tesla.com",
    linkedin: "https://linkedin.com/in/jameskim",
    isConnected: false,
    domain: "Engineering"
  },
  {
    id: 5,
    name: "Emily Zhang",
    profilePicture: "/placeholder-user.jpg",
    graduationYear: 2021,
    degree: "Bachelor of Arts",
    branch: "Marketing",
    currentPosition: "Digital Marketing Manager",
    company: "Shopify",
    industry: "E-commerce",
    location: "Toronto, Ontario",
    country: "Canada",
    skills: ["Digital Marketing", "Social Media", "Analytics", "E-commerce"],
    bio: "Creative digital marketer helping brands tell their stories and connect with audiences worldwide.",
    email: "emily.zhang@shopify.com",
    linkedin: "https://linkedin.com/in/emilyzhang",
    isConnected: false,
    domain: "Marketing"
  },
  {
    id: 6,
    name: "David Thompson",
    profilePicture: "/placeholder-user.jpg",
    graduationYear: 2017,
    degree: "Master of Science",
    branch: "Data Science",
    currentPosition: "Data Scientist",
    company: "Netflix",
    industry: "Entertainment",
    location: "Los Angeles, California",
    country: "United States",
    skills: ["Machine Learning", "Python", "SQL", "Data Science", "Analytics"],
    bio: "Data scientist leveraging analytics to enhance user experiences and drive content discovery.",
    email: "david.thompson@netflix.com",
    linkedin: "https://linkedin.com/in/davidthompson",
    isConnected: true,
    domain: "Data Science"
  }
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All Industries");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [yearFrom, setYearFrom] = useState("2000");
  const [yearTo, setYearTo] = useState("2025");
  const [filteredAlumni, setFilteredAlumni] = useState(mockAlumni);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<any>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});

  // Filter alumni based on search criteria
  useEffect(() => {
    let filtered = mockAlumni.filter(alumni => {
      const matchesSearch = searchTerm === "" || 
        alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumni.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumni.currentPosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumni.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesIndustry = selectedIndustry === "All Industries" || alumni.industry === selectedIndustry;
      const matchesDepartment = selectedDepartment === "All Departments" || alumni.branch === selectedDepartment;
      const matchesYear = alumni.graduationYear >= parseInt(yearFrom) && alumni.graduationYear <= parseInt(yearTo);

      // Advanced filters
      const matchesSkills = !advancedFilters.skills?.length || 
        advancedFilters.skills.some((skill: string) => 
          alumni.skills.some(alumniSkill => alumniSkill.toLowerCase().includes(skill.toLowerCase()))
        );

      const matchesCompanies = !advancedFilters.companies?.length || 
        advancedFilters.companies.includes(alumni.company);

      const matchesLocations = !advancedFilters.locations?.length || 
        advancedFilters.locations.some((location: string) => 
          alumni.location.includes(location)
        );

      return matchesSearch && matchesIndustry && matchesDepartment && matchesYear && 
             matchesSkills && matchesCompanies && matchesLocations;
    });

    setFilteredAlumni(filtered);
  }, [searchTerm, selectedIndustry, selectedDepartment, yearFrom, yearTo, advancedFilters]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedIndustry("All Industries");
    setSelectedDepartment("All Departments");
    setYearFrom("2000");
    setYearTo("2025");
    setAdvancedFilters({});
  };

  const handleConnect = (alumniId: number) => {
    // In real app, this would make an API call
    setFilteredAlumni(prev => 
      prev.map(alumni => 
        alumni.id === alumniId 
          ? { ...alumni, isConnected: !alumni.isConnected }
          : alumni
      )
    );
  };

  const handleViewProfile = (alumni: any) => {
    setSelectedAlumni(alumni);
    setShowProfileDialog(true);
  };

  const handleSendMessage = (alumni: any) => {
    setSelectedAlumni(alumni);
    setShowMessageDialog(true);
  };

  const handleMessageSend = (alumniId: number, message: string, subject?: string) => {
    // In real app, this would send the message via API
    console.log('Sending message:', { alumniId, message, subject });
    // Show success notification here
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent rounded-full border-r-indigo-600 animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Loading Alumni Directory</h2>
          <p className="text-gray-600 text-lg">Connecting you with fellow graduates...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/95 backdrop-blur-lg">
          <CardContent className="text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <X className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please log in to access the Alumni Directory and connect with fellow graduates</p>
            <a href="/api/auth/login">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                Login to Continue
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AlumniNavigation>
      <div className="p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <div className="bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <GraduationCap className="w-8 h-8 text-white" />
                    <h1 className="text-4xl font-bold">Alumni Directory</h1>
                  </div>
                  <p className="text-blue-100 text-lg">Connect with fellow graduates, expand your professional network, and discover new opportunities</p>
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
              className="pl-12 h-14 text-lg border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-slate-50 focus:bg-white shadow-sm"
            />
          </div>

            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  Department
                </Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="h-12 border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white shadow-sm text-gray-900">
                    <SelectValue className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept} className="text-gray-900 hover:bg-blue-50">{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  Industry
                </Label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="h-12 border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white shadow-sm text-gray-900">
                    <SelectValue className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry} className="text-gray-900 hover:bg-blue-50">{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
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
                      className="h-12 border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white shadow-sm text-gray-900 placeholder:text-gray-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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
                      className="h-12 border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white shadow-sm text-gray-900 placeholder:text-gray-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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
                className="flex items-center gap-2 h-12 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 rounded-xl shadow-sm"
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
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-700 font-medium">{filteredAlumni.length} alumni found</span>
              </div>
              {(searchTerm || selectedIndustry !== "All Industries" || selectedDepartment !== "All Departments") && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200"
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
          {filteredAlumni.map((alumni) => (
            <Card key={alumni.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-lg hover:scale-[1.02] overflow-hidden h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                {/* Card Header with Gradient - Fixed Height */}
                <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-6 text-white min-h-[160px] flex items-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative z-10 w-full">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 border-4 border-white/30 shadow-xl flex-shrink-0">
                        <AvatarImage src={alumni.profilePicture} alt={alumni.name} />
                        <AvatarFallback className="bg-white/20 text-white text-lg font-bold backdrop-blur-sm">
                          {alumni.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1 truncate">{alumni.name}</h3>
                        <p className="text-white/95 font-semibold text-base line-clamp-1">{alumni.currentPosition}</p>
                        <p className="text-white/85 font-medium line-clamp-1">{alumni.company}</p>
                        {alumni.isConnected && (
                          <Badge className="mt-2 bg-green-500/20 text-green-100 border-green-300/30 shadow-sm text-xs">
                            Connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body - Flexible Height */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Alumni Details - Fixed Height Section */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <div className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md shadow-sm flex-shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">Class of {alumni.graduationYear}</p>
                        <p className="text-gray-600 text-xs truncate">{alumni.branch}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                      <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-md shadow-sm flex-shrink-0">
                        <Building className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{alumni.industry}</p>
                        <p className="text-gray-600 text-xs">Industry</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                      <div className="p-1.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-md shadow-sm flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{alumni.location.split(',')[0]}</p>
                        <p className="text-gray-600 text-xs truncate">{alumni.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bio - Fixed Height */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl p-3 border border-gray-100 mb-4 h-[72px] overflow-hidden">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{alumni.bio}</p>
                  </div>

                  {/* Skills - Fixed Height */}
                  <div className="mb-5 h-[100px] overflow-hidden">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Skills & Expertise
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alumni.skills.slice(0, 4).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 hover:from-blue-200 hover:to-indigo-200 border-blue-200 shadow-sm">
                          {skill}
                        </Badge>
                      ))}
                      {alumni.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs text-gray-600 border-gray-300 hover:bg-gray-50">
                          +{alumni.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Fixed at Bottom */}
                  <div className="mt-auto space-y-3">
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                        onClick={() => handleSendMessage(alumni)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>

                      <Button
                        variant={alumni.isConnected ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleConnect(alumni.id)}
                        className={alumni.isConnected 
                          ? "text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 shadow-sm" 
                          : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-200"
                        }
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {alumni.isConnected ? "Connected" : "Connect"}
                      </Button>
                    </div>

                    {/* Contact Links */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 rounded-lg"
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
                        className="text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 rounded-lg"
                        onClick={() => window.open(alumni.linkedin, '_blank')}
                      >
                        <Linkedin className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">LinkedIn</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredAlumni.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-lg">
            <CardContent className="text-center py-20">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
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
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
                <Button 
                  variant="outline"
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-200 px-8"
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
          onMessage={handleSendMessage}
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
    </AlumniNavigation>
  );
}

export default withPageAuthRequired(AlumniDirectoryPage);