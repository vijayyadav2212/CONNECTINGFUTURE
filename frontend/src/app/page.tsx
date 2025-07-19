"use client"

import { useState } from "react"
import { AlumniSidebar } from "@/components/alumni-sidebar"
import { AlumniDashboard } from "@/components/alumni-dashboard"
import { InterestModal } from "@/components/interest-modal"
import { JobPostingModal } from "@/components/job-posting-modal"
import { AMAModal } from "@/components/ama-modal"
import { RoadmapModal } from "@/components/roadmap-modal"
import { CareerTimelineModal } from "@/components/career-timeline-modal"
import { DonationModal } from "@/components/donation-model"
// Removed import of DonationModal due to missing module

export default function AlumniConnectApp() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [showInterestModal, setShowInterestModal] = useState(false)
  const [showJobModal, setShowJobModal] = useState(false)
  const [showAMAModal, setShowAMAModal] = useState(false)
  const [showRoadmapModal, setShowRoadmapModal] = useState(false)
  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [showDonationModal, setShowDonationModal] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AlumniSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      <main className="flex-1 p-6">
        <AlumniDashboard
          activeSection={activeSection}
          onShowInterestModal={() => setShowInterestModal(true)}
          onShowJobModal={() => setShowJobModal(true)}
          onShowAMAModal={() => setShowAMAModal(true)}
          onShowRoadmapModal={() => setShowRoadmapModal(true)}
          onShowTimelineModal={() => setShowTimelineModal(true)}
          onShowDonationModal={() => setShowDonationModal(true)}
        />
      </main>

      <InterestModal open={showInterestModal} onOpenChange={setShowInterestModal} />

      <JobPostingModal open={showJobModal} onOpenChange={setShowJobModal} />

      <AMAModal open={showAMAModal} onOpenChange={setShowAMAModal} />

      <RoadmapModal open={showRoadmapModal} onOpenChange={setShowRoadmapModal} />

      <CareerTimelineModal open={showTimelineModal} onOpenChange={setShowTimelineModal} />

      <DonationModal open={showDonationModal} onOpenChange={setShowDonationModal} />
    </div>
  )
}
