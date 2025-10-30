// routes/decryptRoute.js
const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/authenticateToken');
const { validate } = require('../middleware/validation');
const UserModel = require('../models/User');
const { decryptData } = require('../utils/decryption');
const { deriveKeyFromSignature } = require('../utils/keyDerivation');
const { logger } = require('../utils/logger');
const router = express.Router();

// POST /api/decryptAndDownload - Decrypt and download file
// Validation: encryptedCID, metadataCID in body
router.post('/decryptAndDownload', authenticateToken, validate('decryptAndDownload'), async (req, res) => {
  try {
    const { encryptedCID, metadataCID, fileName, walletSignature } = req.body;
    const userAddress = req.address.toLowerCase(); // From JWT

    // 🔐 1. Fetch encrypted file from IPFS
    const encryptedRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${encryptedCID}`, {
      responseType: 'arraybuffer',
    });
    const encryptedBuffer = Buffer.from(encryptedRes.data);

    // 📄 2. Fetch metadata (for IV)
    const metadataRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${metadataCID}`);
    const { iv } = metadataRes.data;

    // Get user encryption key (Priority 2 or Priority 1)
    const user = await UserModel.findOne({ userAddress });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let userKey;

    // Priority 2: Wallet-Based Key Derivation (if signature provided)
    if (walletSignature) {
      try {
        userKey = deriveKeyFromSignature(walletSignature, userAddress);
      } catch (error) {
        logger.error('Wallet derivation failed for decryption', { error: error.message, userAddress });
        return res.status(400).json({ 
          message: "Invalid wallet signature for key derivation",
          hint: "Please sign the key derivation message with MetaMask"
        });
      }
    }
    // Priority 1: Master Key Encryption (fallback)
    else {
      if (!user.encryptionKey) {
        return res.status(404).json({ message: "Encryption key not found" });
      }

      // Get decrypted key using virtual getter
      userKey = user.encryptionKeyPlain;
      if (!userKey) {
        return res.status(500).json({ message: "Failed to decrypt user encryption key" });
      }
    }

    let decryptedBuffer;
    try {
      decryptedBuffer = decryptData(encryptedBuffer, Buffer.from(iv, "hex"), userKey);
      if (!decryptedBuffer) {
        throw new Error("Decryption returned empty buffer.");
      }
    } catch (err) {
      logger.error('Decryption error', { error: err.message, userAddress });
      return res.status(500).json({ message: "Decryption failed. File may be corrupted or key is invalid." });
    }
    
    // If decryption successful, send file
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(decryptedBuffer);

  } catch (error) {
    logger.error('Decryption failed', { error: error.message });
    res.status(500).json({ message: "Decryption failed", error: error.message });
  }
});

module.exports = router;
