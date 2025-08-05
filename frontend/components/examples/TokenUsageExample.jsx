// components/examples/TokenUsageExample.jsx
"use client";

import { useAuthToken } from '../../contexts/AuthTokenContext';
import apiClient from '../../lib/auth/apiClient';
import { useState } from 'react';

export default function TokenUsageExample() {
  const { token, tokenLoading, isAuthenticated, user } = useAuthToken();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const userProfile = await apiClient.getUserProfile();
      setProfile(userProfile.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const updateData = {
        name: user.name,
        bio: 'Updated bio via API',
        graduation_year: 2020
      };
      
      await apiClient.updateUserProfile(updateData);
      console.log('Profile updated successfully');
      
      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (tokenLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to use this feature.</div>;
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Token Usage Example</h2>
      
      <div className="mb-4">
        <p><strong>User:</strong> {user?.name || user?.email}</p>
        <p><strong>Token Status:</strong> {token ? 'Active' : 'None'}</p>
        <p><strong>Token Preview:</strong> {token ? `${token.substring(0, 20)}...` : 'N/A'}</p>
      </div>

      <div className="space-y-2">
        <button 
          onClick={fetchProfile}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Profile'}
        </button>
        
        <button 
          onClick={updateProfile}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Update Profile'}
        </button>
      </div>

      {profile && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h3 className="font-semibold">Profile Data:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
