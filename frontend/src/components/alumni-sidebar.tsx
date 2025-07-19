"use client"

// import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  Calendar,
  Map,
  Camera,
  BookOpen,
  Trophy,
  Mail,
  Settings,
  GraduationCap,
  Heart,
} from "lucide-react"
import { cn } from "../../lib/utils"

interface AlumniSidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "mentorship", label: "Mentorship", icon: Users },
  { id: "jobs", label: "Jobs & Internships", icon: Briefcase },
  { id: "ama", label: "AMA Sessions", icon: MessageSquare },
  { id: "events", label: "Events", icon: Calendar },
  { id: "roadmaps", label: "Roadmaps", icon: Map },
  { id: "memories", label: "Memories", icon: Camera },
  { id: "blog", label: "Blog/Articles", icon: BookOpen },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "donations", label: "Donations", icon: Heart },
]

export function AlumniSidebar({ activeSection, setActiveSection }: AlumniSidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900">Alumni Connect</h1>
            <p className="text-sm text-slate-500">PVPPCOE</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src="/placeholder.svg?height=48&width=48" />
            <AvatarFallback>AK</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">Arjun Kumar</h3>
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                🎓 Verified Alumni
              </Badge>
            </div>
            <p className="text-sm text-slate-500">Class of 2020</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  activeSection === item.id
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                )}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </nav>

      {/* Enhanced Footer with Mentor Toggle */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-700">Mentorship Status</span>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            ✅ Available
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-transparent"
          onClick={() => {
            /* Open mentor settings */
          }}
        >
          <Settings className="w-4 h-4" />
          Manage Availability
        </Button>
      </div>
    </div>
  )
}
