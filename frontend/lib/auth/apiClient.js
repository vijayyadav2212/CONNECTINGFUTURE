// lib/auth/apiClient.js
import tokenManager from './tokenManager';

class ApiClient {
  constructor() {
    const envRaw = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL;
    const raw = (envRaw && String(envRaw).trim()) ? String(envRaw) : 'http://localhost:4000';
    // Normalize trailing slashes
    const normalized = String(raw).replace(/\/+$/, '');
    // Route directly to /api/v2
    this.baseURL = normalized.endsWith('/api/v2') ? normalized : `${normalized}/api/v2`;
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
      let response = await fetch(url, config);

      // Handle common non-error statuses gracefully
      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        if (response.status === 401 && endpointPath !== '/auth/refresh') {
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            try {
              const refreshUrl = `${this.baseURL}/auth/refresh`;
              const refreshResponse = await fetch(refreshUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.token) {
                  // Save new tokens
                  tokenManager.setToken(refreshData.token, refreshData.refreshToken);
                  
                  // Re-set cookies
                  document.cookie = `cf_token=${refreshData.token}; path=/; max-age=900; SameSite=Lax`;
                  if (refreshData.refreshToken) {
                    document.cookie = `cf_refresh_token=${refreshData.refreshToken}; path=/; max-age=604800; SameSite=Lax`;
                  }
                  
                  // Re-fetch original request
                  config.headers['Authorization'] = `Bearer ${refreshData.token}`;
                  response = await fetch(url, config);
                  if (response.status === 204) {
                    return null;
                  }
                }
              }
            } catch (refreshErr) {
              console.error('Silent refresh failed:', refreshErr);
            }
          }
        }

        if (response.status === 401) {
          // Token is invalid and refresh failed/expired, clear it
          tokenManager.clearToken({ redirectToLogin: true });
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

  // POST FormData (for file uploads)
  async postFormData(endpoint, formData) {
    const endpointPath = String(endpoint || '').startsWith('/') ? String(endpoint || '') : `/${endpoint}`;
    const url = `${this.baseURL}${endpointPath}`;
    const token = tokenManager.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => 'Upload failed');
      throw new Error(text || `HTTP error ${response.status}`);
    }
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return await response.json();
    }
    return null;
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
