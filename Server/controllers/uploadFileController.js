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

    // Check for missing fields in request body
    if (!address || !req.file) {
      console.error("Missing address or file in the request body.");
      return res.status(400).json({ message: "Missing address or file" });
    }
    
    //log the file object for debugging
    //console.log("Received File Object:", req.file); 
    
    const userAddress = address.toLowerCase();
    let user = await UserModel.findOne({ userAddress });

    if (!user) {
      console.error("User not found:", userAddress);
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 Generate encryption key if not present
    if (!user.encryptionKey) {
      console.log("Generating encryption key for user:", userAddress);
      const encryptionKey = generateEncryptionKey(32);
      user.encryptionKey = encryptionKey;
      await user.save();
    }

    // 🔒 Encrypt the uploaded file
    const { encryptedData, iv } = encryptFile(req.file.buffer, user.encryptionKey);
    console.log("File encrypted successfully");

    // 📤 Upload encrypted file to IPFS
    const fileStream = new stream.PassThrough();
    fileStream.end(encryptedData);

    const fileFormData = new FormData();
    fileFormData.append("file", fileStream, {
      filename: req.file.originalname,
    });

    let encryptedFileCID;
    try {
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
      encryptedFileCID = encryptedFileRes.data.IpfsHash;
      console.log("Encrypted file uploaded to Pinata. CID:", encryptedFileCID);
    } catch (pinataError) {
      console.error("Error uploading file to Pinata:", pinataError.response ? pinataError.response.data : pinataError.message);
      return res.status(500).json({ message: "Error uploading to Pinata" });
    }

    // 🧾 Create metadata JSON including timestamp
    const metadata = {
      iv: iv.toString("hex"),
      uploadedBy: userAddress,
      uploadedAt: new Date().toISOString(),
      originalFileName: req.file.originalname,
    };

    const metadataBuffer = Buffer.from(JSON.stringify(metadata));

    // Create unique metadata file name
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timePart = now.toTimeString().slice(0, 5).replace(":", "");
    const metadataFileName = `metadata_${datePart}_${timePart}.json`;

    const metaFormData = new FormData();
    metaFormData.append("file", metadataBuffer, {
      filename: metadataFileName,
      contentType: "application/json",
    });

    let metadataCID;
    try {
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
      metadataCID = metaRes.data.IpfsHash;
      console.log("Metadata uploaded to Pinata. CID:", metadataCID);
    } catch (pinataError) {
      console.error("Error uploading metadata to Pinata:", pinataError.response ? pinataError.response.data : pinataError.message);
      return res.status(500).json({ message: "Error uploading metadata to Pinata" });
    }

    // Save mapping to MongoDB
    try {
      await FileMapping.create({
        userAddress,
        ipfsCID: encryptedFileCID,
        metadataCID,
        fileName: req.file.originalname,
        uploadTime: new Date(),
        fileHash,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      });
      console.log("File mapping saved to MongoDB");
    } catch (dbError) {
      console.error("Error saving file mapping to MongoDB:", dbError.message);
      return res.status(500).json({ message: "Error saving file mapping to database" });
    }

    // Send both CIDs to frontend

     res.status(200).json({
      message: "Encrypted file & metadata uploaded successfully",
      ipfsCID: encryptedFileCID,
      metadataCID,
    });
  } catch (error) {
    console.error("Upload Error:", error.message || error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { uploadFileController };
