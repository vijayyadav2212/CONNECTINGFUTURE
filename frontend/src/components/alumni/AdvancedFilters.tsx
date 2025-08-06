"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, X, Filter, Users, Building, MapPin, Clock, Heart } from "lucide-react";

interface AdvancedFiltersProps {
  isOpen: boolean;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

const skillsList = [
  "React", "JavaScript", "Python", "Java", "Node.js", "AWS", "Docker", 
  "Kubernetes", "Machine Learning", "Data Science", "Product Management",
  "Marketing", "Sales", "Design", "Leadership", "Project Management"
];

const companiesList = [
  "Google", "Microsoft", "Amazon", "Apple", "Facebook", "Netflix", "Tesla",
  "Spotify", "Airbnb", "Uber", "LinkedIn", "Twitter", "Adobe", "Salesforce"
];

const locationsList = [
  "San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", 
  "Boston, MA", "Chicago, IL", "Los Angeles, CA", "Toronto, ON",
  "London, UK", "Berlin, Germany", "Sydney, Australia", "Bangalore, India"
];

export function AdvancedFilters({ isOpen, onFiltersChange, onClearFilters }: AdvancedFiltersProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [experienceRange, setExperienceRange] = useState({ min: "", max: "" });
  const [jobLevels, setJobLevels] = useState<string[]>([]);
  const [isOpenToMentoring, setIsOpenToMentoring] = useState(false);
  const [isOpenToCollaboration, setIsOpenToCollaboration] = useState(false);

  const handleSkillToggle = (skill: string) => {
    const updated = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(updated);
    updateFilters({ skills: updated });
  };

  const handleCompanyToggle = (company: string) => {
    const updated = selectedCompanies.includes(company)
      ? selectedCompanies.filter(c => c !== company)
      : [...selectedCompanies, company];
    setSelectedCompanies(updated);
    updateFilters({ companies: updated });
  };

  const handleLocationToggle = (location: string) => {
    const updated = selectedLocations.includes(location)
      ? selectedLocations.filter(l => l !== location)
      : [...selectedLocations, location];
    setSelectedLocations(updated);
    updateFilters({ locations: updated });
  };

  const handleJobLevelToggle = (level: string) => {
    const updated = jobLevels.includes(level)
      ? jobLevels.filter(l => l !== level)
      : [...jobLevels, level];
    setJobLevels(updated);
    updateFilters({ jobLevels: updated });
  };

  const updateFilters = (newFilters: any) => {
    onFiltersChange({
      skills: selectedSkills,
      companies: selectedCompanies,
      locations: selectedLocations,
      experienceRange,
      jobLevels,
      isOpenToMentoring,
      isOpenToCollaboration,
      ...newFilters
    });
  };

  const clearAllFilters = () => {
    setSelectedSkills([]);
    setSelectedCompanies([]);
    setSelectedLocations([]);
    setExperienceRange({ min: "", max: "" });
    setJobLevels([]);
    setIsOpenToMentoring(false);
    setIsOpenToCollaboration(false);
    onClearFilters();
  };

  if (!isOpen) return null;

  return (
    <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-lg">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Advanced Filters</h3>
              <p className="text-sm text-gray-600">Refine your search with detailed criteria</p>
            </div>
          </div>
          <Button 
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Skills Filter */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Skills & Expertise</span>
            </div>
            <div className="flex items-center gap-3">
              {selectedSkills.length > 0 && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 shadow-sm">
                  {selectedSkills.length} selected
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100">
              {skillsList.map(skill => (
                <div key={skill} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/80 transition-all duration-200 border border-transparent hover:border-blue-200">
                  <Checkbox
                    id={`skill-${skill}`}
                    checked={selectedSkills.includes(skill)}
                    onCheckedChange={() => handleSkillToggle(skill)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label 
                    htmlFor={`skill-${skill}`}
                    className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {skill}
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Company Filter */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-sm">
                <Building className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Companies</span>
            </div>
            <div className="flex items-center gap-3">
              {selectedCompanies.length > 0 && (
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm">
                  {selectedCompanies.length} selected
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-6 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl border border-indigo-100">
              {companiesList.map(company => (
                <div key={company} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/80 transition-all duration-200 border border-transparent hover:border-indigo-200">
                  <Checkbox
                    id={`company-${company}`}
                    checked={selectedCompanies.includes(company)}
                    onCheckedChange={() => handleCompanyToggle(company)}
                    className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <Label 
                    htmlFor={`company-${company}`}
                    className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    {company}
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Location Filter */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-200 border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Locations</span>
            </div>
            <div className="flex items-center gap-3">
              {selectedLocations.length > 0 && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 shadow-sm">
                  {selectedLocations.length} selected
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-6 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl border border-purple-100">
              {locationsList.map(location => (
                <div key={location} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/80 transition-all duration-200 border border-transparent hover:border-purple-200">
                  <Checkbox
                    id={`location-${location}`}
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={() => handleLocationToggle(location)}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label 
                    htmlFor={`location-${location}`}
                    className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
                  >
                    {location}
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Experience and Special Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <Label className="font-bold text-gray-900">Experience Range (Years)</Label>
            </div>
            <div className="flex gap-3 items-center">
              <Input
                type="number"
                placeholder="Min"
                value={experienceRange.min}
                onChange={(e) => {
                  const updated = { ...experienceRange, min: e.target.value };
                  setExperienceRange(updated);
                  updateFilters({ experienceRange: updated });
                }}
                className="flex-1 h-12 border-green-200 focus:ring-2 focus:ring-green-500/20 rounded-xl bg-white shadow-sm"
              />
              <span className="text-gray-500 font-medium">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={experienceRange.max}
                onChange={(e) => {
                  const updated = { ...experienceRange, max: e.target.value };
                  setExperienceRange(updated);
                  updateFilters({ experienceRange: updated });
                }}
                className="flex-1 h-12 border-green-200 focus:ring-2 focus:ring-green-500/20 rounded-xl bg-white shadow-sm"
              />
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg shadow-sm">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <Label className="font-bold text-gray-900">Special Interests</Label>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/60 transition-colors">
                <Checkbox
                  id="mentoring"
                  checked={isOpenToMentoring}
                  onCheckedChange={(checked) => {
                    setIsOpenToMentoring(checked as boolean);
                    updateFilters({ isOpenToMentoring: checked });
                  }}
                  className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                />
                <Label htmlFor="mentoring" className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-pink-600 transition-colors">
                  Open to Mentoring
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/60 transition-colors">
                <Checkbox
                  id="collaboration"
                  checked={isOpenToCollaboration}
                  onCheckedChange={(checked) => {
                    setIsOpenToCollaboration(checked as boolean);
                    updateFilters({ isOpenToCollaboration: checked });
                  }}
                  className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                />
                <Label htmlFor="collaboration" className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-pink-600 transition-colors">
                  Open to Collaboration
                </Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}