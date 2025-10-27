const FileMapping = require("../models/FileMapping");
const { logger } = require("../utils/logger");

async function confirmUploadController(req, res) {
  try {
    const { address, ipfsCID, metadataCID, fileHash, fileName, fileSize, fileType, blockchainTxHash } = req.body;

    // 1. Validate required fields
    if (!address || !ipfsCID || !metadataCID || !fileHash) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const userAddress = address.toLowerCase();

    // 2. Prevent duplicate entry
    const existing = await FileMapping.findOne({ userAddress, fileHash });
    if (existing) {
      return res.status(409).json({ message: "This file is already uploaded." });
    }

    // 3. Save to DB
    const savedFile = await FileMapping.create({
      userAddress,
      ipfsCID,
      metadataCID,
      fileHash,
      fileName,
      fileSize,
      fileType,
      blockchainTxHash: blockchainTxHash || null,
      verified: !!blockchainTxHash, // Mark as verified if blockchain tx hash provided
      uploadTime: new Date(),
    });

    // Audit log for file upload
    logger.audit('FILE_UPLOAD', {
      userAddress,
      fileName,
      fileSize,
      fileType,
      ipfsCID,
      fileHash,
      blockchainTxHash: blockchainTxHash || 'N/A',
      timestamp: new Date().toISOString()
    });

    // 4. Send back success + saved metadata
    res.status(200).json({
      message: "✅ File mapping saved successfully",
      file: savedFile,
    });

  } catch (error) {
    console.error("❌ Confirm upload error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { confirmUploadController };
