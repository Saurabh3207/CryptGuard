const crypto = require('crypto');

/**
 * Generate a cryptographically secure encryption key
 * @param {number} byteLength - Length in BYTES (not hex characters)
 * @returns {Buffer} - Secure random bytes for encryption
 * 
 * FIXED: Previous version generated only half the required bytes
 * - Old: generateEncryptionKey(32) returned 32 hex chars = 16 bytes (WEAK!)
 * - New: generateEncryptionKey(32) returns 32 bytes = proper AES-256 key
 */
const generateEncryptionKey = (byteLength = 32) => {
    // Validate minimum key length for AES-256
    if (byteLength < 32) {
        throw new Error('Encryption key must be at least 32 bytes for AES-256 security');
    }
    
    // Generate cryptographically secure random bytes
    // Returns a Buffer directly (NOT hex string) for use with crypto operations
    return crypto.randomBytes(byteLength);
};

module.exports = { generateEncryptionKey };