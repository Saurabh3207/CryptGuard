# CryptGuard Security & Optimization Recommendations

## Executive Summary
This document provides a comprehensive security audit and optimization recommendations for the CryptGuard decentralized file storage system. The analysis covers both client and server components, identifying vulnerabilities and suggesting industry-standard improvements.

---

## 🔴 CRITICAL Security Issues

### 1. **JWT Secret Key Exposure Risk**
**Location**: `Server/config/serverConfig.js`, `Server/middleware/authenticateToken.js`
**Issue**: JWT secret key stored in environment variable without validation or rotation mechanism.

**Recommendations**:
- Use minimum 256-bit (32-byte) cryptographically secure random key
- Implement key rotation mechanism
- Add key validation on startup
- Store in secure vault (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)

**Implementation**:
```javascript
// config/serverConfig.js
const crypto = require('crypto');

const JWT_SECRETKEY = process.env.JWT_SECRETKEY;

// Validate JWT secret on startup
if (!JWT_SECRETKEY || JWT_SECRETKEY.length < 32) {
  throw new Error('JWT_SECRETKEY must be at least 32 characters');
}

// Consider using RS256 instead of HS256 for better security
```

### 2. **Missing Rate Limiting**
**Location**: `Server/index.js`
**Issue**: No rate limiting on API endpoints, vulnerable to DDoS and brute force attacks.

**Recommendations**:
```javascript
// Install: npm install express-rate-limit
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use('/api', apiLimiter);
app.use('/api/authentication', authLimiter);
```

### 3. **Weak Encryption Key Generation**
**Location**: `Server/utils/generateKey.js`
**Issue**: Using `crypto.randomBytes(length/2).toString('hex')` incorrectly calculates byte length.

**Fix**:
```javascript
// Current: generateEncryptionKey(32) generates only 16 bytes (32 hex chars)
// Fixed version:
const generateEncryptionKey = (byteLength = 32) => {
  if (byteLength < 32) {
    throw new Error('Encryption key must be at least 32 bytes for AES-256');
  }
  return crypto.randomBytes(byteLength); // Return Buffer, not hex string
};
```

### 4. **Missing Input Validation**
**Location**: All controller files
**Issue**: Insufficient input validation and sanitization.

**Recommendations**:
```javascript
// Install: npm install joi express-validator
const { body, param, validationResult } = require('express-validator');

// Example middleware for file upload validation
const validateFileUpload = [
  body('address').isEthereumAddress().withMessage('Invalid Ethereum address'),
  body('fileHash').matches(/^0x[a-fA-F0-9]{64}$/).withMessage('Invalid file hash'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.post('/preUpload', authenticateToken, validateFileUpload, uploadUserFile, preUploadFileController);
```

### 5. **SQL Injection & NoSQL Injection Prevention**
**Location**: All MongoDB queries
**Issue**: Potential NoSQL injection through unsanitized user input.

**Fix**:
```javascript
// Bad: Direct use of user input
const user = await UserModel.findOne({ userAddress: address });

// Good: Use parameterized queries and validate input
const { sanitize } = require('mongo-sanitize');
const userAddress = sanitize(address.toLowerCase().trim());

// Add input validation
if (!/^0x[a-fA-F0-9]{40}$/i.test(userAddress)) {
  return res.status(400).json({ message: 'Invalid Ethereum address' });
}

const user = await UserModel.findOne({ userAddress });
```

---

## 🟡 HIGH Priority Security Improvements

### 6. **HTTPS Enforcement**
**Location**: `Server/index.js`
**Issue**: No HTTPS enforcement or HSTS headers.

**Implementation**:
```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Enhanced Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

### 7. **File Upload Security**
**Location**: `Server/middleware/multer.js`
**Issue**: Missing file type validation and size limits.

**Enhanced Implementation**:
```javascript
const multer = require('multer');
const path = require('path');

// Allowed file types (whitelist approach)
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'application/zip', 'application/x-rar-compressed'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip', '.rar'];
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file extension.'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only allow single file upload
  },
  fileFilter: fileFilter
});

module.exports = { 
  uploadUserFile: upload.single('file'),
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES
};
```

### 8. **Enhanced Error Handling**
**Location**: All controllers
**Issue**: Error messages leak sensitive information.

**Secure Error Handler**:
```javascript
// utils/errorHandler.js - Enhanced version
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error with context
  console.error({
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ip: req.ip,
    error: err.stack,
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    if (!err.isOperational) {
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong. Please try again later.'
      });
    }
  }

  res.status(err.statusCode).json({
    status: err.statusCode >= 500 ? 'error' : 'fail',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { AppError, errorHandler };
```

### 9. **Database Connection Security**
**Location**: `Server/db/connect.js`
**Issue**: No connection pooling, retry logic, or SSL enforcement.

**Enhanced Implementation**:
```javascript
const mongoose = require('mongoose');

const connectDB = async (mongoURL, retries = 5) => {
  const options = {
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    family: 4, // Use IPv4
    // SSL/TLS for production
    ...(process.env.NODE_ENV === 'production' && {
      ssl: true,
      sslValidate: true,
    })
  };

  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(mongoURL, options);
      console.log('✅ MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
      });
      
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
    }
  }
};

module.exports = { connectDB };
```

---

## 🟢 MEDIUM Priority Optimizations

### 10. **Client-Side Security Enhancements**
**Location**: `Client/CryptGuard/src/utils/apiClient.js`

**Recommendations**:
```javascript
// Add CSRF protection
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CSRF cookies
});

// Enhanced request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Check token expiration before sending
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      if (tokenData.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Token expired');
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);
```

### 11. **Smart Contract Security**
**Location**: `Server/CryptGuard.sol`

**Improvements**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Use latest stable version

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract CryptGuard is ReentrancyGuard, Ownable, Pausable {
    // Events for monitoring
    event FileUploaded(address indexed uploader, bytes32 indexed fileHash, string ipfsCID, uint256 timestamp);
    event FileVerified(address indexed user, uint256 indexed fileIndex, bool isValid);
    
    struct FileMetadata {
        string ipfsCID;
        bytes32 fileHash;
        uint256 uploadTimestamp;
        address uploader;
        bool isActive; // Soft delete capability
    }

    // Store files by user address
    mapping(address => FileMetadata[]) private userFiles;
    mapping(bytes32 => bool) private uploadedHashes;
    
    // Maximum storage per user (prevent spam)
    uint256 public constant MAX_FILES_PER_USER = 1000;
    
    modifier onlyEOA() {
        require(msg.sender == tx.origin, "Contracts are not allowed");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Uploads file metadata with enhanced validation
     * @param _ipfsCID IPFS Content Identifier
     * @param _fileHash SHA-256 hash of the file
     */
    function uploadFile(string calldata _ipfsCID, bytes32 _fileHash) 
        external 
        onlyEOA 
        nonReentrant 
        whenNotPaused 
    {
        require(bytes(_ipfsCID).length > 0 && bytes(_ipfsCID).length < 100, "Invalid IPFS CID length");
        require(_fileHash != bytes32(0), "Invalid file hash");
        require(!uploadedHashes[_fileHash], "File already exists");
        require(userFiles[msg.sender].length < MAX_FILES_PER_USER, "Storage limit exceeded");

        userFiles[msg.sender].push(FileMetadata({
            ipfsCID: _ipfsCID,
            fileHash: _fileHash,
            uploadTimestamp: block.timestamp,
            uploader: msg.sender,
            isActive: true
        }));
        
        uploadedHashes[_fileHash] = true;
        
        emit FileUploaded(msg.sender, _fileHash, _ipfsCID, block.timestamp);
    }

    /**
     * @notice Soft delete a file
     * @param _index Index of the file to delete
     */
    function deleteFile(uint256 _index) external onlyEOA {
        require(_index < userFiles[msg.sender].length, "Invalid file index");
        require(userFiles[msg.sender][_index].isActive, "File already deleted");
        
        userFiles[msg.sender][_index].isActive = false;
        uploadedHashes[userFiles[msg.sender][_index].fileHash] = false;
    }

    /**
     * @notice Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get file count for user
     */
    function getFileCount() external view returns (uint256) {
        return userFiles[msg.sender].length;
    }

    /**
     * @notice Verify file with event emission
     */
    function verifyFile(uint256 _index, bytes32 _currentHash) 
        external 
        view 
        onlyEOA 
        returns (bool) 
    {
        require(_index < userFiles[msg.sender].length, "Invalid File Index");
        require(userFiles[msg.sender][_index].isActive, "File is deleted");
        
        bool isValid = userFiles[msg.sender][_index].fileHash == _currentHash;
        return isValid;
    }
}
```

### 12. **Encryption Key Management**
**Location**: `Server/models/User.js`

**Enhanced Schema**:
```javascript
const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  userAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum address format'
    }
  },
  encryptionKey: {
    type: Buffer,
    required: false,
    select: false // Don't return in queries by default
  },
  encryptionKeyVersion: {
    type: Number,
    default: 1 // For key rotation
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for performance
UserSchema.index({ userAddress: 1 });
UserSchema.index({ lastLogin: -1 });

// Method to increment failed login attempts
UserSchema.methods.incrementLoginAttempts = async function() {
  // Reset if lockout period has expired
  if (this.lockoutUntil && this.lockoutUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1, lockoutUntil: null }
    });
  }
  
  // Increment attempts
  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 15 minutes
  if (this.failedLoginAttempts + 1 >= 5) {
    updates.$set = { lockoutUntil: Date.now() + 15 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { failedLoginAttempts: 0, lockoutUntil: null }
  });
};

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
```

---

## 📊 Performance Optimizations

### 13. **Database Query Optimization**
**Location**: `Server/controllers/fileController.js`

```javascript
// Use lean() for read-only queries
const files = await FileMapping.find({ userAddress: walletAddress.toLowerCase() })
  .select('fileName fileSize fileType uploadTime ipfsCID') // Only select needed fields
  .sort({ uploadTime: -1 })
  .limit(10)
  .lean(); // Returns plain JavaScript objects instead of Mongoose documents

// Use aggregation for statistics
const stats = await FileMapping.aggregate([
  { $match: { userAddress: walletAddress.toLowerCase() } },
  {
    $group: {
      _id: null,
      totalFiles: { $sum: 1 },
      totalSize: { $sum: '$fileSize' },
      avgSize: { $avg: '$fileSize' }
    }
  }
]);
```

### 14. **Caching Strategy**
**Location**: Server-wide

```javascript
// Install: npm install node-cache
const NodeCache = require('node-cache');
const fileCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 min TTL

// Cache file statistics
async function getFileStats(req, res) {
  const { walletAddress } = req.params;
  const cacheKey = `stats_${walletAddress}`;
  
  // Check cache first
  const cached = fileCache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }
  
  // Fetch from database
  const stats = await calculateStats(walletAddress);
  
  // Store in cache
  fileCache.set(cacheKey, stats);
  
  return res.status(200).json(stats);
}
```

### 15. **Client-Side Optimizations**

**React Component Optimization**:
```javascript
// Use React.memo for expensive components
import { memo, useMemo, useCallback } from 'react';

const FileList = memo(({ files }) => {
  const sortedFiles = useMemo(() => {
    return files.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
  }, [files]);
  
  return (
    <div>
      {sortedFiles.map(file => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
});

// Use useCallback for event handlers
const handleUpload = useCallback(async (file) => {
  // Upload logic
}, [dependencies]);
```

---

## 🛡️ Additional Security Measures

### 16. **Logging and Monitoring**
```javascript
// Install: npm install winston
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Log security events
logger.info('User login attempt', { 
  userAddress, 
  ip: req.ip, 
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString()
});
```

### 17. **Environment Variable Validation**
```javascript
// config/validateEnv.js
const requiredEnvVars = [
  'MONGODB_URL',
  'JWT_SECRETKEY',
  'PINATA_JWT',
  'PORT'
];

function validateEnv() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT secret length
  if (process.env.JWT_SECRETKEY.length < 32) {
    throw new Error('JWT_SECRETKEY must be at least 32 characters long');
  }
}

module.exports = { validateEnv };
```

---

## 🎯 Implementation Priority

### Phase 1 (Immediate - Critical Security):
1. Add rate limiting
2. Fix encryption key generation
3. Add input validation middleware
4. Implement proper error handling

### Phase 2 (High Priority - 1-2 weeks):
5. HTTPS enforcement and enhanced helmet config
6. File upload security improvements
7. Database connection hardening
8. Smart contract upgrades

### Phase 3 (Medium Priority - 1 month):
9. Caching implementation
10. Enhanced logging and monitoring
11. Client-side security improvements
12. Performance optimizations

---

## 📚 Additional Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
- Smart Contract Security: https://consensys.github.io/smart-contract-best-practices/
- Web3 Security: https://github.com/ethereum/wiki/wiki/Safety

---

**Last Updated**: October 17, 2025  
**Version**: 1.0  
**Status**: Initial Security Audit
 