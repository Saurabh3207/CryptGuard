const UserModel = require("../models/User");
const FileMapping = require("../models/FileMapping"); 
const { PINATA_JWT } = require("../config/serverConfig");
const { generateEncryptionKey } = require("../utils/generateKey");
const { encryptFile } = require("../utils/encryption");
const stream = require("stream");
const axios = require("axios");
const FormData = require("form-data");

async function preUploadFileController(req, res) {
  try {
    const { address, fileHash } = req.body;

    if (!address || !fileHash || !req.file) {
      return res.status(400).json({ message: "Missing address, file, or file hash" });
    }

    const userAddress = address.toLowerCase();

    // ✅ Check if file already exists in DB
    const alreadyExists = await FileMapping.findOne({ userAddress, fileHash });
    if (alreadyExists) {
      return res.status(409).json({ message: "File already exists" }); 
    }

    // ✅ Proceed if not duplicate
    let user = await UserModel.findOne({ userAddress });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.encryptionKey) {
      const encryptionKey = generateEncryptionKey(32);
      user.encryptionKey = encryptionKey;
      await user.save();
    }

    const { encryptedData, iv } = encryptFile(req.file.buffer, user.encryptionKey);

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
    console.error("Pre-upload Error:", error.message || error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { preUploadFileController };
