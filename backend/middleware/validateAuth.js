// backend/middleware/validateAuth.js
const { body, validationResult } = require('express-validator');

// 1. Rules for Registration
const registerRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 chars long'),
  
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .toLowerCase(), // Converts uppercase to lowercase automatically

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 chars long')
    // .matches(/\d/).withMessage('Password must contain a number') // Optional: enforce complexity
];

// 2. Rules for Login
const loginRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

// 3. The "Judge" Function
// This checks if any of the above rules failed
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Return the first error message found
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  
  // If no errors, let the request pass to the controller
  next();
};

module.exports = {
  registerRules,
  loginRules,
  validate
};