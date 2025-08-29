// lib/auth/apiClient.js
import tokenManager from './tokenManager';

class ApiClient {
  constructor() {
    const raw = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    this.baseURL = raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;
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
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, clear it
          tokenManager.clearToken();
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
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
