const crypto = require('crypto');

const decryptData = (encryptedData, iv, encryptionKey) => {
    // Convert iv and encryptedData to Buffer if they are not already in the correct format
    try {
        if (typeof iv === 'object' && iv.type === 'Buffer' && Array.isArray(iv.data)) {
            iv = Buffer.from(iv.data);
        }

        if (typeof encryptedData === 'object' && encryptedData.type === 'Buffer' && Array.isArray(encryptedData.data)) {
            encryptedData = Buffer.from(encryptedData.data);
        }

        // Normalize encryption key input
        const normalizeKey = (key) => {
            if (Buffer.isBuffer(key)) return key;
            if (typeof key === 'string') {
                if (/^[0-9a-fA-F]+$/.test(key) && key.length % 2 === 0) {
                    return Buffer.from(key, 'hex');
                }
                try { return Buffer.from(key, 'base64'); } catch (e) { return Buffer.from(key); }
            }
            throw new Error('Invalid encryption key format');
        };

        const keyBuffer = normalizeKey(encryptionKey);

        // Create a decipher object with the same algorithm and key
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
        const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
        return decryptedData;
    } catch (error) {
        throw error; 
    }
 
};

module.exports = { decryptData };