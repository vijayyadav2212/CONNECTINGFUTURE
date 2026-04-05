// "use client"
// import { useState, useEffect, useRef } from "react"
// import type React from "react"

// import {
//   Briefcase,
//   Users,
//   Building2,
//   ArrowLeft,
//   Calendar,
//   MapPin,
//   Eye,
//   Search,
//   Filter,
//   Star,
//   DollarSign,
//   FileText,
//   Link2,
//   Clock,
// } from "lucide-react"
// import Link from "next/link"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { useToast } from "@/hooks/use-toast"
// import { useUser } from "@auth0/nextjs-auth0/client"
// import AlumniNavigation from "../AluminaNavigation/AlumniNavigation"

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api"

// // Backend job types and helpers
// type JobItem = {
//   id: number
//   title: string
//   company: string
//   location: string
//   postedDate: string
//   description: string
//   salary: string
//   tags: string[]
//   views: number
//   applied: number
//   status: string
//   featured: boolean
//   logo?: string | null
//   industry: string
//   jobType: string
//   isRemote: boolean
//   postedBy?: string
// }

// function salaryString(smin?: string | number | null, smax?: string | number | null, currency?: string | null) {
//   if (smin && smax && currency) return `${currency} ${smin}-${smax}`
//   return "Salary not specified"
// }

// function mapJobRow(row: any): JobItem {
//   const tagsArr = row.tags ? String(row.tags).split(',').map((t) => t.trim()).filter(Boolean) : []
//   return {
//     id: row.id,
//     title: row.title,
//     company: row.company,
//     location: row.location,
//     postedDate: (row.posted_date || row.created_at || new Date().toISOString()).toString().split('T')[0],
//     description: row.description,
//     salary: salaryString(row.salary_min, row.salary_max, row.currency),
//     tags: tagsArr,
//     views: Number(row.views || 0),
//     applied: Number(row.applied || 0),
//     status: row.status || "Pending Review",
//     featured: !!row.featured,
//     logo: row.logo || null,
//     industry: row.industry,
//     jobType: row.job_type,
//     isRemote: !!row.is_remote,
//     postedBy: row.posted_by || undefined,
//   }
// }

// function getTypeColor(type: string) {
//   switch (type) {
//     case 'Full-time':
//       return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300 shadow-sm'
//     case 'Part-time':
//       return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-300 shadow-sm'
//     case 'Internship':
//     case 'Internship (Paid)':
//     case 'Internship (Unpaid)':
//       return 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-300 shadow-sm'
//     case 'Contract':
//     case 'Temporary':
//       return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-300 shadow-sm'
//     default:
//       return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-300 shadow-sm'
//   }
// }

// // Mock job data (replaced by backend fetch)
// const jobPostings = [
//   {
//     id: 1,
//     title: "Senior Software Engineer",
//     company: "TechCorp Inc.",
//     location: "San Francisco, CA (Remote)",
//     postedDate: "2025-01-10",
//     description:
//       "Join our innovative team to build cutting-edge software solutions that impact millions of users worldwide.",
//     salary: "$120k-180k",
//     tags: ["Full Time", "Technology", "Software Engineering", "React"],
//     views: 245,
//     applied: 12,
//     status: "Approved",
//     featured: true,
//     logo: "/placeholder.svg?height=40&width=40&text=TC",
//     industry: "Technology",
//     jobType: "Full-time",
//     isRemote: true,
//   },
//   {
//     id: 2,
//     title: "Marketing Internship (Paid)",
//     company: "Growth Marketing Co.",
//     location: "New York, NY",
//     postedDate: "2025-01-08",
//     description: "Exciting paid internship opportunity to learn digital marketing strategies and campaign management.",
//     salary: "$18-22/hour",
//     tags: ["Internship Paid", "Marketing", "Internship"],
//     views: 89,
//     applied: 7,
//     status: "Approved",
//     featured: false,
//     logo: "/placeholder.svg?height=40&width=40&text=GM",
//     industry: "Marketing",
//     jobType: "Internship (Paid)",
//     isRemote: false,
//   },
//   {
//     id: 3,
//     title: "Financial Analyst",
//     company: "Finance Pro LLC",
//     location: "Chicago, IL",
//     postedDate: "2025-01-05",
//     description: "Analyze financial data and create reports to support business decisions.",
//     salary: "$65k-85k",
//     tags: ["Full Time", "Finance", "Analysis"],
//     views: 156,
//     applied: 23,
//     status: "Approved",
//     featured: false,
//     logo: "/placeholder.svg?height=40&width=40&text=FP",
//     industry: "Finance",
//     jobType: "Full-time",
//     isRemote: false,
//   },
//   {
//     id: 4,
//     title: "Remote UX Designer",
//     company: "Design Studio",
//     location: "Remote",
//     postedDate: "2025-01-12",
//     description: "Create user-centered designs for web and mobile applications.",
//     salary: "$70k-95k",
//     tags: ["Full Time", "Design", "UX/UI", "Remote"],
//     views: 203,
//     applied: 18,
//     status: "Approved",
//     featured: true,
//     logo: "/placeholder.svg?height=40&width=40&text=DS",
//     industry: "Technology",
//     jobType: "Full-time",
//     isRemote: true,
//   },
// ]

// // Mock user's posted jobs
// const userPostedJobs = [
//   {
//     id: 101,
//     title: "Senior Software Engineer",
//     company: "TechCorp Inc.",
//     location: "San Francisco, CA (Remote)",
//     postedDate: "2025-01-10",
//     description:
//       "Join our innovative team to build cutting-edge software solutions that impact millions of users worldwide.",
//     salary: "$120k-180k",
//     tags: ["Full Time", "Technology", "Software Engineering", "React"],
//     views: 245,
//     applied: 12,
//     status: "Approved",
//     featured: true,
//     logo: "/placeholder.svg?height=40&width=40&text=TC",
//     industry: "Technology",
//     jobType: "Full-time",
//     isRemote: true,
//     postedBy: "sarah.johnson@email.com",
//   },
//   {
//     id: 102,
//     title: "Frontend Developer Internship",
//     company: "StartupXYZ",
//     location: "New York, NY",
//     postedDate: "2025-01-08",
//     description: "Great opportunity for students to learn modern web development in a fast-paced startup environment.",
//     salary: "$25-30/hour",
//     tags: ["Internship Paid", "Technology", "Frontend", "React"],
//     views: 89,
//     applied: 7,
//     status: "Pending Review",
//     featured: false,
//     logo: "/placeholder.svg?height=40&width=40&text=SX",
//     industry: "Technology",
//     jobType: "Internship (Paid)",
//     isRemote: false,
//     postedBy: "sarah.johnson@email.com",
//   },
//   {
//     id: 103,
//     title: "Product Manager",
//     company: "InnovateCorp",
//     location: "Remote",
//     postedDate: "2025-01-05",
//     description: "Lead product strategy and development for our flagship SaaS platform.",
//     salary: "$90k-120k",
//     tags: ["Full Time", "Product", "Strategy", "Remote"],
//     views: 156,
//     applied: 23,
//     status: "Draft",
//     featured: false,
//     logo: "/placeholder.svg?height=40&width=40&text=IC",
//     industry: "Technology",
//     jobType: "Full-time",
//     isRemote: true,
//     postedBy: "sarah.johnson@email.com",
//   },
// ]

// const industries = [
//   "Technology",
//   "Finance",
//   "Healthcare",
//   "Marketing",
//   "Consulting",
//   "Manufacturing",
//   "Education",
//   "Non-profit",
//   "Government",
//   "Retail",
//   "Media",
//   "Real Estate",
// ]

// const jobTypes = [
//   "All Types",
//   "Full-time",
//   "Part-time",
//   "Contract",
//   "Temporary",
//   "Internship (Paid)",
//   "Internship (Unpaid)",
//   "Volunteer",
// ]

// const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR"]

// const statusOptions = ["All Status", "Approved", "Pending Review", "Draft", "Rejected"]

// function AlumniJobBoard() {
//   const { user, isLoading, error } = useUser()
//   const { toast } = useToast()

//   // Tab state
//   const [activeTab, setActiveTab] = useState("Browse Jobs")

//   // Job posting form state
//   const [formData, setFormData] = useState({
//     jobTitle: "",
//     companyName: "",
//     location: "",
//     remoteAvailable: false,
//     jobType: "",
//     industry: "",
//     jobDescription: "",
//     responsibilities: "",
//     requirements: "",
//     applicationDeadline: "",
//     contactPerson: "",
//     applicationMethod: "company",
//     applicationUrl: "",
//     salaryMin: "",
//     salaryMax: "",
//     currency: "USD",
//     benefits: "",
//     tags: "",
//   })
//   const [activeStep, setActiveStep] = useState<number>(1)

//   // Browse Jobs state
//   const [searchQuery, setSearchQuery] = useState("")
//   const [showFilters, setShowFilters] = useState(false)
//   const [selectedJob, setSelectedJob] = useState<JobItem | null>(null)
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [selectedIndustry, setSelectedIndustry] = useState("All Industries")
//   const [selectedJobType, setSelectedJobType] = useState("All Types")
//   const [locationQuery, setLocationQuery] = useState("")
//   const [remoteOnly, setRemoteOnly] = useState(false)

//   // Backend data
//   const [jobs, setJobs] = useState<JobItem[]>([])
//   const [myJobs, setMyJobs] = useState<JobItem[]>([])
//   const [applicantsByJob, setApplicantsByJob] = useState<Record<number, any[]>>({})
//   const [expandedApplicantsJobId, setExpandedApplicantsJobId] = useState<number | null>(null)
//   const [updatingAppId, setUpdatingAppId] = useState<number | null>(null)

//   const fetchJobs = async () => {
//     const params = new URLSearchParams()
//     if (searchQuery) params.set('q', searchQuery)
//     if (selectedIndustry && selectedIndustry !== 'All Industries') params.set('industry', selectedIndustry)
//     if (selectedJobType && selectedJobType !== 'All Types') params.set('job_type', selectedJobType)
//     if (locationQuery) params.set('location', locationQuery)
//     if (remoteOnly) params.set('remote_only', 'true')
//     // Only show approved jobs in the general listing
//     params.set('status', 'Approved')
//     try {
//       const res = await fetch(`${API_BASE}/jobs?${params.toString()}`)
//       const data = await res.json()
//       setJobs((data.jobs || []).map(mapJobRow))
//     } catch (e) {
//       console.warn('Failed to fetch jobs', e)
//       toast({ title: 'Failed to load jobs', description: 'Please try again later.', variant: 'destructive' })
//     }
//   }

//   const fetchMyJobs = async () => {
//     if (!user?.email) return
//     const params = new URLSearchParams()
//     params.set('posted_by', user.email)
//     if (myPostsSearchQuery) params.set('q', myPostsSearchQuery)
//     if (myPostsSelectedIndustry && myPostsSelectedIndustry !== 'All Industries') params.set('industry', myPostsSelectedIndustry)
//     if (myPostsSelectedJobType && myPostsSelectedJobType !== 'All Types') params.set('job_type', myPostsSelectedJobType)
//     if (myPostsLocationQuery) params.set('location', myPostsLocationQuery)
//     if (myPostsRemoteOnly) params.set('remote_only', 'true')
//     if (myPostsStatusFilter && myPostsStatusFilter !== 'All Status') params.set('status', myPostsStatusFilter)
//     try {
//       const res = await fetch(`${API_BASE}/jobs?${params.toString()}`)
//       const data = await res.json()
//       setMyJobs((data.jobs || []).map(mapJobRow))
//     } catch (e) {
//       console.warn('Failed to fetch my jobs', e)
//       toast({ title: 'Failed to load your posts', description: 'Please try again later.', variant: 'destructive' })
//     }
//   }

//   useEffect(() => { fetchJobs() }, [])
//   useEffect(() => { fetchJobs() }, [searchQuery, selectedIndustry, selectedJobType, locationQuery, remoteOnly])

//   // Form submission state
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [isDraftSaving, setIsDraftSaving] = useState(false)
//   const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
//   const [errorMessage, setErrorMessage] = useState("")
//   const [successMessage, setSuccessMessage] = useState("")
//   const [drafts, setDrafts] = useState<any[]>([])
//   const [showDrafts, setShowDrafts] = useState(false)

//   // My Posts state
//   const [myPostsSearchQuery, setMyPostsSearchQuery] = useState("")
//   const [myPostsShowFilters, setMyPostsShowFilters] = useState(false)
//   const [myPostsSelectedIndustry, setMyPostsSelectedIndustry] = useState("All Industries")
//   const [myPostsSelectedJobType, setMyPostsSelectedJobType] = useState("All Types")
//   const [myPostsLocationQuery, setMyPostsLocationQuery] = useState("")
//   const [myPostsRemoteOnly, setMyPostsRemoteOnly] = useState(false)
//   const [myPostsStatusFilter, setMyPostsStatusFilter] = useState("All Status")

//   // Previous snapshots for notifications
//   const prevJobsRef = useRef<JobItem[]>([])
//   const prevMyJobsRef = useRef<JobItem[]>([])

//   // Load my posts when tab is active or filters change
//   useEffect(() => {
//     if (activeTab === 'My Posts') fetchMyJobs()
//   }, [activeTab, user?.email, myPostsSearchQuery, myPostsSelectedIndustry, myPostsSelectedJobType, myPostsLocationQuery, myPostsRemoteOnly, myPostsStatusFilter])

//   // Load saved drafts on component mount
//   useEffect(() => {
//     const savedDrafts = localStorage.getItem("jobPostingDrafts")
//     if (savedDrafts) {
//       try {
//         const draftsData = JSON.parse(savedDrafts)
//         // Filter drafts that are less than 30 days old
//         const validDrafts = draftsData.filter((draft: any) => {
//           const savedDate = new Date(draft.savedAt)
//           const daysDiff = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24)
//           return daysDiff < 30
//         })
//         setDrafts(validDrafts)
//       } catch (error) {
//         console.error("Error loading drafts:", error)
//       }
//     }
//   }, [])

//   // Poll for new jobs/internships when Browse Jobs tab is active
//   useEffect(() => {
//     if (activeTab !== 'Browse Jobs') return
//     let cancelled = false
//     const checkJobsUpdates = async () => {
//       try {
//         const params = new URLSearchParams()
//         if (searchQuery) params.set('q', searchQuery)
//         if (selectedIndustry && selectedIndustry !== 'All Industries') params.set('industry', selectedIndustry)
//         if (selectedJobType && selectedJobType !== 'All Types') params.set('job_type', selectedJobType)
//         if (locationQuery) params.set('location', locationQuery)
//         if (remoteOnly) params.set('remote_only', 'true')
//         const res = await fetch(`${API_BASE}/jobs?${params.toString()}`)
//         const data = await res.json()
//         const latest: JobItem[] = (data.jobs || []).map(mapJobRow)
//         if (!cancelled) {
//           // Detect new jobs
//           const prevIds = new Set(prevJobsRef.current.map(j => j.id))
//           const newJobs = latest.filter(j => !prevIds.has(j.id))
//           if (newJobs.length > 0) {
//             const newInternships = newJobs.filter(j => String(j.jobType).toLowerCase().includes('internship'))
//             if (newInternships.length > 0) {
//               toast({ title: 'New internships available', description: `${newInternships.length} new internship${newInternships.length > 1 ? 's' : ''} posted.` })
//             }
//             const otherNew = newJobs.length - newInternships.length
//             if (otherNew > 0) {
//               toast({ title: 'New jobs posted', description: `${otherNew} new job${otherNew > 1 ? 's' : ''} added.` })
//             }
//           }
//           // Update state and snapshot
//           setJobs(latest)
//           prevJobsRef.current = latest
//         }
//       } catch (e) {
//         // silent on background
//       }
//     }
//     // initial snapshot
//     prevJobsRef.current = jobs
//     checkJobsUpdates()
//     const id = setInterval(checkJobsUpdates, 60000)
//     return () => { cancelled = true; clearInterval(id) }
//   }, [activeTab, searchQuery, selectedIndustry, selectedJobType, locationQuery, remoteOnly])

//   // Poll for new applicants on My Posts tab
//   useEffect(() => {
//     const email = String(user?.email || '')
//     if (activeTab !== 'My Posts' || !email) return
//     let cancelled = false
//     const checkMyJobsUpdates = async () => {
//       try {
//         const params = new URLSearchParams()
//         params.set('posted_by', email)
//         if (myPostsSearchQuery) params.set('q', myPostsSearchQuery)
//         if (myPostsSelectedIndustry && myPostsSelectedIndustry !== 'All Industries') params.set('industry', myPostsSelectedIndustry)
//         if (myPostsSelectedJobType && myPostsSelectedJobType !== 'All Types') params.set('job_type', myPostsSelectedJobType)
//         if (myPostsLocationQuery) params.set('location', myPostsLocationQuery)
//         if (myPostsRemoteOnly) params.set('remote_only', 'true')
//         if (myPostsStatusFilter && myPostsStatusFilter !== 'All Status') params.set('status', myPostsStatusFilter)
//         const res = await fetch(`${API_BASE}/jobs?${params.toString()}`)
//         const data = await res.json()
//         const latest: JobItem[] = (data.jobs || []).map(mapJobRow)
//         if (!cancelled) {
//           // Compare applied counts
//           const prevById: Record<number, number> = {}
//           prevMyJobsRef.current.forEach(j => { prevById[j.id] = j.applied || 0 })
//           latest.forEach(j => {
//             const prevApplied = prevById[j.id] ?? 0
//             if ((j.applied || 0) > prevApplied) {
//               const delta = (j.applied || 0) - prevApplied
//               toast({ title: 'New applicant', description: `${delta} new applicant${delta > 1 ? 's' : ''} for "${j.title}"` })
//             }
//           })
//           setMyJobs(latest)
//           prevMyJobsRef.current = latest
//         }
//       } catch (e) {
//         // silent on background
//       }
//     }
//     // initial snapshot
//     prevMyJobsRef.current = myJobs
//     checkMyJobsUpdates()
//     const id = setInterval(checkMyJobsUpdates, 60000)
//     return () => { cancelled = true; clearInterval(id) }
//   }, [activeTab, user?.email, myPostsSearchQuery, myPostsSelectedIndustry, myPostsSelectedJobType, myPostsLocationQuery, myPostsRemoteOnly, myPostsStatusFilter])

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading...</p>
//         </div>
//       </div>
//     )
//   }

//   if (error || !user) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <h1 className="text-xl text-red-500">Authentication Error</h1>
//           <a href="/api/auth/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Login
//           </a>
//         </div>
//       </div>
//     )
//   }

//   const handleTabClick = (tab: string) => {
//     setActiveTab(tab)
//     console.log(`Clicked ${tab}`)
//   }

//   const handleInputChange = (field: string, value: string | boolean) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }))
//   }

//   const handleViewDetails = (jobId: number) => {
//     const job = jobs.find((j) => j.id === jobId) || myJobs.find((j) => j.id === jobId)
//     if (job) {
//       setSelectedJob(job)
//       setIsModalOpen(true)
//     }
//   }

//   const fetchApplicantsForJob = async (jobId: number) => {
//     try {
//       const res = await fetch(`${API_BASE}/applications/by-job?job_id=${jobId}`)
//       const data = await res.json()
//       const list = data.applications || []
//       setApplicantsByJob(prev => ({ ...prev, [jobId]: list }))
//       toast({ title: 'Applicants loaded', description: `${list.length} applicant(s) found.` })
//     } catch (e) {
//       console.warn('Failed to fetch applicants', e)
//       setApplicantsByJob(prev => ({ ...prev, [jobId]: [] }))
//       toast({ title: 'Failed to load applicants', description: 'Please try again.', variant: 'destructive' })
//     }
//   }

//   const toggleApplicants = async (jobId: number) => {
//     if (expandedApplicantsJobId === jobId) {
//       setExpandedApplicantsJobId(null)
//       return
//     }
//     setExpandedApplicantsJobId(jobId)
//     if (!applicantsByJob[jobId]) await fetchApplicantsForJob(jobId)
//   }

//   const updateApplicationStatus = async (appId: number, jobId: number, status: 'accepted' | 'rejected') => {
//     try {
//       setUpdatingAppId(appId)
//       const res = await fetch(`${API_BASE}/applications/${appId}`, {
//         method: 'PUT',
//         headers: { 'content-type': 'application/json' },
//         body: JSON.stringify({ status })
//       })
//       if (!res.ok) throw new Error(`Failed (${res.status})`)
//       setApplicantsByJob(prev => ({
//         ...prev,
//         [jobId]: (prev[jobId] || []).map((a: any) => a.id === appId ? { ...a, status } : a)
//       }))
//       toast({ title: `Application ${status}`, description: `Marked as ${status}.` })
//     } catch (e) {
//       toast({ title: 'Update failed', description: 'Could not update application status.', variant: 'destructive' })
//     } finally {
//       setUpdatingAppId(null)
//     }
//   }

//   const featuredJobs = jobs.filter((job) => job.featured)
//   const regularJobs = jobs.filter((job) => !job.featured)

//   // Split my posts into featured and regular (server-side filtering already applied)
//   const featuredUserJobs = myJobs.filter((job) => job.featured)
//   const regularUserJobs = myJobs.filter((job) => !job.featured)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsSubmitting(true)
//     setSubmitStatus("idle")
//     setErrorMessage("")
//     setSuccessMessage("")

//     // Form validation
//     const requiredFields = {
//       jobTitle: "Job/Internship Title",
//       companyName: "Company Name",
//       location: "Location",
//       jobType: "Job Type",
//       industry: "Industry",
//       jobDescription: "Job Description",
//       responsibilities: "Responsibilities",
//       requirements: "Requirements/Qualifications",
//     }

//     const missingFields = Object.entries(requiredFields)
//       .filter(([key]) => !formData[key as keyof typeof formData])
//       .map(([, label]) => label)

//     if (missingFields.length > 0) {
//       setErrorMessage(`Please fill in the following required fields: ${missingFields.join(", ")}`)
//       setSubmitStatus("error")
//       setIsSubmitting(false)
//       return
//     }

//     try {
//       const payload = {
//         title: formData.jobTitle,
//         company: formData.companyName,
//         location: formData.location,
//         description: formData.jobDescription,
//         responsibilities: formData.responsibilities,
//         requirements: formData.requirements,
//         benefits: formData.benefits,
//         salary_min: formData.salaryMin || null,
//         salary_max: formData.salaryMax || null,
//         currency: formData.currency || null,
//         tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
//         status: 'Pending Review',
//         featured: false,
//         logo: `/placeholder.svg?height=40&width=40&text=${formData.companyName.charAt(0)}`,
//         industry: formData.industry,
//         job_type: formData.jobType,
//         is_remote: !!formData.remoteAvailable,
//         application_deadline: formData.applicationDeadline || null,
//         contact_person: formData.contactPerson || null,
//         application_method: formData.applicationMethod || null,
//         application_url: formData.applicationUrl || null,
//         posted_by: user?.email,
//       }

//       const res = await fetch(`${API_BASE}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
//       if (!res.ok) throw new Error(`Failed: ${res.status}`)

//       setSubmitStatus('success')
//       setSuccessMessage('Job posted successfully! It will be reviewed and published within 24 hours.')
//       fetchMyJobs()

//       // Clear form after successful submission
//       setTimeout(() => {
//         setFormData({
//           jobTitle: "",
//           companyName: "",
//           location: "",
//           remoteAvailable: false,
//           jobType: "",
//           industry: "",
//           jobDescription: "",
//           responsibilities: "",
//           requirements: "",
//           applicationDeadline: "",
//           contactPerson: "",
//           applicationMethod: "company",
//           applicationUrl: "",
//           salaryMin: "",
//           salaryMax: "",
//           currency: "USD",
//           benefits: "",
//           tags: "",
//         })
//         setSuccessMessage("")
//         setSubmitStatus("idle")
//       }, 3000)
//     } catch (error) {
//       console.error("Error posting job:", error)
//       setErrorMessage("Failed to post job. Please try again.")
//       setSubmitStatus("error")
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleSaveAsDraft = async () => {
//     setIsDraftSaving(true)
//     setErrorMessage("")
//     setSuccessMessage("")

//     try {
//       const payload = {
//         title: formData.jobTitle || 'Untitled Draft',
//         company: formData.companyName || 'Company',
//         location: formData.location || 'Location',
//         description: formData.jobDescription || 'Description',
//         responsibilities: formData.responsibilities || '',
//         requirements: formData.requirements || '',
//         benefits: formData.benefits || '',
//         salary_min: formData.salaryMin || null,
//         salary_max: formData.salaryMax || null,
//         currency: formData.currency || null,
//         tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
//         status: 'Draft',
//         featured: false,
//         logo: `/placeholder.svg?height=40&width=40&text=${(formData.companyName || 'D').charAt(0)}`,
//         industry: formData.industry || 'Technology',
//         job_type: formData.jobType || 'Full-time',
//         is_remote: !!formData.remoteAvailable,
//         application_deadline: formData.applicationDeadline || null,
//         contact_person: formData.contactPerson || null,
//         application_method: formData.applicationMethod || null,
//         application_url: formData.applicationUrl || null,
//         posted_by: user?.email,
//       }
//       const res = await fetch(`${API_BASE}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
//       if (!res.ok) throw new Error(`Failed: ${res.status}`)
//       setSuccessMessage('Draft saved successfully!')
//       fetchMyJobs()
//       setTimeout(() => setSuccessMessage(''), 3000)
//     } catch (error) {
//       console.error('Error saving draft:', error)
//       setErrorMessage('Failed to save draft. Please try again.')
//     } finally {
//       setIsDraftSaving(false)
//     }
//   }

//   const handleLoadDraft = (draft: any) => {
//     const { id, savedAt, title, ...draftData } = draft
//     setFormData(draftData)
//     setSuccessMessage(`Draft "${title}" loaded successfully!`)
//     setTimeout(() => setSuccessMessage(""), 3000)
//   }

//   const handleDeleteDraft = (draftId: string) => {
//     const updatedDrafts = drafts.filter((draft) => draft.id !== draftId)
//     setDrafts(updatedDrafts)
//     localStorage.setItem("jobPostingDrafts", JSON.stringify(updatedDrafts))
//     setSuccessMessage("Draft deleted successfully!")
//     setTimeout(() => setSuccessMessage(""), 3000)
//   }

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString)
//     return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
//   }

//   return (
//     <AlumniNavigation>
//       <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
//         {/* Navigation Header */}
//         <nav className="bg-white shadow-sm" style={{ borderBottom: "1px solid #e2e8f0" }}>
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex justify-between items-center py-4">
//               {/* Left side: Navigation tabs */}
//               <div className="flex items-center space-x-6">
//                 <div className="flex items-center space-x-4">
//                   <button
//                     className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Browse Jobs"
//                         ? "bg-blue-100 text-blue-600"
//                         : "text-gray-900 hover:bg-blue-100 hover:text-blue-600"
//                       }`}
//                     onClick={() => handleTabClick("Browse Jobs")}
//                   >
//                     <Briefcase className="w-4 h-4 mr-2" />
//                     Browse Jobs
//                   </button>
//                   <button
//                     className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Post Job"
//                         ? "bg-blue-100 text-blue-600"
//                         : "text-gray-900 hover:bg-blue-100 hover:text-blue-600"
//                       }`}
//                     onClick={() => handleTabClick("Post Job")}
//                   >
//                     <Users className="w-4 h-4 mr-2" />
//                     Post Job
//                   </button>
//                   <button
//                     className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "My Posts"
//                         ? "bg-blue-100 text-blue-600"
//                         : "text-gray-900 hover:bg-blue-100 hover:text-blue-600"
//                       }`}
//                     onClick={() => handleTabClick("My Posts")}
//                   >
//                     <Building2 className="w-4 h-4 mr-2" />
//                     My Posts
//                   </button>
//                 </div>
//               </div>

//               {/* Right side: User Profile */}
//               <div className="flex items-center space-x-3">
//                 <div className="text-right">
//                   <p className="text-sm font-medium text-gray-900">{user.name}</p>
//                   <p className="text-xs text-gray-500">{user.email}</p>
//                 </div>
//                 <div
//                   className="w-8 h-8 rounded-full flex items-center justify-center"
//                   style={{ backgroundColor: "#3b82f6" }}
//                 >
//                   <span className="text-white text-sm font-medium">{user.name?.charAt(0) || "U"}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </nav>

//         {/* Main Content */}
//         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           {activeTab === "Browse Jobs" ? (
//             // Browse Jobs Content
//             <>
//               {/* Search Bar */}
//               <div className="mb-8">
//                 <div className="flex gap-4">
//                   <div className="flex-1 relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                     <input
//                       type="text"
//                       placeholder="Search jobs, companies, or keywords..."
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       style={{ height: "48px" }}
//                     />
//                   </div>
//                   <button
//                     className="h-12 px-6 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center text-gray-700"
//                     onClick={() => setShowFilters(!showFilters)}
//                   >
//                     <Filter className="w-4 h-4 mr-2" />
//                     Filters
//                   </button>
//                 </div>
//               </div>

//               {/* Filters Section */}
//               {showFilters && (
//                 <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
//                   <div className="flex items-end gap-6">
//                     {/* Industry Filter */}
//                     <div className="flex-1">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
//                       <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
//                         <SelectTrigger className="w-full">
//                           <SelectValue placeholder="All Industries" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="All Industries">All Industries</SelectItem>
//                           {industries.map((industry) => (
//                             <SelectItem key={industry} value={industry}>
//                               {industry}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Job Type Filter */}
//                     <div className="flex-1">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
//                       <Select value={selectedJobType} onValueChange={setSelectedJobType}>
//                         <SelectTrigger className="w-full">
//                           <SelectValue placeholder="All Types" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="All Types">All Types</SelectItem>
//                           {jobTypes.slice(1).map((type) => (
//                             <SelectItem key={type} value={type}>
//                               {type}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Location Filter */}
//                     <div className="flex-1">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
//                       <div className="relative">
//                         <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                         <input
//                           type="text"
//                           placeholder="Enter city or state"
//                           value={locationQuery}
//                           onChange={(e) => setLocationQuery(e.target.value)}
//                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         />
//                       </div>
//                     </div>

//                     {/* Remote Only Checkbox */}
//                     <div className="flex items-center space-x-2 pb-2">
//                       <Checkbox
//                         id="remote-filter"
//                         checked={remoteOnly}
//                         onCheckedChange={(checked) => setRemoteOnly(checked === true)}
//                       />
//                       <label htmlFor="remote-filter" className="text-sm text-gray-700 whitespace-nowrap">
//                         Remote only
//                       </label>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Results Summary */}
//               <div className="mb-6">
//                 <h2 className="text-2xl font-bold text-gray-900 mb-2">All Opportunities</h2>
//                 <p className="text-gray-600">{jobs.length} opportunities found</p>
//               </div>

//               {/* Featured Opportunities - styled like student cards */}
//               {featuredJobs.length > 0 && (
//                 <div className="mb-8">
//                   <div className="flex items-center mb-4">
//                     <Star className="w-5 h-5 text-yellow-500 mr-2" />
//                     <h3 className="text-lg font-semibold text-gray-900">Featured Opportunities</h3>
//                   </div>
//                   <div className="space-y-6">
//                     {featuredJobs.map((job) => {
//                       const reqs = (job.tags || []).slice(0, 4)
//                       return (
//                         <div key={job.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group relative">
//                           <div className="p-6 lg:p-8">
//                             <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6">
//                               <div className="flex-1">
//                                 <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
//                                   <h3 className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
//                                     {job.title}
//                                   </h3>
//                                   <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 self-start ${getTypeColor(job.jobType)} transition-all duration-200 group-hover:scale-105`}>
//                                     {job.jobType}
//                                   </span>
//                                 </div>
//                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
//                                   <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
//                                     <div className="bg-blue-100 p-2 rounded-lg">
//                                       <Building2 className="w-4 h-4 text-blue-600" />
//                                     </div>
//                                     <div>
//                                       <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
//                                       <p className="font-semibold text-gray-900">{job.company}</p>
//                                     </div>
//                                   </div>
//                                   <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
//                                     <div className="bg-green-100 p-2 rounded-lg">
//                                       <MapPin className="w-4 h-4 text-green-600" />
//                                     </div>
//                                     <div>
//                                       <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
//                                       <p className="font-semibold text-gray-900">{job.location}</p>
//                                     </div>
//                                   </div>
//                                   {job.salary && (
//                                     <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
//                                       <div className="bg-purple-100 p-2 rounded-lg">
//                                         <DollarSign className="w-4 h-4 text-purple-600" />
//                                       </div>
//                                       <div>
//                                         <p className="text-xs text-gray-500 uppercase tracking-wide">Salary</p>
//                                         <p className="font-semibold text-gray-900">{job.salary}</p>
//                                       </div>
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="mb-6">
//                                   <p className="text-gray-700 leading-relaxed text-base">{job.description}</p>
//                                 </div>
//                                 {reqs.length > 0 && (
//                                   <div className="mb-6">
//                                     <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
//                                       <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                                       Requirements
//                                     </h4>
//                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                                       {reqs.map((req, idx) => (
//                                         <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
//                                           <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
//                                           <span className="text-blue-800 font-medium text-sm">{req}</span>
//                                         </div>
//                                       ))}
//                                     </div>
//                                   </div>
//                                 )}
//                                 <div className="border-t border-gray-100 pt-6">
//                                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                                     <div className="flex items-center gap-2 text-sm">
//                                       <div className="bg-gray-100 p-2 rounded-lg">
//                                         <Clock className="w-4 h-4 text-gray-600" />
//                                       </div>
//                                       <div>
//                                         <p className="text-xs text-gray-500 uppercase tracking-wide">Posted</p>
//                                         <p className="font-semibold text-gray-900">{job.postedDate}</p>
//                                       </div>
//                                     </div>
//                                     <div className="flex items-center gap-2 text-sm">
//                                       <div className="bg-blue-100 p-2 rounded-lg">
//                                         <Eye className="w-4 h-4 text-blue-600" />
//                                       </div>
//                                       <div>
//                                         <p className="text-xs text-gray-500 uppercase tracking-wide">Views</p>
//                                         <p className="font-semibold text-gray-900">{job.views}</p>
//                                       </div>
//                                     </div>
//                                     <div className="flex items-center gap-2 text-sm">
//                                       <div className="bg-purple-100 p-2 rounded-lg">
//                                         <Users className="w-4 h-4 text-purple-600" />
//                                       </div>
//                                       <div>
//                                         <p className="text-xs text-gray-500 uppercase tracking-wide">Applicants</p>
//                                         <p className="font-semibold text-gray-900">{job.applied}</p>
//                                       </div>
//                                     </div>
//                                   </div>
//                                   <div className="mt-4 flex justify-end">
//                                     <button
//                                       className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
//                                       onClick={() => handleViewDetails(job.id)}
//                                     >
//                                       View Details
//                                     </button>
//                                   </div>
//                                 </div>
//                               </div>
//                               <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
//                                 <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
//                                   Featured
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       )
//                     })}
//                   </div>
//                 </div>
//               )}

//               {/* Regular Opportunities - styled like student cards */}
//               {regularJobs.length > 0 && (
//                 <div className="space-y-6">
//                   {regularJobs.map((job) => {
//                     const reqs = (job.tags || []).slice(0, 4)
//                     return (
//                       <div key={job.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group relative">
//                         <div className="p-6 lg:p-8">
//                           <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6">
//                             <div className="flex-1">
//                               <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
//                                 <h3 className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
//                                   {job.title}
//                                 </h3>
//                                 <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 self-start ${getTypeColor(job.jobType)} transition-all duration-200 group-hover:scale-105`}>
//                                   {job.jobType}
//                                 </span>
//                               </div>

//                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
//                                 <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
//                                   <div className="bg-blue-100 p-2 rounded-lg">
//                                     <Building2 className="w-4 h-4 text-blue-600" />
//                                   </div>
//                                   <div>
//                                     <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
//                                     <p className="font-semibold text-gray-900">{job.company}</p>
//                                   </div>
//                                 </div>
//                                 <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-green-50 transition-colors duration-200">
//                                   <div className="bg-green-100 p-2 rounded-lg">
//                                     <MapPin className="w-4 h-4 text-green-600" />
//                                   </div>
//                                   <div>
//                                     <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
//                                     <p className="font-semibold text-gray-900">{job.location}</p>
//                                   </div>
//                                 </div>
//                                 {job.salary && (
//                                   <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200">
//                                     <div className="bg-purple-100 p-2 rounded-lg">
//                                       <DollarSign className="w-4 h-4 text-purple-600" />
//                                     </div>
//                                     <div>
//                                       <p className="text-xs text-gray-500 uppercase tracking-wide">Salary</p>
//                                       <p className="font-semibold text-gray-900">{job.salary}</p>
//                                     </div>
//                                   </div>
//                                 )}
//                               </div>

//                               <div className="mb-6">
//                                 <p className="text-gray-700 leading-relaxed text-base">{job.description}</p>
//                               </div>

//                               {reqs.length > 0 && (
//                                 <div className="mb-6">
//                                   <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
//                                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                                     Requirements
//                                   </h4>
//                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                                     {reqs.map((req, idx) => (
//                                       <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
//                                         <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
//                                         <span className="text-blue-800 font-medium text-sm">{req}</span>
//                                       </div>
//                                     ))}
//                                   </div>
//                                 </div>
//                               )}

//                               <div className="border-t border-gray-100 pt-6">
//                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                                   <div className="flex items-center gap-2 text-sm">
//                                     <div className="bg-gray-100 p-2 rounded-lg">
//                                       <Clock className="w-4 h-4 text-gray-600" />
//                                     </div>
//                                     <div>
//                                       <p className="text-xs text-gray-500 uppercase tracking-wide">Posted</p>
//                                       <p className="font-semibold text-gray-900">{job.postedDate}</p>
//                                     </div>
//                                   </div>
//                                   <div className="flex items-center gap-2 text-sm">
//                                     <div className="bg-blue-100 p-2 rounded-lg">
//                                       <Eye className="w-4 h-4 text-blue-600" />
//                                     </div>
//                                     <div>
//                                       <p className="text-xs text-gray-500 uppercase tracking-wide">Views</p>
//                                       <p className="font-semibold text-gray-900">{job.views}</p>
//                                     </div>
//                                   </div>
//                                   <div className="flex items-center gap-2 text-sm">
//                                     <div className="bg-purple-100 p-2 rounded-lg">
//                                       <Users className="w-4 h-4 text-purple-600" />
//                                     </div>
//                                     <div>
//                                       <p className="text-xs text-gray-500 uppercase tracking-wide">Applicants</p>
//                                       <p className="font-semibold text-gray-900">{job.applied}</p>
//                                     </div>
//                                   </div>
//                                 </div>
//                                 <div className="mt-4 flex justify-end">
//                                   <button
//                                     className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
//                                     onClick={() => handleViewDetails(job.id)}
//                                   >
//                                     View Details
//                                   </button>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     )
//                   })}
//                 </div>
//               )}

//               {/* No Results */}
//               {jobs.length === 0 && (
//                 <div className="text-center py-12">
//                   <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
//                   <p className="text-gray-500">
//                     Try adjusting your search criteria or check back later for new postings.
//                   </p>
//                 </div>
//               )}
//             </>
//           ) : activeTab === "My Posts" ? (
//             // My Posts Content
//             <>
//               {/* My Posts Header */}
//               <div className="mb-8">
//                 <div className="flex justify-between items-start mb-6">
//                   <div>
//                     <h1 className="text-3xl font-bold text-gray-900 mb-2">My Job Postings</h1>
//                     <p className="text-gray-600">Manage your job and internship opportunities</p>
//                   </div>
//                   {/* Post Job button removed as requested */}
//                 </div>

//                 {/* Statistics Cards */}
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//                   <div className="bg-white rounded-lg border border-gray-200 p-6">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm font-medium text-gray-500 mb-1">Total Posts</p>
//                         <p className="text-3xl font-bold text-gray-900">{myJobs.length}</p>
//                       </div>
//                       <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
//                         <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M12 6v6m0 0v6m0-6h6m-6 0H6"
//                           />
//                         </svg>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="bg-white rounded-lg border border-gray-200 p-6">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm font-medium text-gray-500 mb-1">Active Posts</p>
//                         <p className="text-3xl font-bold text-green-600">
//                           {myJobs.filter((job) => job.status === "Approved").length}
//                         </p>
//                       </div>
//                       <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
//                         <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
//                           />
//                         </svg>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="bg-white rounded-lg border border-gray-200 p-6">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm font-medium text-gray-500 mb-1">Total Views</p>
//                         <p className="text-3xl font-bold text-purple-600">
//                           {myJobs.reduce((total, job) => total + (job.views || 0), 0)}
//                         </p>
//                       </div>
//                       <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
//                         <Eye className="w-6 h-6 text-purple-600" />
//                       </div>
//                     </div>
//                   </div>

//                   <div className="bg-white rounded-lg border border-gray-200 p-6">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm font-medium text-gray-500 mb-1">Applications</p>
//                         <p className="text-3xl font-bold text-orange-600">
//                           {myJobs.reduce((total, job) => total + (job.applied || 0), 0)}
//                         </p>
//                       </div>
//                       <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
//                         <Users className="w-6 h-6 text-orange-600" />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Search Bar */}
//               <div className="mb-8">
//                 <div className="flex gap-4">
//                   <div className="flex-1 relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                     <input
//                       type="text"
//                       placeholder="Search your posts, companies, or keywords..."
//                       value={myPostsSearchQuery}
//                       onChange={(e) => setMyPostsSearchQuery(e.target.value)}
//                       className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       style={{ height: "48px" }}
//                     />
//                   </div>
//                   <button
//                     className="h-12 px-6 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center text-gray-700"
//                     onClick={() => setMyPostsShowFilters(!myPostsShowFilters)}
//                   >
//                     <Filter className="w-4 h-4 mr-2" />
//                     Filters
//                   </button>
//                 </div>
//               </div>

//               {/* Filters Section */}
//               {myPostsShowFilters && (
//                 <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
//                   <div className="flex items-end gap-6">
//                     {/* Industry Filter */}
//                     <div className="flex-1">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
//                       <Select value={myPostsSelectedIndustry} onValueChange={setMyPostsSelectedIndustry}>
//                         <SelectTrigger className="w-full">
//                           <SelectValue placeholder="All Industries" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="All Industries">All Industries</SelectItem>
//                           {industries.map((industry) => (
//                             <SelectItem key={industry} value={industry}>
//                               {industry}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Job Type Filter */}
//                     <div className="flex-1">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
//                       <Select value={myPostsSelectedJobType} onValueChange={setMyPostsSelectedJobType}>
//                         <SelectTrigger className="w-full">
//                           <SelectValue placeholder="All Types" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {jobTypes.map((type) => (
//                             <SelectItem key={type} value={type}>
//                               {type}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Status Filter */}
//                     <div className="flex-1">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
//                       <Select value={myPostsStatusFilter} onValueChange={setMyPostsStatusFilter}>
//                         <SelectTrigger className="w-full">
//                           <SelectValue placeholder="All Status" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {statusOptions.map((status) => (
//                             <SelectItem key={status} value={status}>
//                               {status}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Location Filter */}
//                     <div className="flex-1">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
//                       <div className="relative">
//                         <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                         <input
//                           type="text"
//                           placeholder="Enter city or state"
//                           value={myPostsLocationQuery}
//                           onChange={(e) => setMyPostsLocationQuery(e.target.value)}
//                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         />
//                       </div>
//                     </div>

//                     {/* Remote Only Checkbox */}
//                     <div className="flex items-center space-x-2 pb-2">
//                       <Checkbox
//                         id="my-posts-remote-filter"
//                         checked={myPostsRemoteOnly}
//                         onCheckedChange={(checked) => setMyPostsRemoteOnly(checked === true)}
//                       />
//                       <label htmlFor="my-posts-remote-filter" className="text-sm text-gray-700 whitespace-nowrap">
//                         Remote only
//                       </label>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Results Summary */}
//               <div className="mb-6">
//                 <h2 className="text-xl font-bold text-gray-900 mb-2">
//                   Active Postings ({myJobs.filter((job) => job.status === "Approved").length})
//                 </h2>
//                 <p className="text-gray-600">{myJobs.length} total opportunities found</p>
//               </div>

//               {/* Featured User Posts */}
//               {featuredUserJobs.length > 0 && (
//                 <div className="mb-8">
//                   <div className="flex items-center mb-4">
//                     <Star className="w-5 h-5 text-yellow-500 mr-2" />
//                     <h3 className="text-lg font-semibold text-gray-900">Featured Posts</h3>
//                   </div>

//                   <div className="space-y-4">
//                     {featuredUserJobs.map((job) => (
//                       <div
//                         key={job.id}
//                         className="bg-white rounded-lg shadow-sm border-2 border-blue-100 p-6"
//                         style={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
//                       >
//                         <div className="flex items-start justify-between mb-4">
//                           <div className="flex items-start space-x-4">
//                             <img
//                               src={job.logo || "/placeholder.svg"}
//                               alt={`${job.company} logo`}
//                               className="w-12 h-12 rounded-lg object-cover bg-gray-200"
//                             />
//                             <div>
//                               <div className="flex items-center gap-2 mb-1">
//                                 <Star className="w-4 h-4 text-yellow-500" />
//                                 <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
//                                   Featured
//                                 </span>
//                               </div>
//                               <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
//                               <div className="flex items-center text-gray-600 mb-2">
//                                 <Building2 className="w-4 h-4 mr-1" />
//                                 <span>{job.company}</span>
//                               </div>
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             <span
//                               className={`text-xs px-2 py-1 rounded-full mb-2 inline-block ${job.status === "Approved"
//                                   ? "bg-green-100 text-green-800"
//                                   : job.status === "Pending Review"
//                                     ? "bg-yellow-100 text-yellow-800"
//                                     : job.status === "Draft"
//                                       ? "bg-gray-100 text-gray-800"
//                                       : "bg-red-100 text-red-800"
//                                 }`}
//                             >
//                               {job.status}
//                             </span>
//                             <div className="flex items-center text-green-600 font-semibold">
//                               <DollarSign className="w-4 h-4 mr-1" />
//                               <span>{job.salary}</span>
//                             </div>
//                           </div>
//                         </div>

//                         <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
//                           <div className="flex items-center">
//                             <MapPin className="w-4 h-4 mr-1" />
//                             <span>{job.location}</span>
//                           </div>
//                           <div className="flex items-center">
//                             <Calendar className="w-4 h-4 mr-1" />
//                             <span>Posted {job.postedDate}</span>
//                           </div>
//                         </div>

//                         <p className="text-gray-600 mb-4">{job.description}</p>

//                         <div className="flex flex-wrap gap-2 mb-4">
//                           {job.tags.map((tag, index) => (
//                             <span
//                               key={index}
//                               className={`px-2 py-1 text-xs rounded-full border ${index === 0
//                                   ? "bg-blue-100 text-blue-800 border-blue-200"
//                                   : "bg-gray-100 text-gray-700 border-gray-200"
//                                 }`}
//                             >
//                               {tag}
//                             </span>
//                           ))}
//                         </div>

//                         <div className="flex justify-between items-center">
//                           <div className="flex items-center gap-4 text-sm text-gray-500">
//                             <div className="flex items-center">
//                               <Eye className="w-4 h-4 mr-1" />
//                               <span>{job.views} views</span>
//                             </div>
//                             <div className="flex items-center">
//                               <Users className="w-4 h-4 mr-1" />
//                               <span>{job.applied} applied</span>
//                             </div>
//                           </div>
//                           <div className="flex space-x-2">
//                             <button
//                               className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
//                               onClick={() => console.log("Edit job", job.id)}
//                             >
//                               Edit
//                             </button>
//                             <button
//                               className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
//                               onClick={() => toggleApplicants(job.id)}
//                             >
//                               View Applicants
//                             </button>
//                             <button
//                               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
//                               onClick={() => handleViewDetails(job.id)}
//                             >
//                               View Details
//                             </button>
//                           </div>
//                         </div>

//                         {expandedApplicantsJobId === job.id && (
//                           <div className="mt-4 border-t border-gray-200 pt-4">
//                             <h4 className="text-sm font-semibold text-gray-900 mb-2">Applicants</h4>
//                             {!(applicantsByJob[job.id] && applicantsByJob[job.id].length) ? (
//                               <p className="text-gray-600 text-sm">No applications yet.</p>
//                             ) : (
//                               <div className="space-y-2">
//                                 {applicantsByJob[job.id].map((app: any) => (
//                                   <div key={app.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
//                                     <div className="flex items-center justify-between gap-3">
//                                       <div>
//                                         <p className="font-medium text-gray-900">{app.applicant_email}</p>
//                                         <p className="text-xs text-gray-600">Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : ''}</p>
//                                       </div>
//                                       <div className="flex items-center gap-2">
//                                         <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 capitalize">{app.status || 'applied'}</span>
//                                         <button
//                                           disabled={updatingAppId === app.id}
//                                           onClick={() => updateApplicationStatus(app.id, job.id, 'accepted')}
//                                           className={`text-xs px-3 py-1 rounded-md text-white ${updatingAppId === app.id ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'} transition-colors`}
//                                         >
//                                           Accept
//                                         </button>
//                                         <button
//                                           disabled={updatingAppId === app.id}
//                                           onClick={() => updateApplicationStatus(app.id, job.id, 'rejected')}
//                                           className={`text-xs px-3 py-1 rounded-md text-white ${updatingAppId === app.id ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
//                                         >
//                                           Reject
//                                         </button>
//                                       </div>
//                                     </div>
//                                     <div className="mt-2 text-sm">
//                                       {app.resume_url && (
//                                         <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resume</a>
//                                       )}
//                                     </div>
//                                     {app.cover_letter && (
//                                       <div className="mt-2 text-xs text-gray-700">
//                                         <span className="font-semibold">Cover Letter:</span> {String(app.cover_letter).length > 240 ? String(app.cover_letter).slice(0, 240) + '…' : app.cover_letter}
//                                       </div>
//                                     )}
//                                   </div>
//                                 ))}
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Regular User Posts */}
//               {regularUserJobs.length > 0 && (
//                 <div className="space-y-4">
//                   {regularUserJobs.map((job) => (
//                     <div
//                       key={job.id}
//                       className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
//                     >
//                       <div className="flex items-start justify-between mb-4">
//                         <div className="flex items-start space-x-4">
//                           <img
//                             src={job.logo || "/placeholder.svg"}
//                             alt={`${job.company} logo`}
//                             className="w-12 h-12 rounded-lg object-cover bg-gray-200"
//                           />
//                           <div>
//                             <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
//                             <div className="flex items-center text-gray-600 mb-2">
//                               <Building2 className="w-4 h-4 mr-1" />
//                               <span>{job.company}</span>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <span
//                             className={`text-xs px-2 py-1 rounded-full mb-2 inline-block ${job.status === "Approved"
//                                 ? "bg-green-100 text-green-800"
//                                 : job.status === "Pending Review"
//                                   ? "bg-yellow-100 text-yellow-800"
//                                   : job.status === "Draft"
//                                     ? "bg-gray-100 text-gray-800"
//                                     : "bg-red-100 text-red-800"
//                               }`}
//                           >
//                             {job.status}
//                           </span>
//                           <div className="flex items-center text-green-600 font-semibold">
//                             <DollarSign className="w-4 h-4 mr-1" />
//                             <span>{job.salary}</span>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
//                         <div className="flex items-center">
//                           <MapPin className="w-4 h-4 mr-1" />
//                           <span>{job.location}</span>
//                         </div>
//                         <div className="flex items-center">
//                           <Calendar className="w-4 h-4 mr-1" />
//                           <span>Posted {job.postedDate}</span>
//                         </div>
//                       </div>

//                       <p className="text-gray-600 mb-4">{job.description}</p>

//                       <div className="flex flex-wrap gap-2 mb-4">
//                         {job.tags.map((tag, index) => (
//                           <span
//                             key={index}
//                             className={`px-2 py-1 text-xs rounded-full border ${index === 0
//                                 ? "bg-blue-100 text-blue-800 border-blue-200"
//                                 : "bg-gray-100 text-gray-700 border-gray-200"
//                               }`}
//                           >
//                             {tag}
//                           </span>
//                         ))}
//                       </div>

//                       <div className="flex justify-between items-center">
//                         <div className="flex items-center gap-4 text-sm text-gray-500">
//                           <div className="flex items-center">
//                             <Eye className="w-4 h-4 mr-1" />
//                             <span>{job.views} views</span>
//                           </div>
//                           <div className="flex items-center">
//                             <Users className="w-4 h-4 mr-1" />
//                             <span>{job.applied} applied</span>
//                           </div>
//                         </div>
//                         <div className="flex space-x-2">
//                           <button
//                             className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
//                             onClick={() => console.log("Edit job", job.id)}
//                           >
//                             Edit
//                           </button>
//                           <button
//                             className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
//                             onClick={() => toggleApplicants(job.id)}
//                           >
//                             View Applicants
//                           </button>
//                           <button
//                             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
//                             onClick={() => handleViewDetails(job.id)}
//                           >
//                             View Details
//                           </button>
//                         </div>
//                       </div>

//                       {expandedApplicantsJobId === job.id && (
//                         <div className="mt-4 border-t border-gray-200 pt-4">
//                           <h4 className="text-sm font-semibold text-gray-900 mb-2">Applicants</h4>
//                           {!(applicantsByJob[job.id] && applicantsByJob[job.id].length) ? (
//                             <p className="text-gray-600 text-sm">No applications yet.</p>
//                           ) : (
//                             <div className="space-y-2">
//                               {applicantsByJob[job.id].map((app: any) => (
//                                 <div key={app.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
//                                   <div className="flex items-center justify-between gap-3">
//                                     <div>
//                                       <p className="font-medium text-gray-900">{app.applicant_email}</p>
//                                       <p className="text-xs text-gray-600">Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : ''}</p>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                       <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 capitalize">{app.status || 'applied'}</span>
//                                       <button
//                                         disabled={updatingAppId === app.id}
//                                         onClick={() => updateApplicationStatus(app.id, job.id, 'accepted')}
//                                         className={`text-xs px-3 py-1 rounded-md text-white ${updatingAppId === app.id ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'} transition-colors`}
//                                       >
//                                         Accept
//                                       </button>
//                                       <button
//                                         disabled={updatingAppId === app.id}
//                                         onClick={() => updateApplicationStatus(app.id, job.id, 'rejected')}
//                                         className={`text-xs px-3 py-1 rounded-md text-white ${updatingAppId === app.id ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
//                                       >
//                                         Reject
//                                       </button>
//                                     </div>
//                                   </div>
//                                   <div className="mt-2 text-sm">
//                                     {app.resume_url && (
//                                       <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resume</a>
//                                     )}
//                                   </div>
//                                   {app.cover_letter && (
//                                     <div className="mt-2 text-xs text-gray-700">
//                                       <span className="font-semibold">Cover Letter:</span> {String(app.cover_letter).length > 240 ? String(app.cover_letter).slice(0, 240) + '…' : app.cover_letter}
//                                     </div>
//                                   )}
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* No Results */}
//               {myJobs.length === 0 && (
//                 <div className="text-center py-12">
//                   <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
//                   <p className="text-gray-500 mb-4">
//                     {myJobs.length === 0
//                       ? "You haven't posted any jobs yet. Create your first job posting!"
//                       : "Try adjusting your search criteria to find your posts."}
//                   </p>
//                   {/* Post first job CTA removed as posting is not enabled here */}
//                 </div>
//               )}
//             </>
//           ) : (
//             // Post Job Content
//             <div className="max-w-4xl mx-auto">
//               <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
//                 <div className="mb-8">
//                   <h1 className="text-2xl font-bold text-gray-900 mb-2">Post a New Opportunity</h1>
//                   <p className="text-gray-600">
//                     Fill out the details below to create a compelling job or internship posting.
//                   </p>
//                 </div>

//                 {/* Drafts Section */}
//                 {drafts.length > 0 && (
//                   <div className="mb-8">
//                     <div className="flex items-center justify-between mb-4">
//                       <h2 className="text-lg font-semibold text-gray-900">Your Drafts ({drafts.length})</h2>
//                       <button
//                         type="button"
//                         onClick={() => setShowDrafts(!showDrafts)}
//                         className="text-blue-600 hover:text-blue-800 text-sm font-medium"
//                       >
//                         {showDrafts ? "Hide Drafts" : "Show Drafts"}
//                       </button>
//                     </div>

//                     {showDrafts && (
//                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
//                         {drafts.map((draft) => (
//                           <div
//                             key={draft.id}
//                             className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//                           >
//                             <div className="flex justify-between items-start mb-2">
//                               <h3 className="font-medium text-gray-900 truncate">{draft.title || "Untitled Draft"}</h3>
//                               <button
//                                 onClick={() => handleDeleteDraft(draft.id)}
//                                 className="text-red-500 hover:text-red-700 ml-2"
//                                 title="Delete draft"
//                               >
//                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth={2}
//                                     d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
//                                   />
//                                 </svg>
//                               </button>
//                             </div>
//                             <p className="text-sm text-gray-600 mb-2 truncate">
//                               {draft.companyName && `${draft.companyName} • `}
//                               {draft.location || "Location not specified"}
//                             </p>
//                             <p className="text-xs text-gray-500 mb-3">Saved {formatDate(draft.savedAt)}</p>
//                             <div className="flex space-x-2">
//                               <button
//                                 onClick={() => handleLoadDraft(draft)}
//                                 className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
//                               >
//                                 Load Draft
//                               </button>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 <form onSubmit={handleSubmit} className="space-y-6">
//                   {/* Steps Header */}
//                   <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
//                     <div className="flex items-center justify-between">
//                       {[{ id: 1, name: 'Basic Info', icon: <Briefcase className="w-4 h-4" /> }, { id: 2, name: 'Details', icon: <FileText className="w-4 h-4" /> }, { id: 3, name: 'Compensation', icon: <DollarSign className="w-4 h-4" /> }, { id: 4, name: 'Application', icon: <Link2 className="w-4 h-4" /> }].map((step, index) => (
//                         <div key={step.id} className="flex items-center">
//                           <div className="flex items-center space-x-3">
//                             <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeStep >= step.id ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
//                               {step.icon}
//                             </div>
//                             <div className="hidden md:block">
//                               <p className={`text-sm font-semibold ${activeStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>Step {step.id}</p>
//                               <p className={`text-xs ${activeStep >= step.id ? 'text-gray-600' : 'text-gray-400'}`}>{step.name}</p>
//                             </div>
//                           </div>
//                           {index < 3 && (
//                             <div className={`flex-1 h-0.5 mx-4 ${activeStep > step.id ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}`} />
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Step 1: Basic Info */}
//                   {activeStep === 1 && (
//                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
//                       <div>
//                         <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
//                         <p className="text-sm text-gray-500">Enter the core job details</p>
//                       </div>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">Job/Internship Title <span className="text-red-500">*</span></label>
//                           <input type="text" placeholder="e.g., Senior Software Engineer" value={formData.jobTitle} onChange={(e) => handleInputChange('jobTitle', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md" required />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">Company Name <span className="text-red-500">*</span></label>
//                           <input type="text" placeholder="e.g., TechCorp Inc." value={formData.companyName} onChange={(e) => handleInputChange('companyName', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md" required />
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
//                           <input type="text" placeholder="e.g., San Francisco, CA" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md" required />
//                         </div>
//                         <div className="flex items-center pt-8">
//                           <Checkbox id="remote" checked={formData.remoteAvailable} onCheckedChange={(checked) => handleInputChange('remoteAvailable', checked as boolean)} />
//                           <label htmlFor="remote" className="ml-2 text-sm text-gray-700">Remote work available</label>
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">Job Type <span className="text-red-500">*</span></label>
//                           <Select value={formData.jobType} onValueChange={(v) => handleInputChange('jobType', v)}>
//                             <SelectTrigger className="w-full"><SelectValue placeholder="Select job type" /></SelectTrigger>
//                             <SelectContent>
//                               {jobTypes.slice(1).map((t) => (
//                                 <SelectItem key={t} value={t}>{t}</SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">Industry <span className="text-red-500">*</span></label>
//                           <Select value={formData.industry} onValueChange={(v) => handleInputChange('industry', v)}>
//                             <SelectTrigger className="w-full"><SelectValue placeholder="Select industry" /></SelectTrigger>
//                             <SelectContent>
//                               {industries.map((ind) => (
//                                 <SelectItem key={ind} value={ind}>{ind}</SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                         </div>
//                       </div>
//                       <div className="flex justify-end pt-4 border-t border-gray-200">
//                         <button type="button" onClick={() => setActiveStep(2)} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl">Next: Details</button>
//                       </div>
//                     </div>
//                   )}

//                   {/* Step 2: Details */}
//                   {activeStep === 2 && (
//                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
//                       <div>
//                         <h2 className="text-lg font-bold text-gray-900">Job Details</h2>
//                         <p className="text-sm text-gray-500">Describe the role and requirements</p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Job Description <span className="text-red-500">*</span></label>
//                         <textarea placeholder="Provide a detailed description of the role..." value={formData.jobDescription} onChange={(e) => handleInputChange('jobDescription', e.target.value)} rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-md" required />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Key Responsibilities <span className="text-red-500">*</span></label>
//                         <textarea placeholder="List the main responsibilities..." value={formData.responsibilities} onChange={(e) => handleInputChange('responsibilities', e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-md" required />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Requirements/Qualifications <span className="text-red-500">*</span></label>
//                         <textarea placeholder="List required skills, experience, education..." value={formData.requirements} onChange={(e) => handleInputChange('requirements', e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-md" required />
//                       </div>
//                       <div className="flex justify-between pt-4 border-t border-gray-200">
//                         <button type="button" onClick={() => setActiveStep(1)} className="px-6 py-2.5 bg-gray-100 rounded-xl">Back</button>
//                         <button type="button" onClick={() => setActiveStep(3)} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl">Next: Compensation</button>
//                       </div>
//                     </div>
//                   )}

//                   {/* Step 3: Compensation */}
//                   {activeStep === 3 && (
//                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
//                       <div>
//                         <h2 className="text-lg font-bold text-gray-900">Compensation</h2>
//                         <p className="text-sm text-gray-500">Set salary range and currency (optional)</p>
//                       </div>
//                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                         <div>
//                           <input type="number" placeholder="Min" value={formData.salaryMin} onChange={(e) => handleInputChange('salaryMin', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md" />
//                         </div>
//                         <div>
//                           <input type="number" placeholder="Max" value={formData.salaryMax} onChange={(e) => handleInputChange('salaryMax', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md" />
//                         </div>
//                         <div>
//                           <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
//                             <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
//                             <SelectContent>{currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
//                           </Select>
//                         </div>
//                       </div>
//                       <div className="flex justify-between pt-4 border-t border-gray-200">
//                         <button type="button" onClick={() => setActiveStep(2)} className="px-6 py-2.5 bg-gray-100 rounded-xl">Back</button>
//                         <button type="button" onClick={() => setActiveStep(4)} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl">Next: Application</button>
//                       </div>
//                     </div>
//                   )}

//                   {/* Step 4: Application */}
//                   {activeStep === 4 && (
//                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
//                       <div>
//                         <h2 className="text-lg font-bold text-gray-900">Application</h2>
//                         <p className="text-sm text-gray-500">How should applicants apply?</p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
//                         <input type="date" value={formData.applicationDeadline} onChange={(e) => handleInputChange('applicationDeadline', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md" />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
//                         <input type="text" placeholder="Contact person name" value={formData.contactPerson} onChange={(e) => handleInputChange('contactPerson', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md" />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Application Method</label>
//                         <Select value={formData.applicationMethod} onValueChange={(v) => handleInputChange('applicationMethod', v)}>
//                           <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="company">Apply on company site</SelectItem>
//                             <SelectItem value="email">Apply via email</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Application URL or Email</label>
//                         <input type="text" placeholder="https://... or email@company.com" value={formData.applicationUrl} onChange={(e) => handleInputChange('applicationUrl', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md" />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Benefits & Tags</label>
//                         <textarea placeholder="Benefits, perks..." value={formData.benefits} onChange={(e) => handleInputChange('benefits', e.target.value)} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-md" />
//                         <input type="text" placeholder="Tags (comma separated)" value={formData.tags} onChange={(e) => handleInputChange('tags', e.target.value)} className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-md" />
//                       </div>

//                       {/* Status Messages */}
//                       {submitStatus === 'success' && (<div className="p-4 bg-green-50 border border-green-200 rounded-md"><p className="text-green-800">{successMessage}</p></div>)}
//                       {submitStatus === 'error' && (<div className="p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-red-800">{errorMessage}</p></div>)}

//                       <div className="flex justify-between pt-4 border-t border-gray-200">
//                         <button type="button" onClick={() => setActiveStep(3)} className="px-6 py-2.5 bg-gray-100 rounded-xl">Back</button>
//                         <div className="flex gap-4">
//                           <button type="button" onClick={handleSaveAsDraft} disabled={isDraftSaving} className="px-6 py-2.5 bg-gray-100 rounded-xl">{isDraftSaving ? 'Saving...' : 'Save as Draft'}</button>
//                           <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl">{isSubmitting ? 'Posting...' : 'Post Job'}</button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </form>
//               </div>
//             </div>
//           )}
//         </main>

//         {/* Job Details Modal */}
//         {selectedJob && (
//           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//             <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle className="text-xl font-bold">{selectedJob.title}</DialogTitle>
//               </DialogHeader>
//               <div className="space-y-4">
//                 <div className="flex items-center space-x-4">
//                   <img
//                     src={selectedJob.logo || "/placeholder.svg"}
//                     alt={`${selectedJob.company} logo`}
//                     className="w-16 h-16 rounded-lg object-cover bg-gray-200"
//                   />
//                   <div>
//                     <h3 className="text-lg font-semibold">{selectedJob.company}</h3>
//                     <div className="flex items-center text-gray-600">
//                       <MapPin className="w-4 h-4 mr-1" />
//                       <span>{selectedJob.location}</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex flex-wrap gap-2">
//                   {selectedJob.tags.map((tag, index) => (
//                     <span
//                       key={index}
//                       className={`px-2 py-1 text-xs rounded-full border ${index === 0
//                           ? "bg-blue-100 text-blue-800 border-blue-200"
//                           : "bg-gray-100 text-gray-700 border-gray-200"
//                         }`}
//                     >
//                       {tag}
//                     </span>
//                   ))}
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 text-sm">
//                   <div>
//                     <span className="font-medium text-gray-700">Posted:</span>
//                     <p className="text-gray-600">{selectedJob.postedDate}</p>
//                   </div>
//                   <div>
//                     <span className="font-medium text-gray-700">Salary:</span>
//                     <p className="text-gray-600">{selectedJob.salary}</p>
//                   </div>
//                   <div>
//                     <span className="font-medium text-gray-700">Views:</span>
//                     <p className="text-gray-600">{selectedJob.views}</p>
//                   </div>
//                   <div>
//                     <span className="font-medium text-gray-700">Applications:</span>
//                     <p className="text-gray-600">{selectedJob.applied}</p>
//                   </div>
//                 </div>

//                 <div>
//                   <h4 className="font-medium text-gray-700 mb-2">Description</h4>
//                   <p className="text-gray-600 leading-relaxed">{selectedJob.description}</p>
//                 </div>

//                 {/* Alumni are view-only: no apply/save actions */}
//               </div>
//             </DialogContent>
//           </Dialog>
//         )}
//       </div>
//     </AlumniNavigation>
//   )
// }

// export default AlumniJobBoard

"use client"
import { useState, useEffect } from "react"
import type React from "react"
import {
  Briefcase, Users, Building2, Calendar, MapPin, Eye, Search, Filter,
  DollarSign, FileText, Link2, Clock, ChevronRight, CheckCircle2,
  X, Edit3, Globe, Plus, Sparkles
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@auth0/nextjs-auth0/client"
import AlumniNavigation from "../AluminaNavigation/AlumniNavigation"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api"

type JobItem = {
  id: number; title: string; company: string; location: string;
  postedDate: string; description: string; salary: string;
  tags: string[]; views: number; applied: number; status: string;
  featured: boolean; jobType: string; industry: string; isRemote: boolean; postedBy?: string;
}

const industries = [
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

export default function AlumniJobBoard() {
  const { user, isLoading } = useUser()
  const { toast } = useToast()

  // Tabs & Navigation State
  const [activeTab, setActiveTab] = useState("Post Job")
  const [activeStep, setActiveStep] = useState(1)

  // Data States
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState("All Industries")
  const [selectedJobType, setSelectedJobType] = useState("All Types")
  const [locationQuery, setLocationQuery] = useState("")
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [myJobs, setMyJobs] = useState<JobItem[]>([])
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false)
  const [applicants, setApplicants] = useState<any[]>([])
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    jobTitle: "", companyName: "", location: "", remoteAvailable: false,
    jobType: "", industry: "", jobDescription: "", responsibilities: "",
    requirements: "", salaryMin: "", salaryMax: "", currency: "USD",
    applicationUrl: "", applicationDeadline: "", contactPerson: "", tags: "", applicationMethod: ""
  })

  // Safe Mapping Helper
  const mapJobData = (row: any): JobItem => ({
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : (row.tags ? String(row.tags).split(',') : []),
    postedDate: row.posted_date || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    jobType: row.job_type || row.jobType,
    salary: row.salary || `${row.currency || 'INR'} ${row.salary_min || 0} - ${row.salary_max || 0}`
  })

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs?status=Approved`)
      const data = await res.json()
      setJobs((data.jobs || []).map(mapJobData))
    } catch (e) { console.error("Fetch Error:", e) }
  }

  const fetchMyJobs = async () => {
    if (!user?.email) return
    try {
      const res = await fetch(`${API_BASE}/jobs?posted_by=${user.email}`)
      const data = await res.json()
      setMyJobs((data.jobs || []).map(mapJobData))
    } catch (e) { console.error("MyPosts Error:", e) }
  }

  const handleViewApplicants = async (job: JobItem) => {
    setSelectedJob(job)
    setIsApplicantModalOpen(true)
    setLoadingApplicants(true)
    try {
      const res = await fetch(`${API_BASE}/applications/by-job?job_id=${job.id}`)
      if (res.ok) {
        const data = await res.json()
        setApplicants(data.applications || [])
      } else {
        setApplicants([])
      }
    } catch (e) {
      console.error(e)
      setApplicants([])
    } finally {
      setLoadingApplicants(false)
    }
  }

  useEffect(() => {
    fetchJobs();
    if (user?.email) fetchMyJobs();
  }, [user?.email, activeTab])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const matchesBrowseFilters = (job: JobItem) => {
    if (selectedIndustry !== "All Industries" && job.industry !== selectedIndustry) return false
    if (selectedJobType !== "All Types" && job.jobType !== selectedJobType) return false
    if (locationQuery.trim() && !job.location.toLowerCase().includes(locationQuery.trim().toLowerCase())) return false
    if (remoteOnly && !job.isRemote) return false

    const searchableText = [
      job.title,
      job.company,
      job.location,
      job.description,
      job.salary,
      job.jobType,
      ...(job.tags || []),
    ]
      .join(" ")
      .toLowerCase()

    return !normalizedSearchQuery || searchableText.includes(normalizedSearchQuery)
  }

  const filteredJobs = jobs.filter(matchesBrowseFilters)
  const filteredMyJobs = myJobs.filter((job) => {
    if (!normalizedSearchQuery) return true
    const searchableText = [
      job.title,
      job.company,
      job.location,
      job.description,
      job.salary,
      job.jobType,
      ...(job.tags || []),
    ]
      .join(" ")
      .toLowerCase()

    return searchableText.includes(normalizedSearchQuery)
  })

  const clearBrowseFilters = () => {
    setSearchQuery("")
    setSelectedIndustry("All Industries")
    setSelectedJobType("All Types")
    setLocationQuery("")
    setRemoteOnly(false)
  }

  const handleSubmit = async () => {
    if (!formData.jobTitle || !formData.companyName) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields (*)", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: formData.jobTitle,
        company: formData.companyName,
        location: formData.location,
        description: formData.jobDescription,
        requirements: formData.requirements,
        salary_min: formData.salaryMin,
        salary_max: formData.salaryMax,
        currency: formData.currency,
        job_type: formData.jobType,
        industry: formData.industry,
        is_remote: formData.remoteAvailable,
        posted_by: user?.email,
        application_url: formData.applicationUrl,
        application_method: formData.applicationMethod,
        application_deadline: formData.applicationDeadline,
        contact_person: formData.contactPerson,
        tags: formData.tags ? formData.tags.split(',').map(s => s.trim()) : [],
        benefits: (formData as any).benefits || '',
        status: 'Pending Review'
      }

      const res = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title: "Job Posted!", description: "Your post is under review." })
        setActiveTab("My Posts")
        setFormData({ jobTitle: "", companyName: "", location: "", remoteAvailable: false, jobType: "", industry: "", jobDescription: "", responsibilities: "", requirements: "", salaryMin: "", salaryMax: "", currency: "USD", applicationUrl: "", applicationDeadline: "", contactPerson: "", tags: "", applicationMethod: "" })
        setActiveStep(1)
      } else {
        throw new Error("Failed to post")
      }
    } catch (e) {
      toast({ title: "Submission Failed", description: "Could not connect to the server.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Loading Portal...</div>

  return (
    <AlumniNavigation>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-purple-50 pb-12">

        <main className="max-w-7xl mx-auto px-6 py-10">

          {/* Hero Header */}
          <section className="bg-gradient-to-r from-[#e7eaff] to-[#eaddff] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[15px] mb-3">
                <Sparkles size={18} className="text-indigo-500" />
                <span>Jobs &amp; Internship Hub</span>
              </div>
              <h1 className="text-4xl md:text-[44px] font-extrabold text-[#1e293b] mb-4 tracking-tight leading-tight">
                Jobs &amp; Internship
              </h1>
              <p className="text-slate-600 text-[17px] font-medium opacity-90">
                Browse opportunities, publish openings, and manage your postings in one place.
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="relative z-10 flex gap-2 bg-white/40 p-2 rounded-2xl shadow-sm border border-white/60 backdrop-blur-md shrink-0 w-full md:w-auto justify-between md:justify-start">
              {[
                { label: "Browse Jobs", value: "Browse Jobs" },
                { label: "Post Job", value: "Post Job" },
                { label: "My Posts", value: "My Posts" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex-1 md:flex-none px-6 md:px-8 py-3.5 rounded-xl text-[15px] font-bold transition-all duration-300 ${activeTab === tab.value ? 'bg-white text-[#4F46E5] shadow-sm border border-white' : 'text-indigo-900/60 hover:text-indigo-900 hover:bg-white/40 border border-transparent'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {/* TAB: BROWSE JOBS */}
          {activeTab === "Browse Jobs" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-[2rem] border border-white shadow-xl shadow-blue-500/5">
                <div className="relative flex-1 group min-w-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all" />
                  <input
                    className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-12 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-medium placeholder:text-slate-400"
                    placeholder="Search roles, companies, or keywords..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    aria-label="Search jobs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`w-full sm:w-auto px-8 py-4 bg-white border rounded-2xl font-bold flex items-center justify-center gap-2 shrink-0 transition-colors ${showFilters ? "border-[#4F46E5] text-[#4F46E5]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                >
                  <Filter className="w-4 h-4" /> Filters
                </button>
              </div>

              {showFilters && (
                <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-[2rem] border border-white shadow-xl shadow-blue-500/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Industry</label>
                      <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                        <SelectTrigger className="w-full rounded-2xl border-slate-200 bg-white h-12 text-slate-900 font-semibold data-[placeholder]:text-slate-400 [&>svg]:text-slate-500">
                          <SelectValue placeholder="All Industries" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                          <SelectItem value="All Industries">All Industries</SelectItem>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry} className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">{industry}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Job Type</label>
                      <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                        <SelectTrigger className="w-full rounded-2xl border-slate-200 bg-white h-12 text-slate-900 font-semibold data-[placeholder]:text-slate-400 [&>svg]:text-slate-500">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                          <SelectItem value="All Types">All Types</SelectItem>
                          {jobTypes.slice(1).map((type) => (
                            <SelectItem key={type} value={type} className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={locationQuery}
                          onChange={(e) => setLocationQuery(e.target.value)}
                          placeholder="Enter city or state"
                          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-3 w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white cursor-pointer select-none">
                        <Checkbox checked={remoteOnly} onCheckedChange={(checked) => setRemoteOnly(checked === true)} />
                        <span className="text-sm font-bold text-slate-700">Remote only</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-slate-500">Showing filtered results for Browse Jobs.</p>
                    <button
                      type="button"
                      onClick={clearBrowseFilters}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-500">
                <p>{filteredJobs.length} result{filteredJobs.length === 1 ? "" : "s"} found</p>
                {(searchQuery || showFilters) && <button type="button" onClick={clearBrowseFilters} className="text-[#4F46E5] hover:text-indigo-700 font-bold">Clear search and filters</button>}
              </div>

              <div className="grid grid-cols-1 gap-8">
                {filteredJobs.length > 0 ? filteredJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 hover:shadow-xl transition-all border-white/40">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4 items-center">
                        <h3 className="text-2xl font-black text-slate-800">{job.title}</h3>
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-purple-50 text-purple-600 rounded-full border border-purple-100">
                          {job.jobType}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Building2 className="w-5 h-5 text-blue-500" /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Company</p><p className="font-bold text-slate-700">{job.company}</p></div>
                      </div>
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><MapPin className="w-5 h-5 text-emerald-500" /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Location</p><p className="font-bold text-slate-700">{job.location}</p></div>
                      </div>
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><DollarSign className="w-5 h-5 text-purple-500" /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Salary</p><p className="font-bold text-slate-700">{job.salary}</p></div>
                      </div>
                    </div>

                    <p className="text-slate-600 mb-6 font-medium leading-relaxed">{job.description}</p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {(job.tags || []).map((tag, i) => (
                        <span key={i} className="text-[11px] font-black px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl">#{tag}</span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                      <div className="flex gap-6 text-slate-400 font-bold text-xs">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Posted {job.postedDate}</span>
                        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {job.views} Views</span>
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {job.applied} Applied</span>
                      </div>
                      <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">View Details</button>
                    </div>
                  </div>
                )) : (
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 text-center">
                    <h3 className="text-2xl font-black text-slate-800 mb-2">No jobs found</h3>
                    <p className="text-slate-500 font-medium mb-6">Try a different keyword, company, or location.</p>
                    <button type="button" onClick={() => setSearchQuery("")} className="px-6 py-3 rounded-2xl bg-[#4F46E5] text-white font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-colors">
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: POST JOB */}
          {activeTab === "Post Job" && (
            <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white/40">
                <div className="mb-10 text-center">
                  <h1 className="text-3xl font-black text-slate-900 mb-2">Post a New Opportunity</h1>
                  <p className="text-slate-500 font-bold">Fill out the details below to create a compelling posting.</p>
                </div>

                <div className="flex justify-between items-center mb-12 relative px-4">
                  <div className="absolute top-6 left-0 w-full h-[2px] bg-slate-100 -z-10" />
                  {[
                    { s: 1, label: "Basic Info", icon: <Briefcase className="w-4 h-4" /> },
                    { s: 2, label: "Details", icon: <FileText className="w-4 h-4" /> },
                    { s: 3, label: "Compensation", icon: <DollarSign className="w-4 h-4" /> },
                    { s: 4, label: "Application", icon: <Link2 className="w-4 h-4" /> }
                  ].map((step) => (
                    <div key={step.s} className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-md transition-all ${activeStep >= step.s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                        }`}>
                        {step.icon}
                      </div>
                      <p className={`text-[10px] font-black uppercase ${activeStep >= step.s ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  {activeStep === 1 && (
                    <div className="space-y-8 animate-in fade-in">
                      <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Basic Information</h2>
                        <p className="text-sm font-medium text-slate-400">Enter the core job details</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Job/Internship Title <span className="text-red-500">*</span></label>
                          <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="e.g., Senior Software Engineer" value={formData.jobTitle} onChange={e => handleInputChange('jobTitle', e.target.value)} />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Company Name <span className="text-red-500">*</span></label>
                          <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="e.g., TechCorp Inc." value={formData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Location <span className="text-red-500">*</span></label>
                          <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="e.g., San Francisco, CA" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3 pt-8">
                          <Checkbox id="rem" checked={formData.remoteAvailable} onCheckedChange={v => handleInputChange('remoteAvailable', v)} />
                          <label htmlFor="rem" className="text-[14px] font-medium text-slate-500">Remote work available</label>
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Job Type <span className="text-red-500">*</span></label>
                          <Select value={formData.jobType} onValueChange={v => handleInputChange('jobType', v)}>
                            <SelectTrigger className="w-full px-5 py-6 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 font-medium"><SelectValue placeholder="Select job type" /></SelectTrigger>
                            <SelectContent className="bg-slate-50 border-slate-200 text-slate-900 rounded-[16px]">
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Full-time">Full-time</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Part-time">Part-time</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Internship (Paid)">Internship (Paid)</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Internship (Unpaid)">Internship (Unpaid)</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Contract">Contract</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Temporary">Temporary</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Volunteer">Volunteer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Industry <span className="text-red-500">*</span></label>
                          <Select value={formData.industry} onValueChange={v => handleInputChange('industry', v)}>
                            <SelectTrigger className="w-full px-5 py-6 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 font-medium"><SelectValue placeholder="Select industry" /></SelectTrigger>
                            <SelectContent className="bg-slate-50 border-slate-200 text-slate-900 rounded-[16px]">
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Technology">Technology</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Finance">Finance</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Healthcare">Healthcare</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Marketing">Marketing</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Consulting">Consulting</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Manufacturing">Manufacturing</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Education">Education</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Non-profit">Non-profit</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Government">Government</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Retail">Retail</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="Media">Media</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-8 animate-in fade-in">
                      <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Job Details</h2>
                        <p className="text-sm font-medium text-slate-400">Describe the role and requirements</p>
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[14px] font-bold text-slate-700">Job Description <span className="text-red-500">*</span></label>
                        <textarea rows={5} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="Provide a detailed description of the role..." value={formData.jobDescription} onChange={e => handleInputChange('jobDescription', e.target.value)} />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[14px] font-bold text-slate-700">Key Responsibilities <span className="text-red-500">*</span></label>
                        <textarea rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="List the main responsibilities..." value={formData.responsibilities} onChange={e => handleInputChange('responsibilities', e.target.value)} />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[14px] font-bold text-slate-700">Requirements/Qualifications <span className="text-red-500">*</span></label>
                        <textarea rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="List required skills, experience, education..." value={formData.requirements} onChange={e => handleInputChange('requirements', e.target.value)} />
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-8 animate-in fade-in">
                      <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Compensation</h2>
                        <p className="text-sm font-medium text-slate-400">Set salary range and currency (optional)</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Min Salary</label>
                          <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="e.g., 60000" value={formData.salaryMin} onChange={e => handleInputChange('salaryMin', e.target.value)} />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Max Salary</label>
                          <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="e.g., 120000" value={formData.salaryMax} onChange={e => handleInputChange('salaryMax', e.target.value)} />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Currency</label>
                          <Select value={formData.currency} onValueChange={v => handleInputChange('currency', v)}>
                            <SelectTrigger className="w-full px-5 py-6 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 font-medium"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-50 border-slate-200 text-slate-900 rounded-[16px]">
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="USD">USD</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="INR">INR</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 4 && (
                    <div className="space-y-8 animate-in fade-in">
                      <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Application</h2>
                        <p className="text-sm font-medium text-slate-400">How should applicants apply?</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Application Deadline</label>
                          <input type="date" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all " value={formData.applicationDeadline} onChange={e => handleInputChange('applicationDeadline', e.target.value)} />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Contact Person</label>
                          <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="Contact person name" value={formData.contactPerson} onChange={e => handleInputChange('contactPerson', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Application Method</label>
                          <Select value={formData.applicationMethod} onValueChange={v => handleInputChange('applicationMethod', v)}>
                            <SelectTrigger className="w-full px-5 py-6 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 font-medium"><SelectValue placeholder="e.g. Email or URL" /></SelectTrigger>
                            <SelectContent className="bg-slate-50 border-slate-200 text-slate-900 rounded-[16px]">
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="company">Apply on company site</SelectItem>
                              <SelectItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-slate-700" value="email">Apply via email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Application URL / Email <span className="text-red-500">*</span></label>
                          <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="e.g. hr@company.com" value={formData.applicationUrl} onChange={e => handleInputChange('applicationUrl', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Tags (comma separated)</label>
                          <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="e.g. React, Remote, Full Time" value={formData.tags} onChange={e => handleInputChange('tags', e.target.value)} />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[14px] font-bold text-slate-700">Benefits / Perks</label>
                          <textarea rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all" placeholder="List any benefits, health insurance..." value={(formData as any).benefits || ''} onChange={e => handleInputChange('benefits', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center px-2">
                  {activeStep > 1 ? (
                    <button onClick={() => setActiveStep(activeStep - 1)} className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-[14px] font-bold hover:bg-slate-200 transition-all">Back</button>
                  ) : <div />}
                  <button
                    onClick={() => activeStep < 4 ? setActiveStep(activeStep + 1) : handleSubmit()}
                    disabled={isSubmitting}
                    className="px-10 py-3.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-[14px] font-bold shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
                  >
                    {activeStep === 4 ? (isSubmitting ? "Posting..." : "Post Job") : "Next: Details"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MY POSTS */}
          {activeTab === "My Posts" && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Posts", val: myJobs.length, icon: <FileText className="text-blue-500" />, bg: "bg-blue-50", plus: true },
                  { label: "Active Posts", val: myJobs.filter(j => j.status === 'Approved').length, icon: <CheckCircle2 className="text-emerald-500" />, bg: "bg-emerald-50" },
                  { label: "Total Views", val: "0", icon: <Eye className="text-purple-500" />, bg: "bg-purple-50" },
                  { label: "Applications", val: "0", icon: <Users className="text-orange-500" />, bg: "bg-orange-50" }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-white shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center`}>{s.icon}</div>
                      <div><p className="text-[11px] font-black text-slate-400 uppercase">{s.label}</p><p className="text-3xl font-black text-slate-800">{s.val}</p></div>
                    </div>
                    {s.plus && <button onClick={() => setActiveTab("Post Job")} className="p-3 bg-blue-500 text-white rounded-xl shadow-lg"><Plus className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 ml-2">Your Job Postings</h3>
                {filteredMyJobs.map(job => (
                  <div key={job.id} className="bg-white/70 backdrop-blur-md p-8 rounded-[2.5rem] border border-white flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-400">{job.company.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-xl font-black text-slate-800">{job.title}</h4>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100 capitalize">{job.status}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-500 flex items-center gap-2"><Building2 className="w-4 h-4" /> {job.company} • <Calendar className="w-4 h-4" /> Posted {job.postedDate}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black">Edit</button>
                      <button onClick={() => handleViewApplicants(job)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black">Applicants</button>
                      <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/20">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-10 border-none">
          {selectedJob && (
            <div className="space-y-6 animate-in fade-in">
              <DialogTitle className="sr-only">Job details</DialogTitle>
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100"><Building2 className="w-10 h-10 text-slate-300" /></div>
              <div>
                <h2 className="text-3xl font-black text-slate-900">{selectedJob.title}</h2>
                <p className="text-lg text-slate-500 font-bold">{selectedJob.company} • {selectedJob.location}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Salary Range</p><p className="text-xl font-black text-emerald-600">{selectedJob.salary}</p></div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Job Type</p><p className="text-xl font-black text-slate-800">{selectedJob.jobType}</p></div>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">About the role</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{selectedJob.description}</p>
              </div>
              {/* Removed Apply Now Button, kept only View Logic above */}
              {selectedJob.postedBy === user?.email && (
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Registered Applicants ({selectedJob.applied || 0})</h4>
                  <button onClick={() => {setIsModalOpen(false); handleViewApplicants(selectedJob);}} className="text-sm text-blue-500 font-bold flex items-center gap-2 hover:text-blue-600 tracking-wide transition-all">View Full Applicant List <ChevronRight className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isApplicantModalOpen} onOpenChange={setIsApplicantModalOpen}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-10 border-none bg-white">
          {selectedJob && (
            <div className="space-y-6 animate-in fade-in">
              <DialogTitle className="sr-only">Applicants list</DialogTitle>
              <div>
                <h2 className="text-3xl font-black text-slate-900">Applicants</h2>
                <p className="text-lg text-slate-500 font-bold">{selectedJob.title} @{selectedJob.company}</p>
              </div>
              
              {loadingApplicants ? (
                <div className="py-20 flex justify-center text-slate-400 font-bold animate-pulse">Loading Applicants...</div>
              ) : applicants.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <Users className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="font-bold text-lg">No one has applied yet.</p>
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {applicants.map((app) => (
                    <div key={app.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                           {app.applicant_email.charAt(0).toUpperCase()}
                         </div>
                         <div>
                           <p className="font-bold text-slate-800">{app.applicant_email}</p>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'applied' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>{app.status}</span>
                         {app.resume_url && (
                           <a 
                             href={app.resume_url.startsWith('http') ? app.resume_url : `${API_BASE.replace('/api', '')}${app.resume_url.startsWith('/') ? '' : '/'}${app.resume_url}`} 
                             target="_blank" 
                             rel="noreferrer" 
                             className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 text-sm hover:scale-105 transition-all"
                           >
                             Resume
                           </a>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AlumniNavigation>
  )
}
