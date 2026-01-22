/**
 * API TEST SCRIPT
 * 
 * Quick script to test all API endpoints
 * Run this AFTER starting the server
 * 
 * Usage: node test-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// ANSI color codes for pretty terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  test: (msg) => console.log(`\n${colors.cyan}►${colors.reset} ${msg}`)
};

/**
 * TEST 1: Health Check
 */
const testHealthCheck = async () => {
  log.test('Testing: GET /health');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    log.success(`Health check passed`);
    log.info(`Status: ${response.data.status}`);
    log.info(`Uptime: ${response.data.uptime}s`);
    return true;
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    return false;
  }
};

/**
 * TEST 2: Fetch Stock Data
 */
const testFetchStock = async (ticker = 'TCS') => {
  log.test(`Testing: POST /stocks/fetch (${ticker})`);
  try {
    const response = await axios.post(`${BASE_URL}/stocks/fetch`, {
      ticker: ticker
    });
    log.success(`Stock data fetched successfully`);
    log.info(`Ticker: ${response.data.data.ticker}`);
    log.info(`Company: ${response.data.data.companyName}`);
    log.info(`PE Ratio: ${response.data.data.peRatio}`);
    return true;
  } catch (error) {
    log.error(`Fetch failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
};

/**
 * TEST 3: List Stocks
 */
const testListStocks = async () => {
  log.test('Testing: GET /stocks');
  try {
    const response = await axios.get(`${BASE_URL}/stocks?limit=10`);
    log.success(`Listed ${response.data.count} stocks`);
    if (response.data.data.length > 0) {
      log.info(`First stock: ${response.data.data[0].ticker} - ${response.data.data[0].company_name}`);
    }
    return true;
  } catch (error) {
    log.error(`List failed: ${error.message}`);
    return false;
  }
};

/**
 * TEST 4: Get Stock by Ticker
 */
const testGetStockByTicker = async (ticker = 'TCS') => {
  log.test(`Testing: GET /stocks/${ticker}`);
  try {
    const response = await axios.get(`${BASE_URL}/stocks/${ticker}`);
    log.success(`Stock found: ${response.data.data.company_name}`);
    log.info(`PE Ratio: ${response.data.data.pe_ratio}`);
    log.info(`Market Cap: ${response.data.data.market_cap}`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      log.error(`Stock not found: ${ticker}`);
      log.info(`Try fetching it first: POST /stocks/fetch`);
    } else {
      log.error(`Error: ${error.message}`);
    }
    return false;
  }
};

/**
 * TEST 5: Natural Language Query
 */
const testNaturalLanguageQuery = async (query = 'Show stocks with PE ratio less than 25') => {
  log.test('Testing: POST /stocks/query (AI Feature)');
  log.info(`Query: "${query}"`);
  try {
    const response = await axios.post(`${BASE_URL}/stocks/query`, {
      query: query
    });
    log.success(`Query executed successfully`);
    log.info(`Found ${response.data.count} matching stocks`);
    log.info(`Filters applied: ${JSON.stringify(response.data.filters)}`);
    if (response.data.data.length > 0) {
      log.info(`Sample result: ${response.data.data[0].ticker} - PE: ${response.data.data[0].pe_ratio}`);
    }
    return true;
  } catch (error) {
    log.error(`Query failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
};

/**
 * RUN ALL TESTS
 */
const runAllTests = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 AI STOCK SCREENER API TEST SUITE');
  console.log('='.repeat(60));
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  // Test 1: Health Check
  const test1 = await testHealthCheck();
  test1 ? results.passed++ : results.failed++;
  
  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 2: Fetch Stock (creates data for next tests)
  const test2 = await testFetchStock('TCS');
  test2 ? results.passed++ : results.failed++;
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 3: List Stocks
  const test3 = await testListStocks();
  test3 ? results.passed++ : results.failed++;
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 4: Get Stock by Ticker
  const test4 = await testGetStockByTicker('TCS');
  test4 ? results.passed++ : results.failed++;
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 5: Natural Language Query (AI Feature)
  const test5 = await testNaturalLanguageQuery('Show stocks with PE ratio less than 30');
  test5 ? results.passed++ : results.failed++;
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`Total: ${results.passed + results.failed}`);
  console.log('='.repeat(60) + '\n');
  
  if (results.failed === 0) {
    console.log(`${colors.green}🎉 All tests passed! Your backend is working perfectly!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Some tests failed. Check the error messages above.${colors.reset}\n`);
  }
};

// Run the tests
runAllTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error.message);
  console.log('\n💡 Make sure:');
  console.log('   1. Server is running (npm start)');
  console.log('   2. Database is connected');
  console.log('   3. .env file is configured\n');
  process.exit(1);
});
