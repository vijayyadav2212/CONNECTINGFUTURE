// lib/auth/tokenManager.js

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days matching JWT sign expiry

class TokenManager {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  // Store token in memory and localStorage
  setToken(token, expiresIn = SESSION_TTL_SECONDS) {
    this.token = token;
    this.tokenExpiry = new Date(Date.now() + (expiresIn * 1000));
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_token_expiry', this.tokenExpiry.toISOString());
      localStorage.setItem('cf_jwt', token); // compatibility with mockAuth0
    }
  }

  // Get token from memory or localStorage
  getToken() {
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

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
          this.clearToken();
        }
      }
    }

    return null;
  }

  isTokenValid() {
    const token = this.getToken();
    return token !== null;
  }

  // Clear token from memory and localStorage
  clearToken(options = {}) {
    this.token = null;
    this.tokenExpiry = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_expiry');
      localStorage.removeItem('cf_jwt');
      localStorage.removeItem('cf_user');
      
      if (options.redirectToLogin) {
        window.location.replace('/login');
      }
    }
  }

  async ensureValidToken() {
    return this.getToken();
  }

  // Server-side helper stub (Auth0 retired)
  async getServerSideToken(req, res) {
    return null;
  }
}

const tokenManager = new TokenManager();
export default tokenManager;
