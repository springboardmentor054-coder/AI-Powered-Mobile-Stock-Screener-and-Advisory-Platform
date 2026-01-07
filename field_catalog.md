# 📘 Database Field Catalogue
**Project: AI-Powered Mobile Stock Screener and Advisory Platform**

---

##  USER_MASTER

| No | Field Name | Data Type | Description |
|----|-----------|----------|-------------|
| 1 | user_id | UUID (PK) | Unique user identifier |
| 2 | user_name | VARCHAR(100) | Full name |
| 3 | email | VARCHAR(150) | Email address |
| 4 | phone_number | VARCHAR(15) | Mobile number |
| 5 | password_hash | VARCHAR(255) | Encrypted password |
| 6 | role | VARCHAR(30) | Investor / Admin |
| 7 | subscription_type | VARCHAR(30) | Free / Premium |
| 8 | account_status | VARCHAR(20) | Active / Inactive |
| 9 | last_login | TIMESTAMP | Last login time |
|10 | failed_login_attempts | INT | Failed login attempts |
|11 | preferred_language | VARCHAR(20) | UI language |
|12 | country | VARCHAR(50) | User country |
|13 | timezone | VARCHAR(50) | Timezone |
|14 | kyc_status | BOOLEAN | KYC completed |
|15 | notification_enabled | BOOLEAN | Notifications enabled |
|16 | email_verified | BOOLEAN | Email verified |
|17 | phone_verified | BOOLEAN | Phone verified |
|18 | created_at | TIMESTAMP | Created time |
|19 | updated_at | TIMESTAMP | Updated time |
|20 | deleted_flag | BOOLEAN | Soft delete |

---

##  QUERY_REQUEST

| No | Field Name | Data Type | Description |
|----|-----------|----------|-------------|
| 1 | query_id | UUID (PK) | Query ID |
| 2 | user_id | UUID (FK) | User reference |
| 3 | natural_language_query | TEXT | English query |
| 4 | parsed_dsl_json | JSON | LLM output |
| 5 | query_type | VARCHAR(50) | Screener / Advisory |
| 6 | api_request_id | VARCHAR(100) | API request ID |
| 7 | authentication_status | BOOLEAN | Auth result |
| 8 | validation_status | BOOLEAN | Validation result |
| 9 | execution_status | VARCHAR(20) | Success / Failed |
|10 | execution_time_ms | INT | Execution time |
|11 | sql_query | TEXT | Generated SQL |
|12 | error_message | TEXT | Error details |
|13 | request_source | VARCHAR(20) | Mobile / Web |
|14 | client_ip | VARCHAR(50) | IP address |
|15 | device_type | VARCHAR(50) | Android / iOS |
|16 | query_complexity | VARCHAR(20) | Simple / Advanced |
|17 | result_count | INT | Result size |
|18 | cache_hit | BOOLEAN | Cache used |
|19 | created_at | TIMESTAMP | Created time |
|20 | updated_at | TIMESTAMP | Updated time |

---

##  STOCK_MASTER

| No | Field Name | Data Type | Description |
|----|-----------|----------|-------------|
| 1 | stock_id | UUID (PK) | Stock ID |
| 2 | stock_symbol | VARCHAR(20) | Ticker |
| 3 | company_name | VARCHAR(150) | Company name |
| 4 | exchange | VARCHAR(10) | NSE / BSE |
| 5 | isin | VARCHAR(20) | ISIN |
| 6 | sector | VARCHAR(50) | Sector |
| 7 | industry | VARCHAR(50) | Industry |
| 8 | market_cap | DECIMAL | Market cap |
| 9 | listing_date | DATE | IPO date |
|10 | face_value | DECIMAL | Face value |
|11 | lot_size | INT | Lot size |
|12 | country | VARCHAR(50) | Country |
|13 | currency | VARCHAR(10) | Currency |
|14 | trading_status | VARCHAR(20) | Active / Halted |
|15 | index_member | BOOLEAN | Index member |
|16 | last_traded_price | DECIMAL | LTP |
|17 | volume | BIGINT | Trading volume |
|18 | data_source | VARCHAR(50) | Data provider |
|19 | created_at | TIMESTAMP | Created time |
|20 | updated_at | TIMESTAMP | Updated time |

---

##  STOCK_FUNDAMENTALS

| No | Field Name | Data Type | Description |
|----|-----------|----------|-------------|
| 1 | fundamentals_id | UUID (PK) | Record ID |
| 2 | stock_id | UUID (FK) | Stock reference |
| 3 | pe_ratio | DECIMAL | PE ratio |
| 4 | peg_ratio | DECIMAL | PEG ratio |
| 5 | pb_ratio | DECIMAL | PB ratio |
| 6 | roe | DECIMAL | ROE |
| 7 | roa | DECIMAL | ROA |
| 8 | revenue | DECIMAL | Revenue |
| 9 | revenue_growth_yoy | DECIMAL | YoY growth |
|10 | ebitda | DECIMAL | EBITDA |
|11 | ebitda_growth_yoy | DECIMAL | EBITDA growth |
|12 | net_profit | DECIMAL | Net profit |
|13 | eps | DECIMAL | EPS |
|14 | free_cash_flow | DECIMAL | FCF |
|15 | total_debt | DECIMAL | Total debt |
|16 | debt_to_fcf_ratio | DECIMAL | Debt/FCF |
|17 | promoter_holding | DECIMAL | Promoter % |
|18 | public_holding | DECIMAL | Public % |
|19 | financial_year | VARCHAR(10) | FY |
|20 | last_updated | TIMESTAMP | Updated time |

---

##  SCREENER_RESULTS

| No | Field Name | Data Type | Description |
|----|-----------|----------|-------------|
| 1 | result_id | UUID (PK) | Result ID |
| 2 | query_id | UUID (FK) | Query reference |
| 3 | stock_id | UUID (FK) | Stock reference |
| 4 | current_price | DECIMAL | Current price |
| 5 | target_price | DECIMAL | Target price |
| 6 | upside_percent | DECIMAL | Upside |
| 7 | screener_score | INT | Score |
| 8 | result_rank | INT | Rank |
| 9 | earnings_beat_probability | DECIMAL | Earnings chance |
|10 | buyback_announced | BOOLEAN | Buyback |
|11 | dividend_yield | DECIMAL | Dividend |
|12 | volatility | DECIMAL | Volatility |
|13 | trend_indicator | VARCHAR(20) | Trend |
|14 | confidence_level | VARCHAR(20) | Confidence |
|15 | risk_category | VARCHAR(20) | Risk |
|16 | recommendation | VARCHAR(20) | Buy/Hold/Sell |
|17 | notes | TEXT | Notes |
|18 | is_favorited | BOOLEAN | Saved |
|19 | created_at | TIMESTAMP | Created |
|20 | updated_at | TIMESTAMP | Updated |

---

##  ALERTS

| No | Field Name | Data Type | Description |
|----|-----------|----------|-------------|
| 1 | alert_id | UUID (PK) | Alert ID |
| 2 | user_id | UUID (FK) | User |
| 3 | stock_id | UUID (FK) | Stock |
| 4 | alert_type | VARCHAR(50) | Price / Ratio |
| 5 | alert_condition | TEXT | Condition |
| 6 | threshold_value | DECIMAL | Threshold |
| 7 | comparison_operator | VARCHAR(10) | >, <, = |
| 8 | current_value | DECIMAL | Current value |
| 9 | alert_status | VARCHAR(20) | Active/Triggered |
|10 | trigger_count | INT | Trigger count |
|11 | last_triggered | TIMESTAMP | Last trigger |
|12 | notification_type | VARCHAR(20) | Email/Push |
|13 | priority | VARCHAR(20) | Priority |
|14 | expiry_date | DATE | Expiry |
|15 | auto_disable | BOOLEAN | Auto disable |
|16 | remarks | TEXT | Remarks |
|17 | created_by | VARCHAR(50) | Creator |
|18 | created_at | TIMESTAMP | Created |
|19 | updated_at | TIMESTAMP | Updated |
|20 | deleted_flag | BOOLEAN | Soft delete |

---
