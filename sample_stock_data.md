# Sample Stock Dataset

This file contains sample (dummy) stock data used to demonstrate
filters in the AI-powered stock screener project.
This is not real market data and is created for academic purposes.

## Stock Data Table

| Company        | Sector        | PE | ROE (%) | PEG | Debt/Equity | Revenue Growth | Buyback |
|---------------|--------------|----|---------|-----|-------------|----------------|---------|
| NovaSystems   | IT Services  | 12 | 22      | 1.6 | 0.28        | Yes            | No      |
| FinEdge       | Banking      | 10 | 19      | 1.3 | 0.40        | Yes            | Yes     |
| GreenVolt     | Energy       | 18 | 16      | 2.4 | 0.55        | Yes            | No      |
| HealthPlus    | Healthcare   | 21 | 14      | 2.9 | 0.30        | No             | No      |
| SkyConnect    | Telecom      | 15 | 17      | 2.1 | 0.48        | Yes            | Yes     |

## Description of Fields

- *PE*: Price to Earnings Ratio  
- *ROE*: Return on Equity  
- *PEG*: Price/Earnings to Growth Ratio  
- *Debt/Equity*: Financial leverage of the company  
- *Revenue Growth*: Indicates increasing revenue  
- *Buyback*: Whether the company announced share buyback

## Purpose

This dataset is used to test and validate stock filtering logic
based on valuation, profitability, and financial health parameters.

# Queries used to filter stocks from the available sample stock data
## Query 1: price to Earnings less than 15
*Description:*  
This query filters stocks whose Price to Earnings ratio is less than 15.
Such stocks are generally considered undervalued and suitable for value investing.

| Company       | Sector       | PE | ROE (%) | PEG | Debt/Equity | Revenue Growth | Buyback |
|--------------|-------------|----|---------|-----|-------------|----------------|---------|
| NovaSystems  | IT Services | 12 | 22      | 1.6 | 0.28        | Yes            | No      |
| FinEdge      | Banking     | 10 | 19      | 1.3 | 0.40        | Yes            | Yes     |


