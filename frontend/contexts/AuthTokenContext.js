// contexts/AuthTokenContext.js
"use client";

import React, { createContext, useContext } from 'react';
import { useMockAuth } from '../src/lib/mockAuth0';

const AuthTokenContext = createContext();

export function AuthTokenProvider({ children }) {
  const { user, token, isLoading } = useMockAuth();

  const refreshToken = async () => {
    return token;
  };

  const value = {
    token,
    tokenLoading: isLoading,
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
