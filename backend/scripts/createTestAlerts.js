require('dotenv').config();
const pool = require('../config/database');

/**
 * Create test alerts for demonstration
 */
async function createTestAlerts() {
  try {
    console.log('🔔 Creating test alerts...\n');

    // Get first user ID
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      process.exit(1);
    }

    const userId = userResult.rows[0].id;
    console.log(`Creating test alerts for user ID: ${userId}\n`);

    // Sample test alerts
    const testAlerts = [
      {
        symbol: 'AAPL',
        alert_type: 'price_increase',
        title: 'Apple Inc. Price Increased',
        message: 'AAPL price increased by 7.5% from ₹150.00 to ₹161.25. Strong momentum detected!',
        old_value: 150.00,
        new_value: 161.25,
        change_percentage: 7.5,
        severity: 'warning'
      },
      {
        symbol: 'MSFT',
        alert_type: 'price_decrease',
        title: 'Microsoft Corp. Price Decreased',
        message: 'MSFT price decreased by 5.2% from ₹380.00 to ₹360.24. Consider reviewing your position.',
        old_value: 380.00,
        new_value: 360.24,
        change_percentage: -5.2,
        severity: 'warning'
      },
      {
        symbol: 'GOOGL',
        alert_type: 'volume_spike',
        title: 'Alphabet Inc. Volume Spike',
        message: 'GOOGL trading volume increased by 75%. This could indicate significant market interest.',
        old_value: 1000000,
        new_value: 1750000,
        change_percentage: 75,
        severity: 'info'
      },
      {
        symbol: 'TSLA',
        alert_type: 'pe_decrease',
        title: 'Tesla Inc. P/E Ratio Decreased',
        message: 'TSLA P/E ratio decreased by 18.5% from 45.2 to 36.8. Valuation improving.',
        old_value: 45.2,
        new_value: 36.8,
        change_percentage: -18.5,
        severity: 'info'
      },
      {
        symbol: 'NVDA',
        alert_type: 'price_increase',
        title: 'NVIDIA Corp. Price Increased',
        message: 'NVDA price increased by 12.3% from ₹500.00 to ₹561.50. Breaking new highs!',
        old_value: 500.00,
        new_value: 561.50,
        change_percentage: 12.3,
        severity: 'critical'
      },
    ];

    let createdCount = 0;

    for (const alert of testAlerts) {
      try {
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
        
        console.log(`✅ Created alert: ${alert.title}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating alert for ${alert.symbol}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully created ${createdCount} test alerts!`);
    console.log(`\nThese alerts will appear in the mobile app with a bell icon.`);
    console.log(`Alerts provide notifications when:
  - Stock prices change significantly (±5%)
  - P/E ratios change (±15%)
  - Trading volume spikes (50%+)
  - Dividend yields change (±20%)
    `);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestAlerts();
