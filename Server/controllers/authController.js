const ethers = require("ethers");
const UserModel = require("../models/User");
const jwt = require("jsonwebtoken");
const { JWT_SECRETKEY } = require("../config/serverConfig");
const { logger } = require("../utils/logger");

// Load refresh token secret
const JWT_REFRESH_SECRETKEY = process.env.JWT_REFRESH_SECRETKEY || JWT_SECRETKEY;

async function authController(req, res, next) {
  try {
  const { signature } = req.body;
  const { address } = req.query;

    if (!signature) {
      return res.status(400).json({ message: "Signature is required" });
  }

    // The message signed by the user
    const message =
      "Welcome to CryptGuard! Please sign this message to authenticate your account";

    // Recover the address from the signature
    // UPDATED: ethers v6 syntax (removed .utils)
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log("Recovered Address: ", recoveredAddress);

    // Compare the recovered address with the address sent from frontend
    if (address.toLowerCase() === recoveredAddress.toLowerCase()) {
      const address = recoveredAddress.toLowerCase();
      const user = await UserModel.findOne({ userAddress: address });

    if (!user) {
        const userData = await UserModel.create({ userAddress: address, loginCount: 1 });
        console.log("User Created: ", userData);
        
        // Audit log for new user registration
        logger.audit('USER_REGISTRATION', {
          userAddress: address,
          timestamp: new Date().toISOString()
        });
      } else {
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();
        
        // Audit log for user login
        logger.audit('USER_LOGIN', {
          userAddress: address,
          loginCount: user.loginCount,
          timestamp: new Date().toISOString()
        });
      }
    // Generate access token (short-lived: 15 minutes)
    const accessToken = jwt.sign(
      { address },
      JWT_SECRETKEY,
      { expiresIn: "15m" }
    );

    // Generate refresh token (long-lived: 7 days)
    const refreshToken = jwt.sign(
      { address },
      JWT_REFRESH_SECRETKEY,
      { expiresIn: "7d" }
    );

    console.log("Generated Access Token (15min)");
    console.log("Generated Refresh Token (7days)");
      
      // Security log for successful authentication
      logger.security('Authentication successful', {
        userAddress: address,
        timestamp: new Date().toISOString()
      });
      
      // Set HttpOnly cookies for both tokens
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(200).json({ 
        message: "Authentication Successful",
        address // Send address for client state management
      });
    } else {
      // Security log for failed authentication
      logger.security('Authentication failed - address mismatch', {
        providedAddress: address,
        recoveredAddress: recoveredAddress,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ message: "Authentication Failed" });
    }
  } catch (error) {
    // Enhanced error handling with specific error types
    console.error("Authentication error:", error);
    
    if (error.code === 'INVALID_ARGUMENT') {
      return res.status(400).json({ message: "Invalid signature format" });
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(503).json({ message: "Database temporarily unavailable" });
    }
    
    return res.status(500).json({ message: "Authentication failed. Please try again." });
  }
}

module.exports = { authController };
