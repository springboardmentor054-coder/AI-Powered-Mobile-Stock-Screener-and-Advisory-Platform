### Day 1

## Stock Screener Understanding

Stock screeners use filters to narrow down stocks based on financial health, valuation, growth, and risk. Common filters include:

- Valuation metrics: PE, PEG, Price-to-Book
- Profitability metrics: ROE, ROA, EBITDA Margin
- Growth metrics: Revenue Growth, Earnings Growth
- Debt metrics: Debt-to-Equity, Debt-to-Free-Cash-Flow
- Cash flow metrics: Free Cash Flow, Operating Cash Flow
- Market metrics: Market Cap, Volume, Beta
- Shareholder actions: Buybacks, Dividends
- Analyst metrics: Target Price, Earnings Estimates
- Time-based metrics: Last N quarters growth

# 5 Most Important Stock Screener Filters (with explanation)

      Filter	                            What it Measures	                              Why It’s Important

Price-to-Earnings (PE)	             Price relative to earnings	                   Helps identify undervalued or overvalued stocks
Return on Equity (ROE)	             Profit generated from shareholder equity	   Indicates management efficiency
PEG Ratio	                         PE adjusted for growth	                       Finds growth stocks at reasonable prices
Debt-to-Free-Cash-Flow	             Ability to repay debt using cash	           Measures financial stability
Revenue & EBITDA Growth (YoY)	     Business growth consistency	               Ensures company is expanding, not shrinking

#

## Natural Language Query Examples + Solved Table

| Company  | Sector        | PE | ROE (%) | PEG | Debt/FCF | Revenue Growth | Buyback |
| -------- | ------------- | -- | ------- | --- | -------- | -------------- | ------- |
| TechNova | IT            | 8  | 18      | 1.5 | 0.20     | Yes            | Yes     |
| SoftEdge | IT            | 14 | 22      | 2.8 | 0.30     | Yes            | No      |
| ChipCore | Semiconductor | 9  | 15      | 2.0 | 0.18     | Yes            | Yes     |
| NetWave  | Telecom       | 11 | 10      | 3.5 | 0.40     | No             | No      |

Query 1

“Show IT stocks with PE below 10”

| Company  |
| -------- |
| TechNova |
| ChipCore |

Query 2

“Show IT stocks with PEG less than 3 and revenue growth”

| Company  |
| -------- |
| TechNova |
| SoftEdge |
| ChipCore |

Query 3

“Show stocks with low debt and announced buybacks”

| Company  |
| -------- |
| TechNova |
| ChipCore |

Query 4

“Show stocks with ROE above 15% and PE below 12”

| Company  |
| -------- |
| TechNova |
| ChipCore |


# 
### Day 2

## Financial Concepts (Meaning, Usage, Formula, Implementation)

# PE Ratio (Price to Earnings)

Meaning:
Shows how much investors are paying for ₹1 of company earnings.

Formula:
𝑃𝐸 =Current Stock Price / Earnings Per Share (EPS)

Where it is used:
Valuation comparison
Identifying undervalued/overvalued stocks

How to use it:
Low PE → possibly undervalued
High PE → growth expectations or overvaluation	​

Calculate PE or store directly from market API

# PEG Ratio (PE to Growth)

Meaning:
Adjusts PE ratio by company’s earnings growth.

Formula:
PEG= PE / Earnings Growth Rate 
	​
Where it is used:
Growth stock evaluation

How to use it:
PEG < 1 → undervalued growth stock
PEG < 3 → reasonable valuation

# EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization)

Meaning:
Shows operating profit from core business.

Formula:
EBITDA=Revenue−Operating Expenses

Where it is used:
Measuring operational performance
Comparing companies fairly

How to use it:
Higher EBITDA → stronger operations

# Free Cash Flow (FCF)

Meaning:
Actual cash available after running the business.

Formula:
FCF=Operating Cash Flow−Capital Expenditure

Where it is used:
Debt repayment
Buybacks & dividends

How to use it:
Positive FCF → financially healthy company

# Promoter Holding

Meaning:
Percentage of shares owned by promoters/founders.

Formula:
Promoter Holding= Promoter Shares / Total Shares * 100

Where it is used:
Confidence indicator

How to use it:
High holding → long-term confidence
Increasing holding → positive signal

# Earnings Call

Meaning:
Quarterly meeting where company discusses results and future outlook.

Where it is used:
Volatility prediction
Earnings surprise analysis

How to use it:
Stock often moves sharply after calls

# Buyback

Meaning:
Company repurchases its own shares.

Where it is used:
Shareholder value creation

How to use it:
Reduces share count
Increases EPS
Signals management confidence

#

## How AI Converts English → Stock Results

English Query → AI → Structured Rules → SQL → Database → Results

Example English Query
“Show IT stocks with PE below 10 and promoter holding above 50%”

Step 1: English Input
User enters query in mobile app.

Step 2: LLM Understanding
AI identifies:
Sector = IT
PE < 10
Promoter Holding > 50%

Step 3: Convert to DSL (Structured JSON)
{
  "sector": "IT",
  "filters": [
    { "field": "pe_ratio", "operator": "<", "value": 10 },
    { "field": "promoter_holding", "operator": ">", "value": 50 }
  ]
}

Step 4: Convert DSL → SQL

SELECT * FROM stocks
WHERE sector = 'IT'
AND pe_ratio < 10
AND promoter_holding > 50;

Step 5: Database Execution
SQL runs on PostgreSQL
Matching rows returned

Step 6: Results to User
Stocks shown as cards or table in app

## AI, SQL & Technical Concepts Used

Artificial Intelligence (AI)

Uses LLMs to understand natural language
Converts English to structured logic
Handles ambiguity & variations

----------------------------------------------------------------------------------
LLM (Large Language Model)

Trained on language patterns
Used in JSON-only constrained mode
Prevents hallucinations & unsafe output

----------------------------------------------------------------------------------
DSL (Domain Specific Language)

Intermediate format between English & SQL
Ensures validation and security

----------------------------------------------------------------------------------
SQL

Structured Query Language
Used to filter stock data efficiently
Optimized for large datasets

----------------------------------------------------------------------------------
Database (PostgreSQL + TimescaleDB)

Stores stock fundamentals & price history
TimescaleDB handles time-series data

----------------------------------------------------------------------------------
API Gateway

Authentication
Validation
Rate limiting

----------------------------------------------------------------------------------
Caching (Redis)

Stores frequent query results
Improves performance

----------------------------------------------------------------------------------
Security Concepts

SQL injection prevention
Query whitelisting
Role-based access