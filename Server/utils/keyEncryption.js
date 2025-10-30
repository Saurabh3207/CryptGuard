const crypto = require('crypto');
const config = require('../config/serverConfig');

/**
 * Encrypt user's encryption key before storing in database
 * Uses AES-256-GCM for authenticated encryption (more secure than CBC)
 * 
 * @param {Buffer} plainKey - The user's encryption key in plaintext
 * @returns {Buffer} - Encrypted key: [iv(16) + authTag(16) + encrypted]
 */
function encryptKey(plainKey) {
  // Validate master key exists and has proper length
  if (!config.MASTER_ENCRYPTION_KEY) {
    throw new Error('MASTER_ENCRYPTION_KEY not configured. Cannot encrypt user keys.');
  }
  
  if (config.MASTER_ENCRYPTION_KEY.length < 64) {
    throw new Error('MASTER_ENCRYPTION_KEY must be at least 32 bytes (64 hex characters)');
  }

  try {
    // Convert master key from hex to Buffer
    const masterKey = Buffer.from(config.MASTER_ENCRYPTION_KEY, 'hex');
    
    // Generate random IV (12 bytes is recommended for GCM)
    const iv = crypto.randomBytes(12);
    
    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
    
    // Encrypt the key
    let encrypted = cipher.update(plainKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get authentication tag (provides integrity check)
    const authTag = cipher.getAuthTag();
    
    // Return combined buffer: iv + authTag + encrypted
    // This format makes it easy to extract components during decryption
    return Buffer.concat([iv, authTag, encrypted]);
    
  } catch (error) {
    throw new Error('Failed to encrypt user key: ' + error.message);
  }
}

/**
 * Decrypt user's encryption key when loading from database
 * 
 * @param {Buffer} encryptedKey - The encrypted key from database
 * @returns {Buffer} - The original plaintext encryption key
 */
function decryptKey(encryptedKey) {
  // Validate master key exists
  if (!config.MASTER_ENCRYPTION_KEY) {
    throw new Error('MASTER_ENCRYPTION_KEY not configured. Cannot decrypt user keys.');
  }

  try {
    // Convert master key from hex to Buffer
    const masterKey = Buffer.from(config.MASTER_ENCRYPTION_KEY, 'hex');
    
    // Extract components from the combined buffer
    const iv = encryptedKey.slice(0, 12);           // First 12 bytes
    const authTag = encryptedKey.slice(12, 28);     // Next 16 bytes
    const encrypted = encryptedKey.slice(28);       // Rest is encrypted data
    
    // Create decipher with AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
    
    // Set authentication tag (verifies integrity)
    decipher.setAuthTag(authTag);
    
    // Decrypt the key
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
    
  } catch (error) {
    // This could happen if:
    // 1. Wrong master key used
    // 2. Data corrupted
    // 3. Tampered data (auth tag verification fails)
    throw new Error('Failed to decrypt user key. Data may be corrupted or master key changed.');
  }
}

/**
 * Verify that key encryption/decryption is working correctly
 * Run this during server startup to catch configuration issues early
 */
function verifyKeyEncryption() {
  try {
    // Test with a sample 32-byte key
    const testKey = crypto.randomBytes(32);
    const encrypted = encryptKey(testKey);
    const decrypted = decryptKey(encrypted);
    
    // Verify the decrypted key matches original
    if (!testKey.equals(decrypted)) {
      throw new Error('Key encryption/decryption verification failed');
    }
    
    return true;
    
  } catch (error) {
    throw new Error(`Key encryption verification failed: ${error.message}`);
  }
}

module.exports = {
  encryptKey,
  decryptKey,
  verifyKeyEncryption
};
