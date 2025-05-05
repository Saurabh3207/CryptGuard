const express = require('express');
const router = express.Router();
const { getUserFiles, getFileStats } = require('../controllers/fileController');

// GET recent uploaded files
router.get('/files/user/:walletAddress', getUserFiles);

// GET stats for dashboard
router.get('/files/stats/:walletAddress', getFileStats);

module.exports = router;
