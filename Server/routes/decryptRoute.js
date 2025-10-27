// routes/decryptRoute.js
const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/authenticateToken');
const { validate } = require('../middleware/validation');
const UserModel = require('../models/User');
const { decryptData } = require('../utils/decryption');
const router = express.Router();

// POST /api/decryptAndDownload - Decrypt and download file
// Validation: encryptedCID, metadataCID in body
router.post('/decryptAndDownload', authenticateToken, validate('decryptAndDownload'), async (req, res) => {
  try {
    const { encryptedCID, metadataCID, fileName } = req.body;
    const userAddress = req.address.toLowerCase(); // From JWT

    // 🔐 1. Fetch encrypted file from IPFS
    const encryptedRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${encryptedCID}`, {
      responseType: 'arraybuffer',
    });
    const encryptedBuffer = Buffer.from(encryptedRes.data);

    // 📄 2. Fetch metadata (for IV)
    const metadataRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${metadataCID}`);
    const { iv } = metadataRes.data;

    // 🔑 3. Get user encryption key from DB
    const user = await UserModel.findOne({ userAddress });
    if (!user || !user.encryptionKey) {
      return res.status(404).json({ message: "Encryption key not found" });
    }

    let decryptedBuffer;
    try {
      decryptedBuffer = decryptData(encryptedBuffer, Buffer.from(iv, "hex"), user.encryptionKey);
      if (!decryptedBuffer) {
        throw new Error("Decryption returned empty buffer.");
      }
    } catch (err) {
      console.error("Decryption error:", err.message);
      return res.status(500).json({ message: "Decryption failed. File may be corrupted or key is invalid." });
    }
    
    //  If decryption successful, send file
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(decryptedBuffer);
    

  } catch (error) {
    console.error("Decryption failed:", error);
    res.status(500).json({ message: "Decryption failed", error: error.message });
  }
});

module.exports = router;
