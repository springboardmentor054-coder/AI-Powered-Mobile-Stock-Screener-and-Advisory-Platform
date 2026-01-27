const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const router = express.Router();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

// Signup endpoint
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        message: "Email, password, and name are required" 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Invalid email format" 
      });
    }

    // Password strength validation (min 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ 
        message: "User with this email already exists" 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, name, created_at`,
      [email.toLowerCase(), passwordHash, name]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      message: "Server error during signup" 
    });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, name, password_hash, is_active FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ 
        message: "Account is deactivated" 
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Update last login
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Server error during login" 
    });
  }
});

module.exports = router;
