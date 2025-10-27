// middleware/validation.js - Comprehensive input validation middleware
const Joi = require('joi');
const sanitize = require('mongo-sanitize');

/**
 * Custom Joi validators for blockchain and crypto-specific formats
 */

// Ethereum address validator (0x + 40 hex characters)
const ethereumAddress = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{40}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid Ethereum address format. Expected 0x followed by 40 hex characters.',
    'any.required': 'Ethereum address is required'
  });

// IPFS CID validator (supports both v0 and v1)
// Accept common CIDv0 (Qm...) and CIDv1 (bafy...) base32 lengths (roughly 50-60 chars)
const ipfsCID = Joi.string()
  .pattern(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{50,60})$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid IPFS CID format. Must be a valid CIDv0 (Qm...) or CIDv1 (bafy...).',
    'any.required': 'IPFS CID is required'
  });

// File hash validator (0x + 64 hex characters for SHA-256)
const fileHash = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{64}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid file hash format. Expected 0x followed by 64 hex characters (SHA-256).',
    'any.required': 'File hash is required'
  });

// JWT token validator
const jwtToken = Joi.string()
  .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid JWT token format',
    'any.required': 'Authentication token is required'
  });

// Signature validator (hex string)
const signature = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{130}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid signature format. Expected 0x followed by 130 hex characters.',
    'any.required': 'Signature is required'
  });

// File name validator (safe characters only)
const fileName = Joi.string()
  .min(1)
  .max(255)
  .pattern(/^[a-zA-Z0-9._\-\s()]+$/)
  .messages({
    'string.pattern.base': 'File name contains invalid characters. Only alphanumeric, dots, dashes, underscores, spaces, and parentheses allowed.',
    'string.min': 'File name must be at least 1 character',
    'string.max': 'File name must not exceed 255 characters'
  });

// File size validator (in bytes, max 10MB)
const fileSize = Joi.number()
  .integer()
  .min(1)
  .max(10 * 1024 * 1024)
  .messages({
    'number.min': 'File size must be at least 1 byte',
    'number.max': 'File size must not exceed 10MB',
    'number.base': 'File size must be a number'
  });

/**
 * Validation Schemas for different endpoints
 */

const validationSchemas = {
  // Authentication validation
  authentication: Joi.object({
    body: Joi.object({
      signature: signature
    }),
    query: Joi.object({
      address: ethereumAddress
    })
  }),

  // Pre-upload validation
  preUpload: Joi.object({
    body: Joi.object({
      address: ethereumAddress,
      fileHash: fileHash
    }),
    file: Joi.object({
      originalname: fileName,
      size: fileSize.required(),
      mimetype: Joi.string().required()
    }).unknown(true)
  }),

  // Confirm upload validation
  confirmUpload: Joi.object({
    body: Joi.object({
      address: ethereumAddress,
      ipfsCID: ipfsCID,
      metadataCID: ipfsCID,
      fileHash: fileHash,
      fileName: fileName.optional(),
      fileSize: fileSize.optional(),
      fileType: Joi.string().max(100).optional()
    })
  }),

  // Get user files validation
  getUserFiles: Joi.object({
    params: Joi.object({
      walletAddress: ethereumAddress
    })
  }),

  // Decrypt and download validation
  decryptAndDownload: Joi.object({
    body: Joi.object({
      encryptedCID: ipfsCID,
      metadataCID: ipfsCID,
      fileName: fileName.optional()
    })
  })
};

/**
 * Validation middleware factory
 * @param {string} schemaName - Name of the validation schema to use
 * @returns {Function} Express middleware function
 */
const validate = (schemaName) => {
  return async (req, res, next) => {
    try {
      const schema = validationSchemas[schemaName];
      
      if (!schema) {
        console.error(`Validation schema '${schemaName}' not found`);
        return res.status(500).json({ 
          message: 'Internal server error: Invalid validation configuration' 
        });
      }

      // Sanitize inputs to prevent NoSQL injection
      if (req.body) {
        req.body = sanitize(req.body);
      }
      if (req.query) {
        req.query = sanitize(req.query);
      }
      if (req.params) {
        req.params = sanitize(req.params);
      }

      // Build validation object
      const validationObject = {};
      
      // Helper function to safely check if schema has a path
      const hasPath = (path) => {
        try {
          schema.extract(path);
          return true;
        } catch (err) {
          return false;
        }
      };
      
      if (hasPath('body')) {
        validationObject.body = req.body;
      }
      if (hasPath('query')) {
        validationObject.query = req.query;
      }
      if (hasPath('params')) {
        validationObject.params = req.params;
      }
      if (hasPath('file') && req.file) {
        validationObject.file = req.file;
      }

      // Validate
      const { error, value } = schema.validate(validationObject, {
        abortEarly: false, // Return all errors, not just the first one
        stripUnknown: true // Remove unknown properties
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        console.warn('Validation failed:', {
          endpoint: req.path,
          errors: errors,
          ip: req.ip
        });

        return res.status(400).json({
          message: 'Validation failed',
          errors: errors
        });
      }

      // Update request with validated and sanitized values
      if (value.body) req.body = value.body;
      if (value.query) req.query = value.query;
      if (value.params) req.params = value.params;

      next();
    } catch (err) {
      console.error('Validation middleware error:', err);
      return res.status(500).json({ 
        message: 'Internal server error during validation' 
      });
    }
  };
};

/**
 * Additional security middleware
 */

// Sanitize all inputs (can be used globally)
const sanitizeInputs = (req, res, next) => {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  next();
};

// Validate content type for JSON endpoints
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    // Allow multipart/form-data for file uploads
    if (req.path.includes('/preUpload')) {
      return next();
    }
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        message: 'Content-Type must be application/json'
      });
    }
  }
  next();
};

// Limit request body size (additional protection beyond express.json limit)
const validateBodySize = (req, res, next) => {
  const contentLength = req.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      message: 'Request body too large. Maximum size is 10MB.'
    });
  }
  next();
};

module.exports = {
  validate,
  sanitizeInputs,
  validateContentType,
  validateBodySize,
  // Export schemas for testing
  validationSchemas,
  // Export individual validators for custom use
  validators: {
    ethereumAddress,
    ipfsCID,
    fileHash,
    jwtToken,
    signature,
    fileName,
    fileSize
  }
};
