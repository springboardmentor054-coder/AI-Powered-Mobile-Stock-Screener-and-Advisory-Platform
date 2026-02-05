# Time-Based Queries with GROUP BY and HAVING

This document demonstrates how to use time-based queries with GROUP BY and HAVING clauses in the stock screener.

## Setup

First, run the SQL script to create the quarterly_financials table:

```bash
psql -U your_username -d your_database -f backend/scripts/createQuarterlyFinancialsTable.sql
```

## Query Examples

### 1. Companies with 4 Consecutive Profitable Quarters in Last 12 Months

**Natural Language Query:**
```
Companies with 4 consecutive profitable quarters in the last 12 months
```

**Generated DSL:**
```json
{
  "sector": null,
  "symbol": null,
  "companyName": null,
  "conditions": [],
  "timeFilters": {
    "quarterRange": {
      "value": 12,
      "unit": "months"
    }
  },
  "groupBy": {
    "fields": ["company_id"],
    "aggregates": [
      {
        "function": "MIN",
        "field": "revenue",
        "alias": "min_revenue"
      }
    ]
  },
  "having": [
    {
      "expression": "COUNT(*)",
      "operator": "=",
      "value": 4
    },
    {
      "aggregate": "MIN",
      "field": "revenue",
      "operator": ">",
      "value": 0
    }
  ],
  "specialFilters": {}
}
```

**Generated SQL:**
```sql
SELECT 
  s.company_id,
  s.symbol, 
  s.company_name, 
  s.sector,
  COUNT(qf.quarter) as quarter_count,
  MIN(qf.revenue) as min_revenue
FROM stocks s
INNER JOIN quarterly_financials qf ON s.company_id = qf.company_id
WHERE s.is_active = TRUE
  AND qf.quarter >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY qf.company_id, s.symbol, s.company_name, s.sector
HAVING COUNT(*) = 4 AND MIN(qf.revenue) > 0
ORDER BY quarter_count DESC, s.symbol ASC
LIMIT 500
```

---

### 2. Companies with Consistent Revenue Growth

**Natural Language Query:**
```
Companies reporting revenue growth in every quarter of the past year
```

**Generated DSL:**
```json
{
  "sector": null,
  "symbol": null,
  "companyName": null,
  "conditions": [],
  "timeFilters": {
    "quarterRange": {
      "value": 12,
      "unit": "months"
    }
  },
  "groupBy": {
    "fields": ["company_id"],
    "aggregates": [
      {
        "function": "MIN",
        "field": "revenue",
        "alias": "min_revenue"
      },
      {
        "function": "COUNT",
        "field": "quarter",
        "alias": "quarter_count"
      }
    ]
  },
  "having": [
    {
      "aggregate": "MIN",
      "field": "revenue",
      "operator": ">",
      "value": 0
    },
    {
      "expression": "COUNT(*)",
      "operator": ">=",
      "value": 4
    }
  ],
  "specialFilters": {}
}
```

---

### 3. Technology Companies with Strong Quarterly Performance

**Natural Language Query:**
```
Technology companies with at least 3 profitable quarters in the past 9 months and average revenue above 1 million
```

**Generated DSL:**
```json
{
  "sector": "Technology",
  "symbol": null,
  "companyName": null,
  "conditions": [],
  "timeFilters": {
    "quarterRange": {
      "value": 9,
      "unit": "months"
    }
  },
  "groupBy": {
    "fields": ["company_id"],
    "aggregates": [
      {
        "function": "AVG",
        "field": "revenue",
        "alias": "avg_revenue"
      },
      {
        "function": "MIN",
        "field": "net_income",
        "alias": "min_profit"
      }
    ]
  },
  "having": [
    {
      "expression": "COUNT(*)",
      "operator": ">=",
      "value": 3
    },
    {
      "aggregate": "AVG",
      "field": "revenue",
      "operator": ">",
      "value": 1000000
    },
    {
      "aggregate": "MIN",
      "field": "net_income",
      "operator": ">",
      "value": 0
    }
  ],
  "specialFilters": {}
}
```

---

## API Usage

### Using the Screener API

**Endpoint:** `POST /api/screener/run`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "query": "Companies with 4 consecutive profitable quarters in the last 12 months"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "company_id": 1,
      "symbol": "AAPL",
      "company_name": "Apple Inc.",
      "sector": "Technology",
      "quarter_count": 4,
      "min_revenue": 81800000000
    },
    {
      "company_id": 5,
      "symbol": "MSFT",
      "company_name": "Microsoft Corporation",
      "sector": "Technology",
      "quarter_count": 4,
      "min_revenue": 52900000000
    }
  ],
  "count": 2,
  "dsl": "{...}",
  "sql": "SELECT...",
  "userQuery": "Companies with 4 consecutive profitable quarters in the last 12 months",
  "usedLLM": true
}
```

---

## DSL Structure Reference

### timeFilters
Filters data based on time ranges:

```json
"timeFilters": {
  "quarterRange": {
    "value": 12,
    "unit": "months"  // or "years", "days"
  },
  "dateFrom": "2023-01-01",  // optional
  "dateTo": "2024-12-31"     // optional
}
```

### groupBy
Groups results and calculates aggregates:

```json
"groupBy": {
  "fields": ["company_id"],  // fields to group by
  "aggregates": [
    {
      "function": "COUNT",  // COUNT, MIN, MAX, AVG, SUM
      "field": "quarter",
      "alias": "quarter_count"
    },
    {
      "function": "MIN",
      "field": "revenue",
      "alias": "min_revenue"
    }
  ]
}
```

### having
Filters grouped results:

```json
"having": [
  {
    "expression": "COUNT(*)",  // for direct SQL expressions
    "operator": "=",
    "value": 4
  },
  {
    "aggregate": "MIN",  // for aggregate functions
    "field": "revenue",
    "operator": ">",
    "value": 0
  }
]
```

---

## Testing

1. **Create the table:**
   ```bash
   cd backend
   psql -U postgres -d stockdb -f scripts/createQuarterlyFinancialsTable.sql
   ```

2. **Populate sample data** (optional - uncomment the INSERT statements in the SQL file)

3. **Test the API:**
   ```bash
   curl -X POST http://localhost:5000/api/screener/run \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"query": "Companies with 4 consecutive profitable quarters in the last 12 months"}'
   ```

---

## Notes

- The `quarterly_financials` table requires `company_id` to join with the `stocks` table
- Time-based queries automatically use `INNER JOIN` instead of `LEFT JOIN` for performance
- All dates use PostgreSQL's `INTERVAL` syntax for flexible date arithmetic
- The `quarter` field should store the first day of each quarter (e.g., 2024-01-01 for Q1 2024)
- GROUP BY automatically includes non-aggregated SELECT fields
- HAVING clauses are applied after GROUP BY for filtering aggregated results
