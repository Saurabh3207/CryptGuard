const express = require('express');
const router = express.Router();
const { deleteFileController } = require('../controllers/deleteFileController');
const { authenticateToken } = require('../middleware/authenticateToken');
const { validateRequest } = require('../utils/errorHandler');
const { fileSchemas } = require('../utils/validation');

// DELETE /api/files/:fileId - Delete a file
router.delete(
  '/files/:fileId', 
  authenticateToken,
  validateRequest(fileSchemas.deleteFile),
  deleteFileController
);

module.exports = router;
