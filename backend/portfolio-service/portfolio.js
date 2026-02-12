const express = require("express");
const fs = require("fs");

const router = express.Router();
const FILE = "./watchlist.json";

router.post("/add", (req, res) => {
  const { symbol } = req.body;

  let list = [];
  if (fs.existsSync(FILE))
    list = JSON.parse(fs.readFileSync(FILE));

  list.push(symbol);
  fs.writeFileSync(FILE, JSON.stringify(list));

  res.json({ message: "Added" });
});

router.get("/", (req, res) => {
  const list = JSON.parse(fs.readFileSync(FILE));
  res.json(list);
});

module.exports = router;
