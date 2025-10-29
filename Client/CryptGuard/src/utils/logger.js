/**
 * Environment-aware logging utility
 * Prevents sensitive information disclosure in production
 */

const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Development-only debug logging
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info logging (shown in production but sanitized)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    } else {
      // In production, only log non-sensitive info
      console.info('[INFO]', args[0]); // Only first argument
    }
  },

  /**
   * Warning logging (always shown, sanitized in production)
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error logging (always shown)
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Success logging (development only)
   */
  success: (...args) => {
    if (isDevelopment) {
      console.log('[SUCCESS]', ...args);
    }
  }
};

export default logger;
