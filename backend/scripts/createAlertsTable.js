require('dotenv').config();
const pool = require('../config/database');

async function createAlertsTable() {
  try {
    console.log('Creating alerts table for wishlist notifications...\n');

    // Drop existing table if recreating
    await pool.query('DROP TABLE IF EXISTS wishlist_alerts CASCADE');

    // Create alerts table
    const createTableQuery = `
      CREATE TABLE wishlist_alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(10) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        old_value NUMERIC,
        new_value NUMERIC,
        change_percentage NUMERIC,
        severity VARCHAR(20) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      );
    `;

    await pool.query(createTableQuery);
    console.log('✓ wishlist_alerts table created successfully');

    // Create indexes for efficient queries
    await pool.query(`
      CREATE INDEX idx_alerts_user_id ON wishlist_alerts(user_id);
      CREATE INDEX idx_alerts_symbol ON wishlist_alerts(symbol);
      CREATE INDEX idx_alerts_is_read ON wishlist_alerts(is_read);
      CREATE INDEX idx_alerts_created_at ON wishlist_alerts(created_at DESC);
      CREATE INDEX idx_alerts_user_unread ON wishlist_alerts(user_id, is_read) WHERE is_read = FALSE;
    `);
    console.log('✓ Indexes created successfully');

    // Add comment
    await pool.query(`
      COMMENT ON TABLE wishlist_alerts IS 'Stores alerts for wishlist stock changes';
      COMMENT ON COLUMN wishlist_alerts.alert_type IS 'Type of alert: price_change, pe_increase, pe_decrease, volume_spike, etc.';
      COMMENT ON COLUMN wishlist_alerts.severity IS 'Alert severity: info, warning, critical';
    `);

    console.log('\n✅ Alerts table setup complete!');
    console.log('\nAlert Types:');
    console.log('  - price_increase: Price went up significantly');
    console.log('  - price_decrease: Price went down significantly');
    console.log('  - pe_increase: PE ratio increased');
    console.log('  - pe_decrease: PE ratio decreased');
    console.log('  - volume_spike: Trading volume spike');
    console.log('  - target_reached: Price target reached');

    await pool.end();
  } catch (error) {
    console.error('❌ Error creating alerts table:', error.message);
    process.exit(1);
  }
}

createAlertsTable();
