# Stock Screener - Complete Setup Guide

## ✅ What You Have Now

### Backend Files Created:
1. **cache.js** - Redis client for caching query results
2. **compileDSL.js** - Converts DSL JSON to SQL queries
3. **llm.js** - OpenAI integration for natural language parsing
4. **services/validationService.js** - Validates DSL structure
5. **routes/screener.js** - Main API endpoint for stock screening
6. **app.js** - Updated to include screener route
7. **server.js** - Updated to run on port 5000

### Flutter Files Created:
1. **lib/services/api_service.dart** - HTTP client for backend API
2. **lib/screens/home_screen.dart** - Search input screen
3. **lib/screens/result_screen.dart** - Results display screen
4. **lib/main.dart** - Updated app entry point

---

## 🚀 Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

This will install:
- express (server)
- pg (PostgreSQL)
- dotenv (environment variables)
- openai (LLM integration)
- redis (caching)
- cors, helmet, morgan (middleware)

#### Configure Environment Variables
Create a `.env` file in the `backend` folder:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_screener
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Install and Start Redis (Optional but Recommended)

**Windows:**
1. Download Redis from: https://github.com/tporadowski/redis/releases
2. Extract and run: `redis-server.exe`

**Or use Docker:**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Skip Redis:** The app will work without Redis (cache errors are handled gracefully)

#### Start Backend Server
```bash
npm start
```

Or for development:
```bash
npm run dev
```

Expected output:
```
Server running on port 5000
Redis Client Connected
```

---

### 2. Flutter Setup

#### Install Dependencies
```bash
cd stock_screener_app
flutter pub get
```

#### Run Flutter App
```bash
flutter run
```

Or select a device in VS Code and press F5

---

## ✅ Verification Checklist

### ✅ Check 1: Backend Health
Open browser: http://localhost:5000/health

**Expected Response:**
```json
{
  "status": "OK"
}
```

### ✅ Check 2: Test Screener API

**Using curl (PowerShell):**
```powershell
curl -X POST http://localhost:5000/screener `
  -H "Content-Type: application/json" `
  -d '{\"query\":\"Show IT stocks with PE below 5\"}'
```

**Using PowerShell Invoke-WebRequest:**
```powershell
$body = @{
    query = "Show IT stocks with PE below 5"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/screener `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "data": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "sector": "IT",
      "pe_ratio": 4.5,
      "peg_ratio": 1.2,
      "debt_to_fcf": 0.5,
      "market_cap": 2500000000000
    }
  ],
  "cached": false,
  "count": 1
}
```

**Console Logs Should Show:**
```
=== Incoming Query ===
Show IT stocks with PE below 5

=== LLM Parsing ===
LLM Response: {"sector":"IT","filters":[{"field":"pe_ratio","operator":"<","value":5}]}
Parsed DSL: {
  "sector": "IT",
  "filters": [
    {
      "field": "pe_ratio",
      "operator": "<",
      "value": 5
    }
  ]
}

=== Validation ===
DSL validation passed

=== SQL Compilation ===
Generated SQL: SELECT c.symbol, c.name, c.sector, ...
SQL Params: [ 'IT', 5 ]

=== Database Query ===
Found 10 stocks
✅ Result cached successfully
```

### ✅ Check 3: Test Redis Caching

Run the same query twice:
```bash
# First request - should parse with LLM
curl -X POST http://localhost:5000/screener -H "Content-Type: application/json" -d "{\"query\":\"Show IT stocks with PE below 5\"}"

# Second request - should return from cache instantly
curl -X POST http://localhost:5000/screener -H "Content-Type: application/json" -d "{\"query\":\"Show IT stocks with PE below 5\"}"
```

**Second response should have:**
```json
{
  "cached": true,
  ...
}
```

**Console should show:**
```
✅ Cache HIT - Returning cached result
```

### ✅ Check 4: Test Validation

Test with invalid query:
```powershell
$body = @{
    query = "Show stocks with invalid_field below 5"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/screener `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected Error Response:**
```json
{
  "error": "Invalid query structure",
  "details": "Invalid field \"invalid_field\" at index 0..."
}
```

### ✅ Check 5: Flutter App

1. Run the Flutter app
2. Enter query: "Show IT stocks with PE below 5"
3. Click "Search"

**Expected:**
- Loading indicator appears
- Results screen displays with list of stocks
- Each stock shows: symbol, name, sector, PE ratio, PEG ratio, Debt/FCF

---

## 🔧 Troubleshooting

### Backend Issues

**Port already in use:**
```
Error: listen EADDRINUSE: address already in use :::5000
```
Solution: Change PORT in .env or kill process using port 5000

**OpenAI API Error:**
```
Failed to parse query: Insufficient quota
```
Solution: Check your OpenAI API key and billing

**Redis Connection Error:**
```
Redis Client Error: connect ECONNREFUSED
```
Solution: Start Redis server or app will continue without caching

**Database Connection Error:**
```
Error: connect ECONNREFUSED
```
Solution: Make sure PostgreSQL is running and credentials in .env are correct

### Flutter Issues

**HTTP package not found:**
```bash
flutter pub get
```

**Cannot connect to backend:**
- Make sure backend is running on port 5000
- Check firewall settings
- If using emulator, use `http://10.0.2.2:5000` instead of `http://localhost:5000`
- If using real device, use your computer's IP address

**Update API Service for device:**
Edit `lib/services/api_service.dart`:
```dart
// For Android Emulator
static const String baseUrl = 'http://10.0.2.2:5000';

// For iOS Simulator  
static const String baseUrl = 'http://localhost:5000';

// For Physical Device
static const String baseUrl = 'http://192.168.1.XXX:5000'; // Your computer's IP
```

---

## 📊 Example Queries to Test

1. "Show IT stocks with PE below 5"
2. "Find Finance stocks with PEG ratio less than 2"
3. "Healthcare stocks with debt to FCF below 1"
4. "Show stocks in Technology sector"
5. "Find stocks with PE ratio greater than 10"

---

## 🎯 Next Steps

1. **Add More Data**: Populate your database with more stocks
2. **Improve LLM**: Fine-tune prompts for better parsing
3. **Add Features**: 
   - Sorting options
   - More filter criteria
   - Historical data
   - Charts and graphs
4. **Deployment**:
   - Deploy backend to cloud (Railway, Render, AWS)
   - Build Flutter app for production
   - Set up CI/CD pipeline

---

## 📁 File Structure Summary

```
Stock_screener/
├── backend/
│   ├── cache.js                    ✅ NEW - Redis client
│   ├── compileDSL.js               ✅ NEW - DSL to SQL compiler
│   ├── llm.js                      ✅ UPDATED - OpenAI integration
│   ├── database.js                 ✓ Existing
│   ├── app.js                      ✅ UPDATED - Added screener route
│   ├── server.js                   ✅ UPDATED - Port 5000
│   ├── package.json                ✅ UPDATED - Added redis
│   ├── routes/
│   │   ├── screener.js             ✅ NEW - Main API endpoint
│   │   └── stocks.routes.js        ✓ Existing
│   └── services/
│       ├── validationService.js    ✅ NEW - DSL validation
│       └── marketData.service.js   ✓ Existing
│
└── stock_screener_app/
    ├── lib/
    │   ├── main.dart               ✅ UPDATED - New entry point
    │   ├── services/
    │   │   └── api_service.dart    ✅ NEW - HTTP client
    │   └── screens/
    │       ├── home_screen.dart    ✅ NEW - Search screen
    │       └── result_screen.dart  ✅ NEW - Results screen
    └── pubspec.yaml                ✓ Existing (http package included)
```

---

## 🎉 You're All Set!

Your stock screener is now complete with:
- ✅ Natural language query parsing (LLM)
- ✅ DSL validation
- ✅ SQL compilation
- ✅ Redis caching
- ✅ Flutter mobile app
- ✅ Error handling
- ✅ Clean architecture

**Start the backend and Flutter app to see it in action!**
