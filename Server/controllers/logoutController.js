const { revokeToken } = require("../utils/tokenBlacklist");
const { logger } = require("../utils/logger");

/**
 * Logout Controller
 * Revokes the refresh token and clears cookies
 */
async function logoutController(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    // Revoke the refresh token if it exists
    if (refreshToken) {
      revokeToken(refreshToken);
      logger.audit('USER_LOGOUT', {
        userAddress: req.user?.address || 'unknown',
        timestamp: new Date().toISOString()
      });
    }

    // Clear both cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({ message: "Logout successful" });

  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({ 
      message: "Internal server error during logout" 
    });
  }
}

module.exports = logoutController;
