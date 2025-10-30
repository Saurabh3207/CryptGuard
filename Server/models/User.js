const mongoose = require('mongoose');
const { encryptKey, decryptKey } = require('../utils/keyEncryption');

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
    // NOTE: This stores the ENCRYPTED key, not plaintext!
    // Use the virtual field 'encryptionKeyPlain' to access the decrypted key
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

// Virtual field for transparent encryption/decryption of user's encryption key
// This allows us to work with plaintext keys in code while storing encrypted keys in DB
UserSchema.virtual('encryptionKeyPlain')
  .get(function() {
    // Decrypt when reading
    if (!this.encryptionKey) {
      return null;
    }
    try {
      return decryptKey(this.encryptionKey);
    } catch (error) {
      throw new Error(`Failed to decrypt user key: ${error.message}`);
    }
  })
  .set(function(plainKey) {
    // Encrypt when writing
    if (!plainKey) {
      this.encryptionKey = null;
    } else {
      try {
        this.encryptionKey = encryptKey(plainKey);
      } catch (error) {
        throw new Error(`Failed to encrypt user key: ${error.message}`);
      }
    }
  });

// Add compound index for better query performance
UserSchema.index({ userAddress: 1, createdAt: -1 });

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
