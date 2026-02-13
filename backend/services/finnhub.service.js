/**
 * Finnhub Market Data Service
 * ===========================
 * 
 * SINGLE SOURCE OF TRUTH for all market data
 * 
 * Architecture:
 *   Finnhub API → Cache (Redis) → In-Memory Cache → Mock (fallback only)
 * 
 * Features:
 * - Real-time stock quotes with 15-minute delay
 * - Rate limiting (60 calls/min, 250 calls/day)
 * - Automatic caching with TTL
 * - Graceful fallback to mock data
 * - Consistent data source tracking
 * - Numeric types only (no strings)
 * - Proper error handling and logging
 */

require("dotenv").config();
const axios = require("axios");
const cache = require("../cache");

class FinnhubService {
  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY;
    this.baseUrl = "https://finnhub.io/api/v1";
    this.timeout = 10000; // 10 second timeout
    this.cacheTTL = parseInt(process.env.REDIS_CACHE_TTL_SECONDS || 300); // 5 minutes
    
    // Rate limiting tracking
    this.callsThisMinute = 0;
    this.callsThisDay = 0;
    this.minuteResetTime = Date.now() + 60000;
    this.dayResetTime = Date.now() + 86400000;
    
    // In-memory cache (fallback if Redis unavailable)
    this.memoryCache = new Map();
    
    console.log("[FINNHUB] Service initialized");
    if (!this.apiKey) {
      console.warn("[FINNHUB] API key not configured - will use mock data");
    }
  }

  /**
   * Normalize stock symbol to Finnhub format
   * Examples: 'TCS' → 'TCS.NS', 'AAPL' → 'AAPL'
   * @param {string} symbol - Input symbol
   * @returns {string} Normalized symbol
   */
  normalizeSymbol(symbol) {
    if (!symbol) return '';
    
    const upper = symbol.toUpperCase();
    
    // If already has exchange suffix, return as is
    if (upper.includes('.')) return upper;
    
    // Indian stocks default to NSE (.NS)
    // US stocks have no suffix
    // This is a simple heuristic - customize as needed
    const indianStocks = ['TCS', 'INFY', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'WIPRO', 'HCLTECH'];
    if (indianStocks.includes(upper)) {
      return `${upper}.NS`;
    }
    
    return upper;
  }

  /**
   * Check if we can make an API call (rate limiting)
   * @returns {boolean} True if within rate limits
   */
  canMakeCall() {
    const now = Date.now();
    
    // Reset minute counter if time has passed
    if (now > this.minuteResetTime) {
      this.callsThisMinute = 0;
      this.minuteResetTime = now + 60000;
    }
    
    // Reset day counter if time has passed
    if (now > this.dayResetTime) {
      this.callsThisDay = 0;
      this.dayResetTime = now + 86400000;
    }
    
    const maxPerMin = parseInt(process.env.FINNHUB_RATE_LIMIT_CALLS_PER_MIN || 60);
    const maxPerDay = parseInt(process.env.FINNHUB_RATE_LIMIT_CALLS_PER_DAY || 250);
    
    const withinMin = this.callsThisMinute < maxPerMin;
    const withinDay = this.callsThisDay < maxPerDay;
    
    return withinMin && withinDay;
  }

  /**
   * Get cache key for a symbol
   * @param {string} symbol - Stock symbol
   * @returns {string} Cache key
   */
  getCacheKey(symbol) {
    return `finnhub:quote:${symbol.toUpperCase()}`;
  }

  /**
   * Get cache key for candle data
   * @param {string} symbol - Stock symbol
   * @param {string|number} resolution - Finnhub resolution
   * @param {number} from - Unix seconds
   * @param {number} to - Unix seconds
   * @returns {string} Cache key
   */
  getCandleCacheKey(symbol, resolution, from, to) {
    return `finnhub:candles:${symbol.toUpperCase()}:${resolution}:${from}:${to}`;
  }

  /**
   * Fetch stock quote from Finnhub API
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Quote data
   */
  async fetchQuoteFromAPI(symbol) {
    if (!this.apiKey) {
      throw new Error("FINNHUB_API_KEY not configured");
    }

    // Check rate limits
    if (!this.canMakeCall()) {
      const remainingMin = 60 - this.callsThisMinute;
      throw new Error(
        `Rate limit exceeded. Remaining calls this minute: ${remainingMin}. Try again in 1 minute.`
      );
    }

    try {
      const url = `${this.baseUrl}/quote`;
      const response = await axios.get(url, {
        params: {
          symbol: symbol,
          token: this.apiKey
        },
        timeout: this.timeout
      });

      // Track the call
      this.callsThisMinute++;
      this.callsThisDay++;

      if (!response.data || response.data.error) {
        throw new Error(response.data?.error || "Invalid response from Finnhub");
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error("Finnhub rate limit exceeded (429)");
      }
      throw error;
    }
  }

  /**
   * Fetch candle data from Finnhub API
   * @param {string} symbol - Stock symbol
   * @param {string|number} resolution - Finnhub resolution
   * @param {number} from - Unix seconds
   * @param {number} to - Unix seconds
   * @returns {Promise<Object>} Candle data
   */
  async fetchCandlesFromAPI(symbol, resolution, from, to) {
    if (!this.apiKey) {
      throw new Error("FINNHUB_API_KEY not configured");
    }

    if (!this.canMakeCall()) {
      const remainingMin = 60 - this.callsThisMinute;
      throw new Error(
        `Rate limit exceeded. Remaining calls this minute: ${remainingMin}. Try again in 1 minute.`
      );
    }

    try {
      const url = `${this.baseUrl}/stock/candle`;
      const response = await axios.get(url, {
        params: {
          symbol: symbol,
          resolution: resolution,
          from: from,
          to: to,
          token: this.apiKey
        },
        timeout: this.timeout
      });

      this.callsThisMinute++;
      this.callsThisDay++;

      if (!response.data || response.data.error) {
        throw new Error(response.data?.error || "Invalid response from Finnhub");
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error("Finnhub rate limit exceeded (429)");
      }
      throw error;
    }
  }

  /**
   * Get cached quote (Redis or memory)
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object|null>} Cached data or null
   */
  async getFromCache(symbol) {
    const cacheKey = this.getCacheKey(symbol);

    try {
      // Try Redis first
      const cached = await cache.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Validate cached data - reject if price is 0 or invalid
        if (data && data.current_price > 0) {
          return data;
        }
        console.log(`  Rejecting invalid cached data for ${symbol} (price=${data?.current_price || 0})`);
      }
    } catch (error) {
      console.warn(`Redis get failed: ${error.message}`);
    }

    // Fallback to memory cache
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached.expires > Date.now()) {
        // Validate cached data - reject if price is 0 or invalid
        if (cached.data && cached.data.current_price > 0) {
          return cached.data;
        }
        console.log(`  Rejecting invalid cached data for ${symbol} (price=${cached.data?.current_price || 0})`);
        this.memoryCache.delete(cacheKey);
      } else {
        this.memoryCache.delete(cacheKey);
      }
    }

    return null;
  }

  /**
   * Cache a quote (Redis and memory)
   * @param {string} symbol - Stock symbol
   * @param {Object} data - Quote data to cache
   * @returns {Promise<void>}
   */
  async cacheQuote(symbol, data) {
    const cacheKey = this.getCacheKey(symbol);

    try {
      // Store in Redis with TTL
      await cache.setEx(cacheKey, this.cacheTTL, JSON.stringify(data));
    } catch (error) {
      console.warn(`Redis setEx failed: ${error.message}`);
    }

    // Also store in memory cache
    this.memoryCache.set(cacheKey, {
      data,
      expires: Date.now() + this.cacheTTL * 1000
    });
  }

  /**
   * Cache candle data (Redis and memory)
   * @param {string} symbol - Stock symbol
   * @param {string|number} resolution - Finnhub resolution
   * @param {number} from - Unix seconds
   * @param {number} to - Unix seconds
   * @param {Object} data - Candle data to cache
   * @returns {Promise<void>}
   */
  async cacheCandles(symbol, resolution, from, to, data) {
    const cacheKey = this.getCandleCacheKey(symbol, resolution, from, to);

    try {
      await cache.setEx(cacheKey, this.cacheTTL, JSON.stringify(data));
    } catch (error) {
      console.warn(`Redis setEx failed: ${error.message}`);
    }

    this.memoryCache.set(cacheKey, {
      data,
      expires: Date.now() + this.cacheTTL * 1000
    });
  }

  /**
   * Get cached candles (Redis or memory)
   * @param {string} symbol - Stock symbol
   * @param {string|number} resolution - Finnhub resolution
   * @param {number} from - Unix seconds
   * @param {number} to - Unix seconds
   * @returns {Promise<Object|null>} Cached data or null
   */
  async getCandlesFromCache(symbol, resolution, from, to) {
    const cacheKey = this.getCandleCacheKey(symbol, resolution, from, to);

    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data && Array.isArray(data.candles) && data.candles.length > 0) {
          return data;
        }
      }
    } catch (error) {
      console.warn(`Redis get failed: ${error.message}`);
    }

    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached.expires > Date.now()) {
        if (cached.data && Array.isArray(cached.data.candles) && cached.data.candles.length > 0) {
          return cached.data;
        }
        this.memoryCache.delete(cacheKey);
      } else {
        this.memoryCache.delete(cacheKey);
      }
    }

    return null;
  }

  /**
   * Generate mock stock data (for testing without API key)
   * @param {string} symbol - Stock symbol
   * @returns {Object} Mock quote data
   */
  generateMockData(symbol) {
    // Generate realistic prices based on symbol hash for consistency
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = hash % 1000;
    
    const basePrice = 1000 + seed * 4; // Base: 1000-5000
    const volatility = basePrice * 0.03; // 3% daily volatility
    const change = (Math.random() - 0.5) * 2 * volatility; // -3% to +3%
    
    const currentPrice = basePrice + change;
    const high = currentPrice + Math.abs(volatility * 0.5);
    const low = currentPrice - Math.abs(volatility * 0.5);
    const open = basePrice + (Math.random() - 0.5) * volatility;
    
    return {
      c: Math.max(1, currentPrice),    // Current price (min 1)
      h: Math.max(1, high),            // High
      l: Math.max(1, low),             // Low
      o: Math.max(1, open),            // Open
      pc: Math.max(1, basePrice),      // Previous close
      v: Math.floor(1000000 + Math.random() * 5000000), // Volume
      t: Math.floor(Date.now() / 1000) // Timestamp
    };
  }

  /**
   * Generate mock candle data (for testing without API key)
   * @param {string} symbol - Stock symbol
   * @param {string|number} resolution - Finnhub resolution
   * @param {number} from - Unix seconds
   * @param {number} to - Unix seconds
   * @returns {Object} Mock candle data
   */
  generateMockCandles(symbol, resolution, from, to) {
    const stepSeconds = this.getResolutionStepSeconds(resolution);
    const timestamps = [];
    for (let t = from; t <= to; t += stepSeconds) {
      timestamps.push(t);
    }

    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = hash % 1000;
    let price = 1000 + seed * 3;

    const opens = [];
    const highs = [];
    const lows = [];
    const closes = [];
    const volumes = [];

    timestamps.forEach(() => {
      const move = (Math.random() - 0.5) * price * 0.01;
      const open = price;
      const close = Math.max(1, open + move);
      const high = Math.max(open, close) + Math.abs(move) * 0.5;
      const low = Math.min(open, close) - Math.abs(move) * 0.5;

      opens.push(open);
      highs.push(Math.max(1, high));
      lows.push(Math.max(1, low));
      closes.push(close);
      volumes.push(Math.floor(500000 + Math.random() * 5000000));

      price = close;
    });

    return {
      s: 'ok',
      t: timestamps,
      o: opens,
      h: highs,
      l: lows,
      c: closes,
      v: volumes
    };
  }

  /**
   * Normalize candle response
   * @param {Object} data - Finnhub candle data
   * @param {string} symbol - Stock symbol
   * @param {string} dataSource - Where data came from
   * @returns {Object} Normalized candle object
   */
  normalizeCandles(data, symbol, dataSource, fallbackReason = null) {
    if (!data || data.s !== 'ok' || !Array.isArray(data.t)) {
      return {
        symbol,
        candles: [],
        data_source: dataSource,
        is_real_data: dataSource !== 'MOCK',
        is_delayed: dataSource === 'FINNHUB_API',
        delay_minutes: dataSource === 'FINNHUB_API' ? 15 : 0,
        fallback_reason: fallbackReason
      };
    }

    const candles = data.t.map((timestamp, idx) => {
      return {
        t: new Date(timestamp * 1000).toISOString(),
        o: parseFloat(data.o?.[idx]) || 0,
        h: parseFloat(data.h?.[idx]) || 0,
        l: parseFloat(data.l?.[idx]) || 0,
        c: parseFloat(data.c?.[idx]) || 0,
        v: parseInt(data.v?.[idx]) || 0
      };
    });

    return {
      symbol,
      candles,
      data_source: dataSource,
      is_real_data: dataSource !== 'MOCK',
      is_delayed: dataSource === 'FINNHUB_API',
      delay_minutes: dataSource === 'FINNHUB_API' ? 15 : 0,
      fallback_reason: fallbackReason
    };
  }

  /**
   * Get seconds per resolution step
   * @param {string|number} resolution - Finnhub resolution
   * @returns {number} Step seconds
   */
  getResolutionStepSeconds(resolution) {
    const res = String(resolution).toUpperCase();
    if (res === 'D') return 86400;
    if (res === 'W') return 604800;
    if (res === 'M') return 2592000;
    const minutes = parseInt(res, 10);
    if (!Number.isFinite(minutes) || minutes <= 0) return 300;
    return minutes * 60;
  }

  /**
   * Parse Quote API response and normalize output
   * @param {Object} data - Finnhub quote data
   * @param {string} symbol - Stock symbol
   * @param {string} dataSource - Where data came from
   * @returns {Object} Normalized quote object
   */
  normalizeQuote(data, symbol, dataSource, fallbackReason = null) {
    return {
      symbol: symbol,
      current_price: parseFloat(data.c) || 0,
      previous_close: parseFloat(data.pc) || 0,
      high: parseFloat(data.h) || null,
      low: parseFloat(data.l) || null,
      open: parseFloat(data.o) || null,
      volume: parseInt(data.v) || 0,
      timestamp: data.t ? new Date(data.t * 1000).toISOString() : new Date().toISOString(),
      
      // Calculated fields
      change: (parseFloat(data.c) || 0) - (parseFloat(data.pc) || 0),
      change_percent: ((parseFloat(data.c) || 0) - (parseFloat(data.pc) || 0)) / (parseFloat(data.pc) || 1) * 100,
      
      // Data source metadata
      data_source: dataSource,
      is_real_data: dataSource !== 'MOCK',
      is_delayed: dataSource === 'FINNHUB_API', // Finnhub has 15-minute delay
      delay_minutes: dataSource === 'FINNHUB_API' ? 15 : 0,
      fallback_reason: fallbackReason
    };
  }

  /**
   * Get real-time stock quote (PRIMARY METHOD)
   * Implements full pipeline: Finnhub → Cache → Mock
   * 
   * @param {string} symbol - Stock symbol (e.g., 'TCS.NS')
   * @returns {Promise<Object>} Normalized quote with metadata
   */
  async getQuote(symbol) {
    if (!symbol) {
      throw new Error("Symbol is required");
    }

    const normalizedSymbol = this.normalizeSymbol(symbol);
    console.log(`[Finnhub] Getting quote for ${normalizedSymbol}`);

    let fallbackReason = null;
    try {
      // Step 1: Check cache
      const cached = await this.getFromCache(normalizedSymbol);
      if (cached) {
        console.log(`  Cache HIT for ${normalizedSymbol}`);
        return cached;
      }

      // Step 2: Try Finnhub API
      if (this.apiKey) {
        try {
          const apiData = await this.fetchQuoteFromAPI(normalizedSymbol);
          
          // Validate that we got real data (price > 0)
          if (!apiData.c || apiData.c <= 0) {
            throw new Error(`Invalid price data (price=${apiData.c || 0})`);
          }
          
          const result = this.normalizeQuote(apiData, normalizedSymbol, 'FINNHUB_API');
          
          // Cache the result
          await this.cacheQuote(normalizedSymbol, result);
          
          console.log(`[FINNHUB] ${normalizedSymbol}: ${result.current_price.toFixed(2)}`);
          return result;
        } catch (error) {
          fallbackReason = error.message;
          console.warn(`  Finnhub API failed: ${error.message}`);
          // Fall through to mock
        }
      } else {
        fallbackReason = "FINNHUB_API_KEY not configured";
      }

      // Step 3: Fallback to mock
      console.log(`  Using mock data for ${normalizedSymbol}`);
      const mockData = this.generateMockData(normalizedSymbol);
      const result = this.normalizeQuote(
        mockData,
        normalizedSymbol,
        'MOCK',
        fallbackReason
      );
      
      // Cache mock data too
      await this.cacheQuote(normalizedSymbol, result);
      
      return result;

    } catch (error) {
      console.error(`[FINNHUB] Error getting quote for ${normalizedSymbol}:`, error.message);
      
      // Last resort: return mock data
      const mockData = this.generateMockData(normalizedSymbol);
      return this.normalizeQuote(
        mockData,
        normalizedSymbol,
        'MOCK',
        error.message
      );
    }
  }

  /**
   * Get multiple quotes in parallel
   * @param {string[]} symbols - Array of stock symbols
   * @returns {Promise<Object[]>} Array of normalized quotes
   */
  async getQuotes(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return [];
    }

    console.log(`[Finnhub] Fetching ${symbols.length} quotes...`);
    
    const promises = symbols.map(symbol => 
      this.getQuote(symbol).catch(error => {
        console.error(`  Error fetching ${symbol}:`, error.message);
        return this.normalizeQuote(
          this.generateMockData(symbol),
          symbol,
          'MOCK'
        );
      })
    );

    const results = await Promise.all(promises);
    
    const realDataCount = results.filter(r => r.is_real_data).length;
    console.log(`[FINNHUB] Retrieved ${realDataCount}/${symbols.length} real quotes`);
    
    return results;
  }

  /**
   * Get candlestick data for a symbol
   * @param {string} symbol - Stock symbol
   * @param {string|number} resolution - Finnhub resolution
   * @param {number} from - Unix seconds
   * @param {number} to - Unix seconds
   * @returns {Promise<Object>} Normalized candle data
   */
  async getCandles(symbol, resolution, from, to) {
    if (!symbol) {
      throw new Error("Symbol is required");
    }

    const normalizedSymbol = this.normalizeSymbol(symbol);

    let fallbackReason = null;
    const cached = await this.getCandlesFromCache(normalizedSymbol, resolution, from, to);
    if (cached) {
      return cached;
    }

    try {
      if (this.apiKey) {
        try {
          const apiData = await this.fetchCandlesFromAPI(
            normalizedSymbol,
            resolution,
            from,
            to
          );

          const result = this.normalizeCandles(apiData, normalizedSymbol, 'FINNHUB_API');
          await this.cacheCandles(normalizedSymbol, resolution, from, to, result);
          return result;
        } catch (error) {
          fallbackReason = error.message;
          console.warn(`  Finnhub candle API failed: ${error.message}`);
        }
      } else {
        fallbackReason = "FINNHUB_API_KEY not configured";
      }

      const mockData = this.generateMockCandles(normalizedSymbol, resolution, from, to);
      const result = this.normalizeCandles(
        mockData,
        normalizedSymbol,
        'MOCK',
        fallbackReason
      );
      await this.cacheCandles(normalizedSymbol, resolution, from, to, result);
      return result;
    } catch (error) {
      console.error(`[FINNHUB] Error getting candles for ${normalizedSymbol}:`, error.message);
      const mockData = this.generateMockCandles(normalizedSymbol, resolution, from, to);
      return this.normalizeCandles(
        mockData,
        normalizedSymbol,
        'MOCK',
        error.message
      );
    }
  }

  /**
   * Clear all caches (useful for testing)
   * @returns {Promise<void>}
   */
  async clearCache() {
    this.memoryCache.clear();
    // Redis clear would require pattern matching - skipped for safety
    console.log("[CACHE] Memory cache cleared");
  }

  /**
   * Get service health status
   * @returns {Object} Health information
   */
  getStatus() {
    return {
      service: 'Finnhub',
      api_key_configured: !!this.apiKey,
      calls_this_minute: this.callsThisMinute,
      calls_this_day: this.callsThisDay,
      rate_limit_min: parseInt(process.env.FINNHUB_RATE_LIMIT_CALLS_PER_MIN || 60),
      rate_limit_day: parseInt(process.env.FINNHUB_RATE_LIMIT_CALLS_PER_DAY || 250),
      cache_size_memory: this.memoryCache.size,
      cache_ttl_seconds: this.cacheTTL
    };
  }
}

// Export singleton instance
module.exports = new FinnhubService();
