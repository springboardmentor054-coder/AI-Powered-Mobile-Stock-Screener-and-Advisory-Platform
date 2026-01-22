# Stock Screener API - Routes Documentation

## 🎯 Main Endpoint

### POST `/screener`

Natural language stock screening endpoint powered by OpenAI LLM.

**Request:**
```json
POST http://localhost:5000/screener
Content-Type: application/json

{
  "query": "Show IT stocks with PE below 5"
}
```

**Response (Success):**
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

**Response (Error - 400):**
```json
{
  "error": "Invalid query structure",
  "details": "Invalid field \"invalid_field\" at index 0. Allowed fields: sector, pe_ratio, peg_ratio, debt_to_fcf"
}
```

**Response (Error - 500):**
```json
{
  "error": "Internal server error",
  "message": "Failed to parse query: OpenAI API error"
}
```

---

## 📊 Query Examples

### Simple Queries
```
"Show IT stocks"
"Find Finance stocks"
"Healthcare stocks"
```

### Numeric Filters
```
"Show IT stocks with PE below 5"
"Find stocks with PEG ratio less than 2"
"Healthcare stocks with debt to FCF below 1"
```

### Multiple Filters
```
"Show IT stocks with PE below 5 and PEG ratio less than 2"
"Find Finance stocks with low debt to FCF"
```

---

## 🔄 Request Flow

1. **Incoming Query**
   - Receives natural language query
   - Validates query is a non-empty string

2. **Cache Check**
   - Checks Redis cache using query as key
   - Returns cached result if found (with `cached: true`)

3. **LLM Parsing** (if cache miss)
   - Sends query to OpenAI
   - Receives structured DSL JSON
   - Logs DSL for debugging

4. **Validation**
   - Validates DSL structure
   - Checks allowed fields and operators
   - Returns 400 error if invalid

5. **SQL Compilation**
   - Converts DSL to parameterized SQL query
   - Logs SQL and parameters

6. **Database Query**
   - Executes SQL against PostgreSQL
   - Returns matching stocks

7. **Caching**
   - Stores result in Redis (1 hour TTL)
   - Returns JSON response

---

## 🛠️ DSL Format

The LLM converts natural language to this JSON structure:

```json
{
  "sector": "IT",
  "filters": [
    {
      "field": "pe_ratio",
      "operator": "<",
      "value": 5
    }
  ],
  "last_quarters": 4
}
```

**Allowed Fields:**
- `sector` (string)
- `pe_ratio` (number)
- `peg_ratio` (number)
- `debt_to_fcf` (number)

**Allowed Operators:**
- `<` - Less than
- `>` - Greater than
- `<=` - Less than or equal
- `>=` - Greater than or equal
- `=` - Equal

---

## 🗃️ Database Schema

The endpoint queries these tables:

```sql
-- companies table
CREATE TABLE companies (
  symbol VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255),
  sector VARCHAR(100)
);

-- fundamentals table
CREATE TABLE fundamentals (
  symbol VARCHAR(10) REFERENCES companies(symbol),
  pe_ratio DECIMAL(10, 2),
  peg_ratio DECIMAL(10, 2),
  debt_to_fcf DECIMAL(10, 2),
  market_cap BIGINT
);
```

---

## 📝 Console Logs

When a request is processed, you'll see detailed logs:

```
=== Incoming Query ===
Show IT stocks with PE below 5

=== LLM Parsing ===
Parsing query: Show IT stocks with PE below 5
LLM Response: {"sector":"IT","filters":[{"field":"pe_ratio","operator":"<","value":5}]}
Parsed DSL: {
  "sector": "IT",
  "filters": [
    { "field": "pe_ratio", "operator": "<", "value": 5 }
  ]
}

=== Validation ===
Validating DSL: { "sector": "IT", "filters": [...] }
DSL validation passed

=== SQL Compilation ===
Compiling DSL: { "sector": "IT", "filters": [...] }
Generated SQL: 
    SELECT 
      c.symbol,
      c.name,
      c.sector,
      f.pe_ratio,
      f.peg_ratio,
      f.debt_to_fcf,
      f.market_cap
    FROM companies c
    INNER JOIN fundamentals f ON c.symbol = f.symbol
    WHERE 1=1
     AND c.sector = $1 AND f.pe_ratio < $2
     ORDER BY f.market_cap DESC LIMIT 100

SQL Params: [ 'IT', 5 ]

=== Database Query ===
Found 10 stocks
✅ Result cached successfully
```

---

## 🚀 Performance

### Caching Strategy
- **Cache Key:** `screener:{query}`
- **TTL:** 3600 seconds (1 hour)
- **Storage:** Redis

### First Request (Cache Miss)
- LLM call: ~1-2 seconds
- Database query: ~50-200ms
- Total: ~1.5-2.5 seconds

### Subsequent Requests (Cache Hit)
- Redis lookup: ~5-10ms
- Total: ~10-20ms

**Result:** ~100x faster on cached queries!

---

## 🔒 Error Handling

All errors are caught and handled gracefully:

1. **Missing Query**
   - Returns 400 with "Query is required"

2. **LLM Errors**
   - Catches OpenAI API errors
   - Returns 500 with error message

3. **Validation Errors**
   - Returns 400 with specific validation failure

4. **Database Errors**
   - Catches SQL errors
   - Returns 500 with error message

5. **Redis Errors**
   - App continues without caching
   - Logs warning but doesn't fail

---

## 🧪 Testing

### Using curl (PowerShell)
```powershell
curl -X POST http://localhost:5000/screener `
  -H "Content-Type: application/json" `
  -d '{\"query\":\"Show IT stocks with PE below 5\"}'
```

### Using Invoke-WebRequest (PowerShell)
```powershell
$body = @{
    query = "Show IT stocks with PE below 5"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/screener `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Using Node.js
```bash
node tests/verify-complete.js
```

---

## 📦 Dependencies

- **express** - Web framework
- **pg** - PostgreSQL client
- **openai** - OpenAI API client
- **redis** - Redis client for caching
- **dotenv** - Environment variables

---

## 🎓 Architecture

```
Client Request
    ↓
Express Router (routes/screener.js)
    ↓
Check Redis Cache (cache.js)
    ↓ (if miss)
Parse Query (llm.js)
    ↓
Validate DSL (services/validationService.js)
    ↓
Compile to SQL (compileDSL.js)
    ↓
Execute Query (database.js)
    ↓
Cache Result (cache.js)
    ↓
Return Response
```

---

## 🔧 Configuration

Required environment variables:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_screener
DB_USER=postgres
DB_PASSWORD=yourpassword

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=5000
```

---

## 📈 Limitations

1. **Query Complexity:** Currently supports basic filters only
2. **Field Limit:** Only sector, pe_ratio, peg_ratio, debt_to_fcf
3. **Result Limit:** Maximum 100 stocks per query
4. **LLM Dependency:** Requires OpenAI API access
5. **Cache Duration:** 1 hour (configurable)

---

## 🚧 Future Enhancements

- [ ] Support for date range queries
- [ ] Multiple sector filtering
- [ ] Sorting options
- [ ] Pagination
- [ ] Query history
- [ ] User authentication
- [ ] Rate limiting
- [ ] WebSocket for real-time updates
- [ ] Export to CSV/Excel
- [ ] Save favorite queries

---

## 📞 Support

If you encounter issues:

1. Check console logs for detailed error messages
2. Verify all dependencies are installed
3. Ensure PostgreSQL and Redis are running
4. Check OpenAI API key is valid
5. Review `SETUP_GUIDE.md` for troubleshooting

---

**Built with ❤️ for efficient stock screening**
