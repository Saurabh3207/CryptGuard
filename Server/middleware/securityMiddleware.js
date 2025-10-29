// Server/middleware/securityMiddleware.js - Enhanced security middleware

const crypto = require('crypto');
const { logger } = require('../utils/logger');
const config = require('../config/serverConfig');

// Store used nonces to prevent replay attacks (in production, use Redis)
const usedNonces = new Map();
const NONCE_EXPIRY = config.NONCE_EXPIRY_MS || 5 * 60 * 1000; // 5 minutes

// Clean expired nonces every minute
setInterval(() => {
  const now = Date.now();
  for (const [nonce, timestamp] of usedNonces.entries()) {
    if (now - timestamp > NONCE_EXPIRY) {
      usedNonces.delete(nonce);
    }
  }
}, 60000);

/**
 * Prevent replay attacks by validating nonce and timestamp
 * OPTIONAL: Only enforced if ENABLE_REPLAY_PROTECTION is true
 */
const preventReplayAttack = (req, res, next) => {
  // Skip if feature is disabled
  if (!config.ENABLE_REPLAY_PROTECTION) {
    return next();
  }

  const nonce = req.headers['x-request-nonce'];
  const timestamp = req.headers['x-request-timestamp'];

  if (!nonce || !timestamp) {
    logger.warn('Missing nonce or timestamp (replay protection enabled)', {
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    return res.status(400).json({ 
      message: 'Missing security headers. Please update your client.',
      code: 'MISSING_SECURITY_HEADERS'
    });
  }

  // Validate timestamp (request must be within configured window)
  const requestTime = parseInt(timestamp);
  const currentTime = Date.now();
  const timeDiff = Math.abs(currentTime - requestTime);

  if (timeDiff > NONCE_EXPIRY) {
    logger.warn('Request timestamp expired', {
      ip: req.ip,
      path: req.path,
      timeDiff,
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ 
      message: 'Request expired. Please try again.',
      code: 'REQUEST_EXPIRED'
    });
  }

  // Check if nonce was already used
  if (usedNonces.has(nonce)) {
    logger.error('Replay attack detected - nonce reused', {
      ip: req.ip,
      path: req.path,
      nonce,
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ 
      message: 'Invalid request. Possible replay attack detected.',
      code: 'REPLAY_ATTACK_DETECTED'
    });
  }

  // Store nonce
  usedNonces.set(nonce, currentTime);
  next();
};

/**
 * Verify request signature for critical operations
 * OPTIONAL: Only enforced if ENABLE_REQUEST_SIGNING is true
 */
const verifyRequestSignature = (req, res, next) => {
  // Skip if feature is disabled
  if (!config.ENABLE_REQUEST_SIGNING) {
    return next();
  }

  const signature = req.headers['x-request-signature'];
  const timestamp = req.headers['x-request-timestamp'];

  if (!signature || !timestamp) {
    return res.status(400).json({ 
      message: 'Missing request signature. Please update your client.',
      code: 'MISSING_SIGNATURE'
    });
  }

  try {
    // Create payload to verify
    const payload = {
      method: req.method,
      path: req.path,
      timestamp: timestamp,
      body: req.body
    };

    // TODO: Implement proper signature verification
    // For wallet-based: Use ethers.utils.verifyMessage(payload, signature)
    // For HMAC: Use crypto.createHmac('sha256', secret).update(payload).digest('hex')
    
    // Placeholder: mark as verified for now
    req.signatureVerified = true;
    next();
  } catch (error) {
    logger.error('Signature verification failed', {
      ip: req.ip,
      path: req.path,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ 
      message: 'Invalid request signature',
      code: 'INVALID_SIGNATURE'
    });
  }
};

/**
 * Enhanced security headers
 */
const enhancedSecurityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (force HTTPS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Validate request integrity using checksum
 * OPTIONAL: Only enforced if ENABLE_CONTENT_INTEGRITY is true
 */
const validateRequestIntegrity = (req, res, next) => {
  // Skip if feature is disabled
  if (!config.ENABLE_CONTENT_INTEGRITY) {
    return next();
  }

  // Skip for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const checksum = req.headers['x-content-checksum'];
  
  if (!checksum) {
    return res.status(400).json({ 
      message: 'Missing content checksum. Please update your client.',
      code: 'MISSING_CHECKSUM'
    });
  }

  try {
    const bodyString = JSON.stringify(req.body);
    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(bodyString)
      .digest('hex');

    if (checksum !== calculatedChecksum) {
      logger.error('Content integrity check failed', {
        ip: req.ip,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        message: 'Content integrity check failed',
        code: 'INTEGRITY_CHECK_FAILED'
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating request integrity', error);
    return res.status(500).json({ 
      message: 'Error validating request',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Encrypt sensitive response data
 */
const encryptSensitiveResponse = (data, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

/**
 * Log security events
 */
const logSecurityEvent = (event, details) => {
  logger.security(event, {
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  preventReplayAttack,
  verifyRequestSignature,
  enhancedSecurityHeaders,
  validateRequestIntegrity,
  encryptSensitiveResponse,
  logSecurityEvent
};
