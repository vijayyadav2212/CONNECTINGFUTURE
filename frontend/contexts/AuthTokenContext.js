// contexts/AuthTokenContext.js
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import tokenManager from '../lib/auth/tokenManager';

const AuthTokenContext = createContext();

export function AuthTokenProvider({ children }) {
  const { user, isLoading } = useUser();
  const [token, setToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  useEffect(() => {
    const initializeToken = async () => {
      if (isLoading) return;

      if (!user) {
        // User is not logged in, clear any existing token
        tokenManager.clearToken();
        setToken(null);
        setTokenLoading(false);
        return;
      }

      // Check if we already have a valid token
      const existingToken = tokenManager.getToken();
      if (existingToken) {
        setToken(existingToken);
        setTokenLoading(false);
        return;
      }

      // Fetch new token
      try {
        const response = await fetch('/api/auth/token');
        if (response.status === 204) {
          // Not authenticated or no token available yet
          setToken(null);
          tokenManager.clearToken();
        } else if (response.ok) {
          const data = await response.json();
          if (data?.accessToken) {
            tokenManager.setToken(data.accessToken, data.expiresIn);
            setToken(data.accessToken);
            // Trigger a background profile fetch to ensure user is saved in DB
            try { fetch('/api/user/profile', { cache: 'no-store' }).catch(() => {}); } catch {}
          } else {
            setToken(null);
            tokenManager.clearToken();
          }
        } else {
          // Non-OK and not 204: avoid throwing; just clear token
          setToken(null);
          tokenManager.clearToken();
        }
      } catch (error) {
        // Network issues: clear token silently
        setToken(null);
        tokenManager.clearToken();
      } finally {
        setTokenLoading(false);
      }
    };

    initializeToken();
  }, [user, isLoading]);

  const refreshToken = async () => {
    if (!user) return null;

    setTokenLoading(true);
    tokenManager.clearToken();

    try {
      const response = await fetch('/api/auth/token');
      if (response.status === 204) {
        setToken(null);
        return null;
      }
      if (response.ok) {
        const data = await response.json();
        tokenManager.setToken(data.accessToken, data.expiresIn);
        setToken(data.accessToken);
        // Trigger background profile fetch to ensure DB save
        try { fetch('/api/user/profile', { cache: 'no-store' }).catch(() => {}); } catch {}
        return data.accessToken;
      }
    } catch (error) {
      // ignore
    } finally {
      setTokenLoading(false);
    }
    return null;
  };

  const value = {
    token,
    tokenLoading,
    refreshToken,
    isAuthenticated: !!user && !!token,
    user
  };

  return (
    <AuthTokenContext.Provider value={value}>
      {children}
    </AuthTokenContext.Provider>
  );
}

export function useAuthToken() {
  const context = useContext(AuthTokenContext);
  if (context === undefined) {
    throw new Error('useAuthToken must be used within an AuthTokenProvider');
  }
  return context;
}
