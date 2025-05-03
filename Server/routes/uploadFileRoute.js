const express = require('express');
const router = express.Router();
const {uploadFileController} = require('../controllers/uploadFileController');
const {uploadUserFile} = require('../middleware/multer');
const {authenticateToken} = require('../middleware/authenticateToken');

// Protect the route with authentication and multer file upload middleware
router.post('/uploadFile', authenticateToken, uploadUserFile, uploadFileController);

module.exports = router;