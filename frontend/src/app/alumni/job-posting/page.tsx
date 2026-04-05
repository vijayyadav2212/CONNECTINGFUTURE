"use client"
import { useState, useEffect } from "react"
import type React from "react"
import {
  Briefcase, Users, Building2, Calendar, MapPin, Eye, Search, Filter,
  DollarSign, FileText, Link2, Clock, ChevronRight, CheckCircle2,
  X, Edit3, Globe, Plus, AlertTriangle, Bookmark, BookmarkCheck, CheckCircle, Loader2, RefreshCw, TrendingUp, Building, ExternalLink
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@auth0/nextjs-auth0/client"
import AlumniNavigation from "../AluminaNavigation/AlumniNavigation"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api"

type JobItem = {
  id: number; title: string; company: string; location: string;
  postedDate: string; description: string; salary: string;
  tags: string[]; views: number; applied: number; status: string;
  featured: boolean; jobType: string; isRemote: boolean; postedBy?: string; industry?: string;
}

type ExternalJob = {
  job_id: string
  title: string
  company: string
  location: string
  apply_link: string
  employment_type: string
  salary: string
  posted_date: string | null
  logo_url?: string | null
  source?: string
  view_count?: number
  apply_click_count?: number
  applied_confirm_count?: number
  application_response_count?: number
}

type JobSearchSettings = {
  role: string
  location: string
  employment_type: string
}

const EXTERNAL_BOOKMARK_STORAGE_KEY = "alumni-external-job-bookmarks"
const EXTERNAL_PENDING_APPLY_KEY = "alumni-external-job-pending-apply"
const DEFAULT_EXTERNAL_SETTINGS: JobSearchSettings = {
  role: "",
  location: "",
  employment_type: "All Types",
}

const EXTERNAL_JOB_TYPE_OPTIONS = ["All Types", "Full-time", "Part-time", "Contract", "Internship", "Temporary", "Remote"]

function formatExternalDate(value: string | null) {
  if (!value) return "Recently posted"
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return "Recently posted"
  return dt.toLocaleDateString()
}

function buildExternalJobsUrl(filters: JobSearchSettings, refresh = false) {
  const params = new URLSearchParams()
  params.set("source", "external")
  if (filters.role && filters.role.trim()) {
    params.set("role", filters.role.trim())
  }
  if (filters.location && filters.location.trim()) {
    params.set("location", filters.location.trim())
  }
  if (filters.employment_type && filters.employment_type !== "All Types") {
    params.set("employment_type", filters.employment_type)
  }
  if (refresh) params.set("refresh", "true")
  return `${API_BASE}/jobs?${params.toString()}`
}

export default function AlumniJobBoard() {
  const { user, isLoading } = useUser()
  const { toast } = useToast()

  // Tabs & Navigation State
  const [activeTab, setActiveTab] = useState("Post Job")
  const [browseSection, setBrowseSection] = useState<"portal" | "external">("portal")
  const [activeStep, setActiveStep] = useState(1)

  // Data States
  const [searchQuery, setSearchQuery] = useState("")
  const [showBrowseFilters, setShowBrowseFilters] = useState(false)
  const [browseIndustry, setBrowseIndustry] = useState("all")
  const [browseJobType, setBrowseJobType] = useState("all")
  const [browseRemoteOnly, setBrowseRemoteOnly] = useState(false)
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [myJobs, setMyJobs] = useState<JobItem[]>([])
  const [appliedPortalJobIds, setAppliedPortalJobIds] = useState<Set<number>>(new Set())
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyJob, setApplyJob] = useState<JobItem | null>(null)
  const [resumeUrl, setResumeUrl] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [applySubmitting, setApplySubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([])
  const [analyticsJobs, setAnalyticsJobs] = useState<ExternalJob[]>([])
  const [externalBookmarkedIds, setExternalBookmarkedIds] = useState<string[]>([])
  const [externalLoading, setExternalLoading] = useState(true)
  const [externalRefreshing, setExternalRefreshing] = useState(false)
  const [externalError, setExternalError] = useState<string | null>(null)
  const [externalFilters, setExternalFilters] = useState<JobSearchSettings>(DEFAULT_EXTERNAL_SETTINGS)
  const [externalApplyPromptOpen, setExternalApplyPromptOpen] = useState(false)
  const [externalApplyPromptJob, setExternalApplyPromptJob] = useState<ExternalJob | null>(null)
  const [submittingExternalFeedback, setSubmittingExternalFeedback] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditSuccessOpen, setIsEditSuccessOpen] = useState(false)
  const [editingJobId, setEditingJobId] = useState<number | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
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

  const [editFormData, setEditFormData] = useState({
    jobTitle: "", companyName: "", location: "", remoteAvailable: false,
    jobType: "", industry: "", jobDescription: "", responsibilities: "",
    requirements: "", salaryMin: "", salaryMax: "", currency: "USD",
    applicationUrl: "", applicationDeadline: "", contactPerson: "", tags: "", applicationMethod: "", benefits: ""
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

  const fetchMyPortalApplications = async () => {
    if (!user?.email) return
    try {
      const res = await fetch(`${API_BASE}/applications?applicant_email=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      const ids = new Set<number>()
      ;(data.applications || []).forEach((a: any) => ids.add(Number(a.job_id)))
      setAppliedPortalJobIds(ids)
    } catch {
      // no-op
    }
  }

  const fetchExternalAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs/external/analytics/summary`, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(data.jobs)) setAnalyticsJobs(data.jobs)
      else setAnalyticsJobs([])
    } catch {
      setAnalyticsJobs([])
    }
  }

  const fetchExternalJobs = async (next: JobSearchSettings, refresh = false) => {
    try {
      refresh ? setExternalRefreshing(true) : setExternalLoading(true)
      setExternalError(null)
      const res = await fetch(buildExternalJobsUrl(next, refresh), { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to fetch external jobs")
      setExternalJobs(Array.isArray(data.jobs) ? data.jobs : [])
      void fetchExternalAnalytics()
    } catch (e: any) {
      setExternalJobs([])
      const msg = String(e?.message || "Failed to fetch external jobs")
      if (msg.toLowerCase().includes("not subscribed")) {
        setExternalError("RapidAPI JSearch is not subscribed for this key. Subscribe on RapidAPI, then refresh this page.")
      } else {
        setExternalError(msg)
      }
    } finally {
      setExternalLoading(false)
      setExternalRefreshing(false)
    }
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
    if (user?.email) fetchMyPortalApplications();
    if (activeTab === "Browse Jobs") {
      void fetchExternalJobs(externalFilters, false)
      void fetchExternalAnalytics()
    }
  }, [user?.email, activeTab])

  const openPortalApplyForm = (job: JobItem) => {
    if (appliedPortalJobIds.has(job.id)) return
    setApplyJob(job)
    setResumeUrl("")
    setCoverLetter("")
    setUploadedFileName(null)
    setApplyOpen(true)
  }

  const submitPortalApplication = async () => {
    if (!user?.email || !applyJob) return
    setApplySubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/jobs/${applyJob.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_email: user.email, resume_url: resumeUrl || null, cover_letter: coverLetter || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Apply failed")
      setAppliedPortalJobIds(prev => new Set(prev).add(applyJob.id))
      setJobs(prev => prev.map(j => j.id === applyJob.id ? { ...j, applied: Number(j.applied || 0) + 1 } : j))
      setApplyOpen(false)
      setApplyJob(null)
      setResumeUrl("")
      setCoverLetter("")
      setUploadedFileName(null)
      toast({ title: "Application submitted", description: `${applyJob.title} at ${applyJob.company}` })
    } catch (e: any) {
      toast({ title: "Application failed", description: e?.message || "Please try again", variant: "destructive" })
    } finally {
      setApplySubmitting(false)
    }
  }

  const handlePortalResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only PDF, DOC, DOCX allowed", variant: "destructive" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 10MB", variant: "destructive" })
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("resume", file)
      const res = await fetch(`${API_BASE}/uploads/resume`, { method: "POST", body: fd })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`Upload failed (${res.status}) ${text}`)
      }
      const data = await res.json()
      setResumeUrl(data.url)
      setUploadedFileName(file.name)
      toast({ title: "Resume uploaded", description: file.name })
    } catch (err: any) {
      toast({ title: "Upload error", description: err?.message || "Please try again", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(EXTERNAL_BOOKMARK_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setExternalBookmarkedIds(parsed.map(String))
      }
    } catch {
      setExternalBookmarkedIds([])
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(EXTERNAL_BOOKMARK_STORAGE_KEY, JSON.stringify(externalBookmarkedIds))
  }, [externalBookmarkedIds])

  useEffect(() => {
    const tryOpenPendingPrompt = () => {
      if (!user?.email || externalApplyPromptOpen) return
      try {
        const raw = window.localStorage.getItem(EXTERNAL_PENDING_APPLY_KEY)
        if (!raw) return
        const pending = JSON.parse(raw)
        if (!pending || pending.user_email !== user.email || !pending.job) return
        const startedAt = Number(pending.started_at || 0)
        if (startedAt && Date.now() - startedAt > 1000 * 60 * 60 * 24) {
          window.localStorage.removeItem(EXTERNAL_PENDING_APPLY_KEY)
          return
        }
        setExternalApplyPromptJob(pending.job as ExternalJob)
        setExternalApplyPromptOpen(true)
        window.localStorage.removeItem(EXTERNAL_PENDING_APPLY_KEY)
      } catch {
        window.localStorage.removeItem(EXTERNAL_PENDING_APPLY_KEY)
      }
    }

    const onFocus = () => setTimeout(tryOpenPendingPrompt, 150)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") setTimeout(tryOpenPendingPrompt, 150)
    }

    tryOpenPendingPrompt()
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [user?.email, externalApplyPromptOpen])

  const toggleExternalBookmark = (jobId: string) => {
    setExternalBookmarkedIds(curr => (curr.includes(jobId) ? curr.filter(id => id !== jobId) : [...curr, jobId]))
  }

  const bookmarkedExternalJobs = externalJobs.filter(j => externalBookmarkedIds.includes(j.job_id))

  const submitExternalApplicationFeedback = async (applied: boolean) => {
    if (!externalApplyPromptJob || !user?.email) {
      setExternalApplyPromptOpen(false)
      setExternalApplyPromptJob(null)
      return
    }
    setSubmittingExternalFeedback(true)
    try {
      await fetch(`${API_BASE}/jobs/external/${encodeURIComponent(externalApplyPromptJob.job_id)}/application-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: externalApplyPromptJob,
          applied,
          user_email: user.email,
          user_name: user.name || user.email,
          source_page: "alumni-job-posting",
        }),
      })
      if (applied) {
        toast({ title: "Application tracked", description: "Thanks. Your application was counted for analytics." })
      }
      void fetchExternalAnalytics()
    } catch {
      // no-op
    } finally {
      setSubmittingExternalFeedback(false)
      setExternalApplyPromptOpen(false)
      setExternalApplyPromptJob(null)
    }
  }

  const handleExternalApply = async (job: ExternalJob) => {
    const openedAt = Date.now()
    const win = window.open(job.apply_link, "_blank", "noopener,noreferrer")

    if (user?.email) {
      try {
        window.localStorage.setItem(EXTERNAL_PENDING_APPLY_KEY, JSON.stringify({
          job,
          user_email: user.email,
          started_at: openedAt,
        }))
      } catch {
        // no-op
      }

      const onReturnFocus = () => {
        if (Date.now() - openedAt < 1200) return
        window.removeEventListener("focus", onReturnFocus)
        setExternalApplyPromptJob(job)
        setExternalApplyPromptOpen(true)
        window.localStorage.removeItem(EXTERNAL_PENDING_APPLY_KEY)
      }
      window.addEventListener("focus", onReturnFocus)
    }

    try {
      await fetch(`${API_BASE}/jobs/external/${encodeURIComponent(job.job_id)}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      })
      void fetchExternalAnalytics()
    } catch {
      // no-op
    }
    if (!win) window.location.href = job.apply_link
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
  }

  const openEditModal = (job: any) => {
    setEditingJobId(Number(job.id))
    setEditFormData({
      jobTitle: String(job.title || ""),
      companyName: String(job.company || ""),
      location: String(job.location || ""),
      remoteAvailable: !!(job.is_remote ?? job.isRemote),
      jobType: String(job.job_type || job.jobType || ""),
      industry: String(job.industry || ""),
      jobDescription: String(job.description || ""),
      responsibilities: String(job.responsibilities || ""),
      requirements: String(job.requirements || ""),
      salaryMin: String(job.salary_min ?? ""),
      salaryMax: String(job.salary_max ?? ""),
      currency: String(job.currency || "USD"),
      applicationUrl: String(job.application_url || ""),
      applicationDeadline: String(job.application_deadline || "").slice(0, 10),
      contactPerson: String(job.contact_person || ""),
      tags: Array.isArray(job.tags) ? job.tags.join(", ") : String(job.tags || ""),
      applicationMethod: String(job.application_method || ""),
      benefits: String(job.benefits || "")
    })
    setIsEditModalOpen(true)
  }

  const saveEditedJob = async () => {
    if (!editingJobId) return
    if (!editFormData.jobTitle.trim() || !editFormData.companyName.trim() || !editFormData.location.trim()) {
      toast({ title: "Missing fields", description: "Please fill title, company, and location.", variant: "destructive" })
      return
    }

    setIsSavingEdit(true)
    try {
      const payload = {
        title: editFormData.jobTitle.trim(),
        company: editFormData.companyName.trim(),
        location: editFormData.location.trim(),
        description: editFormData.jobDescription,
        responsibilities: editFormData.responsibilities,
        requirements: editFormData.requirements,
        benefits: editFormData.benefits,
        salary_min: editFormData.salaryMin || null,
        salary_max: editFormData.salaryMax || null,
        currency: editFormData.currency || null,
        tags: editFormData.tags ? editFormData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
        industry: editFormData.industry,
        job_type: editFormData.jobType,
        is_remote: !!editFormData.remoteAvailable,
        application_deadline: editFormData.applicationDeadline || null,
        contact_person: editFormData.contactPerson || null,
        application_method: editFormData.applicationMethod || null,
        application_url: editFormData.applicationUrl || null
      }

      const res = await fetch(`${API_BASE}/jobs/${editingJobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to update job")

      toast({ title: "Job updated", description: "Your changes were saved successfully." })
      setIsEditModalOpen(false)
      setIsEditSuccessOpen(true)
      setEditingJobId(null)
      await fetchMyJobs()
      if (activeTab === "Browse Jobs") await fetchJobs()
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || "Could not update this job.", variant: "destructive" })
    } finally {
      setIsSavingEdit(false)
    }
  }

  const postJobSteps = [
    { s: 1, label: "Basic Info", title: "Basic Information", hint: "Role, company, location, type, and industry" },
    { s: 2, label: "Details", title: "Job Details", hint: "Description, responsibilities, and requirements" },
    { s: 3, label: "Compensation", title: "Compensation", hint: "Salary range and currency" },
    { s: 4, label: "Application", title: "Application", hint: "How candidates can apply" }
  ]

  const requiredFieldsByStep: Record<number, Array<{ key: string; label: string }>> = {
    1: [
      { key: "jobTitle", label: "Job/Internship Title" },
      { key: "companyName", label: "Company Name" },
      { key: "location", label: "Location" },
      { key: "jobType", label: "Job Type" },
      { key: "industry", label: "Industry" }
    ],
    2: [
      { key: "jobDescription", label: "Job Description" },
      { key: "responsibilities", label: "Key Responsibilities" },
      { key: "requirements", label: "Requirements/Qualifications" }
    ],
    3: [],
    4: [
      { key: "applicationMethod", label: "Application Method" },
      { key: "applicationUrl", label: "Application URL / Email" }
    ]
  }

  const getMissingFieldsForStep = (step: number) => {
    const rules = requiredFieldsByStep[step] || []
    return rules.filter(({ key }) => {
      const value = (formData as any)[key]
      return typeof value === "string" ? !value.trim() : !value
    })
  }

  const goToNextStep = () => {
    const missing = getMissingFieldsForStep(activeStep)
    if (missing.length > 0) {
      toast({
        title: "Complete this step",
        description: `Please fill: ${missing.map(f => f.label).join(", ")}`,
        variant: "destructive"
      })
      return
    }
    setActiveStep(prev => Math.min(prev + 1, 4))
  }

  const handleSubmit = async () => {
    const allMissing = [1, 2, 4].flatMap(step => getMissingFieldsForStep(step).map(f => f.label))
    if (allMissing.length > 0) {
      toast({ title: "Missing Fields", description: `Please complete: ${allMissing.join(", ")}`, variant: "destructive" })
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

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Loading Portal...</h2>
            <p className="text-base text-gray-600 font-medium">Getting your job board ready</p>
          </div>
        </div>
      </div>
    )
  }

  const availableIndustries = Array.from(
    new Set(jobs.map((job) => String(job.industry || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))

  const availableJobTypes = Array.from(
    new Set(jobs.map((job) => String(job.jobType || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q || (
      String(job.title || "").toLowerCase().includes(q) ||
      String(job.company || "").toLowerCase().includes(q) ||
      String(job.location || "").toLowerCase().includes(q) ||
      String(job.description || "").toLowerCase().includes(q) ||
      (job.tags || []).some((tag) => String(tag).toLowerCase().includes(q))
    )

    const matchesIndustry = browseIndustry === "all" || String(job.industry || "").toLowerCase() === browseIndustry.toLowerCase()
    const matchesJobType = browseJobType === "all" || String(job.jobType || "").toLowerCase() === browseJobType.toLowerCase()
    const matchesRemote = !browseRemoteOnly || !!job.isRemote

    return matchesSearch && matchesIndustry && matchesJobType && matchesRemote
  })

  const formatPostedDate = (value?: string) => {
    const d = value ? new Date(value) : null
    if (!d || Number.isNaN(d.getTime())) return value || "-"
    return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })
  }

  const formatPostedTime = (value?: string) => {
    const d = value ? new Date(value) : null
    if (!d || Number.isNaN(d.getTime())) return ""
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <AlumniNavigation>
      <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col font-sans mb-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#e7eaff] to-[#eaddff] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-8 mb-2">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[15px] mb-3">
              <Briefcase size={18} className="text-indigo-500" />
              <span>Explore Opportunities</span>
            </div>
            <h1 className="text-4xl md:text-[44px] font-extrabold text-[#1e293b] mb-4 tracking-tight leading-tight">
              Jobs & Internship
            </h1>
            <p className="text-slate-600 text-[17px] font-medium opacity-90">
              Browse opportunities, publish openings, and manage your postings in one place.
            </p>
          </div>

          {/* Tab Container */}
          <div className="relative z-10 flex gap-2 bg-white/40 p-2 rounded-2xl shadow-sm border border-white/60 backdrop-blur-md shrink-0">
            {["Browse Jobs", "Post Job", "My Posts"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl text-[15px] font-bold transition-all duration-300 ${
                  activeTab === tab 
                    ? "bg-white text-[#4F46E5] shadow-sm border border-white" 
                    : "text-indigo-900/60 hover:text-indigo-900 hover:bg-white/40 border border-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TAB: BROWSE JOBS */}
        {activeTab === "Browse Jobs" && (
          <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white/50 backdrop-blur-sm p-4 rounded-[2rem] border border-white shadow-xl shadow-blue-500/5">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all" />
                    <input
                      className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-12 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-medium"
                      placeholder="Search roles, companies, location, or tags..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery.trim().length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBrowseFilters((prev) => !prev)}
                    className="sm:w-auto w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <Filter className="w-4 h-4" /> Filters
                  </button>
                </div>
                {showBrowseFilters ? (
                  <div className="mt-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Industry</label>
                        <Select value={browseIndustry} onValueChange={setBrowseIndustry}>
                          <SelectTrigger className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium [&>span]:text-slate-900">
                            <SelectValue className="text-slate-900" placeholder="All industries" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 rounded-xl text-slate-900 shadow-xl">
                            <SelectItem className="text-slate-800 focus:text-slate-900 focus:bg-slate-100 cursor-pointer" value="all">All industries</SelectItem>
                            {availableIndustries.map((industry) => (
                              <SelectItem className="text-slate-800 focus:text-slate-900 focus:bg-slate-100 cursor-pointer" key={industry} value={industry}>{industry}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Job Type</label>
                        <Select value={browseJobType} onValueChange={setBrowseJobType}>
                          <SelectTrigger className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium [&>span]:text-slate-900">
                            <SelectValue className="text-slate-900" placeholder="All job types" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 rounded-xl text-slate-900 shadow-xl">
                            <SelectItem className="text-slate-800 focus:text-slate-900 focus:bg-slate-100 cursor-pointer" value="all">All job types</SelectItem>
                            {availableJobTypes.map((jobType) => (
                              <SelectItem className="text-slate-800 focus:text-slate-900 focus:bg-slate-100 cursor-pointer" key={jobType} value={jobType}>{jobType}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <label className="w-full h-[42px] px-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 cursor-pointer">
                          <Checkbox checked={browseRemoteOnly} onCheckedChange={(checked) => setBrowseRemoteOnly(checked === true)} />
                          <span className="text-sm font-semibold text-slate-700">Remote only</span>
                        </label>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            setBrowseIndustry("all")
                            setBrowseJobType("all")
                            setBrowseRemoteOnly(false)
                          }}
                          className="w-full h-[42px] px-4 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 px-1 flex items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm font-semibold text-slate-500">
                    Showing {filteredJobs.length} of {jobs.length} jobs
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {searchQuery.trim() ? (
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        Search: {searchQuery.trim()}
                      </span>
                    ) : null}
                    {browseIndustry !== "all" ? <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Industry: {browseIndustry}</span> : null}
                    {browseJobType !== "all" ? <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Type: {browseJobType}</span> : null}
                    {browseRemoteOnly ? <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Remote only</span> : null}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="inline-flex w-full sm:w-auto p-1 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setBrowseSection("portal")}
                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${browseSection === "portal" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    Portal Jobs
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrowseSection("external")}
                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${browseSection === "external" ? "bg-rose-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    External Jobs
                  </button>
                </div>
              </div>

              {browseSection === "portal" && (
                <>
                  <div className="mb-4">
                    <h2 className="text-2xl font-extrabold text-slate-900">Portal Jobs</h2>
                    <p className="text-sm text-slate-500">Jobs posted directly on the platform.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 hover:shadow-xl transition-all border-white/40">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-3 md:gap-4 items-center flex-wrap">
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">{job.title}</h3>
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-purple-50 text-purple-600 rounded-full border border-purple-100">
                          {job.jobType}
                        </span>
                        {job.isRemote ? (
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            Remote
                          </span>
                        ) : null}
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

                    <p className="text-slate-600 mb-6 font-medium leading-relaxed text-sm md:text-[15px] line-clamp-3">{job.description}</p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {(job.tags || []).map((tag, i) => (
                        <span key={i} className="text-[11px] font-black px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl">#{tag}</span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                      <div className="flex flex-wrap gap-4 md:gap-6 text-slate-400 font-bold text-xs">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Posted {job.postedDate}</span>
                        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {job.views} Views</span>
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {job.applied} Applied</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="px-5 md:px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition-all whitespace-nowrap">View Details</button>
                        <button
                          onClick={() => openPortalApplyForm(job)}
                          disabled={appliedPortalJobIds.has(job.id) || String(job.postedBy || "").toLowerCase() === String(user?.email || "").toLowerCase()}
                          className={`px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 whitespace-nowrap ${appliedPortalJobIds.has(job.id)
                            ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                            : String(job.postedBy || "").toLowerCase() === String(user?.email || "").toLowerCase()
                              ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:shadow-xl transform hover:scale-105"
                            }`}
                        >
                          {String(job.postedBy || "").toLowerCase() === String(user?.email || "").toLowerCase()
                            ? "Your Post"
                            : appliedPortalJobIds.has(job.id)
                                ? "Applied"
                                : "Apply Now"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredJobs.length === 0 ? (
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 mx-auto flex items-center justify-center mb-4">
                      <Briefcase className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-lg font-bold text-slate-800">No jobs found</p>
                    <p className="text-sm text-slate-500 mt-1">Try a different keyword, company name, location, or clear your search.</p>
                    {searchQuery.trim() ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                      >
                        <X className="w-4 h-4" /> Clear Search
                      </button>
                    ) : null}
                  </div>
                ) : null}
                  </div>
                </>
              )}

              {browseSection === "external" && (
                <>
                  <div className="mt-1 mb-4">
                    <h2 className="text-2xl font-extrabold text-slate-900">External Jobs</h2>
                    <p className="text-sm text-slate-500">Jobs sourced from external providers.</p>
                  </div>

                  <div className="space-y-3">
                {externalError ? (
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Jobs fetch issue</p>
                      <p className="text-sm">{externalError}</p>
                    </div>
                  </div>
                ) : null}

                {externalLoading ? (
                  <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <Loader2 className="w-6 h-6 text-rose-500 animate-spin mr-3" />
                    <p className="text-sm text-gray-500">Loading external jobs...</p>
                  </div>
                ) : externalJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"><Briefcase className="w-6 h-6 text-gray-300" /></div>
                    <p className="font-bold text-gray-900 text-xl">No jobs found</p>
                    <p className="text-sm text-gray-500 mt-1">Try refreshing external jobs.</p>
                  </div>
                ) : (
                  externalJobs.map(job => {
                    const isBookmarked = externalBookmarkedIds.includes(job.job_id)
                    return (
                      <div key={job.job_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 overflow-hidden">
                            {job.logo_url ? <img src={job.logo_url} alt={job.company} className="w-full h-full object-contain" /> : <Briefcase className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-bold text-gray-900 text-sm truncate">{job.title}</p>
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><Clock className="w-3 h-3" />{formatExternalDate(job.posted_date)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 mb-2">
                              <span className="flex items-center gap-1"><Building className="w-3 h-3" />{job.company}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-green-50 text-green-700 border-green-200">{job.employment_type || "Not specified"}</span>
                            </div>
                            <p className="text-xs text-gray-500">Salary: <span className="font-semibold text-gray-700">{job.salary || "Not specified"}</span></p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => toggleExternalBookmark(job.job_id)} className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                              {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-rose-600" /> : <Bookmark className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => handleExternalApply(job)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors">
                              Apply <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: POST JOB */}
          {activeTab === "Post Job" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="lg:col-span-1 bg-white rounded-[32px] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col">
                <div className="mb-6">
                  <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Post a New Opportunity</h1>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">Complete each section in sequence, like mentorship profile setup.</p>
                </div>

                <div className="space-y-4">
                  {postJobSteps.map((step, idx) => (
                    <div key={step.s} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border transition-all ${activeStep >= step.s ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {step.s}
                        </div>
                        {idx < postJobSteps.length - 1 ? <div className="w-px h-7 bg-slate-200 mt-2" /> : null}
                      </div>
                      <div className="pt-1.5">
                        <p className={`text-[12px] font-bold uppercase tracking-wide ${activeStep >= step.s ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5">{step.hint}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-[16px] border border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Required In This Step</p>
                  {getMissingFieldsForStep(activeStep).length === 0 ? (
                    <p className="text-[13px] font-semibold text-emerald-600">All required fields completed.</p>
                  ) : (
                    <ul className="space-y-1">
                      {getMissingFieldsForStep(activeStep).map((f) => (
                        <li key={f.key} className="text-[12px] text-slate-700">• {f.label}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                <div className="mb-5">
                  <p className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest">Step {activeStep} of 4</p>
                  <h2 className="text-[24px] font-bold text-slate-900 tracking-tight mt-1">{postJobSteps.find(s => s.s === activeStep)?.title}</h2>
                  <p className="text-[13px] text-slate-500 mt-1">{postJobSteps.find(s => s.s === activeStep)?.hint}</p>
                </div>

                <div className="rounded-[20px] border border-slate-100 bg-slate-50/50 p-6 mb-6">
                  {activeStep === 1 && (
                    <div className="space-y-8 animate-in fade-in">
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
                    onClick={() => activeStep < 4 ? goToNextStep() : handleSubmit()}
                    disabled={isSubmitting}
                    className="px-10 py-3.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-[14px] font-bold shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
                  >
                    {activeStep === 4 ? (isSubmitting ? "Posting..." : "Post Job") : activeStep === 1 ? "Next: Job Details" : activeStep === 2 ? "Next: Compensation" : "Next: Application"}
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
                {myJobs.map(job => (
                  <div key={job.id} className="bg-white/70 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] border border-white flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all">
                    <div className="w-full flex items-start gap-4 sm:gap-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-400">{job.company.charAt(0)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-1">
                          <h4 className="text-xl font-black text-slate-800 truncate">{job.title}</h4>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100 capitalize">{job.status}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {job.company}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatPostedDate(job.postedDate)}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatPostedTime(job.postedDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-auto flex flex-wrap md:flex-nowrap gap-3 md:justify-end">
                      <button onClick={() => openEditModal(job as any)} className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 transition-colors">Edit</button>
                      <button onClick={() => handleViewApplicants(job)} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black hover:bg-slate-50 transition-colors">Applicants</button>
                      <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] rounded-[2rem] p-0 border-none bg-white overflow-hidden flex flex-col">
          <DialogHeader className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100 bg-white">
            <DialogTitle className="text-xl font-black text-slate-900">Edit Job Posting</DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-6 sm:px-8 py-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Title</label>
              <input value={editFormData.jobTitle} onChange={(e) => handleEditInputChange("jobTitle", e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Company</label>
              <input value={editFormData.companyName} onChange={(e) => handleEditInputChange("companyName", e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Location</label>
              <input value={editFormData.location} onChange={(e) => handleEditInputChange("location", e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Job Type</label>
              <Select value={editFormData.jobType} onValueChange={(v) => handleEditInputChange("jobType", v)}>
                <SelectTrigger className="w-full px-4 py-6 bg-slate-50 border border-slate-200 rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl">
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Internship (Paid)">Internship (Paid)</SelectItem>
                  <SelectItem value="Internship (Unpaid)">Internship (Unpaid)</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Industry</label>
              <input value={editFormData.industry} onChange={(e) => handleEditInputChange("industry", e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                <Checkbox checked={editFormData.remoteAvailable} onCheckedChange={(checked) => handleEditInputChange("remoteAvailable", checked === true)} />
                Remote Available
              </label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Description</label>
              <textarea rows={4} value={editFormData.jobDescription} onChange={(e) => handleEditInputChange("jobDescription", e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Requirements</label>
              <textarea rows={3} value={editFormData.requirements} onChange={(e) => handleEditInputChange("requirements", e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Salary Min</label>
              <input value={editFormData.salaryMin} onChange={(e) => handleEditInputChange("salaryMin", e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Salary Max</label>
              <input value={editFormData.salaryMax} onChange={(e) => handleEditInputChange("salaryMax", e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Application URL / Email</label>
              <input value={editFormData.applicationUrl} onChange={(e) => handleEditInputChange("applicationUrl", e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>
          </div>

          <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
            <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200">Cancel</button>
            <button onClick={saveEditedJob} disabled={isSavingEdit} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60">
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6 bg-white [color-scheme:light]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Apply to {applyJob?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Resume</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handlePortalResumeFileChange}
                disabled={uploading}
                className="block w-full text-sm text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <div className="text-xs text-slate-500">PDF, DOC, DOCX up to 10MB. Or paste a URL below.</div>
              <input
                type="url"
                placeholder="Or paste a public resume URL (Google Drive, etc.)"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {uploadedFileName ? <div className="text-sm text-emerald-700">Selected: {uploadedFileName}</div> : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cover Letter</label>
              <textarea
                placeholder="Optional: brief cover letter or message"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={submitPortalApplication}
                disabled={applySubmitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60"
              >
                {applySubmitting ? "Submitting..." : "Submit Application"}
              </button>
              <button
                onClick={() => setApplyOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditSuccessOpen} onOpenChange={setIsEditSuccessOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Successfully Edited</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">Your job post was edited and saved successfully.</p>
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setIsEditSuccessOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={externalApplyPromptOpen}
        onOpenChange={(open) => {
          setExternalApplyPromptOpen(open)
          if (!open) setExternalApplyPromptJob(null)
        }}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Did You Apply For This Job?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">
            {externalApplyPromptJob ? `Did you complete your application for "${externalApplyPromptJob.title}"?` : "Did you complete your external application?"}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => submitExternalApplicationFeedback(true)}
              disabled={submittingExternalFeedback}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60"
            >
              Yes, I Applied
            </button>
            <button
              onClick={() => submitExternalApplicationFeedback(false)}
              disabled={submittingExternalFeedback}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-60"
            >
              No, Not Yet
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-10 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedJob ? `${selectedJob.title} details` : "Job details"}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-start">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100"><Building2 className="w-10 h-10 text-slate-300" /></div>
              </div>
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
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedJob ? `Applicants for ${selectedJob.title}` : "Applicants"}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-start">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Applicants</h2>
                  <p className="text-lg text-slate-500 font-bold">{selectedJob.title} @{selectedJob.company}</p>
                </div>
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
