// Client/CryptGuard/src/utils/sanitize.js - XSS Prevention Utility

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Untrusted HTML content
 * @param {object} options - DOMPurify configuration options
 * @returns {string} - Sanitized HTML content
 */
export const sanitizeHTML = (dirty, options = {}) => {
  const defaultOptions = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
    ...options
  };
  
  return DOMPurify.sanitize(dirty, defaultOptions);
};

/**
 * Sanitize user input text (remove all HTML tags)
 * @param {string} input - User input
 * @returns {string} - Plain text without HTML
 */
export const sanitizeText = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitize file name to prevent path traversal attacks
 * @param {string} fileName - File name to sanitize
 * @returns {string} - Sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') return 'untitled';
  
  // Remove path separators and special characters
  let sanitized = fileName
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .trim();
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    sanitized = sanitized.substring(0, 250) + '.' + ext;
  }
  
  return sanitized || 'untitled';
};

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL or empty string if invalid
 */
export const sanitizeURL = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      console.warn('Blocked potentially dangerous URL:', url);
      return '';
    }
  }
  
  // Only allow http, https, and relative URLs
  if (!/^(https?:\/\/|\/|\.\/|\.\.\/)/.test(trimmed)) {
    return '';
  }
  
  return url;
};

/**
 * Sanitize object by applying sanitization to all string properties
 * @param {object} obj - Object to sanitize
 * @param {function} sanitizer - Sanitization function (default: sanitizeText)
 * @returns {object} - Sanitized object
 */
export const sanitizeObject = (obj, sanitizer = sanitizeText) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize Ethereum address
 * @param {string} address - Ethereum address
 * @returns {string} - Sanitized address or empty string if invalid
 */
export const sanitizeEthereumAddress = (address) => {
  if (!address || typeof address !== 'string') return '';
  
  // Ethereum addresses are 42 characters long (0x + 40 hex chars)
  const cleaned = address.trim();
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(cleaned)) {
    console.warn('Invalid Ethereum address format:', address);
    return '';
  }
  
  return cleaned.toLowerCase();
};

/**
 * Validate and sanitize IPFS CID
 * @param {string} cid - IPFS CID
 * @returns {string} - Sanitized CID or empty string if invalid
 */
export const sanitizeIPFSCID = (cid) => {
  if (!cid || typeof cid !== 'string') return '';
  
  const cleaned = cid.trim();
  
  // IPFS CIDv0: Qm... (46 characters)
  // IPFS CIDv1: bafy... or bafk... (variable length)
  if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{52,}|bafk[a-z2-7]{52,})$/.test(cleaned)) {
    console.warn('Invalid IPFS CID format:', cid);
    return '';
  }
  
  return cleaned;
};

/**
 * Create safe HTML attributes object
 * @param {object} attrs - Attributes object
 * @returns {object} - Sanitized attributes
 */
export const createSafeAttributes = (attrs) => {
  const safe = {};
  
  for (const [key, value] of Object.entries(attrs)) {
    // Skip event handlers
    if (key.startsWith('on')) continue;
    
    // Sanitize specific attributes
    if (key === 'href' || key === 'src') {
      safe[key] = sanitizeURL(value);
    } else if (typeof value === 'string') {
      safe[key] = sanitizeText(value);
    } else {
      safe[key] = value;
    }
  }
  
  return safe;
};

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeFileName,
  sanitizeURL,
  sanitizeObject,
  sanitizeEthereumAddress,
  sanitizeIPFSCID,
  createSafeAttributes
};
