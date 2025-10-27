const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true // Add index for faster queries
  },
  encryptionKey: {
    type: Buffer,
    default: null
  },
  backupEncryptionKey: {
    type: String, // Encrypted backup key for recovery
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  }
});

// Add compound index for better query performance
UserSchema.index({ userAddress: 1, createdAt: -1 });

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
