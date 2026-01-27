const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(" ");
  
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid authorization format. Use: Bearer <token>" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request object for use in routes
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name
    };
    
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(403).json({ message: "Invalid token" });
  }
};
