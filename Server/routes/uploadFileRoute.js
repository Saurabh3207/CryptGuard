const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authenticateToken');
const { uploadUserFile } = require('../middleware/multer');

const { preUploadFileController } = require('../controllers/preUploadFileController');
const { confirmUploadController } = require('../controllers/confirmUploadController');

// Step 1: Encrypt file & upload to IPFS 
router.post('/preUpload', authenticateToken, uploadUserFile, preUploadFileController);

// Step 2: After blockchain confirmation, save to MongoDB
router.post('/confirmUpload', authenticateToken, confirmUploadController);

module.exports = router;
