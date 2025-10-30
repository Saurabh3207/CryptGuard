// utils/validation.js - Input validation schemas using Joi

const Joi = require('joi');

// Ethereum address validation
const ethereumAddress = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{40}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid Ethereum address format'
  });

// IPFS CID validation
const ipfsCID = Joi.string()
  .pattern(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^baf[a-z0-9]{56}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid IPFS CID format'
  });

// File hash validation (SHA-256)
const fileHash = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{64}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid file hash format'
  });

// Authentication validation schemas
const authSchemas = {
  login: Joi.object({
    signature: Joi.string().required().messages({
      'any.required': 'Signature is required for authentication'
    })
  }),

  register: Joi.object({
    userAddress: ethereumAddress,
    publicKey: Joi.string().required().messages({
      'any.required': 'Public key is required'
    }),
    encryptedPrivateKey: Joi.string().required().messages({
      'any.required': 'Encrypted private key is required'
    }),
    salt: Joi.string().required().messages({
      'any.required': 'Salt is required'
    }),
    iv: Joi.string().required().messages({
      'any.required': 'Initialization vector is required'
    })
  })
};

// File upload validation schemas
const fileSchemas = {
  preUpload: Joi.object({
    address: ethereumAddress,
    fileHash: fileHash
  }),

  confirmUpload: Joi.object({
    address: ethereumAddress,
    ipfsCID: ipfsCID,
    metadataCID: ipfsCID,
    fileHash: fileHash,
    fileName: Joi.string()
      .max(255)
      .required()
      .messages({
        'string.max': 'File name cannot exceed 255 characters',
        'any.required': 'File name is required'
      }),
    fileSize: Joi.number()
      .min(1)
      .max(5 * 1024 * 1024) // 5MB limit
      .required()
      .messages({
        'number.min': 'File size must be greater than 0',
        'number.max': 'File size cannot exceed 5MB',
        'any.required': 'File size is required'
      }),
    fileType: Joi.string()
      .max(50)
      .required()
      .messages({
        'string.max': 'File type cannot exceed 50 characters',
        'any.required': 'File type is required'
      })
  }),

  getFiles: Joi.object({
    walletAddress: ethereumAddress,
    limit: Joi.number().min(1).max(100).default(10),
    offset: Joi.number().min(0).default(0)
  }),

  deleteFile: Joi.object({
    userAddress: ethereumAddress
  })
};

// Decryption validation schema
const decryptionSchemas = {
  decrypt: Joi.object({
    ipfsCID: ipfsCID,
    userAddress: ethereumAddress
  })
};

// Query parameter validation
const querySchemas = {
  address: Joi.object({
    address: ethereumAddress
  }),

  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sort: Joi.string().valid('uploadTime', '-uploadTime', 'fileName', '-fileName').default('-uploadTime')
  })
};

// Common field validations
const commonValidations = {
  ethereumAddress,
  ipfsCID,
  fileHash,
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  fileName: Joi.string()
    .max(255)
    .pattern(/^[^<>:"/\\|?*\x00-\x1f]+$/)
    .messages({
      'string.max': 'File name cannot exceed 255 characters',
      'string.pattern.base': 'File name contains invalid characters'
    }),

  fileSize: Joi.number()
    .min(1)
    .max(5 * 1024 * 1024),

  mimeType: Joi.string()
    .pattern(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/)
    .messages({
      'string.pattern.base': 'Invalid MIME type format'
    })
};

// Sanitization functions
const sanitize = {
  ethereumAddress: (address) => address ? address.toLowerCase().trim() : null,
  fileName: (name) => name ? name.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '') : null,
  string: (str) => str ? str.trim() : null
};

module.exports = {
  authSchemas,
  fileSchemas,
  decryptionSchemas,
  querySchemas,
  commonValidations,
  sanitize
};