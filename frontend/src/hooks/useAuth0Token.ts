// hooks/useAuth0Token.js
import { useMockAuth } from '../lib/mockAuth0';
import { useState, useEffect } from 'react';

export function useAuth0Token() {
  const { token, isLoading } = useMockAuth();
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  useEffect(() => {
    setLocalToken(token);
    setTokenLoading(isLoading);
  }, [token, isLoading]);

  const refreshToken = async () => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('auth_token');
      setLocalToken(t);
      return t;
    }
    return null;
  };

  return {
    token: localToken,
    tokenLoading,
    refreshToken,
  };
}

export default useAuth0Token;
