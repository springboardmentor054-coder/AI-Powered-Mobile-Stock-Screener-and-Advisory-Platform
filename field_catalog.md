# Field Catalogue Documentation  
AI-Powered Mobile Stock Screener & Advisory Platform

---

## 1. Symbols Master Table

| Field Name     | Data Type | Description |
|---------------|----------|-------------|
| symbol_id     | INT (PK) | Unique stock ID |
| symbol        | VARCHAR  | Stock ticker (e.g., TCS, INFY) |
| company_name  | VARCHAR  | Company name |
| sector        | VARCHAR  | Business sector |
| exchange      | VARCHAR  | NSE / BSE |
| is_active     | BOOLEAN  | Stock active status |

---

## 2. Price Data Table

| Field Name   | Data Type | Description |
|-------------|----------|-------------|
| price_id    | INT (PK) | Unique price record ID |
| symbol_id   | INT (FK) | Reference to Symbols table |
| trade_date  | DATE     | Trading date |
| open_price  | DECIMAL  | Opening price |
| high_price  | DECIMAL  | Highest price |
| low_price   | DECIMAL  | Lowest price |
| close_price | DECIMAL  | Closing price |
| volume      | BIGINT   | Trade volume |

---

## 3. Fundamentals Table

| Field Name       | Data Type | Description |
|-----------------|----------|-------------|
| fundamental_id  | INT (PK) | Unique fundamentals record |
| symbol_id       | INT (FK) | Stock reference |
| pe_ratio        | DECIMAL  | Price to Earnings ratio |
| pb_ratio        | DECIMAL  | Price to Book ratio |
| roe             | DECIMAL  | Return on Equity (%) |
| eps             | DECIMAL  | Earnings per Share |
| market_cap      | BIGINT   | Market capitalization |
| revenue_growth  | DECIMAL  | Revenue growth (%) |

---

## 4. Screener Query Table

| Field Name      | Data Type | Description |
|----------------|----------|-------------|
| query_id       | INT (PK) | Screener query ID |
| user_id        | INT      | User reference |
| natural_query  | TEXT     | User English query |
| dsl_query      | TEXT     | Converted DSL query |
| created_at     | TIMESTAMP| Query creation time |

---

## 5. User Portfolio Table

| Field Name    | Data Type | Description |
|--------------|----------|-------------|
| portfolio_id | INT (PK) | Portfolio ID |
| user_id      | INT      | User reference |
| symbol_id    | INT      | Stock reference |
| quantity     | INT      | Number of shares |
| avg_price    | DECIMAL  | Average buy price |

---

## 6. Alerts Table

| Field Name     | Data Type | Description |
|---------------|----------|-------------|
| alert_id      | INT (PK) | Alert ID |
| user_id       | INT      | User reference |
| symbol_id     | INT      | Stock reference |
| condition     | VARCHAR  | Alert condition (e.g., PE < 10) |
| trigger_value | DECIMAL  | Threshold value |
| status        | VARCHAR  | Active / Triggered |
| created_at    | TIMESTAMP| Alert creation time |

---

## 7. Advisory Signals Table

| Field Name    | Data Type | Description |
|--------------|----------|-------------|
| signal_id    | INT (PK) | Signal ID |
| symbol_id    | INT      | Stock reference |
| signal_type  | VARCHAR  | Buy / Sell / Hold |
| confidence   | DECIMAL  | AI confidence (%) |
| generated_at | TIMESTAMP| Signal generation time |

---

