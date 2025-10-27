const express = require('express');
const router = express.Router();
const { authController } = require('../controllers/authController');
const { validate } = require('../middleware/validation');

// POST /api/authentication - Authenticate user with wallet signature
// Validation: signature in body, address in query
router.post('/authentication', validate('authentication'), authController);

module.exports = router;