"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AlumniNavigation from "../../AluminaNavigation/AlumniNavigation";

type Roadmap = {
  id: number;
  owner_email: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  phases: number;
  tags?: string | null;
  followers?: number;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function RoadmapDetailsPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${backendUrl}/api/roadmaps/${id}`)
      .then(r => r.json())
      .then(setRoadmap)
      .catch(() => setRoadmap(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AlumniNavigation>
      <div className="p-6 min-h-screen bg-gray-50">
        {loading && <p>Loading...</p>}
        {!loading && !roadmap && <p className="text-red-600">Roadmap not found.</p>}
        {roadmap && (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">{roadmap.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{roadmap.description}</p>
              <div className="flex gap-2">
                <Badge variant="outline">{roadmap.category}</Badge>
                <Badge variant="outline">{roadmap.level}</Badge>
                {roadmap.tags && <Badge variant="secondary">{roadmap.tags}</Badge>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phases</p>
                  <p className="text-lg font-semibold">{roadmap.phases}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-lg font-semibold">{roadmap.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Followers</p>
                  <p className="text-lg font-semibold">{roadmap.followers ?? 0}</p>
                </div>
              </div>
              <Button asChild variant="outline">
                <a href="/alumni/roadmap">Back to roadmaps</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AlumniNavigation>
  );
}
