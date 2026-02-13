/**
 * Query Cache Service
 * Production-ready caching layer for screener queries
 * Implements LRU caching with Redis backend and in-memory fallback
 */

const cache = require("../cache");
const crypto = require("crypto");

class QueryCacheService {
  constructor() {
    this.memoryCache = new Map();
    this.maxMemoryCacheSize = 100;
    this.defaultTTL = 300; // 5 minutes
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Generate cache key from query parameters
   * @param {Object} dsl - DSL object
   * @returns {string} Cache key
   */
  generateCacheKey(dsl) {
    const normalized = stableStringify(dsl);
    return `screener:${crypto.createHash('md5').update(normalized).digest('hex')}`;
  }

  /**
   * Get cached query result
   * @param {Object} dsl - DSL query object
   * @returns {Promise<Array|null>} Cached results or null
   */
  async get(dsl) {
    const key = this.generateCacheKey(dsl);

    try {
      // Try Redis first
      const redisResult = await cache.get(key);
      if (redisResult) {
        this.hitCount++;
        console.log(`[CACHE] HIT (Redis): ${key}`);
        return JSON.parse(redisResult);
      }

      // Fallback to memory cache
      if (this.memoryCache.has(key)) {
        const cached = this.memoryCache.get(key);
        
        // Check expiration
        if (cached.expires > Date.now()) {
          this.hitCount++;
          console.log(`[CACHE] HIT (Memory): ${key}`);
          
          // Move to front (LRU)
          this.memoryCache.delete(key);
          this.memoryCache.set(key, cached);
          
          return cached.data;
        } else {
          // Expired
          this.memoryCache.delete(key);
        }
      }

      this.missCount++;
      console.log(`[CACHE] MISS: ${key}`);
      return null;

    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set cache entry
   * @param {Object} dsl - DSL query object
   * @param {Array} data - Query results
   * @param {number} ttl - Time to live in seconds
   */
  async set(dsl, data, ttl = this.defaultTTL) {
    const key = this.generateCacheKey(dsl);

    try {
      // Store in Redis
      await cache.setEx(key, ttl, JSON.stringify(data));

      // Store in memory cache
      this.memoryCache.set(key, {
        data,
        expires: Date.now() + (ttl * 1000)
      });

      // Enforce max size (LRU eviction)
      if (this.memoryCache.size > this.maxMemoryCacheSize) {
        const firstKey = this.memoryCache.keys().next().value;
        this.memoryCache.delete(firstKey);
      }

      console.log(`Cached result: ${key} (TTL: ${ttl}s)`);

    } catch (error) {
      console.error('Cache set error:', error.message);
    }
  }

  /**
   * Invalidate cache for specific query
   * @param {Object} dsl - DSL query object
   */
  async invalidate(dsl) {
    const key = this.generateCacheKey(dsl);

    try {
      await cache.del(key);
      this.memoryCache.delete(key);
      console.log(`Invalidated cache: ${key}`);
    } catch (error) {
      console.error('Cache invalidation error:', error.message);
    }
  }

  /**
   * Clear all cached queries
   */
  async clearAll() {
    try {
      this.memoryCache.clear();
      console.log('Memory cache cleared');
      
      // Note: Redis keys would need pattern-based deletion
      // This is a placeholder for production implementation
    } catch (error) {
      console.error('Cache clear error:', error.message);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? ((this.hitCount / total) * 100).toFixed(2) : 0;

    return {
      hits: this.hitCount,
      misses: this.missCount,
      total_requests: total,
      hit_rate_percent: parseFloat(hitRate),
      memory_cache_size: this.memoryCache.size,
      max_memory_cache_size: this.maxMemoryCacheSize
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.hitCount = 0;
    this.missCount = 0;
  }
}

module.exports = new QueryCacheService();

function stableStringify(value) {
  return JSON.stringify(sortValue(value));
}

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    const sorted = {};
    const keys = Object.keys(value).sort();
    for (const key of keys) {
      sorted[key] = sortValue(value[key]);
    }
    return sorted;
  }

  return value;
}
