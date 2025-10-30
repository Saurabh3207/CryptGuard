const express = require('express');
const router = express.Router();
const { getUserFiles, getFileStats } = require('../controllers/fileController');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/authenticateToken');

// GET recent uploaded files
// Validation: walletAddress in params + authentication required
router.get('/files/user/:walletAddress', authenticateToken, validate('getUserFiles'), getUserFiles);

// GET stats for dashboard
// Validation: walletAddress in params + authentication required
router.get('/files/stats/:walletAddress', authenticateToken, validate('getUserFiles'), getFileStats);

module.exports = router;
