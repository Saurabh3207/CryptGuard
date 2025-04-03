const ethers = require("ethers");
const UserModel = require("../models/User");
const { PinataSDK } = require("pinata");
const { PINATA_JWT, PINATA_GATEWAY } = require("../config/serverConfig");
const { generateEncryptionKey } = require("../utils/generateKey");
const { encryptFile } = require("../utils/encryption");
const multer = require("multer");
const stream = require("stream");
const axios = require("axios");
const FormData = require("form-data");

// Initialize multer to handle file uploads (in memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("file");

async function uploadFileController(req, res, next) {
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    // For testing, replace with dynamic address
    const address = "0x75D1a8b4f0a3761B5D199e36C32a948EeA5A87d4"; 
    const userAddress = address.toLowerCase();
    const user = await UserModel.findOne({ userAddress: userAddress });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate encryption key if it doesn't exist
    if (user.encryptionKey === null) {
      const encryptionKey = generateEncryptionKey(32);
      user.encryptionKey = encryptionKey;
      await user.save();
    }

    // Encrypt the file using the user encryption key
    const { encryptedData, iv } = encryptFile(req.file.buffer, user.encryptionKey);
   

    // Convert the encrypted Buffer to a readable stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(encryptedData);

    // Prepare the FormData for uploading to Pinata
    const formData = new FormData();
    formData.append("file", bufferStream, { filename: req.file.originalname });

    // Upload the encrypted file to Pinata using axios
    const uploadResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );
    

    // Respond with the IPFS hash after upload
    res.status(200).json({
      message: "File uploaded successfully",
      ipfsHash: uploadResponse.data.IpfsHash, // Return the IPFS hash
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { uploadFileController };
