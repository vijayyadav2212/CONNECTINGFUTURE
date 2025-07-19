"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent } from "@/src/components/ui/card"
import { Plus, X, GripVertical } from "lucide-react"

interface RoadmapModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface RoadmapStep {
  id: string
  title: string
  description: string
  resources: string[]
  timeEstimate: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
}

export function RoadmapModal({ open, onOpenChange }: RoadmapModalProps) {
  const [roadmapData, setRoadmapData] = useState({
    title: "",
    description: "",
    category: "Frontend Development",
  })

  const [steps, setSteps] = useState<RoadmapStep[]>([
    {
      id: "1",
      title: "HTML & CSS Fundamentals",
      description: "Learn the basics of web structure and styling",
      resources: ["MDN Web Docs", "freeCodeCamp"],
      timeEstimate: "2 weeks",
      difficulty: "Beginner",
    },
  ])

  const addStep = () => {
    const newStep: RoadmapStep = {
      id: Date.now().toString(),
      title: "",
      description: "",
      resources: [],
      timeEstimate: "",
      difficulty: "Beginner",
    }
    setSteps([...steps, newStep])
  }

  const updateStep = (id: string, field: keyof RoadmapStep, value: any) => {
    setSteps(steps.map((step) => (step.id === id ? { ...step, [field]: value } : step)))
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id))
  }

  const addResource = (stepId: string, resource: string) => {
    if (resource.trim()) {
      updateStep(stepId, "resources", [...(steps.find((s) => s.id === stepId)?.resources || []), resource.trim()])
    }
  }

  const removeResource = (stepId: string, resourceIndex: number) => {
    const step = steps.find((s) => s.id === stepId)
    if (step) {
      const newResources = step.resources.filter((_, index) => index !== resourceIndex)
      updateStep(stepId, "resources", newResources)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Career Roadmap</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roadmap-title">Roadmap Title *</Label>
              <Input
                id="roadmap-title"
                placeholder="e.g. Frontend Developer Roadmap"
                value={roadmapData.title}
                onChange={(e) => setRoadmapData({ ...roadmapData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="w-full p-2 border border-slate-300 rounded-md"
                value={roadmapData.category}
                onChange={(e) => setRoadmapData({ ...roadmapData, category: e.target.value })}
              >
                <option value="Frontend Development">Frontend Development</option>
                <option value="Backend Development">Backend Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Product Management">Product Management</option>
                <option value="UI/UX Design">UI/UX Design</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="roadmap-description">Description</Label>
            <Textarea
              id="roadmap-description"
              placeholder="Describe what this roadmap covers and who it's for..."
              rows={3}
              value={roadmapData.description}
              onChange={(e) => setRoadmapData({ ...roadmapData, description: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Roadmap Steps</h3>
              <Button onClick={addStep} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <Card key={step.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 mt-2">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Step title"
                            value={step.title}
                            onChange={(e) => updateStep(step.id, "title", e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Input
                              placeholder="Time estimate"
                              value={step.timeEstimate}
                              onChange={(e) => updateStep(step.id, "timeEstimate", e.target.value)}
                            />
                            <select
                              className="p-2 border border-slate-300 rounded-md"
                              value={step.difficulty}
                              onChange={(e) => updateStep(step.id, "difficulty", e.target.value as any)}
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </div>
                        </div>

                        <Textarea
                          placeholder="Step description"
                          rows={2}
                          value={step.description}
                          onChange={(e) => updateStep(step.id, "description", e.target.value)}
                        />

                        <div>
                          <Label className="text-sm">Resources</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              placeholder="Add resource link or name"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  addResource(step.id, e.currentTarget.value)
                                  e.currentTarget.value = ""
                                }
                              }}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {step.resources.map((resource, resourceIndex) => (
                              <Badge key={resourceIndex} variant="secondary" className="flex items-center gap-1">
                                {resource}
                                <X
                                  className="w-3 h-3 cursor-pointer"
                                  onClick={() => removeResource(step.id, resourceIndex)}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)}>Create Roadmap</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
