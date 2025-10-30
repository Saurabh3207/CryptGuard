const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { sanitizeInputs, validateContentType, validateBodySize } = require('./middleware/validation');
const { enhancedSecurityHeaders, preventReplayAttack } = require('./middleware/securityMiddleware');
const { logger } = require('./utils/logger');
const config = require('./config/serverConfig');
const { MONGODB_URL, PORT } = config;
const { connectDB } = require('./db/connect');
const authenticationRoute = require('./routes/authenticationRoute');
const uploadFileRoute = require('./routes/uploadFileRoute');
const fileRoute = require('./routes/fileRoute');
const decryptRoute = require('./routes/decryptRoute');
const refreshTokenRoute = require('./routes/refreshTokenRoute');
const logoutRoute = require('./routes/logoutRoute');
const deleteFileRoute = require('./routes/deleteFileRoute');

// Security headers (helmet provides basic protection)
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
  }
}));

// Enhanced custom security headers
app.use(enhancedSecurityHeaders);

// Restrict CORS to trusted origin (set CORS_ORIGIN in .env)
const allowedOrigin = config.CORS_ORIGIN;
app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Request-Timestamp', 
                     'X-Request-Nonce', 'X-Content-Checksum', 'X-Request-Signature'],
    exposedHeaders: ['X-Response-Checksum']
}));

// Body size validation (before parsing)
app.use(validateBodySize);

// Parse JSON with size limit
app.use(express.json({ limit: '10mb' }));

// Parse cookies (for HttpOnly token support)
app.use(cookieParser());

// Global input sanitization (prevents NoSQL injection)
app.use(sanitizeInputs);

// Validate content type for API requests
app.use(validateContentType);

// ===== RATE LIMITING PROTECTION =====
// General API rate limiter - prevents DDoS attacks
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 minutes
    message: { 
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        console.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
        res.status(429).json({
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

// Strict rate limiter for authentication - prevents brute force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 authentication attempts per 15 minutes
    message: { 
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
        console.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            message: 'Too many authentication attempts. Please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

// Apply rate limiters
app.use('/api', apiLimiter); // Apply to all API routes
app.use('/api/authentication', authLimiter); // Extra strict for auth

// Apply replay attack prevention conditionally (based on ENABLE_REPLAY_PROTECTION flag)
// When disabled, middleware is a no-op and passes through
app.use('/api', preventReplayAttack);

// Routes
app.use('/api', authenticationRoute);
app.use('/api', refreshTokenRoute);  // Token refresh endpoint
app.use('/api', logoutRoute);        // Logout endpoint
app.use('/api', uploadFileRoute);
app.use('/api', fileRoute);
app.use('/api', decryptRoute);
app.use('/api', deleteFileRoute);    // File deletion endpoint

// Start server
async function serverStart() {
    try {
        // Validate security configuration
        config.validateSecrets();
        
        // Verify key encryption system
        const { verifyKeyEncryption } = require('./utils/keyEncryption');
        verifyKeyEncryption();
        
        await connectDB(MONGODB_URL);
        
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.security('Master key encryption active', { timestamp: new Date().toISOString() });
        });
    } catch (error) {
        logger.error('Server startup failed', { error: error.message });
        process.exit(1);
    }
}

serverStart();

 