const UserModel = require("../models/User");
const FileMapping = require("../models/FileMapping"); 
const { PINATA_JWT } = require("../config/serverConfig");
const { generateEncryptionKey } = require("../utils/generateKey");
const { encryptFile } = require("../utils/encryption");
const { deriveKeyFromSignature } = require("../utils/keyDerivation");
const { logger } = require("../utils/logger");
const stream = require("stream");
const axios = require("axios");
const FormData = require("form-data");

async function preUploadFileController(req, res) {
  try {
    const { address, fileHash, walletSignature } = req.body;

    if (!address || !fileHash || !req.file) {
      return res.status(400).json({ message: "Missing address, file, or file hash" });
    }

    const userAddress = address.toLowerCase();

    // Check if file already exists in DB
    const alreadyExists = await FileMapping.findOne({ userAddress, fileHash });
    if (alreadyExists) {
      return res.status(409).json({ message: "File already exists" }); 
    }

    // ✅ Proceed if not duplicate
    let user = await UserModel.findOne({ userAddress });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let userKey;

    // Priority 2: Wallet-Based Key Derivation (Preferred for new operations)
    if (walletSignature) {
      try {
        userKey = deriveKeyFromSignature(walletSignature, userAddress);
      } catch (error) {
        logger.error('Wallet derivation failed', { error: error.message, userAddress });
        return res.status(400).json({ 
          message: "Invalid wallet signature for key derivation",
          hint: "Please sign the key derivation message with MetaMask"
        });
      }
    } 
    // Priority 1: Master Key Encryption (Fallback for existing users)
    else {
      // Generate and encrypt user's encryption key if doesn't exist
      if (!user.encryptionKey) {
        const plainKey = generateEncryptionKey(32);
        user.encryptionKeyPlain = plainKey;  // Uses virtual setter (encrypts automatically)
        await user.save();
      }

      // Get decrypted key for file encryption
      userKey = user.encryptionKeyPlain;  // Uses virtual getter (decrypts automatically)
    }

    const { encryptedData, iv } = encryptFile(req.file.buffer, userKey);

    const fileStream = new stream.PassThrough();
    fileStream.end(encryptedData);

    const fileFormData = new FormData();
    fileFormData.append("file", fileStream, { filename: req.file.originalname });

    const encryptedFileRes = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      fileFormData,
      {
        headers: {
          ...fileFormData.getHeaders(),
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );
    const ipfsCID = encryptedFileRes.data.IpfsHash;

    // Verify IPFS pinning status
    try {
      const pinStatus = await axios.get(
        `https://api.pinata.cloud/data/pinList?hashContains=${ipfsCID}`,
        {
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
          },
        }
      );
      
      if (!pinStatus.data.rows || pinStatus.data.rows.length === 0) {
        throw new Error('IPFS pinning verification failed');
      }
    } catch (verifyError) {
      logger.warn('IPFS pinning verification warning', { error: verifyError.message, ipfsCID });
      // Continue even if verification fails (file is still uploaded)
    }

    const metadata = {
      iv: iv.toString("hex"),
      uploadedBy: userAddress,
      uploadedAt: new Date().toISOString(),
      originalFileName: req.file.originalname,
    };

    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const metaFormData = new FormData();
    metaFormData.append("file", metadataBuffer, {
      filename: `metadata_${Date.now()}.json`,
      contentType: "application/json",
    });

    const metaRes = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      metaFormData,
      {
        headers: {
          ...metaFormData.getHeaders(),
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );

    const metadataCID = metaRes.data.IpfsHash;

    res.status(200).json({
      ipfsCID,
      metadataCID,
      fileHash,
      message: "Encryption and IPFS upload successful",
    });

  } catch (error) {
    logger.error('Pre-upload error', { error: error.message, userAddress: req.body?.address });
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { preUploadFileController };
