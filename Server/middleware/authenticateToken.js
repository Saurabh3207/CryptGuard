const jwt = require("jsonwebtoken");


async function authenticateToken(req, res, next) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
    console.log("Decoded Token:", decoded);  
    req.address = decoded.address;
    next();
  } catch (error) {
    console.error("JWT Authentication Error:", error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    return res.status(401).json({ message: "Authentication failed" });
  }
  
}

module.exports = { authenticateToken };
