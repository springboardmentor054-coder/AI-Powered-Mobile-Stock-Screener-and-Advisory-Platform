const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Protected route - get current user profile
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Profile retrieved successfully",
    user: req.user
  });
});

module.exports = router;
