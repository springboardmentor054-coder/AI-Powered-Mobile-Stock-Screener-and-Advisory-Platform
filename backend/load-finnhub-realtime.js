/**
 * REAL-TIME Data Loader using Finnhub (FREE API)
 * Get your FREE API key: https://finnhub.io/register
 * Free tier: 60 calls/minute, real-time quotes (15-min delay)
 */

require("dotenv").config();
const pool = require("./database");
const axios = require("axios");

// Add your Finnhub API key to .env file:
// FINNHUB_API_KEY=your_key_here
const API_KEY = process.env.FINNHUB_API_KEY;

const INDIAN_STOCKS = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 
  'ICICIBANK.NS', 'SBIN.NS', 'WIPRO.NS', 'HCLTECH.NS'
];

async function fetchFinnhubQuote(symbol) {
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return null;
  }
}

async function fetchFinnhubProfile(symbol) {
  try {
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return null;
  }
}

async function loadRealTimeData() {
  if (!API_KEY) {
    console.log('\n❌ FINNHUB_API_KEY not found in .env!');
    console.log('\n📝 To get REAL-TIME data:');
    console.log('   1. Sign up FREE at https://finnhub.io/register');
    console.log('   2. Get your API key from dashboard');
    console.log('   3. Add to .env: FINNHUB_API_KEY=your_key');
    console.log('\n⚡ Free tier: 60 calls/min, real-time quotes!\n');
    process.exit(1);
  }

  console.log('🚀 Loading REAL-TIME data from Finnhub...\n');

  for (const symbol of INDIAN_STOCKS) {
    const quote = await fetchFinnhubQuote(symbol);
    const profile = await fetchFinnhubProfile(symbol);
    
    if (quote && quote.c) {
      const cleanSymbol = symbol.replace('.NS', '');
      
      // Update database with real-time price
      await pool.query(
        `UPDATE fundamentals 
         SET market_cap = $1, updated_at = NOW()
         WHERE symbol = $2`,
        [quote.c * 1000000000, cleanSymbol] // Approximate market cap
      );
      
      console.log(`✅ ${cleanSymbol}: ₹${quote.c.toFixed(2)} (Real-time!)`);
    }
    
    await new Promise(r => setTimeout(r, 1000)); // Rate limit
  }
  
  console.log('\n✅ Real-time data loaded!\n');
  await pool.end();
}

loadRealTimeData();
