"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Switch } from "@/src/components/ui/switch"
import { Label } from "@/src/components/ui/label"

interface InterestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const domains = [
  "AI/ML",
  "Frontend Development",
  "Backend Development",
  "Data Science",
  "Product Management",
  "UI/UX Design",
  "DevOps",
  "Mobile Development",
  "Blockchain",
  "Cybersecurity",
  "Finance",
  "Marketing",
  "Consulting",
]

const activities = [
  "Mentorship",
  "Job Referrals",
  "Resume Review",
  "Mock Interviews",
  "Career Guidance",
  "Technical Discussions",
  "Event Speaking",
  "Hiring",
]

export function InterestModal({ open, onOpenChange }: InterestModalProps) {
  const [selectedDomains, setSelectedDomains] = useState<string[]>(["AI/ML", "Frontend Development"])
  const [selectedActivities, setSelectedActivities] = useState<string[]>(["Mentorship", "Career Guidance"])
  const [availableForMentorship, setAvailableForMentorship] = useState(true)

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) => (prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]))
  }

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Your Interests & Availability</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Domains */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Areas of Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => (
                <Badge
                  key={domain}
                  variant={selectedDomains.includes(domain) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedDomains.includes(domain) ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-slate-100"
                  }`}
                  onClick={() => toggleDomain(domain)}
                >
                  {domain}
                </Badge>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Activities You're Interested In</h3>
            <div className="flex flex-wrap gap-2">
              {activities.map((activity) => (
                <Badge
                  key={activity}
                  variant={selectedActivities.includes(activity) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedActivities.includes(activity) ? "bg-green-600 hover:bg-green-700" : "hover:bg-slate-100"
                  }`}
                  onClick={() => toggleActivity(activity)}
                >
                  {activity}
                </Badge>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label htmlFor="mentorship-toggle" className="font-medium text-slate-900">
                Available for Mentorship
              </Label>
              <p className="text-sm text-slate-600">Students will be able to send you mentorship requests</p>
            </div>
            <Switch
              id="mentorship-toggle"
              checked={availableForMentorship}
              onCheckedChange={setAvailableForMentorship}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
