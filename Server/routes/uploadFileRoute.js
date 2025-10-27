const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authenticateToken');
const { uploadUserFile } = require('../middleware/multer');
const { validate } = require('../middleware/validation');

const { preUploadFileController } = require('../controllers/preUploadFileController');
const { confirmUploadController } = require('../controllers/confirmUploadController');

// Step 1: Encrypt file & upload to IPFS 
// Validation: address & fileHash in body, file upload
router.post('/preUpload', authenticateToken, uploadUserFile, validate('preUpload'), preUploadFileController);

// Step 2: After blockchain confirmation, save to MongoDB
// Validation: address, ipfsCID, metadataCID, fileHash in body
router.post('/confirmUpload', authenticateToken, validate('confirmUpload'), confirmUploadController);

module.exports = router;
