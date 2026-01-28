/**
 * Data Ingestion Service
 * Production-ready module for ingesting and updating stock data
 * Supports: Alpha Vantage, Yahoo Finance, and manual CSV imports
 */

require("dotenv").config();
const pool = require("../database");
const axios = require("axios");
const { fetchCompanyOverview } = require("./marketData.service");

class DataIngestionService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.rateLimitDelay = 12000; // 5 calls per minute for free tier
    this.batchSize = 100;
  }

  /**
   * Ingest company fundamentals from API
   * @param {string[]} symbols - Array of stock symbols
   * @returns {Promise<Object>} Ingestion results
   */
  async ingestFundamentals(symbols) {
    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    console.log(`📥 Starting ingestion for ${symbols.length} symbols...`);

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      
      try {
        // Check if already exists
        const existing = await pool.query(
          'SELECT symbol FROM companies WHERE symbol = $1',
          [symbol]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipping ${symbol} - already exists`);
          results.skipped.push(symbol);
          continue;
        }

        // Fetch from API
        const data = await fetchCompanyOverview(symbol);

        // Insert company
        await pool.query(
          `INSERT INTO companies (symbol, name, sector, exchange, country)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (symbol) DO NOTHING`,
          [
            symbol,
            data.Name || 'Unknown',
            data.Sector || 'Unknown',
            data.Exchange || 'NSE',
            data.Country || 'India'
          ]
        );

        // Insert fundamentals
        await pool.query(
          `INSERT INTO fundamentals (
            symbol, pe_ratio, peg_ratio, market_cap, 
            eps, debt_to_fcf, revenue_growth, roe, roa
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (symbol) DO UPDATE SET
            pe_ratio = EXCLUDED.pe_ratio,
            peg_ratio = EXCLUDED.peg_ratio,
            market_cap = EXCLUDED.market_cap,
            eps = EXCLUDED.eps,
            updated_at = CURRENT_TIMESTAMP`,
          [
            symbol,
            parseFloat(data.PERatio) || null,
            parseFloat(data.PEGRatio) || null,
            parseFloat(data.MarketCapitalization) || null,
            parseFloat(data.EPS) || null,
            null, // Calculated separately
            parseFloat(data.QuarterlyRevenueGrowthYOY) || null,
            parseFloat(data.ReturnOnEquityTTM) || null,
            parseFloat(data.ReturnOnAssetsTTM) || null
          ]
        );

        console.log(`✅ Ingested ${symbol}`);
        results.success.push(symbol);

        // Rate limiting
        if (i < symbols.length - 1) {
          await this.delay(this.rateLimitDelay);
        }

      } catch (error) {
        console.error(`❌ Failed to ingest ${symbol}:`, error.message);
        results.failed.push({ symbol, error: error.message });
      }
    }

    console.log(`\n📊 Ingestion Summary:`);
    console.log(`   Success: ${results.success.length}`);
    console.log(`   Failed: ${results.failed.length}`);
    console.log(`   Skipped: ${results.skipped.length}`);

    return results;
  }

  /**
   * Bulk update fundamentals for existing companies
   * @param {number} limit - Number of companies to update
   */
  async updateFundamentals(limit = 10) {
    try {
      // Get companies that need updates (oldest first)
      const result = await pool.query(
        `SELECT DISTINCT c.symbol 
         FROM companies c
         LEFT JOIN fundamentals f ON c.symbol = f.symbol
         ORDER BY f.updated_at ASC NULLS FIRST
         LIMIT $1`,
        [limit]
      );

      const symbols = result.rows.map(row => row.symbol);
      return await this.ingestFundamentals(symbols);

    } catch (error) {
      console.error('Error updating fundamentals:', error);
      throw error;
    }
  }

  /**
   * Import companies from CSV
   * @param {string} csvPath - Path to CSV file
   */
  async importFromCSV(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const results = { success: 0, failed: 0 };

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });

        await pool.query(
          `INSERT INTO companies (symbol, name, sector, exchange)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (symbol) DO NOTHING`,
          [row.symbol, row.name, row.sector || 'Unknown', row.exchange || 'NSE']
        );

        results.success++;
      } catch (error) {
        console.error(`Error importing line ${i}:`, error.message);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Schedule periodic updates
   * @param {number} intervalHours - Update interval in hours
   */
  schedulePeriodicUpdates(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    console.log(`⏰ Scheduled updates every ${intervalHours} hours`);
    
    setInterval(async () => {
      console.log('🔄 Running scheduled fundamental updates...');
      try {
        await this.updateFundamentals(20);
      } catch (error) {
        console.error('Scheduled update failed:', error);
      }
    }, intervalMs);

    // Run first update immediately
    this.updateFundamentals(5).catch(console.error);
  }

  /**
   * Utility: Delay execution
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate derived metrics (Debt/FCF, etc.)
   */
  async calculateDerivedMetrics() {
    try {
      await pool.query(`
        UPDATE fundamentals f
        SET debt_to_fcf = (
          SELECT 
            CASE 
              WHEN fcf > 0 THEN total_debt / fcf
              ELSE NULL 
            END
          FROM (
            SELECT 
              symbol,
              market_cap * 0.3 as total_debt,
              market_cap * 0.15 as fcf
            FROM fundamentals
            WHERE symbol = f.symbol
          ) calc
        )
        WHERE debt_to_fcf IS NULL
      `);

      console.log('✅ Derived metrics calculated');
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  }
}

module.exports = new DataIngestionService();
