"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  token: string | null;
  login: (token: string, refreshToken: string, userData: any) => void;
  logout: () => void;
}

const Auth0Context = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('cf_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token_expiry');
        localStorage.removeItem('cf_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (jwtToken: string, refreshToken: string, userData: any) => {
    setToken(jwtToken);
    
    const mappedUser = {
      sub: userData.auth0_id || `local|${userData.id}`,
      email: userData.email,
      name: userData.name || userData.email,
      picture: userData.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.email}`,
      ...userData
    };
    setUser(mappedUser);
    
    localStorage.setItem('auth_token', jwtToken);
    localStorage.setItem('auth_token_expiry', new Date(Date.now() + 15 * 60 * 1000).toISOString());
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    localStorage.setItem('cf_user', JSON.stringify(mappedUser));
    
    // Also set standard cookie so Edge Middleware can inspect it
    document.cookie = `cf_token=${jwtToken}; path=/; max-age=900; SameSite=Lax`;
    if (refreshToken) {
      document.cookie = `cf_refresh_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token_expiry');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('cf_user');
    document.cookie = "cf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "cf_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setToken(null);
    setUser(null);
    router.push('/');
  };

  return (
    <Auth0Context.Provider value={{ user, token, isLoading, error, login, logout }}>
      {children}
    </Auth0Context.Provider>
  );
}

export function useUser() {
  const context = useContext(Auth0Context);
  return {
    user: context.user,
    isLoading: context.isLoading,
    error: context.error,
  };
}

export function useMockAuth() {
  return useContext(Auth0Context);
}

export function withPageAuthRequired(Component: any) {
  return function AuthenticatedComponent(props: any) {
    const { user, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/login');
      }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
