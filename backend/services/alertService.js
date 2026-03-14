require('dotenv').config();
const pool = require('../config/database');

/**
 * Service to generate alerts based on wishlist stock changes
 */

/**
 * Generate alerts by comparing current data with historical snapshots
 */
async function generateAlertsForWishlistChanges() {
  try {
    console.log('🔔 Generating alerts for wishlist changes...\n');

    // Get all users with wishlist items
    const usersResult = await pool.query(`
      SELECT DISTINCT user_id 
      FROM wishlist 
      WHERE user_id IS NOT NULL
    `);

    if (usersResult.rows.length === 0) {
      console.log('No users with wishlist items found.');
      return { success: true, alertsGenerated: 0 };
    }

    let totalAlerts = 0;

    for (const user of usersResult.rows) {
      const userId = user.user_id;
      const userAlerts = await generateAlertsForUser(userId);
      totalAlerts += userAlerts;
    }

    console.log(`✅ Generated ${totalAlerts} alerts for ${usersResult.rows.length} users`);
    return { success: true, alertsGenerated: totalAlerts };

  } catch (error) {
    console.error('❌ Error generating alerts:', error.message);
    throw error;
  }
}

/**
 * Generate alerts for a specific user by comparing current vs previous snapshots
 */
async function generateAlertsForUser(userId) {
  try {
    // Get user's wishlist with current data
    const wishlistResult = await pool.query(`
      SELECT 
        w.symbol,
        s.company_name,
        s.sector,
        COALESCE(ead.current_price, lp.close) as current_price,
        f.pe_ratio,
        f.pb_ratio,
        f.eps,
        f.dividend_yield,
        s.average_volume
      FROM wishlist w
      INNER JOIN stocks s ON w.symbol = s.symbol
      LEFT JOIN fundamentals f ON s.symbol = f.symbol
      LEFT JOIN earnings_analyst_data ead ON s.symbol = ead.symbol
      LEFT JOIN LATERAL (
        SELECT close
        FROM price_history
        WHERE symbol = s.symbol
        ORDER BY date DESC
        LIMIT 1
      ) lp ON true
      WHERE w.user_id = $1
    `, [userId]);

    if (wishlistResult.rows.length === 0) {
      return 0;
    }

    let alertsCreated = 0;

    for (const stock of wishlistResult.rows) {
      // Get the most recent snapshot for this stock
      const snapshotResult = await pool.query(`
        SELECT 
          current_price, pe_ratio, pb_ratio, eps, 
          dividend_yield, volume, snapshot_date
        FROM wishlist_history
        WHERE user_id = $1 AND symbol = $2
        ORDER BY snapshot_date DESC
        LIMIT 1
      `, [userId, stock.symbol]);

      if (snapshotResult.rows.length === 0) {
        // No previous snapshot, skip
        continue;
      }

      const previousData = snapshotResult.rows[0];
      const alerts = detectChanges(stock, previousData, userId);

      // Insert alerts into database
      for (const alert of alerts) {
        await pool.query(`
          INSERT INTO wishlist_alerts 
          (user_id, symbol, alert_type, title, message, old_value, new_value, change_percentage, severity)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          userId,
          alert.symbol,
          alert.alert_type,
          alert.title,
          alert.message,
          alert.old_value,
          alert.new_value,
          alert.change_percentage,
          alert.severity
        ]);
        alertsCreated++;
      }
    }

    return alertsCreated;

  } catch (error) {
    console.error(`Error generating alerts for user ${userId}:`, error.message);
    return 0;
  }
}

/**
 * Detect changes between current and previous data
 */
function detectChanges(currentStock, previousSnapshot, userId) {
  const alerts = [];
  const symbol = currentStock.symbol;
  const companyName = currentStock.company_name;

  // Price change detection (2% threshold instead of 5%)
  if (currentStock.current_price && previousSnapshot.current_price) {
    const priceChange = ((currentStock.current_price - previousSnapshot.current_price) / previousSnapshot.current_price) * 100;
    
    if (Math.abs(priceChange) >= 2) {
      const direction = priceChange > 0 ? 'increased' : 'decreased';
      const severity = Math.abs(priceChange) >= 10 ? 'critical' : 'warning';
      
      alerts.push({
        symbol,
        alert_type: priceChange > 0 ? 'price_increase' : 'price_decrease',
        title: `${companyName} Price ${direction}`,
        message: `${symbol} price ${direction} by ${Math.abs(priceChange).toFixed(2)}% from ₹${previousSnapshot.current_price.toFixed(2)} to ₹${currentStock.current_price.toFixed(2)}`,
        old_value: previousSnapshot.current_price,
        new_value: currentStock.current_price,
        change_percentage: priceChange,
        severity
      });
    }
  }

  // PE Ratio change detection (5% threshold instead of 15%)
  if (currentStock.pe_ratio && previousSnapshot.pe_ratio) {
    const peChange = ((currentStock.pe_ratio - previousSnapshot.pe_ratio) / previousSnapshot.pe_ratio) * 100;
    
    if (Math.abs(peChange) >= 5) {
      const direction = peChange > 0 ? 'increased' : 'decreased';
      
      alerts.push({
        symbol,
        alert_type: peChange > 0 ? 'pe_increase' : 'pe_decrease',
        title: `${companyName} P/E Ratio ${direction}`,
        message: `${symbol} P/E ratio ${direction} by ${Math.abs(peChange).toFixed(2)}% from ${previousSnapshot.pe_ratio.toFixed(2)} to ${currentStock.pe_ratio.toFixed(2)}`,
        old_value: previousSnapshot.pe_ratio,
        new_value: currentStock.pe_ratio,
        change_percentage: peChange,
        severity: 'info'
      });
    }
  }

  // Volume spike detection (25% increase instead of 50%)
  if (currentStock.average_volume && previousSnapshot.volume) {
    const volumeChange = ((currentStock.average_volume - previousSnapshot.volume) / previousSnapshot.volume) * 100;
    
    if (volumeChange >= 25) {
      alerts.push({
        symbol,
        alert_type: 'volume_spike',
        title: `${companyName} Volume Spike`,
        message: `${symbol} trading volume increased by ${volumeChange.toFixed(2)}%. This could indicate significant market interest.`,
        old_value: previousSnapshot.volume,
        new_value: currentStock.average_volume,
        change_percentage: volumeChange,
        severity: 'warning'
      });
    }
  }

  // Dividend yield significant change (10% threshold instead of 20%)
  if (currentStock.dividend_yield && previousSnapshot.dividend_yield) {
    const divChange = ((currentStock.dividend_yield - previousSnapshot.dividend_yield) / previousSnapshot.dividend_yield) * 100;
    
    if (Math.abs(divChange) >= 10) {
      const direction = divChange > 0 ? 'increased' : 'decreased';
      
      alerts.push({
        symbol,
        alert_type: divChange > 0 ? 'dividend_increase' : 'dividend_decrease',
        title: `${companyName} Dividend ${direction}`,
        message: `${symbol} dividend yield ${direction} by ${Math.abs(divChange).toFixed(2)}% from ${(previousSnapshot.dividend_yield * 100).toFixed(2)}% to ${(currentStock.dividend_yield * 100).toFixed(2)}%`,
        old_value: previousSnapshot.dividend_yield,
        new_value: currentStock.dividend_yield,
        change_percentage: divChange,
        severity: 'info'
      });
    }
  }

  return alerts;
}

/**
 * Create a test alert for a user
 */
async function createTestAlert(userId, symbol = 'AAPL') {
  try {
    await pool.query(`
      INSERT INTO wishlist_alerts 
      (user_id, symbol, alert_type, title, message, old_value, new_value, change_percentage, severity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      userId,
      symbol,
      'price_increase',
      'Test Alert: Price Increased',
      `${symbol} price increased by 7.5% from ₹150.00 to ₹161.25`,
      150.00,
      161.25,
      7.5,
      'warning'
    ]);
    console.log(`✅ Test alert created for user ${userId}`);
  } catch (error) {
    console.error('Error creating test alert:', error.message);
  }
}

module.exports = {
  generateAlertsForWishlistChanges,
  generateAlertsForUser,
  createTestAlert
};

// Run if executed directly
if (require.main === module) {
  generateAlertsForWishlistChanges()
    .then(() => {
      console.log('\n✅ Alert generation complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}
