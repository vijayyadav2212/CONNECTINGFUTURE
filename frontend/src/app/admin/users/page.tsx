"use client";

import React, { useState } from 'react';

import { 
  Users, Search, Filter, Edit, Trash2, Shield,
  UserCheck, UserX, Mail, GraduationCap, Building,
  MapPin, Eye
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  userType: 'alumni' | 'student' | 'admin';
  role: 'user' | 'admin' | 'moderator';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  graduationYear?: number;
  major?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  registrationCompleted: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'alumni' | 'student' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [users, setUsers] = useState<User[]>([]);

  // Fetch users from backend via proxy
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/api/admin/users', { cache: 'no-store' });
        if (!resp.ok) {
          console.warn('Failed to load users', resp.status);
          return;
        }
        const data = await resp.json();
        const list = data.users || data.users || [];
        if (!mounted) return;
        // Normalize to local shape
        const mapped = (list || []).map((u: any) => ({
          id: u.id,
          name: u.name || u.email || 'Unknown',
          email: u.email || '',
          userType: u.user_type || u.userType || 'alumni',
          role: u.role || 'user',
          approvalStatus: (u.approval_status || 'approved') as 'pending' | 'approved' | 'rejected',
          graduationYear: u.graduation_year,
          major: u.major,
          company: u.company,
          jobTitle: u.job_title,
          location: u.location,
          registrationCompleted: !!u.registration_completed,
          createdAt: u.created_at || u.createdAt || new Date().toISOString()
        }));
        setUsers(mapped);
      } catch (e) {
        console.warn('Error fetching users', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleRoleChange = (userId: number, newRole: 'user' | 'admin' | 'moderator') => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleStatusChange = async (userId: number, newStatus: 'pending' | 'approved' | 'rejected') => {
    // Optimistic update
    setUsers(users.map(u => u.id === userId ? { ...u, approvalStatus: newStatus } : u));
    try {
      const resp = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: userId, approval_status: newStatus }) });
      if (!resp.ok) {
        console.warn('Approval update failed', resp.status);
        // revert by refetching
        const r = await fetch('/api/admin/users', { cache: 'no-store' });
        const data = await r.json();
        setUsers((data.users || []).map((u: any) => ({
          id: u.id,
          name: u.name || u.email || 'Unknown',
          email: u.email || '',
          userType: u.user_type || u.userType || 'alumni',
          role: u.role || 'user',
          approvalStatus: (u.approval_status || 'approved') as 'pending' | 'approved' | 'rejected',
          graduationYear: u.graduation_year,
          major: u.major,
          company: u.company,
          jobTitle: u.job_title,
          location: u.location,
          registrationCompleted: !!u.registration_completed,
          createdAt: u.created_at || u.createdAt || new Date().toISOString()
        })));
      }
    } catch (e) {
      console.warn('Approval update error', e);
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const filteredUsersBase = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredStudents = filteredUsersBase.filter(u => u.userType === 'student');
  const filteredAlumni = filteredUsersBase.filter(u => u.userType === 'alumni');
  const filteredAdmins = filteredUsersBase.filter(u => u.userType === 'admin');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected</span>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium flex items-center"><Shield className="w-3 h-3 mr-1" />Admin</span>;
      case 'moderator':
        return <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">Moderator</span>;
      case 'user':
        return <span className="px-2 py-1 bg-[#f6f3eb] text-teal-900 rounded-full text-xs font-medium">User</span>;
      default:
        return null;
    }
  };

  const getUserTypeBadge = (type: string) => {
    const colors = {
      'alumni': 'bg-teal-100 text-teal-700',
      'student': 'bg-green-100 text-green-700',
      'admin': 'bg-teal-100 text-teal-700'
    };
    return <span className={`px-2 py-1 ${colors[type as keyof typeof colors]} rounded text-xs font-medium capitalize`}>{type}</span>;
  };

  const stats = {
    total: users.length,
    alumni: users.filter(u => u.userType === 'alumni').length,
    students: users.filter(u => u.userType === 'student').length,
    admins: users.filter(u => u.userType === 'admin').length,
    pending: users.filter(u => u.approvalStatus === 'pending').length,
  };

  const UsersTable = ({
    title,
    tableUsers,
    showRole,
    showApprovalActions,
  }: {
    title: string;
    tableUsers: User[];
    showRole: boolean;
    showApprovalActions: boolean;
  }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-teal-900/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-teal-900/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-teal-950">{title}</h2>
            <p className="text-sm text-teal-700 mt-0.5">
              Pending: {tableUsers.filter(u => u.approvalStatus === 'pending').length} • Total: {tableUsers.length}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f6f3eb] border-b border-teal-900/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Type</th>
                {showRole && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Role</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-teal-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableUsers.length === 0 ? (
                <tr>
                  <td colSpan={showRole ? 7 : 6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-teal-700">No users found</p>
                  </td>
                </tr>
              ) : (
                tableUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f6f3eb] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-teal-950 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-teal-950">{user.name}</div>
                          <div className="text-sm text-teal-700 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getUserTypeBadge(user.userType)}</td>
                    {showRole && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.approvalStatus)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-teal-950">
                        {user.major && (
                          <div className="flex items-center mb-1">
                            <GraduationCap className="w-3 h-3 mr-1 text-teal-700" />
                            <span>{user.major}</span>
                          </div>
                        )}
                        {user.company && (
                          <div className="flex items-center mb-1">
                            <Building className="w-3 h-3 mr-1 text-teal-700" />
                            <span>{user.jobTitle} at {user.company}</span>
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-teal-700" />
                            <span className="text-teal-700">{user.location}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-teal-700">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {showApprovalActions && (
                          <>
                            <button
                              onClick={() => handleStatusChange(user.id, 'approved')}
                              disabled={user.approvalStatus !== 'pending'}
                              className={
                                user.approvalStatus === 'pending'
                                  ? 'text-green-600 hover:text-green-900'
                                  : 'text-gray-300 cursor-not-allowed'
                              }
                              title="Approve"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(user.id, 'rejected')}
                              disabled={user.approvalStatus !== 'pending'}
                              className={
                                user.approvalStatus === 'pending'
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-gray-300 cursor-not-allowed'
                              }
                              title="Reject"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button className="text-teal-900 hover:text-teal-900" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-teal-800 hover:text-teal-950" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-teal-950">User Management</h1>
          <p className="text-teal-800 mt-2">Manage users, roles, and permissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-900/10">
            <p className="text-sm text-teal-800">Total Users</p>
            <p className="text-2xl font-bold text-teal-950 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-900/10">
            <p className="text-sm text-teal-800">Alumni</p>
            <p className="text-2xl font-bold text-teal-900 mt-1">{stats.alumni}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-900/10">
            <p className="text-sm text-teal-800">Students</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.students}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-900/10">
            <p className="text-sm text-teal-800">Admins</p>
            <p className="text-2xl font-bold text-teal-950 mt-1">{stats.admins}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-900/10">
            <p className="text-sm text-teal-800">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-teal-900/10 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-teal-700" />
              
              {/* User Type Filter */}
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="all">Show Students + Alumni</option>
                <option value="alumni">Alumni</option>
                <option value="student">Students</option>
                <option value="admin">Admins</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students + Alumni approval sections */}
        {userTypeFilter === 'all' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <UsersTable title="Students" tableUsers={filteredStudents} showRole={false} showApprovalActions={true} />
            <UsersTable title="Alumni" tableUsers={filteredAlumni} showRole={false} showApprovalActions={true} />
          </div>
        ) : userTypeFilter === 'student' ? (
          <UsersTable title="Students" tableUsers={filteredStudents} showRole={false} showApprovalActions={true} />
        ) : userTypeFilter === 'alumni' ? (
          <UsersTable title="Alumni" tableUsers={filteredAlumni} showRole={false} showApprovalActions={true} />
        ) : (
          <UsersTable title="Admins" tableUsers={filteredAdmins} showRole={true} showApprovalActions={false} />
        )}
      </div>
    </>
  );
}
