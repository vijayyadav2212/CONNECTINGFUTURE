"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Briefcase,
  BookOpen,
  Trophy,
  Settings,
  Send,
  Mic,
  Map,
  UserPlus,
  Calendar,
  MessageSquare,
  TrendingUp,
  Star,
  Award,
  Camera,
  Heart,
  Share2,
} from "lucide-react"

interface AlumniDashboardProps {
  activeSection: string
  onShowInterestModal: () => void
  onShowJobModal: () => void
  onShowAMAModal: () => void
  onShowRoadmapModal: () => void
  onShowTimelineModal: () => void
  onShowDonationModal: () => void
}

export function AlumniDashboard({
  activeSection,
  onShowInterestModal,
  onShowJobModal,
  onShowAMAModal,
  onShowRoadmapModal,
  onShowTimelineModal,
  onShowDonationModal,
}: AlumniDashboardProps) {
  if (activeSection === "dashboard") {
    return (
      <DashboardView
        onShowInterestModal={onShowInterestModal}
        onShowJobModal={onShowJobModal}
        onShowAMAModal={onShowAMAModal}
        onShowRoadmapModal={onShowRoadmapModal}
        onShowTimelineModal={onShowTimelineModal}
        onShowDonationModal={onShowDonationModal}
      />
    )
  }

  if (activeSection === "mentorship") {
    return <MentorshipView />
  }

  if (activeSection === "jobs") {
    return <JobsView onShowJobModal={onShowJobModal} />
  }

  if (activeSection === "memories") {
    return <MemoriesView />
  }

  if (activeSection === "leaderboard") {
    return <LeaderboardView />
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Coming Soon</h2>
        <p className="text-slate-600">This section is under development.</p>
      </div>
    </div>
  )
}

function DashboardView({
  onShowInterestModal,
  onShowJobModal,
  onShowAMAModal,
  onShowRoadmapModal,
  onShowTimelineModal,
  onShowDonationModal,
}: {
  onShowInterestModal: () => void
  onShowJobModal: () => void
  onShowAMAModal: () => void
  onShowRoadmapModal: () => void
  onShowTimelineModal: () => void
  onShowDonationModal: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, Arjun! 🎓</h1>
            <p className="text-blue-100">Ready to make an impact today?</p>
          </div>
          <Button
            variant="secondary"
            onClick={onShowInterestModal}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Settings className="w-4 h-4 mr-2" />
            Update Interests
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Mentees Helped</p>
                <p className="text-2xl font-bold text-slate-900">24</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Jobs Posted</p>
                <p className="text-2xl font-bold text-slate-900">8</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Blogs Written</p>
                <p className="text-2xl font-bold text-slate-900">12</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Impact Points</p>
                <p className="text-2xl font-bold text-slate-900">1,247</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button
              className="h-auto p-4 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={onShowTimelineModal}
            >
              <Settings className="w-6 h-6" />
              <span className="text-sm">Update Profile</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col gap-2 hover:bg-slate-50 bg-transparent"
              onClick={onShowJobModal}
            >
              <Send className="w-6 h-6" />
              <span className="text-sm">Post Job</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col gap-2 hover:bg-slate-50 bg-transparent"
              onClick={onShowAMAModal}
            >
              <Mic className="w-6 h-6" />
              <span className="text-sm">Host AMA</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col gap-2 hover:bg-slate-50 bg-transparent"
              onClick={onShowRoadmapModal}
            >
              <Map className="w-6 h-6" />
              <span className="text-sm">Create Roadmap</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 hover:bg-slate-50 bg-transparent">
              <UserPlus className="w-6 h-6" />
              <span className="text-sm">Become Mentor</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col gap-2 hover:bg-slate-50 bg-transparent"
              onClick={onShowDonationModal}
            >
              <Heart className="w-6 h-6" />
              <span className="text-sm">Make Donation</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>SK</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Mentorship with Sneha</p>
                <p className="text-sm text-slate-600">Today, 3:00 PM</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Confirmed
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">AMA: Career in Tech</p>
                <p className="text-sm text-slate-600">Tomorrow, 7:00 PM</p>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                Hosting
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Rahul Singh</span> got placed at Google through your referral
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-slate-600">
                Your <span className="font-medium">"Frontend Roadmap"</span> has 127 new followers
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-sm text-slate-600">
                <span className="font-medium">5 students</span> completed your React.js roadmap
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MentorshipView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mentorship Dashboard</h1>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Accept New Mentees
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">24</p>
              <p className="text-sm text-slate-600">Active Mentees</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">8</p>
              <p className="text-sm text-slate-600">Sessions This Week</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">4.9</p>
              <p className="text-sm text-slate-600">Average Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg">
                <Avatar>
                  <AvatarImage src={`/placeholder.svg?height=40&width=40&query=student+${i}`} />
                  <AvatarFallback>S{i}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Student {i}</p>
                  <p className="text-sm text-slate-600">Interested in Frontend Development</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Decline
                  </Button>
                  <Button size="sm">Accept</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Avatar>
                  <AvatarImage src={`/placeholder.svg?height=40&width=40&query=mentee+${i}`} />
                  <AvatarFallback>M{i}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Mentee {i}</p>
                  <p className="text-sm text-slate-600">Session completed • 2 days ago</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function JobsView({ onShowJobModal }: { onShowJobModal: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Jobs & Internships</h1>
        <Button onClick={onShowJobModal}>
          <Send className="w-4 h-4 mr-2" />
          Post New Job
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">8</p>
              <p className="text-sm text-slate-600">Active Postings</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">156</p>
              <p className="text-sm text-slate-600">Total Applications</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">12</p>
              <p className="text-sm text-slate-600">Successful Hires</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Job Postings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { title: "Frontend Developer", company: "TechCorp", applications: 24, status: "Active" },
              { title: "Product Manager", company: "StartupXYZ", applications: 18, status: "Active" },
              { title: "Data Scientist", company: "DataFlow", applications: 32, status: "Closed" },
            ].map((job, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-slate-900">{job.title}</h3>
                  <p className="text-sm text-slate-600">
                    {job.company} • {job.applications} applications
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={job.status === "Active" ? "default" : "secondary"}
                    className={job.status === "Active" ? "bg-green-100 text-green-700" : ""}
                  >
                    {job.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MemoriesView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Alumni Memories</h1>
        <Button>
          <Camera className="w-4 h-4 mr-2" />
          Share Memory
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Button variant="outline" size="sm">
          All
        </Button>
        <Button variant="outline" size="sm">
          Events
        </Button>
        <Button variant="outline" size="sm">
          Achievements
        </Button>
        <Button variant="outline" size="sm">
          Campus Life
        </Button>
        <Button variant="outline" size="sm">
          Reunions
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-slate-200 relative">
              <img
                src={`/placeholder.svg?height=200&width=300&query=college+memory+${i}`}
                alt={`Memory ${i}`}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`/placeholder.svg?height=32&width=32&query=alumni+${i}`} />
                  <AvatarFallback>A{i}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-slate-900">Alumni {i}</p>
                  <p className="text-xs text-slate-600">Class of 201{i + 5}</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-3">
                Amazing memories from the annual tech fest! The innovation and creativity displayed by students was
                incredible.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <button className="flex items-center gap-1 hover:text-red-600">
                    <Heart className="w-4 h-4" />
                    {12 + i}
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-600">
                    <MessageSquare className="w-4 h-4" />
                    {3 + i}
                  </button>
                  <button className="flex items-center gap-1 hover:text-green-600">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                <Badge variant="outline" className="text-xs">
                  Tech Fest 2023
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function LeaderboardView() {
  const leaderboardData = [
    { name: "Priya Sharma", points: 2847, badge: "🏆 Top Mentor", avatar: "1" },
    { name: "Arjun Kumar", points: 1247, badge: "💼 Job Hero", avatar: "2" },
    { name: "Sneha Patel", points: 1156, badge: "✍ Knowledge Builder", avatar: "3" },
    { name: "Rahul Singh", points: 987, badge: "🎯 Impact Maker", avatar: "4" },
    { name: "Anita Desai", points: 876, badge: "🌟 Community Star", avatar: "5" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Impact Leaderboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            This Month
          </Button>
          <Button variant="outline" size="sm">
            All Time
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {leaderboardData.slice(0, 3).map((alumni, index) => (
          <Card key={alumni.name} className={`relative overflow-hidden ${index === 0 ? "ring-2 ring-yellow-400" : ""}`}>
            <CardContent className="p-6 text-center">
              <div
                className={`absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] ${
                  index === 0 ? "border-t-yellow-400" : index === 1 ? "border-t-gray-400" : "border-t-orange-400"
                }`}
              >
                <span className="absolute -top-8 -right-2 text-white font-bold text-sm">{index + 1}</span>
              </div>
              <Avatar className="w-16 h-16 mx-auto mb-4">
                <AvatarImage src={`/placeholder.svg?height=64&width=64&query=alumni+${alumni.avatar}`} />
                <AvatarFallback>
                  {alumni.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-slate-900 mb-1">{alumni.name}</h3>
              <Badge variant="outline" className="mb-3 text-xs">
                {alumni.badge}
              </Badge>
              <p className="text-2xl font-bold text-blue-600">{alumni.points.toLocaleString()}</p>
              <p className="text-sm text-slate-600">Impact Points</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboardData.map((alumni, index) => (
              <div key={alumni.name} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-700">
                  {index + 1}
                </div>
                <Avatar>
                  <AvatarImage src={`/placeholder.svg?height=40&width=40&query=alumni+${alumni.avatar}`} />
                  <AvatarFallback>
                    {alumni.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{alumni.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {alumni.badge}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{alumni.points.toLocaleString()}</p>
                  <p className="text-sm text-slate-600">points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
