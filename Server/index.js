
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sanitizeInputs, validateContentType, validateBodySize } = require('./middleware/validation');
const { MONGODB_URL, PORT, CORS_ORIGIN } = require('./config/serverConfig');
const { connectDB } = require('./db/connect');
const authenticationRoute = require('./routes/authenticationRoute');
const uploadFileRoute = require('./routes/uploadFileRoute');
const fileRoute = require('./routes/fileRoute');
const decryptRoute = require('./routes/decryptRoute');

// Security headers
app.use(helmet());

// Restrict CORS to trusted origin (set CORS_ORIGIN in .env)
const allowedOrigin = CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
    origin: allowedOrigin,
    credentials: true,
}));

// Body size validation (before parsing)
app.use(validateBodySize);

// Parse JSON with size limit
app.use(express.json({ limit: '10mb' }));

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

// Routes
app.use('/api', authenticationRoute);
app.use('/api', uploadFileRoute);
app.use('/api', fileRoute);
app.use('/api', decryptRoute);

async function serverStart() {
    try {
        await connectDB(MONGODB_URL);
        console.log('Connected to the database');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
}

// function to start the server
serverStart();

 