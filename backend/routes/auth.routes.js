// backend/routes/auth.routes.js
const express = require("express");
const router = express.Router();

/**
 * POST /auth/login
 * Placeholder for future JWT-based authentication
 */
router.post("/login", async (req, res) => {
  res.status(501).json({
    message: "Authentication service not implemented yet",
  });
});

/**
 * POST /auth/register
 */
router.post("/register", async (req, res) => {
  res.status(501).json({
    message: "User registration not implemented yet",
  });
});

module.exports = router;