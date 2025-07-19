"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Check,
  Search,
  Filter,
  Star,
  Briefcase,
  Code,
  Palette,
  BarChart3,
  Users,
  Megaphone,
  Shield,
  Smartphone,
  Brain,
  DollarSign,
  Lightbulb,
  Globe,
  Camera,
  BookOpen,
  Calendar,
  MessageSquare,
  UserCheck,
  FileText,
  Mic,
  Building,
  X,
  Plus,
  Settings,
  Info,
  Clock,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface EnhancedInterestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const domainCategories = {
  Technology: [
    { name: "AI/ML", icon: Brain, color: "bg-purple-100 text-purple-700 border-purple-200", level: "Expert" },
    { name: "Frontend Development", icon: Code, color: "bg-blue-100 text-blue-700 border-blue-200", level: "Expert" },
    {
      name: "Backend Development",
      icon: Code,
      color: "bg-green-100 text-green-700 border-green-200",
      level: "Intermediate",
    },
    {
      name: "Data Science",
      icon: BarChart3,
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
      level: "Expert",
    },
    {
      name: "Mobile Development",
      icon: Smartphone,
      color: "bg-pink-100 text-pink-700 border-pink-200",
      level: "Beginner",
    },
    { name: "DevOps", icon: Shield, color: "bg-orange-100 text-orange-700 border-orange-200", level: "Intermediate" },
    { name: "Cybersecurity", icon: Shield, color: "bg-red-100 text-red-700 border-red-200", level: "Intermediate" },
    { name: "Blockchain", icon: Globe, color: "bg-yellow-100 text-yellow-700 border-yellow-200", level: "Beginner" },
  ],
  Business: [
    {
      name: "Product Management",
      icon: Briefcase,
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      level: "Expert",
    },
    { name: "Finance", icon: DollarSign, color: "bg-teal-100 text-teal-700 border-teal-200", level: "Intermediate" },
    { name: "Marketing", icon: Megaphone, color: "bg-rose-100 text-rose-700 border-rose-200", level: "Expert" },
    { name: "Consulting", icon: Users, color: "bg-cyan-100 text-cyan-700 border-cyan-200", level: "Expert" },
    {
      name: "Entrepreneurship",
      icon: Lightbulb,
      color: "bg-amber-100 text-amber-700 border-amber-200",
      level: "Expert",
    },
  ],
  Creative: [
    { name: "UI/UX Design", icon: Palette, color: "bg-violet-100 text-violet-700 border-violet-200", level: "Expert" },
    {
      name: "Graphic Design",
      icon: Camera,
      color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
      level: "Intermediate",
    },
    { name: "Content Writing", icon: BookOpen, color: "bg-slate-100 text-slate-700 border-slate-200", level: "Expert" },
  ],
}

const activities = [
  {
    name: "Mentorship",
    icon: Users,
    description: "Guide students in their career journey",
    commitment: "2-4 hours/week",
    impact: "High",
  },
  {
    name: "Job Referrals",
    icon: Briefcase,
    description: "Help students get job opportunities",
    commitment: "1-2 hours/week",
    impact: "High",
  },
  {
    name: "Resume Review",
    icon: FileText,
    description: "Provide feedback on resumes and profiles",
    commitment: "30 min/week",
    impact: "Medium",
  },
  {
    name: "Mock Interviews",
    icon: UserCheck,
    description: "Conduct practice interview sessions",
    commitment: "1-2 hours/week",
    impact: "High",
  },
  {
    name: "Career Guidance",
    icon: Star,
    description: "Share career insights and advice",
    commitment: "1 hour/week",
    impact: "Medium",
  },
  {
    name: "Technical Discussions",
    icon: Code,
    description: "Engage in technical conversations",
    commitment: "Flexible",
    impact: "Medium",
  },
  {
    name: "Event Speaking",
    icon: Mic,
    description: "Speak at college events and webinars",
    commitment: "2-4 hours/month",
    impact: "High",
  },
  {
    name: "Hiring",
    icon: Building,
    description: "Recruit students for your organization",
    commitment: "Flexible",
    impact: "High",
  },
]

const skillLevels = ["Beginner", "Intermediate", "Expert"]
const commitmentLevels = ["Low (1-2 hrs/week)", "Medium (3-5 hrs/week)", "High (6+ hrs/week)"]

export function EnhancedInterestModal({ open, onOpenChange }: EnhancedInterestModalProps) {
  const [selectedDomains, setSelectedDomains] = useState<{ [key: string]: string }>({
    "AI/ML": "Expert",
    "Frontend Development": "Expert",
  })
  const [selectedActivities, setSelectedActivities] = useState<string[]>(["Mentorship", "Career Guidance"])
  const [availableForMentorship, setAvailableForMentorship] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [commitmentLevel, setCommitmentLevel] = useState("Medium (3-5 hrs/week)")
  const [customInterests, setCustomInterests] = useState<string[]>([])
  const [newCustomInterest, setNewCustomInterest] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mentorshipMessage, setMentorshipMessage] = useState(
    "Hi! I'm excited to help you with your career journey. Let's connect and discuss your goals.",
  )

  const toggleDomain = (domain: string, level = "Intermediate") => {
    setSelectedDomains((prev) => {
      const newDomains = { ...prev }
      if (newDomains[domain]) {
        delete newDomains[domain]
      } else {
        newDomains[domain] = level
      }
      return newDomains
    })
  }

  const updateDomainLevel = (domain: string, level: string) => {
    setSelectedDomains((prev) => ({
      ...prev,
      [domain]: level,
    }))
  }

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    )
  }

  const addCustomInterest = () => {
    if (newCustomInterest.trim() && !customInterests.includes(newCustomInterest.trim())) {
      setCustomInterests((prev) => [...prev, newCustomInterest.trim()])
      setNewCustomInterest("")
    }
  }

  const removeCustomInterest = (interest: string) => {
    setCustomInterests((prev) => prev.filter((i) => i !== interest))
  }

  const filteredDomains = Object.entries(domainCategories).reduce(
    (acc, [category, domains]) => {
      if (activeCategory === "All" || activeCategory === category) {
        const filtered = domains.filter((domain) => domain.name.toLowerCase().includes(searchTerm.toLowerCase()))
        if (filtered.length > 0) {
          // @ts-ignore
          acc[category] = filtered
        }
      }
      return acc
    },
    {} as typeof domainCategories,
  )

  const handleSave = () => {
    // Save logic here
    console.log({
      domains: selectedDomains,
      activities: selectedActivities,
      availableForMentorship,
      commitmentLevel,
      customInterests,
      mentorshipMessage,
    })
    onOpenChange(false)
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High":
        return "bg-green-100 text-green-700 border-green-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Personalize Your Alumni Profile
          </DialogTitle>
          <p className="text-slate-600">
            Help us connect you with the right opportunities and students who need your expertise
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2">
          {/* Mentorship Availability - Enhanced Toggle */}
          <Card
            className={`border-2 transition-all duration-300 ${
              availableForMentorship
                ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                      availableForMentorship ? "bg-green-100" : "bg-slate-100"
                    }`}
                  >
                    <Users className={`w-7 h-7 ${availableForMentorship ? "text-green-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <Label htmlFor="mentorship-toggle" className="text-xl font-semibold text-slate-900 cursor-pointer">
                      Mentorship Availability
                    </Label>
                    <p className="text-sm text-slate-600 mt-1">
                      {availableForMentorship
                        ? "Students can send you mentorship requests and book sessions"
                        : "Mentorship requests are currently paused"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Switch
                    id="mentorship-toggle"
                    checked={availableForMentorship}
                    onCheckedChange={setAvailableForMentorship}
                    className="data-[state=checked]:bg-green-500 scale-125"
                  />
                  <Badge
                    variant={availableForMentorship ? "default" : "secondary"}
                    className={`transition-all text-sm px-3 py-1 ${
                      availableForMentorship
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {availableForMentorship ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>✅ Available
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-slate-400 rounded-full mr-2"></div>
                        ⏸️ Paused
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {availableForMentorship && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-slate-700">Current Mentees</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">12</p>
                    <p className="text-xs text-slate-500">Active relationships</p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Pending Requests</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">3</p>
                    <p className="text-xs text-slate-500">Awaiting response</p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-slate-700">This Week</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">5</p>
                    <p className="text-xs text-slate-500">Scheduled sessions</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commitment Level */}
          {availableForMentorship && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Time Commitment</h3>
              <div className="grid grid-cols-3 gap-3">
                {commitmentLevels.map((level) => (
                  <Card
                    key={level}
                    className={`cursor-pointer transition-all duration-200 ${
                      commitmentLevel === level
                        ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                        : "hover:border-slate-300 hover:shadow-sm"
                    }`}
                    onClick={() => setCommitmentLevel(level)}
                  >
                    <CardContent className="p-4 text-center">
                      <div
                        className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          commitmentLevel === level ? "bg-blue-100" : "bg-slate-100"
                        }`}
                      >
                        <Clock
                          className={`w-4 h-4 ${commitmentLevel === level ? "text-blue-600" : "text-slate-400"}`}
                        />
                      </div>
                      <p className="font-medium text-sm text-slate-900">{level.split(" ")[0]}</p>
                      <p className="text-xs text-slate-600">{level.split(" ").slice(1).join(" ")}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Areas of Expertise */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Areas of Expertise</h3>
                <p className="text-sm text-slate-600">
                  Select domains where you can provide guidance and specify your skill level
                </p>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200 px-3 py-1">
                {Object.keys(selectedDomains).length} domains selected
              </Badge>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search domains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-1">
                {["All", ...Object.keys(domainCategories)].map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className={activeCategory === category ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    <Filter className="w-3 h-3 mr-1" />
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Domain Categories */}
            <div className="space-y-6">
              {Object.entries(filteredDomains).map(([category, domains]) => (
                <div key={category}>
                  <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {domains.map((domain) => {
                      const Icon = domain.icon
                      const isSelected = selectedDomains[domain.name]
                      return (
                        <Card
                          key={domain.name}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                              : "hover:border-slate-300 hover:shadow-sm"
                          }`}
                          onClick={() => toggleDomain(domain.name, domain.level)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${domain.color}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-slate-900">{domain.name}</h5>
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>

                            {isSelected && (
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-600">Skill Level</Label>
                                <div className="flex gap-1">
                                  {skillLevels.map((level) => (
                                    <Button
                                      key={level}
                                      variant={selectedDomains[domain.name] === level ? "default" : "outline"}
                                      size="sm"
                                      className={`text-xs h-7 ${
                                        selectedDomains[domain.name] === level ? "bg-blue-600 hover:bg-blue-700" : ""
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateDomainLevel(domain.name, level)
                                      }}
                                    >
                                      {level}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Interests */}
            <div className="mt-6">
              <h4 className="font-medium text-slate-700 mb-3">Add Custom Interests</h4>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Enter a custom domain or skill..."
                  value={newCustomInterest}
                  onChange={(e) => setNewCustomInterest(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addCustomInterest()}
                />
                <Button onClick={addCustomInterest} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {customInterests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customInterests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                      {interest}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeCustomInterest(interest)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Activities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Activities You're Interested In</h3>
                <p className="text-sm text-slate-600">Choose how you'd like to contribute to the alumni community</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200 px-3 py-1">
                {selectedActivities.length} activities selected
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((activity) => {
                const Icon = activity.icon
                const isSelected = selectedActivities.includes(activity.name)
                return (
                  <Card
                    key={activity.name}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "ring-2 ring-green-500 bg-green-50 border-green-200"
                        : "hover:border-slate-300 hover:shadow-sm"
                    }`}
                    onClick={() => toggleActivity(activity.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-slate-900">{activity.name}</h4>
                            {isSelected && (
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{activity.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {activity.commitment}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${getImpactColor(activity.impact)}`}>
                              {activity.impact} Impact
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Advanced Settings */}
          {availableForMentorship && (
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-transparent">
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Advanced Mentorship Settings
                  </span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Welcome Message for New Mentees</Label>
                  <Textarea
                    className="mt-2"
                    rows={3}
                    value={mentorshipMessage}
                    onChange={(e) => setMentorshipMessage(e.target.value)}
                    placeholder="This message will be sent to students when they request mentorship..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Mentorship Tips:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Set clear expectations about response times and availability</li>
                        <li>• Be specific about the type of guidance you can provide</li>
                        <li>• Regular check-ins help maintain meaningful mentorship relationships</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t bg-white">
          <div className="text-sm text-slate-600">
            Your preferences help us match you with relevant opportunities and students
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Check className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
