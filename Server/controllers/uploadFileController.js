const ethers = require("ethers");
const UserModel = require("../models/User");
const { PinataSDK } = require("pinata");
const { PINATA_JWT, PINATA_GATEWAY } = require("../config/serverConfig");
const { generateEncryptionKey } = require("../utils/generateKey");
const { encryptFile } = require("../utils/encryption");

async function uploadFileController(req, res, next) {
  try {
    const pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY
    });
    // for testing purposes
    const address = "0x75D1a8b4f0a3761B5D199e36C32a948EeA5A87d4"; 
    const userAddress = address.toLowerCase();
    const user = await UserModel.findOne({userAddress:userAddress});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if(user.encryptionKey === null){
      const encryptionKey = generateEncryptionKey(32);
      user.encryptionKey = encryptionKey;
      await user.save();
    }
    const { encryptedData, iv } = encryptFile(req.file.buffer, user.encryptionKey);
    console.log(encryptedData);
    // Upload the encrypted file to IPFS
    
    res.status(200).json({ message: "File uploaded successfully" });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { uploadFileController };
