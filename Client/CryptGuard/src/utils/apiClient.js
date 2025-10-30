// Client/CryptGuard/src/utils/apiClient.js - Centralized API client with error handling

import axios from 'axios';
import { generateSecureHeaders, validateToken, verifyResponseIntegrity } from './secureComm';
import logger from './logger';
import { toast } from 'react-hot-toast';

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
  withCredentials: true, // Enable cookies for cross-origin requests
});

// Token refresh state management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add security headers (tokens handled by cookies)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // No need to manually add Authorization header - cookies do this automatically
      
      // Add request ID for tracking
      config.headers['X-Request-ID'] = Date.now().toString();
      
      // Add secure headers (nonce, timestamp, checksum, signature) - conditionally based on flags
      const secureHeaders = await generateSecureHeaders(
        config.method.toUpperCase(),
        config.url,
        config.data
      );
      
      // Merge secure headers with existing headers
      config.headers = {
        ...config.headers,
        ...secureHeaders
      };
      
      // Log request (dev mode only)
      logger.debug('🔒 API request:', {
        method: config.method,
        url: config.url,
        securityEnabled: Object.keys(secureHeaders).length > 0
      });
      
      return config;
    } catch (error) {
      logger.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling, auto-refresh, and integrity verification
apiClient.interceptors.response.use(
  async (response) => {
    // Verify response integrity if checksum is present (only if feature enabled)
    const checksum = response.headers['x-response-checksum'];
    if (checksum && response.data) {
      try {
        const isValid = await verifyResponseIntegrity(response.data, checksum);
        if (!isValid) {
          logger.error('⚠️ Response integrity check failed');
          return Promise.reject(new Error('Response integrity verification failed'));
        }
      } catch (error) {
        logger.error('Error verifying response integrity:', error);
      }
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401 && !originalRequest._retry) {
        // Unauthorized - try to refresh token
        originalRequest._retry = true;
        
        if (isRefreshing) {
          // Queue this request while refresh is in progress
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return apiClient(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }
        
        isRefreshing = true;
        
        try {
          // Attempt to refresh access token
          logger.debug('Access token expired, attempting refresh...');
          
          // Show subtle loading toast
          const toastId = toast.loading('🔄 Refreshing session...', {
            duration: 2000,
            style: {
              background: '#667eea',
              color: '#fff',
              fontSize: '14px'
            }
          });
          
          await axios.post(`${API_BASE_URL}/refresh`, {}, { withCredentials: true });
          logger.debug('Token refreshed successfully');
          
          // Show success toast
          toast.success('✅ Session refreshed!', {
            id: toastId,
            duration: 2000,
            style: {
              background: '#10b981',
              color: '#fff',
              fontSize: '14px'
            }
          });
          
          processQueue(null);
          isRefreshing = false;
          
          // Retry original request
          return apiClient(originalRequest);
          
        } catch (refreshError) {
          // Refresh failed - clear state and redirect to wallet
          logger.error('Token refresh failed:', refreshError);
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Show error notification
          toast.error('⏰ Session expired! Redirecting to wallet...', {
            duration: 3000,
            style: {
              background: '#ef4444',
              color: '#fff',
              fontSize: '14px'
            }
          });
          
          localStorage.removeItem('address');
          
          // Redirect after a short delay
          setTimeout(() => {
            window.location.href = '/wallet';
          }, 1500);
          
          return Promise.reject(new Error('Session expired. Please reconnect your wallet.'));
        }
      }
      
      if (status === 429) {
        // Rate limited
        return Promise.reject(new Error('Too many requests. Please wait before trying again.'));
      }
      
      if (status === 403) {
        // Forbidden - possible security violation
        return Promise.reject(new Error(data?.message || 'Access denied'));
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
    
    deleteFile: (fileId, userAddress) =>
      apiClient.delete(`/files/${fileId}`, {
        data: { userAddress }
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