const axios = require("axios");

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

// Rate limiting tracking
let requestsThisMinute = 0;
let requestsToday = 0;
let minuteResetTime = Date.now() + 60000;
let dayResetTime = Date.now() + 86400000;

/**
 * Rate limiter for Alpha Vantage API
 * Free tier: 25 requests/day, 5 requests/minute
 */
async function checkRateLimit() {
  const now = Date.now();

  // Reset minute counter
  if (now > minuteResetTime) {
    requestsThisMinute = 0;
    minuteResetTime = now + 60000;
  }

  // Reset daily counter
  if (now > dayResetTime) {
    requestsToday = 0;
    dayResetTime = now + 86400000;
  }

  // Check limits
  if (requestsThisMinute >= 5) {
    throw new Error("Rate limit exceeded: 5 requests per minute");
  }
  if (requestsToday >= 25) {
    throw new Error("Rate limit exceeded: 25 requests per day");
  }

  requestsThisMinute++;
  requestsToday++;
}

/**
 * Generic Alpha Vantage API call with error handling
 */
async function makeApiCall(params) {
  await checkRateLimit();

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        apikey: API_KEY,
        ...params
      },
      timeout: 10000
    });

    // Check for API errors
    if (response.data["Error Message"]) {
      throw new Error(`Alpha Vantage API Error: ${response.data["Error Message"]}`);
    }

    if (response.data["Note"]) {
      throw new Error(`Alpha Vantage Rate Limit: ${response.data["Note"]}`);
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Request Failed: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error("No response from Alpha Vantage API");
    } else {
      throw error;
    }
  }
}

/**
 * Fetch company overview (fundamentals, PE ratio, PEG ratio, sector, etc.)
 * Returns: company info, PE, PEG, sector, industry, market cap, etc.
 */
async function getCompanyOverview(symbol) {
  const data = await makeApiCall({
    function: "OVERVIEW",
    symbol: symbol
  });

  if (!data.Symbol) {
    throw new Error(`No data found for symbol: ${symbol}`);
  }

  return {
    symbol: data.Symbol,
    companyName: data.Name,
    exchange: data.Exchange,
    sector: data.Sector,
    industry: data.Industry,
    peRatio: parseFloat(data.PERatio) || null,
    pegRatio: parseFloat(data.PEGRatio) || null,
    marketCap: parseFloat(data.MarketCapitalization) || null,
    dividendYield: parseFloat(data.DividendYield) || null,
    eps: parseFloat(data.EPS) || null,
    profitMargin: parseFloat(data.ProfitMargin) || null,
    operatingMarginTTM: parseFloat(data.OperatingMarginTTM) || null,
    returnOnAssetsTTM: parseFloat(data.ReturnOnAssetsTTM) || null,
    returnOnEquityTTM: parseFloat(data.ReturnOnEquityTTM) || null,
    revenueTTM: parseFloat(data.RevenueTTM) || null,
    bookValue: parseFloat(data.BookValue) || null,
    fiftyTwoWeekHigh: parseFloat(data["52WeekHigh"]) || null,
    fiftyTwoWeekLow: parseFloat(data["52WeekLow"]) || null,
    description: data.Description
  };
}

/**
 * Fetch income statement (quarterly)
 * Returns: revenue, EBITDA, net income
 */
async function getIncomeStatement(symbol) {
  const data = await makeApiCall({
    function: "INCOME_STATEMENT",
    symbol: symbol
  });

  if (!data.quarterlyReports || data.quarterlyReports.length === 0) {
    throw new Error(`No income statement data for symbol: ${symbol}`);
  }

  const quarterly = data.quarterlyReports.map(report => ({
    fiscalDateEnding: report.fiscalDateEnding,
    revenue: parseFloat(report.totalRevenue) || null,
    costOfRevenue: parseFloat(report.costOfRevenue) || null,
    grossProfit: parseFloat(report.grossProfit) || null,
    ebitda: parseFloat(report.ebitda) || null,
    netIncome: parseFloat(report.netIncome) || null,
    operatingIncome: parseFloat(report.operatingIncome) || null
  }));

  const annual = (data.annualReports || []).map(report => ({
    fiscalDateEnding: report.fiscalDateEnding,
    revenue: parseFloat(report.totalRevenue) || null,
    costOfRevenue: parseFloat(report.costOfRevenue) || null,
    grossProfit: parseFloat(report.grossProfit) || null,
    ebitda: parseFloat(report.ebitda) || null,
    netIncome: parseFloat(report.netIncome) || null,
    operatingIncome: parseFloat(report.operatingIncome) || null
  }));

  return {
    symbol: data.symbol,
    quarterly,
    annual
  };
}

/**
 * Fetch balance sheet
 * Returns: total debt, total assets, cash, etc.
 */
async function getBalanceSheet(symbol) {
  const data = await makeApiCall({
    function: "BALANCE_SHEET",
    symbol: symbol
  });

  if (!data.quarterlyReports || data.quarterlyReports.length === 0) {
    throw new Error(`No balance sheet data for symbol: ${symbol}`);
  }

  const quarterly = data.quarterlyReports.map(report => ({
    fiscalDateEnding: report.fiscalDateEnding,
    totalAssets: parseFloat(report.totalAssets) || null,
    totalLiabilities: parseFloat(report.totalLiabilities) || null,
    totalDebt: parseFloat(report.shortLongTermDebtTotal) || null,
    cashAndCashEquivalents: parseFloat(report.cashAndCashEquivalentsAtCarryingValue) || null,
    currentAssets: parseFloat(report.totalCurrentAssets) || null,
    currentLiabilities: parseFloat(report.totalCurrentLiabilities) || null,
    shareholderEquity: parseFloat(report.totalShareholderEquity) || null
  }));

  return {
    symbol: data.symbol,
    quarterly
  };
}

/**
 * Fetch cash flow statement
 * Returns: operating cash flow, free cash flow
 */
async function getCashFlow(symbol) {
  const data = await makeApiCall({
    function: "CASH_FLOW",
    symbol: symbol
  });

  if (!data.quarterlyReports || data.quarterlyReports.length === 0) {
    throw new Error(`No cash flow data for symbol: ${symbol}`);
  }

  const quarterly = data.quarterlyReports.map(report => ({
    fiscalDateEnding: report.fiscalDateEnding,
    operatingCashflow: parseFloat(report.operatingCashflow) || null,
    capitalExpenditures: parseFloat(report.capitalExpenditures) || null,
    // Free Cash Flow = Operating Cash Flow - Capital Expenditures
    freeCashFlow: 
      (parseFloat(report.operatingCashflow) || 0) - 
      Math.abs(parseFloat(report.capitalExpenditures) || 0),
    dividendPayout: parseFloat(report.dividendPayout) || null,
    changeInCashAndCashEquivalents: parseFloat(report.changeInCashAndCashEquivalents) || null
  }));

  return {
    symbol: data.symbol,
    quarterly
  };
}

/**
 * Fetch earnings data
 * Returns: reported EPS, estimated EPS, surprise, earnings date
 */
async function getEarnings(symbol) {
  const data = await makeApiCall({
    function: "EARNINGS",
    symbol: symbol
  });

  if (!data.quarterlyEarnings || data.quarterlyEarnings.length === 0) {
    throw new Error(`No earnings data for symbol: ${symbol}`);
  }

  const quarterly = data.quarterlyEarnings.map(earning => ({
    fiscalDateEnding: earning.fiscalDateEnding,
    reportedDate: earning.reportedDate,
    reportedEPS: parseFloat(earning.reportedEPS) || null,
    estimatedEPS: parseFloat(earning.estimatedEPS) || null,
    surprise: parseFloat(earning.surprise) || null,
    surprisePercentage: parseFloat(earning.surprisePercentage) || null
  }));

  return {
    symbol: data.symbol,
    quarterly
  };
}

/**
 * Fetch earnings calendar (upcoming earnings)
 * Returns: earnings date for next quarter
 */
async function getEarningsCalendar(symbol = null) {
  const params = {
    function: "EARNINGS_CALENDAR",
    horizon: "3month"
  };

  if (symbol) {
    params.symbol = symbol;
  }

  const data = await makeApiCall(params);
  
  // Parse CSV response
  const lines = data.split('\n');
  const headers = lines[0].split(',');
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',');
    const entry = {};
    
    headers.forEach((header, index) => {
      entry[header.trim()] = values[index] ? values[index].trim() : null;
    });
    
    results.push({
      symbol: entry.symbol,
      name: entry.name,
      reportDate: entry.reportDate,
      fiscalDateEnding: entry.fiscalDateEnding,
      estimate: parseFloat(entry.estimate) || null,
      currency: entry.currency
    });
  }

  return results;
}

/**
 * Get current stock price (real-time quote)
 */
async function getGlobalQuote(symbol) {
  const data = await makeApiCall({
    function: "GLOBAL_QUOTE",
    symbol: symbol
  });

  const quote = data["Global Quote"];
  
  if (!quote || !quote["01. symbol"]) {
    throw new Error(`No quote data for symbol: ${symbol}`);
  }

  return {
    symbol: quote["01. symbol"],
    price: parseFloat(quote["05. price"]) || null,
    change: parseFloat(quote["09. change"]) || null,
    changePercent: quote["10. change percent"],
    volume: parseInt(quote["06. volume"]) || null,
    latestTradingDay: quote["07. latest trading day"],
    previousClose: parseFloat(quote["08. previous close"]) || null,
    open: parseFloat(quote["02. open"]) || null,
    high: parseFloat(quote["03. high"]) || null,
    low: parseFloat(quote["04. low"]) || null
  };
}

/**
 * Get comprehensive company data (combines multiple endpoints)
 * This is the main function to fetch all data for a stock
 */
async function getComprehensiveStockData(symbol) {
  try {
    console.log(`Fetching comprehensive data for ${symbol}...`);
    
    // Fetch all data with delays to respect rate limits
    const overview = await getCompanyOverview(symbol);
    await delay(13000); // Wait 13 seconds between calls (5 calls/minute = 12 sec apart)
    
    const quote = await getGlobalQuote(symbol);
    await delay(13000);
    
    const income = await getIncomeStatement(symbol);
    await delay(13000);
    
    const balance = await getBalanceSheet(symbol);
    await delay(13000);
    
    const cashFlow = await getCashFlow(symbol);
    await delay(13000);
    
    const earnings = await getEarnings(symbol);

    return {
      overview,
      quote,
      income,
      balance,
      cashFlow,
      earnings
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Helper function to add delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  getCompanyOverview,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlow,
  getEarnings,
  getEarningsCalendar,
  getGlobalQuote,
  getComprehensiveStockData,
  delay
};
