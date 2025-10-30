// Client/CryptGuard/src/utils/cryptoUtils.js - Client-side cryptographic utilities

/**
 * Client-side cryptographic utilities using Web Crypto API
 * Provides secure RSA key generation, encryption, and password-based key derivation
 */

// Constants
const RSA_KEY_SIZE = 2048;
const AES_KEY_SIZE = 256;
const PBKDF2_ITERATIONS = 100000;
const SALT_SIZE = 16;
const IV_SIZE = 12; // GCM mode uses 12-byte IV

/**
 * Generate RSA key pair using Web Crypto API
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
 */
export const generateRSAKeyPair = async () => {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: RSA_KEY_SIZE,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );

    return keyPair;
  } catch (error) {
    throw new Error(`RSA key generation failed: ${error.message}`);
  }
};

/**
 * Export RSA public key to PEM format
 * @param {CryptoKey} publicKey - Public key to export
 * @returns {Promise<string>} PEM formatted public key
 */
export const exportPublicKey = async (publicKey) => {
  try {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
  } catch (error) {
    throw new Error(`Public key export failed: ${error.message}`);
  }
};

/**
 * Export RSA private key to PEM format
 * @param {CryptoKey} privateKey - Private key to export
 * @returns {Promise<string>} PEM formatted private key
 */
export const exportPrivateKey = async (privateKey) => {
  try {
    const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
  } catch (error) {
    throw new Error(`Private key export failed: ${error.message}`);
  }
};

/**
 * Import RSA private key from PEM format
 * @param {string} pemKey - PEM formatted private key
 * @returns {Promise<CryptoKey>} Imported private key
 */
export const importPrivateKey = async (pemKey) => {
  try {
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pemKey.substring(pemHeader.length, pemKey.length - pemFooter.length);
    const binaryDerString = atob(pemContents.replace(/\s/g, ''));
    const binaryDer = new Uint8Array([...binaryDerString].map(char => char.charCodeAt(0)));

    return await window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );
  } catch (error) {
    throw new Error(`Private key import failed: ${error.message}`);
  }
};

/**
 * Derive encryption key from password using PBKDF2
 * @param {string} password - User password
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
export const deriveKeyFromPassword = async (password, salt) => {
  try {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      keyMaterial,
      {
        name: "AES-GCM",
        length: AES_KEY_SIZE
      },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    throw new Error(`Key derivation failed: ${error.message}`);
  }
};

/**
 * Encrypt private key with password
 * @param {string} privateKeyPem - PEM formatted private key
 * @param {string} password - Encryption password
 * @returns {Promise<{encryptedKey: string, salt: string, iv: string}>}
 */
export const encryptPrivateKey = async (privateKeyPem, password) => {
  try {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_SIZE));
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));
    
    const derivedKey = await deriveKeyFromPassword(password, salt);
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      derivedKey,
      encoder.encode(privateKeyPem)
    );

    return {
      encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv))
    };
  } catch (error) {
    throw new Error(`Private key encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt private key with password
 * @param {string} encryptedKey - Base64 encoded encrypted key
 * @param {string} salt - Base64 encoded salt
 * @param {string} iv - Base64 encoded IV
 * @param {string} password - Decryption password
 * @returns {Promise<string>} Decrypted PEM formatted private key
 */
export const decryptPrivateKey = async (encryptedKey, salt, iv, password) => {
  try {
    const decoder = new TextDecoder();
    const encryptedBuffer = new Uint8Array([...atob(encryptedKey)].map(c => c.charCodeAt(0)));
    const saltBuffer = new Uint8Array([...atob(salt)].map(c => c.charCodeAt(0)));
    const ivBuffer = new Uint8Array([...atob(iv)].map(c => c.charCodeAt(0)));
    
    const derivedKey = await deriveKeyFromPassword(password, saltBuffer);
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer
      },
      derivedKey,
      encryptedBuffer
    );

    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error(`Private key decryption failed: ${error.message}`);
  }
};

/**
 * Generate secure file encryption key
 * @returns {Promise<CryptoKey>} AES encryption key
 */
export const generateFileEncryptionKey = async () => {
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: AES_KEY_SIZE
      },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    throw new Error(`File encryption key generation failed: ${error.message}`);
  }
};

/**
 * Encrypt file with AES-GCM
 * @param {ArrayBuffer} fileData - File data to encrypt
 * @param {CryptoKey} key - AES encryption key
 * @returns {Promise<{encryptedData: ArrayBuffer, iv: Uint8Array}>}
 */
export const encryptFile = async (fileData, key) => {
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));
    
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      fileData
    );

    return { encryptedData, iv };
  } catch (error) {
    throw new Error(`File encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt file with AES-GCM
 * @param {ArrayBuffer} encryptedData - Encrypted file data
 * @param {Uint8Array} iv - Initialization vector
 * @param {CryptoKey} key - AES decryption key
 * @returns {Promise<ArrayBuffer>} Decrypted file data
 */
export const decryptFile = async (encryptedData, iv, key) => {
  try {
    return await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encryptedData
    );
  } catch (error) {
    throw new Error(`File decryption failed: ${error.message}`);
  }
};

/**
 * Generate secure hash of file content
 * @param {ArrayBuffer} fileData - File data to hash
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export const generateFileHash = async (fileData) => {
  try {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', fileData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    throw new Error(`File hash generation failed: ${error.message}`);
  }
};

/**
 * Validate Ethereum address format
 * @param {string} address - Ethereum address to validate
 * @returns {boolean} True if valid
 */
export const isValidEthereumAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Sanitize file name for security
 * @param {string} fileName - Original file name
 * @returns {string} Sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove dangerous characters
    .replace(/\.\./g, '') // Remove directory traversal
    .trim()
    .substring(0, 255); // Limit length
};

/**
 * Validate file size and type
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {{valid: boolean, error?: string}}
 */
export const validateFile = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  // Check for dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (dangerousExtensions.includes(fileExtension)) {
    return { valid: false, error: 'File type not allowed for security reasons' };
  }

  return { valid: true };
};

// Error classes for better error handling
export class CryptoError extends Error {
  constructor(message, code = 'CRYPTO_ERROR') {
    super(message);
    this.name = 'CryptoError';
    this.code = code;
  }
}

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * WALLET-BASED KEY DERIVATION (Priority 2 Security Enhancement)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Derives encryption keys from MetaMask wallet signatures.
 * No keys stored in database - wallet IS the key!
 */

// Standard message for key derivation (matches server-side)
const KEY_DERIVATION_MESSAGE = 'CryptGuard Encryption Key Derivation v1.0';

/**
 * Get the message user must sign for key derivation
 * @returns {string} Standard message
 */
export const getKeyDerivationMessage = () => {
  return KEY_DERIVATION_MESSAGE;
};

/**
 * Derive encryption key from wallet signature using PBKDF2
 * 
 * @param {string} signature - MetaMask signature (130 chars with 0x prefix)
 * @param {string} userAddress - User's Ethereum address (used as salt)
 * @returns {Promise<Uint8Array>} 32-byte encryption key
 */
export const deriveKeyFromSignature = async (signature, userAddress) => {
  try {
    if (!signature || !userAddress) {
      throw new CryptoError('Signature and userAddress are required', 'MISSING_PARAMS');
    }

    // Normalize signature (remove 0x if present)
    const normalizedSignature = signature.startsWith('0x') 
      ? signature.slice(2) 
      : signature;

    // Convert signature to bytes
    const signatureBytes = new Uint8Array(
      normalizedSignature.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    // Import signature as key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      signatureBytes,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Use user address as salt
    const encoder = new TextEncoder();
    const salt = encoder.encode(userAddress.toLowerCase());

    // Derive 32-byte key using PBKDF2 with 100k iterations
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,  // Match server-side
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256  // 256 bits = 32 bytes
      },
      true,  // extractable
      ['encrypt', 'decrypt']
    );

    // Export as raw bytes
    const exportedKey = await window.crypto.subtle.exportKey('raw', derivedKey);
    return new Uint8Array(exportedKey);

  } catch (error) {
    throw new CryptoError(`Key derivation failed: ${error.message}`, 'DERIVATION_FAILED');
  }
};

/**
 * Request user to sign key derivation message with MetaMask
 * 
 * @param {object} signer - Ethers.js signer from MetaMask
 * @param {string} userAddress - User's address
 * @returns {Promise<{signature: string, key: Uint8Array}>}
 */
export const requestKeyDerivationSignature = async (signer, userAddress) => {
  try {
    if (!signer) {
      throw new CryptoError('Signer not available. Connect wallet first.', 'NO_SIGNER');
    }

    // Request user to sign the standard message
    const signature = await signer.signMessage(KEY_DERIVATION_MESSAGE);

    // Derive key from signature
    const key = await deriveKeyFromSignature(signature, userAddress);

    return {
      signature,
      key,
      keyHex: Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('')
    };

  } catch (error) {
    if (error.code === 4001) {
      throw new CryptoError('User rejected signature request', 'USER_REJECTED');
    }
    throw new CryptoError(`Signature request failed: ${error.message}`, 'SIGNATURE_FAILED');
  }
};

/**
 * Convert key bytes to hex string (for server API calls)
 * @param {Uint8Array} keyBytes - Key bytes
 * @returns {string} Hex string
 */
export const keyBytesToHex = (keyBytes) => {
  return Array.from(keyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Convert hex string to key bytes
 * @param {string} hexKey - Hex string
 * @returns {Uint8Array} Key bytes
 */
export const hexToKeyBytes = (hexKey) => {
  const normalized = hexKey.startsWith('0x') ? hexKey.slice(2) : hexKey;
  return new Uint8Array(
    normalized.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );
};