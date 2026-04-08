// lib/auth/tokenManager.js
import { getAccessToken } from '@auth0/nextjs-auth0';

const SESSION_TTL_SECONDS = 3 * 60 * 60;
const REFRESH_BUFFER_SECONDS = 5 * 60; // Refresh when 5 minutes remain
const MIN_REFRESH_INTERVAL = 30 * 1000; // Minimum 30 seconds between refresh attempts

class TokenManager {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.refreshTimer = null;
    this.logoutTimer = null;
    this.isRefreshing = false;
    this.lastRefreshAttempt = 0;
  }

  // Store token in memory and localStorage
  setToken(token, expiresIn = SESSION_TTL_SECONDS) {
    this.token = token;
    this.tokenExpiry = new Date(Date.now() + (expiresIn * 1000));
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_token_expiry', this.tokenExpiry.toISOString());
    }

    // Setup refresh and logout timers
    this.scheduleRefreshAndLogout();
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
          this.scheduleRefreshAndLogout();
          return storedToken;
        } else {
          // Token expired, clear it
          this.clearToken({ redirectToLogin: true });
        }
      }
    }

    return null;
  }

  // Check if token exists and is not expired
  isTokenValid() {
    const token = this.getToken();
    return token !== null;
  }

  // Get time until token needs refresh (in milliseconds)
  getTimeUntilRefresh() {
    if (!this.tokenExpiry) return -1;
    const tokenLifetime = SESSION_TTL_SECONDS * 1000;
    const refreshTime = new Date(this.tokenExpiry.getTime() - (REFRESH_BUFFER_SECONDS * 1000));
    return refreshTime.getTime() - Date.now();
  }

  // Refresh token from server
  async refreshToken() {
    const now = Date.now();
    
    // Prevent rapid refresh attempts
    if (now - this.lastRefreshAttempt < MIN_REFRESH_INTERVAL) {
      return;
    }

    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;
    this.lastRefreshAttempt = now;

    try {
      if (typeof window === 'undefined') return;

      const response = await fetch('/api/auth/token');
      
      if (response.status === 204) {
        // No session, can't refresh
        this.clearToken({ redirectToLogin: true });
        return;
      }

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.accessToken) {
        this.setToken(data.accessToken, data.expiresIn || SESSION_TTL_SECONDS);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // On refresh failure, clear token only if it's truly expired
      if (this.tokenExpiry && new Date() > this.tokenExpiry) {
        this.clearToken({ redirectToLogin: true });
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  // Schedule automatic token refresh before expiry
  scheduleRefreshAndLogout() {
    if (typeof window === 'undefined' || !this.tokenExpiry) {
      return;
    }

    this.clearTimers();

    const timeUntilRefresh = this.getTimeUntilRefresh();
    const timeUntilExpiry = this.tokenExpiry.getTime() - Date.now();

    if (timeUntilRefresh <= 0) {
      // Token is near expiry, refresh immediately
      this.refreshToken();
    } else {
      // Schedule refresh
      this.refreshTimer = window.setTimeout(() => {
        this.refreshToken();
      }, Math.max(1000, timeUntilRefresh));
    }

    // Schedule logout as final safety net
    if (timeUntilExpiry > 0) {
      this.logoutTimer = window.setTimeout(() => {
        this.clearToken({ redirectToLogin: true });
      }, timeUntilExpiry + 1000); // Add 1s buffer
    }
  }

  // Clear all timers
  clearTimers() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }

  // Clear token from memory and localStorage
  clearToken(options = {}) {
    const { redirectToLogin = false } = options;
    this.clearTimers();
    this.token = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_expiry');

      if (redirectToLogin) {
        const returnTo = encodeURIComponent('/login');
        window.location.replace(`/api/auth/logout?returnTo=${returnTo}`);
      }
    }
  }

  // Ensure token is fresh before API calls
  async ensureValidToken() {
    const token = this.getToken();
    if (!token) return null;

    // If token is nearing expiry, try to refresh
    const timeUntilRefresh = this.getTimeUntilRefresh();
    if (timeUntilRefresh < 60000) { // Less than 1 minute remaining
      await this.refreshToken();
    }

    return this.getToken();
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
