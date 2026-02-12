const express = require("express");
const fs = require("fs");

const router = express.Router();
const USERS_FILE = "./users.json";

// Signup
router.post("/signup", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.json({ error: "Missing fields" });

  let users = [];
  if (fs.existsSync(USERS_FILE))
    users = JSON.parse(fs.readFileSync(USERS_FILE));

  if (users.find(u => u.email === email))
    return res.json({ error: "User exists" });

  users.push({ email, password });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users));

  res.json({ message: "Signup success" });
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return res.json({ error: "Invalid login" });

  res.json({ message: "Login success" });
});

module.exports = router;
