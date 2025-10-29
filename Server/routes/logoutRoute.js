const express = require("express");
const logoutController = require("../controllers/logoutController");

const router = express.Router();

// POST /api/logout - Revoke refresh token and clear cookies
router.post("/logout", logoutController);

module.exports = router;
