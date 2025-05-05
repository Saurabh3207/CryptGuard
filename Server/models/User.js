const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userAddress: {
    type: String,
    required: true,
    unique: true
  },
  encryptionKey: {
    type: Buffer,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
