// File: Server/models/FileMapping.js

const mongoose = require("mongoose");

// 📁 File Mapping Schem
const FileMappingSchema = new mongoose.Schema({
  userAddress: { type: String, required: true },
  ipfsCID: { type: String, required: true },
  metadataCID: { type: String, required: true },
  fileName: { type: String },
  uploadTime: { type: Date, default: Date.now },
  fileHash: { type: String }, 
});

module.exports = mongoose.model("FileMapping", FileMappingSchema);
