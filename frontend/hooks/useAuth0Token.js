// hooks/useAuth0Token.js
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import tokenManager from '../lib/auth/tokenManager';

export function useAuth0Token() {
  const { user, isLoading } = useUser();
  const [token, setToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      if (!user || isLoading) {
        setTokenLoading(false);
        return;
      }

      try {
        // Try to get existing token first
        const existingToken = tokenManager.getToken();
        if (existingToken) {
          setToken(existingToken);
          setTokenLoading(false);
          return;
        }

        // Fetch new token from Auth0
        const response = await fetch('/api/auth/token');
        if (response.ok) {
          const data = await response.json();
          const accessToken = data.accessToken;
          
          // Store token using tokenManager
          tokenManager.setToken(accessToken, data.expiresIn || 3600);
          setToken(accessToken);
        } else {
          console.error('Failed to fetch token');
        }
      } catch (error) {
        console.error('Error fetching token:', error);
      } finally {
        setTokenLoading(false);
      }
    };

    fetchToken();
  }, [user, isLoading]);

  // Function to manually refresh token
  const refreshToken = async () => {
    setTokenLoading(true);
    tokenManager.clearToken();
    
    try {
      const response = await fetch('/api/auth/token');
      if (response.ok) {
        const data = await response.json();
        const accessToken = data.accessToken;
        tokenManager.setToken(accessToken, data.expiresIn || 3600);
        setToken(accessToken);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setTokenLoading(false);
    }
  };

  return {
    token,
    tokenLoading,
    refreshToken,
    isAuthenticated: !!user && !!token
  };
}
