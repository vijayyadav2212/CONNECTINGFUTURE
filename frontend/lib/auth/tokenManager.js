// lib/auth/tokenManager.js
import { getAccessToken } from '@auth0/nextjs-auth0';

class TokenManager {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  // Store token in memory and localStorage
  setToken(token, expiresIn = 3600) {
    this.token = token;
    this.tokenExpiry = new Date(Date.now() + (expiresIn * 1000));
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_token_expiry', this.tokenExpiry.toISOString());
    }
  }

  // Get token from memory or localStorage
  getToken() {
    // If we have token in memory and it's not expired, return it
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      const storedExpiry = localStorage.getItem('auth_token_expiry');
      
      if (storedToken && storedExpiry) {
        const expiryDate = new Date(storedExpiry);
        if (new Date() < expiryDate) {
          this.token = storedToken;
          this.tokenExpiry = expiryDate;
          return storedToken;
        } else {
          // Token expired, clear it
          this.clearToken();
        }
      }
    }

    return null;
  }

  // Clear token from memory and localStorage
  clearToken() {
    this.token = null;
    this.tokenExpiry = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_expiry');
    }
  }

  // Check if token is valid (not expired)
  isTokenValid() {
    const token = this.getToken();
    return token !== null;
  }

  // Get token for API calls (for server-side)
  async getServerSideToken(req, res) {
    try {
      const { accessToken } = await getAccessToken(req, res, {
        scopes: ['openid', 'profile', 'email']
      });
      return accessToken;
    } catch (error) {
      console.error('Error getting server-side token:', error);
      return null;
    }
  }
}

// Create a singleton instance
const tokenManager = new TokenManager();

export default tokenManager;
