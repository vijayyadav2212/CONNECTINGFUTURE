"use client";

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Search, 
  MessageCircle, 
  UserMinus,
  Calendar,
  Building,
  GraduationCap,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

// Mock data for connections and requests
const mockConnections = [
  {
    id: 2,
    name: "Marcus Rodriguez",
    profilePicture: "/placeholder-user.jpg",
    currentPosition: "Product Manager",
    company: "Microsoft",
    connectedDate: "2024-01-15",
    mutualConnections: 5,
    lastMessage: "Thanks for connecting! Would love to discuss product strategy."
  },
  {
    id: 6,
    name: "David Thompson",
    profilePicture: "/placeholder-user.jpg",
    currentPosition: "Data Scientist",
    company: "Netflix",
    connectedDate: "2024-02-20",
    mutualConnections: 3,
    lastMessage: "Great connecting with a fellow data enthusiast!"
  }
];

const mockPendingRequests = [
  {
    id: 7,
    name: "Lisa Wang",
    profilePicture: "/placeholder-user.jpg",
    currentPosition: "UX Designer",
    company: "Adobe",
    requestDate: "2024-07-28",
    message: "Hi! I'd love to connect and learn more about your design process."
  },
  {
    id: 8,
    name: "Ahmed Hassan",
    profilePicture: "/placeholder-user.jpg",
    currentPosition: "Software Engineer",
    company: "Spotify",
    requestDate: "2024-07-30",
    message: "Fellow engineer here! Would love to connect and share experiences."
  }
];

const mockSentRequests = [
  {
    id: 9,
    name: "Jennifer Kim",
    profilePicture: "/placeholder-user.jpg",
    currentPosition: "Marketing Director",
    company: "Airbnb",
    requestDate: "2024-07-25",
    status: "pending"
  },
  {
    id: 10,
    name: "Robert Chen",
    profilePicture: "/placeholder-user.jpg",
    currentPosition: "DevOps Engineer",
    company: "Uber",
    requestDate: "2024-07-29",
    status: "pending"
  }
];

function ConnectionsPage() {
  const { user, error, isLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [connections, setConnections] = useState(mockConnections);
  const [pendingRequests, setPendingRequests] = useState(mockPendingRequests);
  const [sentRequests, setSentRequests] = useState(mockSentRequests);

  const handleAcceptRequest = (requestId: number) => {
    const request = pendingRequests.find(req => req.id === requestId);
    if (request) {
      // Add to connections
      const newConnection = {
        ...request,
        connectedDate: new Date().toISOString().split('T')[0],
        mutualConnections: Math.floor(Math.random() * 10),
        lastMessage: request.message
      };
      setConnections(prev => [...prev, newConnection]);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  const handleRejectRequest = (requestId: number) => {
    setPendingRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const handleRemoveConnection = (connectionId: number) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  };

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.currentPosition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl text-red-500">Authentication Error</h1>
          <a href="/api/auth/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/alumni/dashboard" className="flex items-center text-blue-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">My Connections</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <a href="/api/auth/logout">
                <Button variant="outline" size="sm">Logout</Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Connections</h1>
          <p className="text-gray-600">Manage your professional network</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{connections.length}</p>
                <p className="text-sm text-gray-600">Total Connections</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{pendingRequests.length}</p>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{sentRequests.length}</p>
                <p className="text-sm text-gray-600">Sent Requests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="connections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connections">My Connections</TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white px-1 py-0 text-xs">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">Sent Requests</TabsTrigger>
          </TabsList>

          {/* My Connections Tab */}
          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>My Connections ({connections.length})</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search connections..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredConnections.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={connection.profilePicture} alt={connection.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {connection.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{connection.name}</h3>
                          <p className="text-sm text-gray-600">{connection.currentPosition} at {connection.company}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              Connected {new Date(connection.connectedDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {connection.mutualConnections} mutual connections
                            </div>
                          </div>
                          {connection.lastMessage && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              "{connection.lastMessage.slice(0, 60)}..."
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleRemoveConnection(connection.id)}
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredConnections.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? "No connections found matching your search." : "No connections yet. Start connecting with alumni!"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Requests Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Connection Requests ({pendingRequests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-start justify-between p-4 border rounded-lg bg-yellow-50">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.profilePicture} alt={request.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {request.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{request.name}</h3>
                          <p className="text-sm text-gray-600">{request.currentPosition} at {request.company}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            Sent {new Date(request.requestDate).toLocaleDateString()}
                          </div>
                          <div className="mt-2 p-3 bg-white rounded border">
                            <p className="text-sm text-gray-700 italic">"{request.message}"</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No pending connection requests.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sent Requests Tab */}
          <TabsContent value="sent">
            <Card>
              <CardHeader>
                <CardTitle>Sent Connection Requests ({sentRequests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.profilePicture} alt={request.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {request.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{request.name}</h3>
                          <p className="text-sm text-gray-600">{request.currentPosition} at {request.company}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            Sent {new Date(request.requestDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Pending
                        </Badge>
                        <Button size="sm" variant="outline" className="text-red-600">
                          Cancel Request
                        </Button>
                      </div>
                    </div>
                  ))}
                  {sentRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No sent connection requests.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default withPageAuthRequired(ConnectionsPage);
