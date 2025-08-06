"use client"
import { useState, useEffect } from "react"
import type React from "react"

import {
  Briefcase,
  Users,
  Building2,
  ArrowLeft,
  Calendar,
  MapPin,
  Eye,
  Search,
  Filter,
  Star,
  DollarSign,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Mock job data
const jobPostings = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA (Remote)",
    postedDate: "2025-01-10",
    description:
      "Join our innovative team to build cutting-edge software solutions that impact millions of users worldwide.",
    salary: "$120k-180k",
    tags: ["Full Time", "Technology", "Software Engineering", "React"],
    views: 245,
    applied: 12,
    status: "Approved",
    featured: true,
    logo: "/placeholder.svg?height=40&width=40&text=TC",
    industry: "Technology",
    jobType: "Full-time",
    isRemote: true,
  },
  {
    id: 2,
    title: "Marketing Internship (Paid)",
    company: "Growth Marketing Co.",
    location: "New York, NY",
    postedDate: "2025-01-08",
    description: "Exciting paid internship opportunity to learn digital marketing strategies and campaign management.",
    salary: "$18-22/hour",
    tags: ["Internship Paid", "Marketing", "Internship"],
    views: 89,
    applied: 7,
    status: "Approved",
    featured: false,
    logo: "/placeholder.svg?height=40&width=40&text=GM",
    industry: "Marketing",
    jobType: "Internship (Paid)",
    isRemote: false,
  },
  {
    id: 3,
    title: "Financial Analyst",
    company: "Finance Pro LLC",
    location: "Chicago, IL",
    postedDate: "2025-01-05",
    description: "Analyze financial data and create reports to support business decisions.",
    salary: "$65k-85k",
    tags: ["Full Time", "Finance", "Analysis"],
    views: 156,
    applied: 23,
    status: "Approved",
    featured: false,
    logo: "/placeholder.svg?height=40&width=40&text=FP",
    industry: "Finance",
    jobType: "Full-time",
    isRemote: false,
  },
  {
    id: 4,
    title: "Remote UX Designer",
    company: "Design Studio",
    location: "Remote",
    postedDate: "2025-01-12",
    description: "Create user-centered designs for web and mobile applications.",
    salary: "$70k-95k",
    tags: ["Full Time", "Design", "UX/UI", "Remote"],
    views: 203,
    applied: 18,
    status: "Approved",
    featured: true,
    logo: "/placeholder.svg?height=40&width=40&text=DS",
    industry: "Technology",
    jobType: "Full-time",
    isRemote: true,
  },
]

// Mock user's posted jobs
const userPostedJobs = [
  {
    id: 101,
    title: "Senior Software Engineer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA (Remote)",
    postedDate: "2025-01-10",
    description:
      "Join our innovative team to build cutting-edge software solutions that impact millions of users worldwide.",
    salary: "$120k-180k",
    tags: ["Full Time", "Technology", "Software Engineering", "React"],
    views: 245,
    applied: 12,
    status: "Approved",
    featured: true,
    logo: "/placeholder.svg?height=40&width=40&text=TC",
    industry: "Technology",
    jobType: "Full-time",
    isRemote: true,
    postedBy: "sarah.johnson@email.com",
  },
  {
    id: 102,
    title: "Frontend Developer Internship",
    company: "StartupXYZ",
    location: "New York, NY",
    postedDate: "2025-01-08",
    description: "Great opportunity for students to learn modern web development in a fast-paced startup environment.",
    salary: "$25-30/hour",
    tags: ["Internship Paid", "Technology", "Frontend", "React"],
    views: 89,
    applied: 7,
    status: "Pending Review",
    featured: false,
    logo: "/placeholder.svg?height=40&width=40&text=SX",
    industry: "Technology",
    jobType: "Internship (Paid)",
    isRemote: false,
    postedBy: "sarah.johnson@email.com",
  },
  {
    id: 103,
    title: "Product Manager",
    company: "InnovateCorp",
    location: "Remote",
    postedDate: "2025-01-05",
    description: "Lead product strategy and development for our flagship SaaS platform.",
    salary: "$90k-120k",
    tags: ["Full Time", "Product", "Strategy", "Remote"],
    views: 156,
    applied: 23,
    status: "Draft",
    featured: false,
    logo: "/placeholder.svg?height=40&width=40&text=IC",
    industry: "Technology",
    jobType: "Full-time",
    isRemote: true,
    postedBy: "sarah.johnson@email.com",
  },
]

const industries = [
  "All Industries",
  "Technology",
  "Finance",
  "Healthcare",
  "Marketing",
  "Consulting",
  "Manufacturing",
  "Education",
  "Non-profit",
  "Government",
  "Retail",
  "Media",
  "Real Estate",
]

const jobTypes = [
  "All Types",
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship (Paid)",
  "Internship (Unpaid)",
  "Volunteer",
]

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR"]

const statusOptions = ["All Status", "Approved", "Pending Review", "Draft", "Rejected"]

function AlumniJobBoard() {
  const mockUser = {
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
  }

  const user = mockUser
  const isLoading = false
  const error = null

  // Tab state
  const [activeTab, setActiveTab] = useState("Browse Jobs")

  // Job posting form state
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    location: "",
    remoteAvailable: false,
    jobType: "",
    industry: "",
    jobDescription: "",
    responsibilities: "",
    requirements: "",
    applicationDeadline: "",
    contactPerson: "",
    applicationMethod: "company",
    applicationUrl: "",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    benefits: "",
    tags: "",
  })

  // Browse Jobs state
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedJob, setSelectedJob] = useState<(typeof jobPostings)[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState("All Industries")
  const [selectedJobType, setSelectedJobType] = useState("All Types")
  const [locationQuery, setLocationQuery] = useState("")
  const [remoteOnly, setRemoteOnly] = useState(false)

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraftSaving, setIsDraftSaving] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [drafts, setDrafts] = useState<any[]>([])
  const [showDrafts, setShowDrafts] = useState(false)

  // My Posts state
  const [myPostsSearchQuery, setMyPostsSearchQuery] = useState("")
  const [myPostsShowFilters, setMyPostsShowFilters] = useState(false)
  const [myPostsSelectedIndustry, setMyPostsSelectedIndustry] = useState("All Industries")
  const [myPostsSelectedJobType, setMyPostsSelectedJobType] = useState("All Types")
  const [myPostsLocationQuery, setMyPostsLocationQuery] = useState("")
  const [myPostsRemoteOnly, setMyPostsRemoteOnly] = useState(false)
  const [myPostsStatusFilter, setMyPostsStatusFilter] = useState("All Status")

  // Load saved drafts on component mount
  useEffect(() => {
    const savedDrafts = localStorage.getItem("jobPostingDrafts")
    if (savedDrafts) {
      try {
        const draftsData = JSON.parse(savedDrafts)
        // Filter drafts that are less than 30 days old
        const validDrafts = draftsData.filter((draft: any) => {
          const savedDate = new Date(draft.savedAt)
          const daysDiff = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24)
          return daysDiff < 30
        })
        setDrafts(validDrafts)
      } catch (error) {
        console.error("Error loading drafts:", error)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl text-red-500">Authentication Error</h1>
          <a href="/api/auth/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Login
          </a>
        </div>
      </div>
    )
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    console.log(`Clicked ${tab}`)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleViewDetails = (jobId: number) => {
    const job = jobPostings.find((j) => j.id === jobId)
    if (job) {
      setSelectedJob(job)
      setIsModalOpen(true)
    }
  }

  // Filter jobs based on all criteria
  const filteredJobs = jobPostings.filter((job) => {
    // Search query filter
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    // Industry filter
    const matchesIndustry = selectedIndustry === "All Industries" || job.industry === selectedIndustry

    // Job type filter
    const matchesJobType = selectedJobType === "All Types" || job.jobType === selectedJobType

    // Location filter
    const matchesLocation = locationQuery === "" || job.location.toLowerCase().includes(locationQuery.toLowerCase())

    // Remote filter
    const matchesRemote = !remoteOnly || job.isRemote

    return matchesSearch && matchesIndustry && matchesJobType && matchesLocation && matchesRemote
  })

  const featuredJobs = filteredJobs.filter((job) => job.featured)
  const regularJobs = filteredJobs.filter((job) => !job.featured)

  // Filter user's posted jobs
  const filteredUserJobs = userPostedJobs.filter((job) => {
    // Search query filter
    const matchesSearch =
      job.title.toLowerCase().includes(myPostsSearchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(myPostsSearchQuery.toLowerCase()) ||
      job.tags.some((tag) => tag.toLowerCase().includes(myPostsSearchQuery.toLowerCase()))

    // Industry filter
    const matchesIndustry = myPostsSelectedIndustry === "All Industries" || job.industry === myPostsSelectedIndustry

    // Job type filter
    const matchesJobType = myPostsSelectedJobType === "All Types" || job.jobType === myPostsSelectedJobType

    // Location filter
    const matchesLocation =
      myPostsLocationQuery === "" || job.location.toLowerCase().includes(myPostsLocationQuery.toLowerCase())

    // Remote filter
    const matchesRemote = !myPostsRemoteOnly || job.isRemote

    // Status filter
    const matchesStatus = myPostsStatusFilter === "All Status" || job.status === myPostsStatusFilter

    return matchesSearch && matchesIndustry && matchesJobType && matchesLocation && matchesRemote && matchesStatus
  })

  const featuredUserJobs = filteredUserJobs.filter((job) => job.featured)
  const regularUserJobs = filteredUserJobs.filter((job) => !job.featured)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")
    setSuccessMessage("")

    // Form validation
    const requiredFields = {
      jobTitle: "Job/Internship Title",
      companyName: "Company Name",
      location: "Location",
      jobType: "Job Type",
      industry: "Industry",
      jobDescription: "Job Description",
      responsibilities: "Responsibilities",
      requirements: "Requirements/Qualifications",
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key as keyof typeof formData])
      .map(([, label]) => label)

    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in the following required fields: ${missingFields.join(", ")}`)
      setSubmitStatus("error")
      setIsSubmitting(false)
      return
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create job posting object
      const jobPosting = {
        id: Date.now(),
        title: formData.jobTitle,
        company: formData.companyName,
        location: formData.location + (formData.remoteAvailable ? " (Remote)" : ""),
        postedDate: new Date().toISOString().split("T")[0],
        description: formData.jobDescription,
        salary:
          formData.salaryMin && formData.salaryMax
            ? `${formData.currency} ${formData.salaryMin}-${formData.salaryMax}`
            : "Salary not specified",
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        views: 0,
        applied: 0,
        status: "Pending Review",
        featured: false,
        logo: "/placeholder.svg?height=40&width=40&text=" + formData.companyName.charAt(0),
        industry: formData.industry,
        jobType: formData.jobType,
        isRemote: formData.remoteAvailable,
        responsibilities: formData.responsibilities,
        requirements: formData.requirements,
        benefits: formData.benefits,
        applicationDeadline: formData.applicationDeadline,
        contactPerson: formData.contactPerson,
        applicationMethod: formData.applicationMethod,
        applicationUrl: formData.applicationUrl,
      }

      console.log("Job posted successfully:", jobPosting)

      setSubmitStatus("success")
      setSuccessMessage("Job posted successfully! It will be reviewed and published within 24 hours.")

      // Clear form after successful submission
      setTimeout(() => {
        setFormData({
          jobTitle: "",
          companyName: "",
          location: "",
          remoteAvailable: false,
          jobType: "",
          industry: "",
          jobDescription: "",
          responsibilities: "",
          requirements: "",
          applicationDeadline: "",
          contactPerson: "",
          applicationMethod: "company",
          applicationUrl: "",
          salaryMin: "",
          salaryMax: "",
          currency: "USD",
          benefits: "",
          tags: "",
        })
        setSuccessMessage("")
        setSubmitStatus("idle")
      }, 3000)
    } catch (error) {
      console.error("Error posting job:", error)
      setErrorMessage("Failed to post job. Please try again.")
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveAsDraft = async () => {
    setIsDraftSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      // Simulate API call to save draft
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Create new draft object
      const newDraft = {
        ...formData,
        savedAt: new Date().toISOString(),
        id: `draft_${Date.now()}`,
        title: formData.jobTitle || "Untitled Draft",
      }

      // Get existing drafts
      const existingDrafts = JSON.parse(localStorage.getItem("jobPostingDrafts") || "[]")

      // Add new draft to the beginning of the array
      const updatedDrafts = [newDraft, ...existingDrafts]

      // Keep only the latest 10 drafts
      const limitedDrafts = updatedDrafts.slice(0, 10)

      // Save to localStorage
      localStorage.setItem("jobPostingDrafts", JSON.stringify(limitedDrafts))
      setDrafts(limitedDrafts)

      console.log("Draft saved:", newDraft)
      setSuccessMessage("Draft saved successfully!")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    } catch (error) {
      console.error("Error saving draft:", error)
      setErrorMessage("Failed to save draft. Please try again.")
    } finally {
      setIsDraftSaving(false)
    }
  }

  const handleLoadDraft = (draft: any) => {
    const { id, savedAt, title, ...draftData } = draft
    setFormData(draftData)
    setSuccessMessage(`Draft "${title}" loaded successfully!`)
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleDeleteDraft = (draftId: string) => {
    const updatedDrafts = drafts.filter((draft) => draft.id !== draftId)
    setDrafts(updatedDrafts)
    localStorage.setItem("jobPostingDrafts", JSON.stringify(updatedDrafts))
    setSuccessMessage("Draft deleted successfully!")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left side: Back arrow + Navigation tabs */}
            <div className="flex items-center space-x-6">
              <Link href="/alumni/dashboard" className="flex items-center text-blue-600 hover:text-blue-800">
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div className="flex items-center space-x-4">
                <button
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "Browse Jobs"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-900 hover:bg-blue-100 hover:text-blue-600"
                  }`}
                  onClick={() => handleTabClick("Browse Jobs")}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse Jobs
                </button>
                <button
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "Post Job"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-900 hover:bg-blue-100 hover:text-blue-600"
                  }`}
                  onClick={() => handleTabClick("Post Job")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Post Job
                </button>
                <button
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "My Posts"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-900 hover:bg-blue-100 hover:text-blue-600"
                  }`}
                  onClick={() => handleTabClick("My Posts")}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  My Posts
                </button>
              </div>
            </div>

            {/* Right side: User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#3b82f6" }}
              >
                <span className="text-white text-sm font-medium">{user.name?.charAt(0) || "U"}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "Browse Jobs" ? (
          // Browse Jobs Content
          <>
            {/* Search Bar */}
            <div className="mb-8">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ height: "48px" }}
                  />
                </div>
                <button
                  className="h-12 px-6 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
                <div className="flex items-end gap-6">
                  {/* Industry Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Industries" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Job Type Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                    <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTypes.slice(1).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Enter city or state"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Remote Only Checkbox */}
                  <div className="flex items-center space-x-2 pb-2">
                    <Checkbox id="remote-filter" checked={remoteOnly} onCheckedChange={(checked) => setRemoteOnly(checked as boolean)} />
                    <label htmlFor="remote-filter" className="text-sm text-gray-700 whitespace-nowrap">
                      Remote only
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">All Opportunities</h2>
              <p className="text-gray-600">{filteredJobs.length} opportunities found</p>
            </div>

            {/* Featured Opportunities */}
            {featuredJobs.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Featured Opportunities</h3>
                </div>

                <div className="space-y-4">
                  {featuredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white rounded-lg shadow-sm border-2 border-blue-100 p-6"
                      style={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <img
                            src={job.logo || "/placeholder.svg"}
                            alt={`${job.company} logo`}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                Featured
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
                            <div className="flex items-center text-gray-600 mb-2">
                              <Building2 className="w-4 h-4 mr-1" />
                              <span>{job.company}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-2 inline-block">
                            {job.status}
                          </span>
                          <div className="flex items-center text-green-600 font-semibold">
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span>{job.salary}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Posted {job.postedDate}</span>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{job.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full border ${
                              index === 0
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>{job.views} views</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{job.applied} applied</span>
                          </div>
                        </div>
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                          onClick={() => handleViewDetails(job.id)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Opportunities */}
            {regularJobs.length > 0 && (
              <div className="space-y-4">
                {regularJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <img
                          src={job.logo || "/placeholder.svg"}
                          alt={`${job.company} logo`}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                        />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <Building2 className="w-4 h-4 mr-1" />
                            <span>{job.company}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-2 inline-block">
                          {job.status}
                        </span>
                        <div className="flex items-center text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span>{job.salary}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Posted {job.postedDate}</span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{job.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs rounded-full border ${
                            index === 0
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>{job.views} views</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{job.applied} applied</span>
                        </div>
                      </div>
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        onClick={() => handleViewDetails(job.id)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or check back later for new postings.
                </p>
              </div>
            )}
          </>
        ) : activeTab === "My Posts" ? (
          // My Posts Content
          <>
            {/* My Posts Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">My Job Postings</h1>
                  <p className="text-gray-600">Manage your job and internship opportunities</p>
                </div>
                <button
                  onClick={() => setActiveTab("Post Job")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Post New Opportunity
                </button>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Posts</p>
                      <p className="text-3xl font-bold text-gray-900">{userPostedJobs.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Active Posts</p>
                      <p className="text-3xl font-bold text-green-600">
                        {userPostedJobs.filter((job) => job.status === "Approved").length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Views</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {userPostedJobs.reduce((total, job) => total + job.views, 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Applications</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {userPostedJobs.reduce((total, job) => total + job.applied, 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search your posts, companies, or keywords..."
                    value={myPostsSearchQuery}
                    onChange={(e) => setMyPostsSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ height: "48px" }}
                  />
                </div>
                <button
                  className="h-12 px-6 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                  onClick={() => setMyPostsShowFilters(!myPostsShowFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>

            {/* Filters Section */}
            {myPostsShowFilters && (
              <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
                <div className="flex items-end gap-6">
                  {/* Industry Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <Select value={myPostsSelectedIndustry} onValueChange={setMyPostsSelectedIndustry}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Industries" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Job Type Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                    <Select value={myPostsSelectedJobType} onValueChange={setMyPostsSelectedJobType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <Select value={myPostsStatusFilter} onValueChange={setMyPostsStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Enter city or state"
                        value={myPostsLocationQuery}
                        onChange={(e) => setMyPostsLocationQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Remote Only Checkbox */}
                  <div className="flex items-center space-x-2 pb-2">
                    <Checkbox
                      id="my-posts-remote-filter"
                      checked={myPostsRemoteOnly}
                      onCheckedChange={(checked) => setMyPostsRemoteOnly(checked as boolean)}
                    />
                    <label htmlFor="my-posts-remote-filter" className="text-sm text-gray-700 whitespace-nowrap">
                      Remote only
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Active Postings ({filteredUserJobs.filter((job) => job.status === "Approved").length})
              </h2>
              <p className="text-gray-600">{filteredUserJobs.length} total opportunities found</p>
            </div>

            {/* Featured User Posts */}
            {featuredUserJobs.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Featured Posts</h3>
                </div>

                <div className="space-y-4">
                  {featuredUserJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white rounded-lg shadow-sm border-2 border-blue-100 p-6"
                      style={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <img
                            src={job.logo || "/placeholder.svg"}
                            alt={`${job.company} logo`}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                Featured
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
                            <div className="flex items-center text-gray-600 mb-2">
                              <Building2 className="w-4 h-4 mr-1" />
                              <span>{job.company}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs px-2 py-1 rounded-full mb-2 inline-block ${
                              job.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : job.status === "Pending Review"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : job.status === "Draft"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {job.status}
                          </span>
                          <div className="flex items-center text-green-600 font-semibold">
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span>{job.salary}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Posted {job.postedDate}</span>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{job.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full border ${
                              index === 0
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>{job.views} views</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{job.applied} applied</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                            onClick={() => console.log("Edit job", job.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            onClick={() => handleViewDetails(job.id)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular User Posts */}
            {regularUserJobs.length > 0 && (
              <div className="space-y-4">
                {regularUserJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <img
                          src={job.logo || "/placeholder.svg"}
                          alt={`${job.company} logo`}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                        />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <Building2 className="w-4 h-4 mr-1" />
                            <span>{job.company}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded-full mb-2 inline-block ${
                            job.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : job.status === "Pending Review"
                                ? "bg-yellow-100 text-yellow-800"
                                : job.status === "Draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {job.status}
                        </span>
                        <div className="flex items-center text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span>{job.salary}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Posted {job.postedDate}</span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{job.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs rounded-full border ${
                            index === 0
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>{job.views} views</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{job.applied} applied</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                          onClick={() => console.log("Edit job", job.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                          onClick={() => handleViewDetails(job.id)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredUserJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-500 mb-4">
                  {userPostedJobs.length === 0
                    ? "You haven't posted any jobs yet. Create your first job posting!"
                    : "Try adjusting your search criteria to find your posts."}
                </p>
                {userPostedJobs.length === 0 && (
                  <button
                    onClick={() => setActiveTab("Post Job")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
                  >
                    Post Your First Job
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          // Post Job Content
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Post a New Opportunity</h1>
                <p className="text-gray-600">
                  Fill out the details below to create a compelling job or internship posting.
                </p>
              </div>

              {/* Drafts Section */}
              {drafts.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Your Drafts ({drafts.length})</h2>
                    <button
                      type="button"
                      onClick={() => setShowDrafts(!showDrafts)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showDrafts ? "Hide Drafts" : "Show Drafts"}
                    </button>
                  </div>

                  {showDrafts && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {drafts.map((draft) => (
                        <div
                          key={draft.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-900 truncate">{draft.title || "Untitled Draft"}</h3>
                            <button
                              onClick={() => handleDeleteDraft(draft.id)}
                              className="text-red-500 hover:text-red-700 ml-2"
                              title="Delete draft"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 truncate">
                            {draft.companyName && `${draft.companyName} • `}
                            {draft.location || "Location not specified"}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">Saved {formatDate(draft.savedAt)}</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleLoadDraft(draft)}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              Load Draft
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Job Title and Company Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job/Internship Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Senior Software Engineer"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., TechCorp Inc."
                      value={formData.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Location and Remote */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., San Francisco, CA"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="flex items-center pt-8">
                    <Checkbox
                      id="remote"
                      checked={formData.remoteAvailable}
                      onCheckedChange={(checked) => handleInputChange("remoteAvailable", checked as boolean)}
                    />
                    <label htmlFor="remote" className="ml-2 text-sm text-gray-700">
                      Remote work available
                    </label>
                  </div>
                </div>

                {/* Job Type and Industry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.jobType} onValueChange={(value) => handleInputChange("jobType", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Full-time" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.filter(industry => industry !== "All Industries").map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Provide a detailed description of the role..."
                    value={formData.jobDescription}
                    onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Responsibilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsibilities <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="List the key responsibilities..."
                    value={formData.responsibilities}
                    onChange={(e) => handleInputChange("responsibilities", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements/Qualifications <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="List the required qualifications and skills..."
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Salary Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (Optional)</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Min salary"
                        value={formData.salaryMin}
                        onChange={(e) => handleInputChange("salaryMin", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Max salary"
                        value={formData.salaryMax}
                        onChange={(e) => handleInputChange("salaryMax", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Benefits (Optional)</label>
                  <textarea
                    placeholder="List benefits and perks..."
                    value={formData.benefits}
                    onChange={(e) => handleInputChange("benefits", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Application Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                  <input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => handleInputChange("applicationDeadline", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g., Sarah Johnson, HR Manager"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., React, JavaScript, Remote (comma-separated)"
                    value={formData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">Separate tags with commas</p>
                </div>

                {/* Success/Error Messages */}
                {submitStatus === "success" && successMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">{successMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {submitStatus === "error" && errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={handleSaveAsDraft}
                    disabled={isDraftSaving}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDraftSaving ? "Saving..." : "Save as Draft"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Posting..." : "Post Job"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Job Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-6">
                {/* Job Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <img
                      src={selectedJob.logo || "/placeholder.svg"}
                      alt={`${selectedJob.company} logo`}
                      className="w-16 h-16 rounded-lg object-cover bg-gray-200"
                    />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h1>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Building2 className="w-5 h-5 mr-2" />
                        <span className="text-lg">{selectedJob.company}</span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{selectedJob.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Posted {selectedJob.postedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600 font-bold text-xl mb-2">
                      <DollarSign className="w-5 h-5 mr-1" />
                      <span>{selectedJob.salary}</span>
                    </div>
                    <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                      {selectedJob.status}
                    </span>
                  </div>
                </div>

                {/* Job Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedJob.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        index === 0
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Job Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedJob.description}</p>
                </div>

                {/* Job Stats */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-gray-500 mb-1">
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="text-sm">Views</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{selectedJob.views}</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-gray-500 mb-1">
                      <Users className="w-4 h-4 mr-1" />
                      <span className="text-sm">Applications</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{selectedJob.applied}</span>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="flex space-x-4">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium">
                    Apply Now
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium">
                    Save Job
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

export default AlumniJobBoard