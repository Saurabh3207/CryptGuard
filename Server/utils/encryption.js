
const crypto = require('crypto');

const encryptFile = (fileBuffer, encryptionKey) => {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  
  // // Create a cipher object with AES-256-CBC algorithm and the provided encryption key and IV
  // Normalize encryption key: accept Buffer, hex string, or base64 string
  const normalizeKey = (key) => {
    if (Buffer.isBuffer(key)) return key;
    if (typeof key === 'string') {
      // Hex (even length) -> treat as hex
      if (/^[0-9a-fA-F]+$/.test(key) && key.length % 2 === 0) {
        return Buffer.from(key, 'hex');
      }
      // base64 fallback
      try {
        return Buffer.from(key, 'base64');
      } catch (e) {
        return Buffer.from(key);
      }
    }
    throw new Error('Invalid encryption key format');
  };

  const keyBuffer = normalizeKey(encryptionKey);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  
  // Encrypt the file data
  const encryptedData = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  
  // Return the encrypted data and initialization vector
  return { encryptedData, iv };
};

module.exports = {
  encryptFile,
};