/**
 * Real-Time Market Data Service
 * Fetches live stock data from Yahoo Finance (free, no API key required)
 */

const axios = require('axios');

class RealTimeMarketDataService {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.cache = new Map();
    this.cacheExpiry = 60000; // 1 minute cache
  }

  /**
   * Fetch real-time stock data from Yahoo Finance
   * @param {string} symbol - Stock symbol (e.g., 'TCS.NS' for NSE)
   * @returns {Promise<Object>} Real-time stock data
   */
  async getRealtimeData(symbol) {
    const cacheKey = symbol;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`📦 Cache hit for ${symbol}`);
      return cached.data;
    }

    try {
      // For Indian stocks, append .NS for NSE or .BO for BSE
      const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
      
      const response = await axios.get(`${this.baseUrl}/${yahooSymbol}`, {
        params: {
          range: '1d',
          interval: '5m',
          includePrePost: false
        },
        timeout: 5000
      });

      const result = response.data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];
      const timestamps = result.timestamp;

      const stockData = {
        symbol: symbol,
        currentPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        open: quote.open[0],
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
        volume: meta.regularMarketVolume,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        marketCap: meta.marketCap || null,
        timestamps: timestamps,
        prices: quote.close.filter(p => p !== null),
        volumes: quote.volume.filter(v => v !== null),
        lastUpdate: new Date(meta.regularMarketTime * 1000).toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: stockData,
        timestamp: Date.now()
      });

      console.log(`✅ Fetched real-time data for ${symbol}: ₹${stockData.currentPrice}`);
      return stockData;

    } catch (error) {
      console.error(`❌ Error fetching data for ${symbol}:`, error.message);
      
      // Return mock data as fallback
      return this.generateMockData(symbol);
    }
  }

  /**
   * Get historical intraday data (last 5 days)
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Historical data with OHLCV
   */
  async getIntradayData(symbol) {
    try {
      const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
      
      const response = await axios.get(`${this.baseUrl}/${yahooSymbol}`, {
        params: {
          range: '5d',
          interval: '15m'
        },
        timeout: 5000
      });

      const result = response.data.chart.result[0];
      const quote = result.indicators.quote[0];
      const timestamps = result.timestamp;

      return {
        symbol: symbol,
        timestamps: timestamps.map(t => new Date(t * 1000).toISOString()),
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close,
        volume: quote.volume
      };

    } catch (error) {
      console.error(`❌ Error fetching intraday data for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch multiple stocks in parallel
   * @param {string[]} symbols - Array of stock symbols
   * @returns {Promise<Object[]>} Array of stock data
   */
  async getBulkRealtimeData(symbols) {
    const promises = symbols.map(symbol => this.getRealtimeData(symbol));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Generate mock data as fallback
   * @param {string} symbol - Stock symbol
   * @returns {Object} Mock stock data
   */
  generateMockData(symbol) {
    const basePrice = 1000 + Math.random() * 2000;
    const change = (Math.random() - 0.5) * 50;
    
    const now = Date.now();
    const timestamps = [];
    const prices = [];
    const volumes = [];

    // Generate 5-minute interval data for last hour
    for (let i = 12; i >= 0; i--) {
      timestamps.push(now - (i * 5 * 60 * 1000));
      const variance = (Math.random() - 0.5) * 20;
      prices.push(basePrice + variance);
      volumes.push(Math.floor(100000 + Math.random() * 500000));
    }

    return {
      symbol: symbol,
      currentPrice: basePrice + change,
      previousClose: basePrice,
      open: basePrice - 10,
      high: basePrice + 15,
      low: basePrice - 12,
      volume: 2500000,
      change: change,
      changePercent: (change / basePrice) * 100,
      marketCap: (basePrice + change) * 1000000000,
      timestamps: timestamps,
      prices: prices,
      volumes: volumes,
      lastUpdate: new Date().toISOString(),
      isMock: true
    };
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new RealTimeMarketDataService();
