// File: Server/models/FileMapping.js

const mongoose = require("mongoose");

// 📁 File Mapping Schema
const FileMappingSchema = new mongoose.Schema({
  userAddress: { 
    type: String, 
    required: true,
    lowercase: true,
    index: true // Add index for faster user queries
  },
  ipfsCID: { 
    type: String, 
    required: true,
    unique: true, // Prevent duplicate IPFS CIDs
    index: true
  },
  metadataCID: { 
    type: String, 
    required: true 
  },
  fileName: { type: String },
  uploadTime: { 
    type: Date, 
    default: Date.now,
    index: true // Index for time-based queries
  },
  fileHash: { 
    type: String,
    required: true,
    index: true // Index for hash lookups
  }, 
  fileSize: { type: Number },
  fileType: { type: String },
  blockchainTxHash: { 
    type: String, // Store blockchain transaction hash
    default: null 
  },
  verified: {
    type: Boolean, // Track if file has been verified on blockchain
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: null
  }
});

// Compound index for user + file hash lookups (duplicate detection)
FileMappingSchema.index({ userAddress: 1, fileHash: 1 });

// Compound index for user + upload time (recent files queries)
FileMappingSchema.index({ userAddress: 1, uploadTime: -1 });

module.exports = mongoose.model("FileMapping", FileMappingSchema);
