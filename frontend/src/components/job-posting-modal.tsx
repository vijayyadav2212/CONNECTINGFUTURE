"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { Switch } from "@/src/components/ui/switch"
import { Badge } from "@/src/components/ui/badge"
import { X } from "lucide-react"

interface JobPostingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JobPostingModal({ open, onOpenChange }: JobPostingModalProps) {
  const [jobData, setJobData] = useState({
    title: "",
    company: "",
    description: "",
    requirements: "",
    applyLink: "",
    isRemote: false,
    type: "full-time",
  })

  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState("")

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()])
      setCurrentSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const handleSubmit = () => {
    // Handle job posting submission
    console.log("Job posted:", { ...jobData, skills })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a Job or Internship</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job-title">Job Title *</Label>
              <Input
                id="job-title"
                placeholder="e.g. Frontend Developer"
                value={jobData.title}
                onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                placeholder="e.g. TechCorp Inc."
                value={jobData.company}
                onChange={(e) => setJobData({ ...jobData, company: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              rows={4}
              value={jobData.description}
              onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="requirements">Requirements & Qualifications</Label>
            <Textarea
              id="requirements"
              placeholder="List the required skills, experience, and qualifications..."
              rows={3}
              value={jobData.requirements}
              onChange={(e) => setJobData({ ...jobData, requirements: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="skills">Required Skills</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="skills"
                placeholder="Add a skill and press Enter"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSkill()}
              />
              <Button type="button" onClick={addSkill}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job-type">Job Type</Label>
              <select
                id="job-type"
                className="w-full p-2 border border-slate-300 rounded-md"
                value={jobData.type}
                onChange={(e) => setJobData({ ...jobData, type: e.target.value })}
              >
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 border border-slate-300 rounded-md">
              <Label htmlFor="remote-toggle">Remote Work</Label>
              <Switch
                id="remote-toggle"
                checked={jobData.isRemote}
                onCheckedChange={(checked) => setJobData({ ...jobData, isRemote: checked })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="apply-link">Application Link *</Label>
            <Input
              id="apply-link"
              placeholder="https://company.com/careers/apply"
              value={jobData.applyLink}
              onChange={(e) => setJobData({ ...jobData, applyLink: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Post Job</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
