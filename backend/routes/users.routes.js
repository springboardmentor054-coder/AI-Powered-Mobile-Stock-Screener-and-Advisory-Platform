/**
 * Users Routes
 * Minimal user provisioning for app-side auth mapping.
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../database");

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route POST /api/users/register
 * @desc Create backend user record (or return existing by email)
 * @access Public
 */
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("name")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Name must be between 1 and 255 characters"),
  ],
  validate,
  async (req, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const name = req.body.name ? String(req.body.name).trim() : null;

      const existing = await db.query(
        `SELECT id, email, name
         FROM users
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [email]
      );

      if (existing.rowCount > 0) {
        return res.status(200).json({
          success: true,
          data: {
            id: existing.rows[0].id,
            email: existing.rows[0].email,
            name: existing.rows[0].name,
            created: false,
          },
        });
      }

      const created = await db.query(
        `INSERT INTO users (email, name)
         VALUES ($1, $2)
         RETURNING id, email, name`,
        [email, name]
      );

      return res.status(201).json({
        success: true,
        data: {
          ...created.rows[0],
          created: true,
        },
      });
    } catch (error) {
      console.error("[Users] Register error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to register user",
        message: error.message,
      });
    }
  }
);

module.exports = router;
