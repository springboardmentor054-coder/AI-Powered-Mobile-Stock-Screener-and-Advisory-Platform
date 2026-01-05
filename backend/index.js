const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const stockRoutes = require("./routes/stocks");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend is running" });
});

app.use("/auth", authRoutes);
app.use("/stocks", stockRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const screenerRoutes = require("./routes/screener");
app.use("/screener", screenerRoutes);
