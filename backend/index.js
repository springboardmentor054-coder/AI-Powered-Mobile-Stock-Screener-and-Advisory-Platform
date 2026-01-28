const express = require('express');
const cors = require('cors'); // <--- 1. Import CORS
const app = express();
require('dotenv').config();

// <--- 2. Add this Middleware Block
app.use(cors({
  origin: 'http://localhost:5173', // Allow your frontend
  credentials: true
}));

app.use(express.json());

// Routes (Kept exactly as you requested)
app.use("/auth", require("./routes/auth")); 
app.use('/data', require('./routes/data'));
app.use('/query', require('./routes/query'));

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});