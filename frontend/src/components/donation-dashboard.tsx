"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, Calendar, Gift, Target, Award, Building, GraduationCap } from "lucide-react"

export function DonationDashboard() {
  const donationHistory = [
    {
      id: 1,
      amount: 5000,
      currency: "INR",
      purpose: "Scholarship Fund",
      date: "2024-01-15",
      status: "Completed",
      impact: "Supported 2 students",
    },
    {
      id: 2,
      amount: 10000,
      currency: "INR",
      purpose: "Infrastructure Development",
      date: "2023-12-10",
      status: "Completed",
      impact: "New lab equipment",
    },
    {
      id: 3,
      amount: 2500,
      currency: "INR",
      purpose: "Event Sponsorship",
      date: "2023-11-20",
      status: "Completed",
      impact: "Tech Fest 2023",
    },
  ]

  const impactStats = [
    { label: "Students Supported", value: "24", icon: Users, color: "text-blue-600" },
    { label: "Projects Funded", value: "8", icon: Target, color: "text-green-600" },
    { label: "Events Sponsored", value: "5", icon: Calendar, color: "text-purple-600" },
    { label: "Total Impact", value: "₹47,500", icon: Heart, color: "text-red-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Donation Dashboard</h1>
          <p className="text-slate-600">Track your contributions and impact</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Heart className="w-4 h-4 mr-2" />
          Make New Donation
        </Button>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {impactStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Donations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Recent Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {donationHistory.map((donation) => (
              <div key={donation.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{donation.purpose}</h3>
                    <p className="text-sm text-slate-600">
                      {donation.date} • {donation.impact}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">₹{donation.amount.toLocaleString()}</p>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {donation.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Impact Stories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Your Impact Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="w-8 h-8 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Scholarship Impact</h4>
                  <p className="text-sm text-blue-700">Your contribution helped</p>
                </div>
              </div>
              <p className="text-sm text-blue-800">
                "Thanks to the scholarship fund, I was able to complete my degree without financial stress. Now I'm
                working at a top tech company!" - Priya S., Class of 2023
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <Building className="w-8 h-8 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">Infrastructure Impact</h4>
                  <p className="text-sm text-green-700">New lab equipment funded</p>
                </div>
              </div>
              <p className="text-sm text-green-800">
                The new AI/ML lab equipment you helped fund is now being used by 200+ students for cutting-edge research
                projects and practical learning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}