const { Pool } = require("pg");
require("dotenv").config();

async function createUsersTable() {
  console.log("Creating users table...");
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD)
  });
  
  try {
    // Check if table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `;
    
    const tableExists = await pool.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log("✓ Users table already exists");
      await pool.end();
      return;
    }
    
    // Create users table
    const createTableQuery = `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP
      );
      
      CREATE INDEX idx_users_email ON users(email);
    `;
    
    await pool.query(createTableQuery);
    console.log("✅ Users table created successfully!");
    
    await pool.end();
    
  } catch (error) {
    console.error("❌ Error creating users table:", error.message);
    await pool.end();
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  createUsersTable()
    .then(() => {
      console.log("\n🎉 Database migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { createUsersTable };
