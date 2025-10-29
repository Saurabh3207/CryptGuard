// Client/CryptGuard/src/utils/secureComm.js - Secure communication utilities

// Feature flags from environment (default to false for backward compatibility)
const ENABLE_REPLAY_PROTECTION = import.meta.env.VITE_ENABLE_REPLAY_PROTECTION === 'true';
const ENABLE_REQUEST_SIGNING = import.meta.env.VITE_ENABLE_REQUEST_SIGNING === 'true';
const ENABLE_CONTENT_INTEGRITY = import.meta.env.VITE_ENABLE_CONTENT_INTEGRITY === 'true';

// Lazy load crypto-js only if needed
let CryptoJS = null;
const loadCryptoJS = async () => {
  if (!CryptoJS && (ENABLE_CONTENT_INTEGRITY || ENABLE_REQUEST_SIGNING)) {
    try {
      CryptoJS = await import('crypto-js');
      return CryptoJS.default || CryptoJS;
    } catch (error) {
      console.warn('crypto-js not installed. Security features disabled.');
      return null;
    }
  }
  return CryptoJS;
};

/**
 * Generate a unique nonce for request
 */
export const generateNonce = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Calculate checksum for request body
 * Only if ENABLE_CONTENT_INTEGRITY is true
 */
export const calculateChecksum = async (data) => {
  if (!ENABLE_CONTENT_INTEGRITY) return null;
  
  const crypto = await loadCryptoJS();
  if (!crypto) return null;
  
  const dataString = JSON.stringify(data);
  return crypto.SHA256(dataString).toString(crypto.enc.Hex);
};

/**
 * Create request signature
 * Only if ENABLE_REQUEST_SIGNING is true
 */
export const signRequest = async (method, path, timestamp, body) => {
  if (!ENABLE_REQUEST_SIGNING) return null;
  
  const crypto = await loadCryptoJS();
  if (!crypto) return null;
  
  const payload = {
    method,
    path,
    timestamp,
    body
  };
  const payloadString = JSON.stringify(payload);
  return crypto.SHA256(payloadString).toString(crypto.enc.Hex);
};

/**
 * Encrypt sensitive data before sending
 */
export const encryptData = async (data, key) => {
  const crypto = await loadCryptoJS();
  if (!crypto) throw new Error('Encryption not available');
  
  try {
    const encrypted = crypto.AES.encrypt(JSON.stringify(data), key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt received encrypted data
 */
export const decryptData = async (encryptedData, key) => {
  const crypto = await loadCryptoJS();
  if (!crypto) throw new Error('Decryption not available');
  
  try {
    const bytes = crypto.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(crypto.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Verify response integrity
 */
export const verifyResponseIntegrity = async (data, checksum) => {
  if (!ENABLE_CONTENT_INTEGRITY) return true; // Skip if disabled
  
  const crypto = await loadCryptoJS();
  if (!crypto) return true;
  
  const calculatedChecksum = crypto.SHA256(JSON.stringify(data))
    .toString(crypto.enc.Hex);
  return calculatedChecksum === checksum;
};

/**
 * Generate secure headers for API requests
 * Conditionally adds headers based on feature flags
 */
export const generateSecureHeaders = async (method, path, body = null) => {
  const headers = {};
  
  // Add timestamp and nonce only if replay protection is enabled
  if (ENABLE_REPLAY_PROTECTION) {
    headers['X-Request-Timestamp'] = Date.now().toString();
    headers['X-Request-Nonce'] = generateNonce();
  }

  // Add checksum for POST/PUT requests only if content integrity is enabled
  if (ENABLE_CONTENT_INTEGRITY && body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    const checksum = await calculateChecksum(body);
    if (checksum) {
      headers['X-Content-Checksum'] = checksum;
    }
  }

  // Add signature for critical operations only if request signing is enabled
  if (ENABLE_REQUEST_SIGNING && body) {
    const signature = await signRequest(method, path, headers['X-Request-Timestamp'] || Date.now().toString(), body);
    if (signature) {
      headers['X-Request-Signature'] = signature;
    }
  }

  return headers;
};

/**
 * Validate token before making request
 */
export const validateToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Check token expiry (decode JWT)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    
    if (Date.now() >= expiryTime) {
      localStorage.removeItem('token');
      throw new Error('Token expired');
    }
    
    return token;
  } catch (error) {
    localStorage.removeItem('token');
    throw new Error('Invalid token');
  }
};

/**
 * Securely store sensitive data in localStorage with encryption
 */
export const secureStorageSet = (key, value, encryptionKey) => {
  try {
    const encrypted = encryptData(value, encryptionKey);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Secure storage set error:', error);
    throw new Error('Failed to store data securely');
  }
};

/**
 * Retrieve and decrypt data from localStorage
 */
export const secureStorageGet = (key, encryptionKey) => {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    return decryptData(encrypted, encryptionKey);
  } catch (error) {
    console.error('Secure storage get error:', error);
    // Clear corrupted data
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * Clear sensitive data from memory
 */
export const clearSensitiveData = (keys = []) => {
  keys.forEach(key => localStorage.removeItem(key));
};

/**
 * Generate a session key for end-to-end encryption
 */
export const generateSessionKey = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Secure random string generator
 */
export const generateSecureRandom = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array));
};

export default {
  generateNonce,
  calculateChecksum,
  signRequest,
  encryptData,
  decryptData,
  verifyResponseIntegrity,
  generateSecureHeaders,
  validateToken,
  secureStorageSet,
  secureStorageGet,
  clearSensitiveData,
  generateSessionKey,
  generateSecureRandom
};
