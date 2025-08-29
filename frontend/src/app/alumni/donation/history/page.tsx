"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Calendar, IndianRupee, Filter, Search, TrendingUp, Gift, Award, ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import AlumniNavigation from '../../AluminaNavigation/AlumniNavigation';

interface Donation {
  id: number;
  donor_name: string;
  donor_email: string;
  amount: string;
  currency: string;
  payment_method: string;
  payment_id: string;
  transaction_status: string;
  donation_type: string;
  cause_category: string;
  message: string;
  created_at: string;
  updated_at: string;
}

interface DonationResponse {
  donations: Donation[];
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

interface Analytics {
  total_donated: string;
  total_donations: number;
  avg_donation: string;
  top_donor: string;
  recent_donations: number;
}

export default function DonationHistory() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  // Fetch donations from backend
  const fetchDonations = async (page: number = 1, email?: string, status?: string) => {
    try {
      setLoading(true);
      let url = `${backendUrl}/api/donations?page=${page}&limit=10`;
      
      if (email && email.trim()) {
        url += `&donor_email=${encodeURIComponent(email.trim())}`;
      }
      
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: DonationResponse = await response.json();
      setDonations(data.donations);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch donations');
      setDonations([]);
      setCurrentPage(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/donations/analytics/summary`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Analytics = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    fetchDonations();
    fetchAnalytics();
  }, []);

  // Filter donations by current user's email
  const handleMyDonations = () => {
    if (user?.email) {
      setSearchEmail(user.email);
      fetchDonations(1, user.email, statusFilter !== 'all' ? statusFilter : undefined);
    }
  };

  // Handle search and filter
  const handleSearch = () => {
    fetchDonations(1, searchEmail, statusFilter !== 'all' ? statusFilter : undefined);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchDonations(1, searchEmail, status !== 'all' ? status : undefined);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchDonations(page, searchEmail, statusFilter !== 'all' ? statusFilter : undefined);
  };

  // Format currency
  const formatCurrency = (amount: string, currency: string = 'INR') => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(numAmount);
  };

  // Format date (IST) with time
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (userLoading) {
    return (
      <AlumniNavigation>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading...</p>
          </div>
        </div>
      </AlumniNavigation>
    );
  }

  return (
    <AlumniNavigation>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Enhanced Header Section */}
          <div className="relative mb-8">
            {/* Back Button - Enhanced */}
            <Button 
              variant="outline" 
              onClick={() => router.push('/alumni/donation')}
              className="mb-6 bg-white/90 hover:bg-white backdrop-blur-lg border-2 border-purple-200 hover:border-purple-400 shadow-xl hover:shadow-2xl transition-all duration-300 group text-gray-800 hover:text-purple-700 font-semibold"
            >
              <ArrowLeft className="h-5 w-5 mr-3 group-hover:-translate-x-1 transition-transform duration-300 text-purple-600" />
              <span className="text-lg">Back to Donation</span>
            </Button>

            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-blue-200/30 rounded-full blur-3xl -z-10"></div>
            <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-pink-200/40 to-purple-200/40 rounded-full blur-2xl -z-10"></div>
            
            {/* Enhanced Header */}
            <div className="text-center mb-12 relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl mb-6 shadow-2xl">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Donation History
              </h1>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Track your contributions and witness the <span className="font-semibold text-purple-700">collective impact</span> of our community's generosity
              </p>
              
              {/* Floating decorative elements */}
              <div className="absolute -top-4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <div className="absolute top-8 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-300"></div>
              <div className="absolute -bottom-2 left-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-500"></div>
            </div>
          </div>

          {/* Enhanced Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
              <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-2xl border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    Total Donated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{formatCurrency(analytics.total_donated)}</div>
                  <div className="text-blue-100 text-sm opacity-80">Community Impact</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 text-white shadow-2xl border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Gift className="h-4 w-4" />
                    </div>
                    Total Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{analytics.total_donations}</div>
                  <div className="text-green-100 text-sm opacity-80">Generous Hearts</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700 text-white shadow-2xl border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <IndianRupee className="h-4 w-4" />
                    </div>
                    Avg Donation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{formatCurrency(analytics.avg_donation)}</div>
                  <div className="text-purple-100 text-sm opacity-80">Per Contribution</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-2xl border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Award className="h-4 w-4" />
                    </div>
                    Top Donor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold truncate mb-1">{analytics.top_donor || 'N/A'}</div>
                  <div className="text-orange-100 text-sm opacity-80">Leading Supporter</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500 via-pink-600 to-rose-700 text-white shadow-2xl border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Calendar className="h-4 w-4" />
                    </div>
                    Recent (30d)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{analytics.recent_donations}</div>
                  <div className="text-pink-100 text-sm opacity-80">This Month</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Filters and Search */}
          <Card className="mb-10 bg-white/70 backdrop-blur-lg border-0 shadow-2xl transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold">Advanced Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors duration-300" />
                    <Input
                      placeholder="Search by donor email..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-400 rounded-xl transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-400 rounded-xl transition-all duration-300 bg-white/50 backdrop-blur-sm">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="border-0 shadow-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleSearch} 
                  className="h-12 px-8 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl shadow-lg transition-all duration-300"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {user?.email && (
                  <Button 
                    onClick={handleMyDonations} 
                    variant="outline" 
                    className="h-12 px-6 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl transition-all duration-300"
                  >
                    <Heart className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="text-purple-700 font-medium">My Donations</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Error Message */}
          {error && (
            <Card className="mb-8 border-0 bg-gradient-to-r from-red-50 to-pink-50 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-red-800">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Heart className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-lg">Oops! Something went wrong</span>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Donations List */}
          <Card className="bg-white/70 backdrop-blur-lg border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold">Donation Records</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-16">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto animation-delay-150"></div>
                  </div>
                  <p className="mt-6 text-gray-700 text-lg">Loading your donation history...</p>
                  <p className="text-gray-600">Please wait while we gather your data</p>
                </div>
              ) : donations.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-xl font-medium mb-2">No donations found</p>
                  <p className="text-gray-600 text-lg">Try adjusting your search criteria or make your first donation!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {donations.map((donation, index) => (
                    <div
                      key={donation.id}
                      className="relative bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-lg transition-all duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >                      
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {donation.donor_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-xl text-gray-800">{donation.donor_name}</h3>
                              <Badge className={`${getStatusColor(donation.transaction_status)} font-medium px-3 py-1 rounded-full`}>
                                {donation.transaction_status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-700 font-medium mb-2">{donation.donor_email}</p>
                          {donation.message && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-3 mb-4">
                              <p className="text-blue-800 italic">"{donation.message}"</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              {formatDate(donation.created_at)}
                            </span>
                            <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              {donation.payment_id}
                            </span>
                            <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                              {donation.payment_method}
                            </span>
                            {donation.cause_category && (
                              <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                {donation.cause_category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right md:text-center">
                          <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text mb-2">
                            {formatCurrency(donation.amount, donation.currency)}
                          </div>
                          <div className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full inline-block">
                            {donation.donation_type}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-10 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="h-12 px-6 border-2 border-purple-200 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-6 py-3 text-lg font-semibold text-gray-800 bg-white rounded-xl shadow-md border border-gray-200">
                      Page <span className="text-purple-700">{currentPage}</span> of <span className="text-blue-700">{totalPages}</span>
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="h-12 px-6 border-2 border-purple-200 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AlumniNavigation>
  );
}
