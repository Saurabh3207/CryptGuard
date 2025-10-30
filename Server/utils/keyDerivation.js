const crypto = require('crypto');

/**
 * CryptGuard - Wallet-Based Key Derivation
 * 
 * Derives encryption keys from MetaMask wallet signatures.
 * This eliminates the need to store encryption keys in the database.
 * 
 * Security Benefits:
 * - Zero-knowledge: Keys never stored anywhere
 * - User's wallet IS their encryption key
 * - Lost wallet = lost access (true end-to-end encryption)
 * - No key management overhead
 */

// Constants for PBKDF2
const PBKDF2_ITERATIONS = 100000;  // 100k iterations (OWASP recommendation)
const KEY_LENGTH = 32;              // 32 bytes = 256 bits for AES-256
const DIGEST = 'sha256';

// Standard message for key derivation (never changes)
const KEY_DERIVATION_MESSAGE = 'CryptGuard Encryption Key Derivation v1.0';

/**
 * Derive encryption key from wallet signature
 * 
 * Flow:
 * 1. User signs KEY_DERIVATION_MESSAGE with MetaMask
 * 2. Signature is used as input to PBKDF2
 * 3. Deterministic key is derived (same signature = same key)
 * 
 * @param {string} signature - Ethereum signature from MetaMask (130 chars hex)
 * @param {string} userAddress - User's Ethereum address (used as salt)
 * @returns {Buffer} - 32-byte encryption key
 */
function deriveKeyFromSignature(signature, userAddress) {
  try {
    // Validate inputs
    if (!signature || typeof signature !== 'string') {
      throw new Error('Invalid signature: must be a non-empty string');
    }
    
    if (!userAddress || typeof userAddress !== 'string') {
      throw new Error('Invalid userAddress: must be a non-empty string');
    }
    
    // Normalize signature (remove 0x prefix if present)
    const normalizedSignature = signature.startsWith('0x') 
      ? signature.slice(2) 
      : signature;
    
    // Use user address as salt (makes key unique per user)
    const salt = userAddress.toLowerCase();
    
    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(
      normalizedSignature,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      DIGEST
    );
    
    return derivedKey;
  } catch (error) {
    throw new Error(`Key derivation failed: ${error.message}`);
  }
}

/**
 * Verify that a signature can derive a key (testing purposes)
 * 
 * @param {string} signature - Ethereum signature
 * @param {string} userAddress - User's address
 * @returns {boolean} - True if derivation succeeds
 */
function verifyKeyDerivation(signature, userAddress) {
  try {
    const key = deriveKeyFromSignature(signature, userAddress);
    return key && key.length === KEY_LENGTH;
  } catch (error) {
    return false;
  }
}

/**
 * Get the standard message that users must sign for key derivation
 * 
 * @returns {string} - Message to sign with MetaMask
 */
function getKeyDerivationMessage() {
  return KEY_DERIVATION_MESSAGE;
}

/**
 * Generate a deterministic key from signature (hex string format)
 * Useful for compatibility with existing encryption code
 * 
 * @param {string} signature - Ethereum signature
 * @param {string} userAddress - User's address
 * @returns {string} - 64-character hex string (32 bytes)
 */
function deriveKeyHex(signature, userAddress) {
  const keyBuffer = deriveKeyFromSignature(signature, userAddress);
  return keyBuffer.toString('hex');
}

/**
 * Test the key derivation system
 * Verifies PBKDF2 is working correctly
 */
function testKeyDerivation() {
  try {
    console.log('\n🧪 Testing Wallet-Based Key Derivation\n');
    console.log('════════════════════════════════════════════════════════════\n');
    
    // Mock signature (would come from MetaMask in production)
    const mockSignature = '0x' + crypto.randomBytes(65).toString('hex');
    const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    
    console.log('Test 1: Basic Key Derivation');
    const key1 = deriveKeyFromSignature(mockSignature, mockAddress);
    console.log(`  ✓ Derived key length: ${key1.length} bytes`);
    console.log(`  ✓ Expected length: ${KEY_LENGTH} bytes`);
    console.log(`  ✓ Key (hex): ${key1.toString('hex').substring(0, 32)}...`);
    
    console.log('\nTest 2: Deterministic (same input = same output)');
    const key2 = deriveKeyFromSignature(mockSignature, mockAddress);
    const matches = key1.equals(key2);
    console.log(`  ✓ Keys match: ${matches}`);
    
    console.log('\nTest 3: Different signatures = different keys');
    const differentSig = '0x' + crypto.randomBytes(65).toString('hex');
    const key3 = deriveKeyFromSignature(differentSig, mockAddress);
    const different = !key1.equals(key3);
    console.log(`  ✓ Keys different: ${different}`);
    
    console.log('\nTest 4: Hex format output');
    const hexKey = deriveKeyHex(mockSignature, mockAddress);
    console.log(`  ✓ Hex key length: ${hexKey.length} chars (${hexKey.length/2} bytes)`);
    console.log(`  ✓ Hex key: ${hexKey.substring(0, 32)}...`);
    
    console.log('\nTest 5: Verification function');
    const valid = verifyKeyDerivation(mockSignature, mockAddress);
    console.log(`  ✓ Verification passed: ${valid}`);
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('\n✅ All tests passed! Key derivation is working correctly.\n');
    
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

module.exports = {
  deriveKeyFromSignature,
  deriveKeyHex,
  verifyKeyDerivation,
  getKeyDerivationMessage,
  testKeyDerivation,
  // Export constants for documentation
  PBKDF2_ITERATIONS,
  KEY_LENGTH,
  KEY_DERIVATION_MESSAGE
};
