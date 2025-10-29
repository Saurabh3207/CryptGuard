const jwt = require("jsonwebtoken");
const { JWT_SECRETKEY } = require("../config/serverConfig");
const { isTokenRevoked } = require("../utils/tokenBlacklist");
const { logger } = require("../utils/logger");

const JWT_REFRESH_SECRETKEY = process.env.JWT_REFRESH_SECRETKEY || JWT_SECRETKEY;

/**
 * Refresh Token Controller
 * Exchanges a valid refresh token for a new access token
 */
async function refreshTokenController(req, res) {
  try {
    // Get refresh token from HttpOnly cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      logger.security('Refresh attempt without token', {
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Check if token is blacklisted
    if (isTokenRevoked(refreshToken)) {
      logger.security('Refresh attempt with revoked token', {
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ message: "Refresh token revoked" });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRETKEY);
    } catch (err) {
      logger.security('Invalid refresh token', {
        error: err.message,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const { address } = decoded;

    // Generate new access token (15 minutes)
    const accessToken = jwt.sign(
      { address },
      JWT_SECRETKEY,
      { expiresIn: "15m" }
    );

    // Set new access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    logger.audit('TOKEN_REFRESH', {
      userAddress: address,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({ 
      message: "Access token refreshed successfully",
      address
    });

  } catch (error) {
    logger.error('Refresh token error:', error);
    return res.status(500).json({ 
      message: "Internal server error during token refresh" 
    });
  }
}

module.exports = refreshTokenController;
