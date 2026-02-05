"use client";

import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Linkedin, 
  MapPin, 
  Building, 
  GraduationCap, 
  MessageCircle, 
  UserPlus,
  Calendar,
  Briefcase,
  Award,
  Globe
} from "lucide-react";

interface AlumniProfileDialogProps {
  alumni: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (alumniId: number) => void;
  onMessage: (alumniId: number) => void;
}

export function AlumniProfileDialog({ 
  alumni, 
  open, 
  onOpenChange, 
  onConnect, 
  onMessage 
}: AlumniProfileDialogProps) {
  if (!alumni) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={alumni.profilePicture} alt={alumni.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-semibold">
                {alumni.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{alumni.name}</DialogTitle>
              <p className="text-blue-600 font-semibold text-lg">{alumni.currentPosition}</p>
              <p className="text-gray-600 mb-3">{alumni.company}</p>
              
              <div className="flex gap-2 mb-4">
                <Button 
                  onClick={() => onMessage(alumni.id)}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
                <Button 
                  variant={alumni.isConnected ? "outline" : "outline"}
                  onClick={() => onConnect(alumni.id)}
                  className={alumni.isConnected ? "text-green-600 border-green-600" : ""}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {alumni.isConnected ? "Connected" : "Connect"}
                </Button>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span>Class of {alumni.graduationYear} • {alumni.branch}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building className="w-4 h-4" />
                  <span>{alumni.industry}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{alumni.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span>{alumni.country}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="about" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="skills">Skills & Interests</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-gray-600">{alumni.bio}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Quick Facts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Graduation Year</span>
                    </div>
                    <span className="text-gray-600">{alumni.graduationYear}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Degree</span>
                    </div>
                    <span className="text-gray-600">{alumni.degree}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Building className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Industry</span>
                    </div>
                    <span className="text-gray-600">{alumni.industry}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span className="font-medium">Location</span>
                    </div>
                    <span className="text-gray-600">{alumni.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="experience" className="mt-6">
            <div className="space-y-6">
              <h3 className="font-semibold">Professional Experience</h3>
              
              {/* Current Position */}
              <div className="border-l-2 border-blue-500 pl-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{alumni.currentPosition}</h4>
                      <p className="text-blue-600 font-medium">{alumni.company}</p>
                      <p className="text-sm text-gray-500">2022 - Present</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Current</Badge>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Leading innovative projects and driving digital transformation initiatives. 
                    Working with cross-functional teams to deliver exceptional results.
                  </p>
                </div>
              </div>

              {/* Previous positions would be listed here */}
              <div className="border-l-2 border-gray-300 pl-4">
                <div className="p-4">
                  <h4 className="font-semibold">Senior Developer</h4>
                  <p className="text-gray-700 font-medium">TechStart Inc.</p>
                  <p className="text-sm text-gray-500">2020 - 2022</p>
                  <p className="text-gray-600 text-sm mt-2">
                    Developed and maintained web applications, mentored junior developers.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="education" className="mt-6">
            <div className="space-y-6">
              <h3 className="font-semibold">Education</h3>
              
              <div className="border-l-2 border-purple-500 pl-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{alumni.degree}</h4>
                      <p className="text-purple-600 font-medium">{alumni.branch}</p>
                      <p className="text-sm text-gray-500">ABC Engineering College</p>
                      <p className="text-sm text-gray-500">Graduated: {alumni.graduationYear}</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Alumni</Badge>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Graduated with distinction. Active in various clubs and technical societies.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {alumni.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Domain Expertise</h3>
                <Badge className="bg-green-100 text-green-800">{alumni.domain}</Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Mentoring</Badge>
                  <Badge variant="outline">Innovation</Badge>
                  <Badge variant="outline">Technology Trends</Badge>
                  <Badge variant="outline">Leadership</Badge>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}