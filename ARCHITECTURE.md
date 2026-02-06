# System Architecture Diagram

## Complete Stock Screener Backend Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                              │
│                    (Flutter Mobile App / Web App)                        │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS.JS SERVER                                │
│                        (Port 5000)                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Security Middleware                                                     │
│  ├── Helmet (Security Headers)                                          │
│  ├── CORS                                                                │
│  ├── Rate Limiting (100 req/15min)                                      │
│  └── Input Validation (express-validator)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  API ROUTES                                                              │
│  ├── /screener           - Natural language stock screening             │
│  ├── /api/portfolio/*    - Portfolio management (NEW)                   │
│  ├── /api/alerts/*       - Alert management (NEW)                       │
│  ├── /api/admin/*        - System monitoring (NEW)                      │
│  ├── /api/advisory/*     - Investment advisory                          │
│  ├── /api/insights/*     - Market insights                              │
│  ├── /stocks/*           - Stock data                                   │
│  └── /health             - Health check                                 │
└────────────────┬───────────────────┬────────────────────────────────────┘
                 │                   │
        ┌────────▼────────┐ ┌────────▼────────┐
        │  SERVICE LAYER  │ │ BACKGROUND JOBS │
        └────────┬────────┘ └────────┬────────┘
                 │                   │
    ┌────────────┼───────────────────┼────────────────┐
    │            │                   │                │
    ▼            ▼                   ▼                ▼
┌────────┐  ┌────────┐        ┌──────────┐    ┌──────────┐
│Portfolio│ │ Alert  │        │Condition │    │Background│
│Service  │ │Service │        │Evaluator │    │Evaluator │
└────┬───┘  └───┬────┘        └────┬─────┘    └────┬─────┘
     │          │                  │               │
     │          │                  │               │
     └──────────┴──────────────────┴───────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
     ┌────────┐     ┌────────┐    ┌────────┐
     │  Audit │     │ Query  │    │ Market │
     │ Service│     │ Cache  │    │  Data  │
     └───┬────┘     └───┬────┘    └────────┘
         │              │
         │              │
         └──────────────┴─────────────────────┐
                                              │
                    ┌─────────────────────────┼─────────────────────┐
                    │                         │                     │
                    ▼                         ▼                     ▼
         ┌──────────────────┐      ┌──────────────────┐  ┌──────────────────┐
         │   POSTGRESQL DB   │      │   REDIS CACHE    │  │   LLM SERVICES   │
         │   (Port 5432)     │      │   (Port 6379)    │  │   (Groq/OpenAI)  │
         ├──────────────────┤      ├──────────────────┤  └──────────────────┘
         │ Tables:           │      │ Features:         │
         │ • users           │      │ • Query cache     │
         │ • companies       │      │ • 5-min TTL       │
         │ • fundamentals    │      │ • LRU fallback    │
         │ • portfolio_items │      │ • Graceful fail   │
         │ • alerts          │      └──────────────────┘
         │ • evaluations     │
         │ • audit_logs      │
         │ • saved_screeners │
         └──────────────────┘
```

---

## Data Flow: User Adds Stock & Receives Alert

```
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Adds Stock to Portfolio                                 │
└──────────────────────────────────────────────────────────────────────┘

User App
   │
   │ POST /api/portfolio/add
   │ { userId: 1, symbol: "TCS", quantity: 100, avgPrice: 3500 }
   ▼
Portfolio Service
   │
   ├── Validate input
   ├── Check user exists
   ├── Begin transaction
   ├── Insert/Update portfolio_items
   ├── Log to audit_logs
   └── Commit transaction
   │
   ▼
Response: { success: true, data: {...} }


┌──────────────────────────────────────────────────────────────────────┐
│ STEP 2: Background Evaluator Runs (Every 1 Hour)                     │
└──────────────────────────────────────────────────────────────────────┘

Background Evaluator (setInterval)
   │
   ├── Get all users with portfolios
   ├── For each user:
   │   ├── Get portfolio stocks
   │   └── For each stock:
   │       ├── Fetch current fundamentals from DB
   │       └── Evaluate conditions
   │
   ▼
Condition Evaluation Service
   │
   ├── getLastEvaluation(userId, companyId, "pe_ratio_change")
   │   └── SELECT from condition_evaluations
   │
   ├── evaluateCondition()
   │   └── Current state: { pe_ratio: 32.1 }
   │
   ├── hasStateChanged?
   │   ├── Previous: { pe_ratio: 28.5 }
   │   ├── Current:  { pe_ratio: 32.1 }
   │   └── CHANGED: true
   │
   ├── storeEvaluation()
   │   └── INSERT/UPDATE condition_evaluations
   │
   └── triggerAction() [if changed]
       │
       ▼
   Alert Service
       │
       ├── Check cooldown (prevent spam)
       ├── Generate alert details
       ├── INSERT into alerts table
       │   ├── type: "pe_ratio_change"
       │   ├── severity: "high"
       │   ├── title: "PE Ratio Changed: TCS"
       │   ├── description: "PE changed from 28.5 to 32.1 (+12.63%)"
       │   ├── previous_value: {"pe_ratio": 28.5}
       │   └── current_value: {"pe_ratio": 32.1}
       │
       └── Log to audit_logs


┌──────────────────────────────────────────────────────────────────────┐
│ STEP 3: User Opens App & Receives Alert                              │
└──────────────────────────────────────────────────────────────────────┘

User App
   │
   │ GET /api/alerts/1?unreadOnly=true
   ▼
Alert Service
   │
   ├── SELECT from alerts WHERE user_id=1 AND read=false
   ├── JOIN with companies table
   └── Return alerts with stock details
   │
   ▼
Response:
{
  "alerts": [
    {
      "id": 1,
      "symbol": "TCS",
      "company_name": "Tata Consultancy Services",
      "alert_type": "pe_ratio_change",
      "severity": "high",
      "title": "PE Ratio Changed: TCS",
      "description": "PE changed from 28.5 to 32.1 (+12.63%)",
      "previous_value": {"pe_ratio": 28.5},
      "current_value": {"pe_ratio": 32.1},
      "triggered_at": "2026-01-30T10:00:00Z",
      "read": false
    }
  ]
}
   │
   ▼
User sees meaningful notification with context!
```

---

## Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER DESIGN                         │
└─────────────────────────────────────────────────────────────────┘

Portfolio Service
├── addStock(userId, symbol, quantity, avgPrice)
│   ├── Input validation
│   ├── User verification
│   ├── Duplicate handling (merge positions)
│   ├── Audit logging
│   └── Transaction safety
│
├── removeStock(userId, symbol)
├── updateStock(userId, symbol, quantity, avgPrice)
└── listPortfolio(userId)

──────────────────────────────────────────────────────────────────

Alert Service
├── createAlert(alertData)
│   ├── Severity validation
│   ├── Cooldown check
│   ├── Alert creation
│   ├── 7-day expiration
│   └── Audit logging
│
├── getUserAlerts(userId, unreadOnly)
├── markAsRead(alertId, userId)
├── dismissAlert(alertId, userId)
└── cleanupExpiredAlerts()

──────────────────────────────────────────────────────────────────

Condition Evaluation Service
├── evaluateCondition(params)
│   ├── getLastEvaluation()      [DB query]
│   ├── evaluateCondition()       [Custom function]
│   ├── hasStateChanged()         [Comparison]
│   ├── storeEvaluation()         [DB insert]
│   └── triggerAction()           [Create alert]
│
├── evaluateUserPortfolio(userId)
│   ├── Get all portfolio stocks
│   ├── For each: evaluate PE, revenue, market cap
│   └── Return results array
│
└── getEvaluationHistory(userId, companyId)

──────────────────────────────────────────────────────────────────

Audit Service
├── log(data, client)
│   ├── Validate required fields
│   ├── Insert to audit_logs
│   └── Console logging
│
├── getUserLogs(userId, limit)
├── getEntityLogs(entityType, entityId)
├── getRecentLogs(limit)
└── getStats(days)

──────────────────────────────────────────────────────────────────

Background Evaluator Service
├── start(intervalMs)              [Initialize scheduler]
├── stop()                         [Stop scheduler]
├── runEvaluationCycle()
│   ├── evaluateAllPortfolios()
│   ├── evaluateSavedScreeners()
│   ├── cleanupExpiredAlerts()
│   └── Update statistics
│
├── getStats()                     [Performance metrics]
└── runManual()                    [Admin trigger]
```

---

## Database Schema Relationships

```
┌──────────────┐
│    users     │
│ ─────────────│
│ id (PK)      │
│ email        │
│ name         │
└──────┬───────┘
       │
       │ 1:N
       │
       ├────────────────────────────────────┐
       │                                    │
       ▼                                    ▼
┌────────────────────┐           ┌──────────────────┐
│  portfolio_items   │           │     alerts       │
│ ───────────────────│           │ ─────────────────│
│ id (PK)            │           │ id (PK)          │
│ user_id (FK) ──────┤           │ user_id (FK) ────┤
│ company_id (FK) ───┼─┐         │ company_id (FK)──┼─┐
│ quantity           │ │         │ alert_type       │ │
│ avg_price          │ │         │ severity         │ │
│ added_at           │ │         │ title            │ │
└────────────────────┘ │         │ description      │ │
                       │         │ triggered_at     │ │
       ┌───────────────┘         └──────────────────┘ │
       │                                              │
       │                                              │
       │          ┌──────────────┐                    │
       │          │  companies   │                    │
       │          │ ─────────────│                    │
       └─────────▶│ id (PK)      │◀───────────────────┘
                  │ symbol       │
                  │ name         │
                  │ sector       │
                  └──────┬───────┘
                         │ 1:1
                         │
                         ▼
                  ┌──────────────┐
                  │ fundamentals │
                  │ ─────────────│
                  │ id (PK)      │
                  │ symbol (FK)  │
                  │ pe_ratio     │
                  │ revenue_growth│
                  │ market_cap   │
                  └──────────────┘

┌──────────────────────────┐       ┌─────────────────┐
│ condition_evaluations    │       │   audit_logs    │
│ ─────────────────────────│       │ ────────────────│
│ id (PK)                  │       │ id (PK)         │
│ user_id (FK)             │       │ user_id (FK)    │
│ company_id (FK)          │       │ entity_type     │
│ evaluation_type          │       │ entity_id       │
│ condition_key            │       │ action          │
│ previous_state (JSON)    │       │ description     │
│ current_state (JSON)     │       │ metadata (JSON) │
│ state_changed            │       │ created_at      │
│ evaluated_at             │       └─────────────────┘
└──────────────────────────┘
```

---

## Alert Cooldown Mechanism

```
Time: 10:00 AM
┌─────────────────────────────────────────────┐
│ PE Ratio changes: 28.5 → 32.1               │
│ Alert Created: ID #1                        │
│ Cooldown Period: 60 minutes                 │
└─────────────────────────────────────────────┘

Time: 10:30 AM (30 min later)
┌─────────────────────────────────────────────┐
│ PE Ratio changes again: 32.1 → 33.0         │
│ Cooldown Active: SUPPRESSED                 │
│ No alert created (spam prevention)          │
└─────────────────────────────────────────────┘

Time: 11:05 AM (65 min from first)
┌─────────────────────────────────────────────┐
│ PE Ratio changes: 33.0 → 35.0               │
│ Cooldown Expired: Alert Created ID #2       │
│ New Cooldown Period: 60 minutes             │
└─────────────────────────────────────────────┘
```

---

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT REQUEST                                             │
│  POST /screener                                             │
│  { "query": "Show IT stocks with PE below 30" }            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Parse to DSL  │
                    └────────┬───────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │ Generate Cache Key       │
              │ MD5("IT","PE<30",...)    │
              │ → "a3f2b1..."           │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │  Check Redis Cache       │
              └──────────┬───────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
         Found                     Not Found
            │                         │
            ▼                         ▼
    ┌──────────────┐        ┌──────────────────┐
    │ Return Cache │        │  Execute SQL     │
    │ ✅ HIT       │        │  Query Database  │
    │ ~10ms        │        └────────┬─────────┘
    └──────────────┘                 │
                                     ▼
                            ┌──────────────────┐
                            │ Store in Redis   │
                            │ TTL: 5 minutes   │
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Return Results   │
                            │ ❌ MISS          │
                            │ ~200ms           │
                            └──────────────────┘
```

---

**All diagrams reflect the actual implementation in the codebase.**
