const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Expected format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // store user info in request
    next(); // proceed to next middleware / controller
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(403).json({ message: 'Unauthorized' });
  }
};

module.exports = { authenticate };
