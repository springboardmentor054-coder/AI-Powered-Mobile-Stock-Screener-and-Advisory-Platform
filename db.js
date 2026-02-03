import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Create and connect DB
const db = await open({
  filename: "./database/stocks.db",
  driver: sqlite3.Database
});

// Create table + seed data
await db.exec(`
  CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    symbol TEXT,
    sector TEXT,
    pe_ratio REAL,
    market_cap TEXT
  );
`);

export default db;
