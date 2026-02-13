/**
 * Initialize Database Schema
 * Reads schema.sql and executes it against the database
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./database");

async function initializeSchema() {
  try {
    const forceReset = process.env.FORCE_SCHEMA_RESET === "true";
    const schemaCheck = await pool.query(`
      SELECT
        to_regclass('public.users') IS NOT NULL AS has_users,
        to_regclass('public.companies') IS NOT NULL AS has_companies,
        to_regclass('public.dhan_stocks') IS NOT NULL AS has_dhan
    `);

    const hasExistingSchema = Boolean(
      schemaCheck.rows?.[0]?.has_users ||
        schemaCheck.rows?.[0]?.has_companies ||
        schemaCheck.rows?.[0]?.has_dhan
    );

    if (hasExistingSchema && !forceReset) {
      console.log(
        "[SCHEMA] Existing schema detected. Skipping initialization to avoid data loss."
      );
      console.log(
        "[SCHEMA] If you need a full reset, run with FORCE_SCHEMA_RESET=true."
      );
      process.exit(0);
    }

    if (forceReset) {
      console.warn(
        "[SCHEMA] FORCE_SCHEMA_RESET=true detected. Existing tables will be dropped."
      );
    }

    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("Initializing database schema...\n");

    // Split into individual statements and execute
    const statements = schemaSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log(`[SCHEMA] Executed: ${statement.substring(0, 60)}...`);
      } catch (error) {
        console.error(`[SCHEMA] Error: ${error.message}`);
        console.error(`   Statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }

    console.log("\n[SCHEMA] Initialization complete");
    process.exit(0);
  } catch (error) {
    console.error("Schema initialization error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeSchema();
