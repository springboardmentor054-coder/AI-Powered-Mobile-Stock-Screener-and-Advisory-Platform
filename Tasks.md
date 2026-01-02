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
