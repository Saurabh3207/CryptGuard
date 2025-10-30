require ('dotenv').config();


module.exports = {
    MONGODB_URL: process.env.MONGODB_URL,
    PORT: process.env.PORT || 3000,
    JWT_SECRETKEY: process.env.JWT_SECRETKEY,
    JWT_REFRESH_SECRETKEY: process.env.JWT_REFRESH_SECRETKEY,
    MASTER_ENCRYPTION_KEY: process.env.MASTER_ENCRYPTION_KEY,
    PINATA_JWT : process.env.PINATA_JWT,
    PINATA_GATEWAY : process.env.PINATA_GATEWAY,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    
    // Security feature flags (set to 'true' in .env to enable)
    ENABLE_REPLAY_PROTECTION: process.env.ENABLE_REPLAY_PROTECTION === 'true',
    ENABLE_REQUEST_SIGNING: process.env.ENABLE_REQUEST_SIGNING === 'true',
    ENABLE_CONTENT_INTEGRITY: process.env.ENABLE_CONTENT_INTEGRITY === 'true',
    
    // Security configuration
    NONCE_EXPIRY_MS: parseInt(process.env.NONCE_EXPIRY_MS) || 5 * 60 * 1000, // 5 minutes default
    
    // Validate critical secrets on startup
    validateSecrets() {
        const errors = [];
        
        // Validate JWT secrets
        if (!this.JWT_SECRETKEY || this.JWT_SECRETKEY.length < 64) {
            errors.push('JWT_SECRETKEY must be at least 32 bytes (64 hex characters)');
        }
        
        if (!this.JWT_REFRESH_SECRETKEY) {
            errors.push('JWT_REFRESH_SECRETKEY is required and must be different from JWT_SECRETKEY');
        } else if (this.JWT_REFRESH_SECRETKEY.length < 64) {
            errors.push('JWT_REFRESH_SECRETKEY must be at least 32 bytes (64 hex characters)');
        } else if (this.JWT_SECRETKEY === this.JWT_REFRESH_SECRETKEY) {
            errors.push('JWT_SECRETKEY and JWT_REFRESH_SECRETKEY must be different');
        }
        
        // Validate master encryption key
        if (!this.MASTER_ENCRYPTION_KEY) {
            errors.push('MASTER_ENCRYPTION_KEY is required for encrypting user keys');
        } else if (this.MASTER_ENCRYPTION_KEY.length < 64) {
            errors.push('MASTER_ENCRYPTION_KEY must be at least 32 bytes (64 hex characters)');
        }
        
        if (errors.length > 0) {
            console.error('\nCRITICAL SECURITY CONFIGURATION ERRORS:\n');
            errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
            console.error('\nGenerate secure keys with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
            throw new Error('Invalid security configuration. Fix the above errors before starting the server.');
        }
    }
}