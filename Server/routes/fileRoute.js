const express = require('express');
const router = express.Router();
const { getUserFiles, getFileStats } = require('../controllers/fileController');
const { validate } = require('../middleware/validation');

// GET recent uploaded files
// Validation: walletAddress in params
router.get('/files/user/:walletAddress', validate('getUserFiles'), getUserFiles);

// GET stats for dashboard
// Validation: walletAddress in params
router.get('/files/stats/:walletAddress', validate('getUserFiles'), getFileStats);

module.exports = router;
