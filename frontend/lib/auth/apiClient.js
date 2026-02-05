// lib/auth/apiClient.js
import tokenManager from './tokenManager';

class ApiClient {
  constructor() {
    const raw = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    // Normalize trailing slashes so values like "http://localhost:4000/api/" don't become "/api/api"
    const normalized = String(raw).replace(/\/+$/, '');
    this.baseURL = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }

  // Get headers with authentication
  getHeaders() {
    const token = tokenManager.getToken();
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const endpointPath = String(endpoint || '').startsWith('/') ? String(endpoint || '') : `/${endpoint}`;
    const url = `${this.baseURL}${endpointPath}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle common non-error statuses gracefully
      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, clear it
          tokenManager.clearToken();
          throw new Error('Authentication required');
        }
        // Allow callers to opt-in to return null on 404
        if (response.status === 404 && options.acceptNotFound) {
          return null;
        }

        // Try to surface server-provided error messages
        let message = `HTTP error ${response.status}`;
        const ct = response.headers.get('content-type') || '';
        try {
          if (ct.includes('application/json')) {
            const errBody = await response.json();
            if (errBody && typeof errBody.message === 'string') {
              message = errBody.message;
            }
          } else {
            const text = await response.text();
            if (text) message = text;
          }
        } catch (_) {
          // ignore parse errors, keep default message
        }
        throw new Error(message);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Non-JSON success: return null to avoid JSON parse errors
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.apiCall(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.apiCall(endpoint, { method: 'DELETE' });
  }

  // GET request that returns null on 404 or 204
  async getOrNull(endpoint) {
    return this.apiCall(endpoint, { method: 'GET', acceptNotFound: true });
  }

  // User-specific methods
  async getUserProfile() {
    return this.get('/users/profile');
  }

  async updateUserProfile(profileData) {
    return this.put('/users/profile', profileData);
  }

  async createUser(userData) {
    return this.post('/users', userData);
  }

  // Generic data storage methods
  async storeData(table, data) {
    return this.post(`/data/${table}`, data);
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

export default apiClient;
