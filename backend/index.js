// backend/index.js
const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());
// ... middlewares ...

// THIS line connects your route file to the server
app.use("/auth", require("./routes/auth")); 

// THIS is where the port lives
const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});