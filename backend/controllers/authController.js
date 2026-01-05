const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Built-in node module for random tokens
const emailService = require('../utils/emailService');
require('dotenv').config();

// 1. REGISTER (Updated)
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check existing user
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(401).json({ message: "User already exists!" });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate Random Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert User with verified = false
    await db.query(
      "INSERT INTO users (username, email, password_hash, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5)",
      [username, email, hashedPassword, false, verificationToken]
    );

    // Send Email
    await emailService.sendVerificationEmail(email, verificationToken);

    res.status(201).json({ 
      message: "Registration successful! Please check your email to verify your account." 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// 2. VERIFY EMAIL (New)
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this token
    const user = await db.query("SELECT * FROM users WHERE verification_token = $1", [token]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update user: set verified = true, clear token
    await db.query(
      "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1",
      [user.rows[0].id]
    );

    // You can redirect them to your frontend login page here
    // res.redirect('http://localhost:3000/login'); 
    
    // For now, just send JSON
    res.json({ message: "Email verified successfully! You can now login." });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// 3. LOGIN (Updated)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Invalid Credential" });
    }

    // CHECK: Is user verified?
    if (!user.rows[0].is_verified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid Credential" });
    }

    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user: { id: user.rows[0].id, username: user.rows[0].username } });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};