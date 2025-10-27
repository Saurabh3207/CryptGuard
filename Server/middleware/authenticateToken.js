const jwt = require("jsonwebtoken");
const { logger } = require("../utils/logger");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or malformed" });
  }

  const token = authHeader.split(" ")[1]; // 🟢 Extract token properly

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
    req.address = decoded.address; // attach user address to request
    
    // Additional Security: Verify request address matches token address
    // Check if address is provided in request body, params, or query
    const requestAddress = req.body?.address || req.params?.address || req.query?.address;
    
    if (requestAddress) {
      const tokenAddress = decoded.address.toLowerCase();
      const providedAddress = requestAddress.toLowerCase();
      
      if (tokenAddress !== providedAddress) {
        logger.security("Token address mismatch detected", {
          tokenAddress,
          providedAddress,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
        return res.status(403).json({ 
          message: "Access denied: Address mismatch. Token does not belong to this account." 
        });
      }
    }
    
    next(); // allow route access
  } catch (error) {
    console.error("JWT Authentication Error:", error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    return res.status(401).json({ message: "Authentication failed" });
  }
}

module.exports = { authenticateToken };
