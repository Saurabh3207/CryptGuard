const jwt = require("jsonwebtoken");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or malformed" });
  }

  const token = authHeader.split(" ")[1]; // 🟢 Extract token properly

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
    req.address = decoded.address; // attach user address to request
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
