const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "stockai-secret-key",
    resave: false,
    saveUninitialized: false
  })
);

app.use(express.static(path.join(__dirname, "../frontend")));

/* =========================
   PASSWORD RULES
========================= */
function validatePassword(pw) {
  if (pw.length < 8) return "At least 8 characters required";
  if (!/[A-Z]/.test(pw)) return "Add one uppercase letter";
  if (!/[a-z]/.test(pw)) return "Add one lowercase letter";
  if (!/[0-9]/.test(pw)) return "Add one number";
  if (!/[@$!%*?&]/.test(pw)) return "Add one special character";
  return null;
}

/* =========================
   REGISTER (REAL)
========================= */
app.post("/register", async (req, res) => {
  let { email, password } = req.body;

  email = email.trim().toLowerCase();
  password = password.trim();

  const error = validatePassword(password);
  if (error) {
    return res.send(`
      <script>alert("${error}"); window.location="/register.html";</script>
    `);
  }

  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hash],
    (err) => {
      if (err) {
        return res.send(`
          <script>alert("Email already registered"); window.location="/register.html";</script>
        `);
      }
      res.send(`
        <script>alert("Registration successful. Please login."); window.location="/login.html";</script>
      `);
    }
  );
});

/* =========================
   LOGIN (🔥 THIS FIXES IT)
========================= */
app.post("/login", (req, res) => {
  let { email, password } = req.body;

  email = email.trim().toLowerCase();
  password = password.trim();

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (!user) {
        return res.send(`
          <script>alert("Email not registered"); window.location="/login.html";</script>
        `);
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.send(`
          <script>alert("Invalid password"); window.location="/login.html";</script>
        `);
      }

      req.session.user = user.email;
      res.redirect("/index.html");
    }
  );
});

/* =========================
   LOGOUT
========================= */
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

/* =========================
   AUTH CHECK API
========================= */
app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ loggedIn: false });
  }
  res.json({ loggedIn: true, email: req.session.user });
});

/* =========================
   PROTECTED SCREENER
========================= */
app.post("/api/screener", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({ results: [] });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
