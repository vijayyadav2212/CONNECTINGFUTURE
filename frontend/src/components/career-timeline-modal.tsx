"use client"

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Plus, X, Building, Award, GraduationCap } from "lucide-react"

interface CareerTimelineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TimelineEvent {
  id: string
  type: "education" | "job" | "achievement" | "project"
  title: string
  organization: string
  description: string
  startDate: string
  endDate: string
  current: boolean
}

export function CareerTimelineModal({ open, onOpenChange }: CareerTimelineModalProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([
    {
      id: "1",
      type: "education",
      title: "B.Tech Computer Science",
      organization: "PVPPCOE",
      description: "Graduated with honors, specialized in AI/ML",
      startDate: "2020",
      endDate: "2024",
      current: false,
    },
  ])

  const addEvent = () => {
    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      type: "job",
      title: "",
      organization: "",
      description: "",
      startDate: "",
      endDate: "",
      current: false,
    }
    setEvents([...events, newEvent])
  }

  const updateEvent = (id: string, field: keyof TimelineEvent, value: any) => {
    setEvents(events.map((event) => (event.id === id ? { ...event, [field]: value } : event)))
  }

  const removeEvent = (id: string) => {
    setEvents(events.filter((event) => event.id !== id))
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "education":
        return <GraduationCap className="w-5 h-5" />
      case "job":
        return <Building className="w-5 h-5" />
      case "achievement":
        return <Award className="w-5 h-5" />
      default:
        return <Building className="w-5 h-5" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "education":
        return "bg-blue-100 text-blue-600 border-blue-200"
      case "job":
        return "bg-green-100 text-green-600 border-green-200"
      case "achievement":
        return "bg-yellow-100 text-yellow-600 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Career Timeline</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-slate-600">Share your career journey to inspire students and showcase your expertise.</p>
            <Button onClick={addEvent} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>

          <div className="space-y-4">
            {events.map((event, index) => (
              <Card key={event.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${getEventColor(event.type)}`}
                    >
                      {getEventIcon(event.type)}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <select
                          className="p-2 border border-slate-300 rounded-md"
                          value={event.type}
                          onChange={(e) => updateEvent(event.id, "type", e.target.value)}
                        >
                          <option value="education">Education</option>
                          <option value="job">Job/Internship</option>
                          <option value="achievement">Achievement</option>
                          <option value="project">Project</option>
                        </select>
                        <Input
                          placeholder="Title/Position"
                          value={event.title}
                          onChange={(e: { target: { value: any } }) => updateEvent(event.id, "title", e.target.value)}
                        />
                        <Input
                          placeholder="Organization/Company"
                          value={event.organization}
                          onChange={(e: { target: { value: any } }) => updateEvent(event.id, "organization", e.target.value)}
                        />
                      </div>

                      <Textarea
                        placeholder="Description of your role, achievements, or key learnings..."
                        rows={2}
                        value={event.description}
                        onChange={(e: { target: { value: any } }) => updateEvent(event.id, "description", e.target.value)}
                      />

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-sm">Start Date</Label>
                          <Input
                            type="month"
                            value={event.startDate}
                            onChange={(e: { target: { value: any } }) => updateEvent(event.id, "startDate", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">End Date</Label>
                          <Input
                            type="month"
                            value={event.endDate}
                            onChange={(e: { target: { value: any } }) => updateEvent(event.id, "endDate", e.target.value)}
                            disabled={event.current}
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={event.current}
                              onChange={(e) => updateEvent(event.id, "current", e.target.checked)}
                            />
                            Current Position
                          </label>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEvent(event.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Timeline Benefits</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Helps students understand career progression paths</li>
              <li>• Showcases your expertise and credibility</li>
              <li>• Enables better mentor-mentee matching</li>
              <li>• Inspires students with real career stories</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)}>Save Timeline</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
