require("dotenv").config();
const express = require("express");
const cors = require("cors");

const screenerRoute = require("./routes/screener");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "OK" }));

app.use("/screener", screenerRoute);

app.listen(5000, () => {
  console.log("API Gateway running on port 5000");
});
