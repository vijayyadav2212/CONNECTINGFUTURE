// hooks/useAuth0Token.js
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';

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
        // Fetch token from Auth0
        const response = await fetch('/api/auth/token');
        if (response.ok) {
          const data = await response.json();
          const accessToken = data.accessToken;
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
    try {
      const response = await fetch('/api/auth/token');
      if (response.ok) {
        const data = await response.json();
        setToken(data.accessToken);
        return data.accessToken;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
    return null;
  };

  return {
    token,
    tokenLoading,
    refreshToken,
  };
}

export default useAuth0Token;
