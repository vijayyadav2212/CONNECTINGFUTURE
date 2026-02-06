"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  MapPin,
  Calendar,
  Building,
  Edit,
  ArrowLeft,
  Github,
  Globe,
} from "lucide-react";

function ProfilePage() {
  const { user, error, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-500">
            Authentication Error
          </h1>
          <a
            href="/api/auth/login"
            className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ---------- HEADER ---------- */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-6">
            <Link
              href="/alumni/dashboard"
              className="flex items-center text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Link>

            <h1 className="text-xl font-bold text-gray-900">
              My Profile
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">
              {user.name}
            </span>
            <a href="/api/auth/logout">
              <Button variant="outline" size="sm">
                Logout
              </Button>
            </a>
          </div>

        </div>
      </nav>

      {/* ---------- CONTENT ---------- */}
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* PROFILE CARD */}
        <Card className="shadow-md">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">

              <Avatar className="w-28 h-28">
                <AvatarImage
                  src={user.picture || "/placeholder-user.jpg"}
                />
                <AvatarFallback className="text-2xl font-bold">
                  {user.name?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">

                <div className="flex justify-between items-start">

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.name}
                    </h2>

                    <p className="text-gray-600 mt-1">
                      Senior Software Architect
                    </p>

                    <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm text-gray-600">

                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        {user.email}
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        Bangalore, India
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Class of 2016
                      </div>

                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        TechCorp Solutions
                      </div>

                    </div>
                  </div>

                  <Button
                    onClick={() =>
                    (window.location.href =
                      "/registration?redirect=/alumni/profile")
                    }
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>

                </div>

                <p className="mt-4 text-gray-700 leading-relaxed">
                  Passionate software architect with 8+ years of experience in
                  building scalable systems. Actively mentoring students and
                  contributing to the alumni community.
                </p>

                <div className="flex gap-3 mt-4">

                  <Button variant="outline" size="sm">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Button>

                  <Button variant="outline" size="sm">
                    <Globe className="w-4 h-4 mr-2" />
                    Portfolio
                  </Button>

                </div>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* INFO GRID */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* PROFESSIONAL */}
          <InfoCard
            title="Professional Information"
            items={[
              ["Current Position", "Senior Software Architect"],
              ["Industry", "Information Technology"],
              ["Experience", "8+ Years"],
            ]}
            badges={[
              "System Architecture",
              "Microservices",
              "Cloud",
              "Leadership",
            ]}
          />

          {/* ACADEMIC */}
          <InfoCard
            title="Academic Information"
            items={[
              ["Degree", "B.Tech Computer Science"],
              ["Institution", "ABC Engineering College"],
              ["Graduation Year", "2016"],
              ["CGPA", "8.5 / 10"],
            ]}
          />

        </div>

        {/* ACTIVITY */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Activity text="Hosted AMA Session: Breaking into Tech Industry" />
            <Activity text="Posted Job Opening: Senior Software Engineer" />
            <Activity text="Updated Career Timeline" />
            <Activity text="Donated ₹10,000 to Scholarship Fund" />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function InfoCard({ title, items, badges }: any) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">

        {items.map((item: any, i: number) => (
          <div key={i}>
            <p className="font-medium text-gray-900">{item[0]}</p>
            <p className="text-gray-600">{item[1]}</p>
          </div>
        ))}

        {badges && (
          <div className="flex flex-wrap gap-2 pt-2">
            {badges.map((b: string) => (
              <Badge key={b} variant="outline">
                {b}
              </Badge>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}

function Activity({ text }: any) {
  return (
    <div className="p-3 bg-slate-100 rounded-lg text-sm text-gray-700">
      {text}
    </div>
  );
}

export default withPageAuthRequired(ProfilePage);
