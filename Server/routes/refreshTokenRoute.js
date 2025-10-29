const express = require("express");
const refreshTokenController = require("../controllers/refreshTokenController");

const router = express.Router();

// POST /api/refresh - Exchange refresh token for new access token
router.post("/refresh", refreshTokenController);

module.exports = router;
