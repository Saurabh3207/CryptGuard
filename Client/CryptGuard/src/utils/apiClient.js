// Client/CryptGuard/src/utils/apiClient.js - Centralized API client with error handling

import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT token management
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.map((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = Date.now().toString();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - handle token expiration
        const originalRequest = error.config;
        
        // Prevent infinite loops
        if (originalRequest._retry) {
          localStorage.removeItem('token');
          window.location.href = '/wallet';
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
        
        originalRequest._retry = true;
        
        // If not already refreshing, attempt to refresh token
        if (!isRefreshing) {
          isRefreshing = true;
          
          // For now, just clear and redirect (can implement refresh token later)
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/wallet';
          }, 1000);
          
          return Promise.reject(new Error('Session expired. Please reconnect your wallet.'));
        }
        
        // Queue requests while refreshing
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }
      
      if (status === 429) {
        // Rate limited
        return Promise.reject(new Error('Too many requests. Please wait before trying again.'));
      }
      
      // Return the error message from server
      const errorMessage = data?.message || `Request failed with status ${status}`;
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Network error
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Request configuration error
      return Promise.reject(new Error('Request configuration error.'));
    }
  }
);

// API endpoints
export const api = {
  // Authentication endpoints
  auth: {
    login: (signature, address) => 
      apiClient.post('/auth/login', { signature }, { params: { address } }),
    
    register: (userData) => 
      apiClient.post('/auth/register', userData),
    
    getProfile: () => 
      apiClient.get('/auth/profile'),
  },

  // File management endpoints
  files: {
    preUpload: (formData, onUploadProgress) => 
      apiClient.post('/upload/preUpload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }),
    
    confirmUpload: (uploadData) => 
      apiClient.post('/upload/confirm', uploadData),
    
    getUserFiles: (walletAddress, params = {}) => 
      apiClient.get(`/files/${walletAddress}`, { params }),
    
    getFileStats: (walletAddress) => 
      apiClient.get(`/files/${walletAddress}/stats`),
    
    getFileById: (walletAddress, fileId) => 
      apiClient.get(`/files/${walletAddress}/${fileId}`),
    
    downloadFile: (ipfsCID, userAddress) => 
      apiClient.post('/decrypt/file', { ipfsCID, userAddress }, {
        responseType: 'arraybuffer'
      }),
  },

  // Health check
  health: () => 
    apiClient.get('/health'),
};

// Utility functions for common API operations
export const apiUtils = {
  // Upload file with progress tracking
  uploadFile: async (file, address, fileHash, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('address', address);
      formData.append('fileHash', fileHash);

      const response = await api.files.preUpload(formData, onProgress);
      return response.data;
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  },

  // Confirm file upload after blockchain transaction
  confirmUpload: async (uploadData) => {
    try {
      const response = await api.files.confirmUpload(uploadData);
      return response.data;
    } catch (error) {
      throw new Error(`Upload confirmation failed: ${error.message}`);
    }
  },

  // Get user files with error handling
  getUserFiles: async (walletAddress, options = {}) => {
    try {
      const { page = 1, limit = 10, sort = '-uploadTime' } = options;
      const response = await api.files.getUserFiles(walletAddress, { page, limit, sort });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }
    
  },

  // Get file statistics
  getFileStats: async (walletAddress) => {
    try {
      const response = await api.files.getFileStats(walletAddress);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch file statistics: ${error.message}`);
    }
  },

  // Download and decrypt file
  downloadFile: async (ipfsCID, userAddress) => {
    try {
      const response = await api.files.downloadFile(ipfsCID, userAddress);
      return response.data;
    } catch (error) {
      throw new Error(`File download failed: ${error.message}`);
    }
  },

  // Authentication with signature
  authenticate: async (signature, address) => {
    try {
      const response = await api.auth.login(signature, address);
      
      if (response.data.data?.token) {
        localStorage.setItem('token', response.data.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await api.auth.register(userData);
      return response.data;
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  },

  // Check API health
  checkHealth: async () => {
    try {
      const response = await api.health();
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  },
};

// Error types for better error handling
export class ApiError extends Error {
  constructor(message, statusCode = null, errorCode = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export default apiClient;