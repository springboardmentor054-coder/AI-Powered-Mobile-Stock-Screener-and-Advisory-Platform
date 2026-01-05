const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/login", (req, res) => {
  const { email } = req.body;

  // Dummy user validation
  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    message: "Login successful",
    token
  });
});

module.exports = router;
