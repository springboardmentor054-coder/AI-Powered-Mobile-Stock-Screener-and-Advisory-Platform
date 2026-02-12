const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.get("/market/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const API_KEY = process.env.ALPHAVANTAGE_API_KEY;

    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching stock data");
  }
});

app.listen(PORT, () => {
  console.log(`Market Data Service running on port ${PORT}`);
});
