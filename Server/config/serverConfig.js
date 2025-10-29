require ('dotenv').config();


module.exports = {
    MONGODB_URL: process.env.MONGODB_URL,
    PORT: process.env.PORT || 3000,
    JWT_SECRETKEY: process.env.JWT_SECRETKEY,
    PINATA_JWT : process.env.PINATA_JWT,
    PINATA_GATEWAY : process.env.PINATA_GATEWAY,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    
    // Security feature flags (set to 'true' in .env to enable)
    ENABLE_REPLAY_PROTECTION: process.env.ENABLE_REPLAY_PROTECTION === 'true',
    ENABLE_REQUEST_SIGNING: process.env.ENABLE_REQUEST_SIGNING === 'true',
    ENABLE_CONTENT_INTEGRITY: process.env.ENABLE_CONTENT_INTEGRITY === 'true',
    
    // Security configuration
    NONCE_EXPIRY_MS: parseInt(process.env.NONCE_EXPIRY_MS) || 5 * 60 * 1000, // 5 minutes default
}