# 📘 Field Catalog — Stock Screener Platform

This document defines the data fields supported by the Stock Screener system.  
These fields are used across:

- LLM Parser (Natural language → DSL)
- Screener Engine (DSL → SQL)
- Database Schema
- Market Data Ingestion
- Mobile App Display

---

## 1. Company Identification Fields

| Field | Type | Description |
|---|---|---|
| symbol | string | Stock ticker symbol (e.g., INFY) |
| name | string | Company name |
| sector | string | Sector classification |
| industry | string | Industry classification |
| exchange | string | Exchange symbol (NSE/BSE) |

---

## 2. Fundamental Valuation Metrics

| Field | Type | Description |
|---|---|---|
| pe_ratio | float | Price to Earnings ratio |
| peg_ratio | float | Price/Earnings to Growth |
| pb_ratio | float | Price to Book ratio |
| ps_ratio | float | Price to Sales ratio |
| market_cap | float | Market capitalization (in crores) |
| ev_ebitda | float | Enterprise Value / EBITDA |

---

## 3. Profitability & Return Metrics

| Field | Type | Description |
|---|---|---|
| roe | float | Return on Equity (%) |
| roa | float | Return on Assets (%) |
| profit_margin | float | Net Profit Margin (%) |
| eps | float | Earnings Per Share |

---

## 4. Liquidity & Leverage Metrics

| Field | Type | Description |
|---|---|---|
| debt_to_equity | float | Total Debt / Equity |
| debt_to_fcf | float | Total Debt / Free Cash Flow |
| fcf_yield | float | Free Cash Flow Yield (%) |

---

## 5. Quarterly Financial Performance

| Field | Type | Description |
|---|---|---|
| revenue | float | Quarterly Revenue (in crores) |
| ebitda | float | Quarterly EBITDA (in crores) |
| net_income | float | Quarterly Net Profit (in crores) |

---

## 6. Ownership / Shareholding Pattern

| Field | Type | Description |
|---|---|---|
| promoter_holding | float | Promoter shareholding (%) |
| fii_holding | float | Foreign institutional investors (%) |
| dii_holding | float | Domestic institutional investors (%) |
| public_holding | float | Public shareholding (%) |

---

## 7. Price & Technical Metrics (Optional for Phase-1)

| Field | Type | Description |
|---|---|---|
| close_price | float | Latest closing price |
| price_52w_high | float | 52-week high price |
| price_52w_low | float | 52-week low price |
| volume | int | Trading volume |

---

## 8. NLP → DSL Field Mapping (Used by Parser)

Users may use natural language such as:

> "IT stocks with PE < 20 and promoter > 40"

Which maps to:

```json
{
  "sector": "technology",
  "filters": [
    { "field": "pe_ratio", "operator": "<", "value": 20 },
    { "field": "promoter_holding", "operator": ">", "value": 40 }
  ]
}
