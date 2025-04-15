const ethers = require("ethers");
const UserModel = require("../models/User");
const { PINATA_JWT } = require("../config/serverConfig");
const { generateEncryptionKey } = require("../utils/generateKey");
const { encryptFile } = require("../utils/encryption");
const stream = require("stream");
const axios = require("axios");
const FormData = require("form-data");
const FileMapping = require("../models/FileMapping"); 

async function uploadFileController(req, res, next) {
  try {
    const { address, fileHash } = req.body;


    if (!address || !req.file) {
      return res.status(400).json({ message: "Missing address or file" });
    }

    console.log("Uploaded File Object:", req.file);

    const userAddress = address.toLowerCase();
    let user = await UserModel.findOne({ userAddress });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 Generate encryption key if not present
    if (!user.encryptionKey) {
      const encryptionKey = generateEncryptionKey(32);
      user.encryptionKey = encryptionKey;
      await user.save();
    }

    // 🔒 Encrypt the uploaded file
    const { encryptedData, iv } = encryptFile(
      req.file.buffer,
      user.encryptionKey
    );

    // 📤 Upload encrypted file to IPFS
    const fileStream = new stream.PassThrough();
    fileStream.end(encryptedData);

    const fileFormData = new FormData();
    fileFormData.append("file", fileStream, {
      filename: req.file.originalname,
    });

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

    const encryptedFileCID = encryptedFileRes.data.IpfsHash;

    // 🧾 Create metadata JSON including timestamp
    const metadata = {
      iv: iv.toString("hex"),
      uploadedBy: userAddress,
      uploadedAt: new Date().toISOString(),
      originalFileName: req.file.originalname,
    };

    const metadataBuffer = Buffer.from(JSON.stringify(metadata));

    //  Create unique metadata file name
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timePart = now.toTimeString().slice(0, 5).replace(":", "");
    const metadataFileName = `metadata_${datePart}_${timePart}.json`;

    const metaFormData = new FormData();
    metaFormData.append("file", metadataBuffer, {
      filename: metadataFileName,
      contentType: "application/json"
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

    // Save mapping to MongoDB
    await FileMapping.create({
      userAddress,
      ipfsCID: encryptedFileCID,
      metadataCID,
      fileName: req.file.originalname,
      uploadTime: new Date(),
      fileHash: fileHash,

    });

    //  Send both CIDs to frontend
    res.status(200).json({
      message: "Encrypted file & metadata uploaded successfully",
      encryptedFileCID,
      metadataCID,
    });

  } catch (error) {
    console.error("Upload Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { uploadFileController };
