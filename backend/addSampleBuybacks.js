require("dotenv").config();
const db = require("./config/database");

/**
 * Add sample stock buyback data for demonstration purposes
 * Real buyback data would come from SEC filings or financial news APIs
 */
async function addSampleBuybacks() {
  console.log("📝 Adding sample stock buyback data...\n");
  
  // Sample buyback announcements (fictional data for demonstration)
  const sampleBuybacks = [
    {
      symbol: 'AAPL',
      actionType: 'stock_buyback',
      announcementDate: new Date('2025-10-15'),
      details: 'Board approves $90 billion stock buyback program',
      amount: 90000000000,
      currency: 'USD',
      status: 'active',
      isActive: true,
      verified: true,
      source: 'Sample Data',
      notes: 'Multi-year buyback program aimed at returning value to shareholders'
    },
    {
      symbol: 'MSFT',
      actionType: 'stock_buyback',
      announcementDate: new Date('2025-09-20'),
      details: 'Announces $60 billion share repurchase authorization',
      amount: 60000000000,
      currency: 'USD',
      status: 'active',
      isActive: true,
      verified: true,
      source: 'Sample Data',
      notes: 'Replaces previous buyback program'
    },
    {
      symbol: 'GOOGL',
      actionType: 'stock_buyback',
      announcementDate: new Date('2025-11-05'),
      details: '$70 billion stock buyback program authorized',
      amount: 70000000000,
      currency: 'USD',
      status: 'active',
      isActive: true,
      verified: true,
      source: 'Sample Data'
    },
    {
      symbol: 'JPM',
      actionType: 'stock_buyback',
      announcementDate: new Date('2025-08-10'),
      details: 'Board approves $30 billion share repurchase program',
      amount: 30000000000,
      currency: 'USD',
      status: 'active',
      isActive: true,
      verified: true,
      source: 'Sample Data'
    },
    {
      symbol: 'BAC',
      actionType: 'stock_buyback',
      announcementDate: new Date('2025-07-25'),
      details: '$25 billion stock buyback authorization',
      amount: 25000000000,
      currency: 'USD',
      status: 'active',
      isActive: true,
      verified: true,
      source: 'Sample Data'
    }
  ];

  let added = 0;
  let skipped = 0;

  for (const buyback of sampleBuybacks) {
    try {
      const query = `
        INSERT INTO corporate_actions (
          symbol, action_type, announcement_date, details, amount,
          currency, status, is_active, verified, source, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;

      await db.query(query, [
        buyback.symbol,
        buyback.actionType,
        buyback.announcementDate,
        buyback.details,
        buyback.amount,
        buyback.currency,
        buyback.status,
        buyback.isActive,
        buyback.verified,
        buyback.source,
        buyback.notes || null
      ]);

      console.log(`✅ Added buyback for ${buyback.symbol}: ${buyback.details}`);
      added++;

    } catch (error) {
      if (error.code === '23505') {
        console.log(`⚠️  Buyback for ${buyback.symbol} already exists, skipping...`);
        skipped++;
      } else {
        console.error(`❌ Error adding buyback for ${buyback.symbol}:`, error.message);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Added: ${added}`);
  console.log(`⚠️  Skipped (duplicates): ${skipped}`);
  console.log(`📊 Total: ${sampleBuybacks.length}`);
  console.log("\n💡 Note: This is sample data for demonstration purposes.");
  console.log("   Real buyback data requires SEC filings or financial news APIs.");
  
  process.exit(0);
}

// Run the script
addSampleBuybacks();
