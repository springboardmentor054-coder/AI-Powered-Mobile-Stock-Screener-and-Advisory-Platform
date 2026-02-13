const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const pool = require("../database");

const DEFAULT_CSV_PATH = path.resolve(__dirname, "..", "..", "Dhan - All Stocks List (1).csv");

async function ensureDhanData() {
  try {
    const result = await pool.query("SELECT COUNT(*) AS count FROM dhan_stocks");
    const count = parseInt(result.rows[0]?.count || "0", 10);

    if (count > 0) {
      return { loaded: false, reason: "already_loaded", count };
    }

    return await importDhanCsv({ replaceExisting: true });
  } catch (error) {
    console.error("Ensure Dhan data error:", error);
    throw error;
  }
}

async function importDhanCsv({ csvPath, replaceExisting = true } = {}) {
  const resolvedPath = csvPath ? path.resolve(csvPath) : DEFAULT_CSV_PATH;

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`CSV file not found at ${resolvedPath}`);
  }

  const csvContent = await fs.promises.readFile(resolvedPath, "utf8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;

  try {
    await client.query("BEGIN");

    if (replaceExisting) {
      await client.query("TRUNCATE dhan_stocks RESTART IDENTITY");
    }

    const insertSql = `
      INSERT INTO dhan_stocks (
        name,
        screener_url,
        ltp,
        change_pct,
        open,
        volume,
        market_cap_cr,
        pe_ratio,
        industry_pe,
        high_52w,
        low_52w,
        return_1m,
        return_3m,
        return_1y,
        return_3y,
        return_5y,
        pb_ratio,
        dividend,
        roe,
        roce,
        eps,
        dma_50,
        dma_200,
        rsi,
        margin_funding,
        margin_pledge,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26,
        $27
      )
      ON CONFLICT (name) DO UPDATE SET
        screener_url = EXCLUDED.screener_url,
        ltp = EXCLUDED.ltp,
        change_pct = EXCLUDED.change_pct,
        open = EXCLUDED.open,
        volume = EXCLUDED.volume,
        market_cap_cr = EXCLUDED.market_cap_cr,
        pe_ratio = EXCLUDED.pe_ratio,
        industry_pe = EXCLUDED.industry_pe,
        high_52w = EXCLUDED.high_52w,
        low_52w = EXCLUDED.low_52w,
        return_1m = EXCLUDED.return_1m,
        return_3m = EXCLUDED.return_3m,
        return_1y = EXCLUDED.return_1y,
        return_3y = EXCLUDED.return_3y,
        return_5y = EXCLUDED.return_5y,
        pb_ratio = EXCLUDED.pb_ratio,
        dividend = EXCLUDED.dividend,
        roe = EXCLUDED.roe,
        roce = EXCLUDED.roce,
        eps = EXCLUDED.eps,
        dma_50 = EXCLUDED.dma_50,
        dma_200 = EXCLUDED.dma_200,
        rsi = EXCLUDED.rsi,
        margin_funding = EXCLUDED.margin_funding,
        margin_pledge = EXCLUDED.margin_pledge,
        updated_at = EXCLUDED.updated_at
    `;

    const now = new Date();

    for (const record of records) {
      const name = (record.name || "").trim();
      if (!name) {
        skipped++;
        continue;
      }

      const values = [
        name,
        record.screener || null,
        parseNumber(record.ltp),
        parseNumber(record.change_pct),
        parseNumber(record.open),
        parseInteger(record.volume),
        parseNumber(record.market_cap_cr),
        parseNumber(record.pe_ratio),
        parseNumber(record.industry_pe),
        parseNumber(record.high_52w),
        parseNumber(record.low_52w),
        parseNumber(record.return_1m),
        parseNumber(record.return_3m),
        parseNumber(record.return_1y),
        parseNumber(record.return_3y),
        parseNumber(record.return_5y),
        parseNumber(record.pb_ratio),
        parseNumber(record.dividend),
        parseNumber(record.roe),
        parseNumber(record.roce),
        parseNumber(record.eps),
        parseNumber(record.dma_50),
        parseNumber(record.dma_200),
        parseNumber(record.rsi),
        parseNumber(record.margin_funding),
        parseNumber(record.margin_pledge),
        now
      ];

      await client.query(insertSql, values);
      inserted++;
    }

    await client.query("COMMIT");

    return {
      inserted,
      skipped,
      total: records.length,
      csv_path: resolvedPath,
      replaced_existing: replaceExisting
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Dhan import error:", error);
    throw error;
  } finally {
    client.release();
  }
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const cleaned = String(value).trim().replace(/,/g, "").replace(/%/g, "");
  if (cleaned === "" || cleaned === "-") {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value) {
  const parsed = parseNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

module.exports = {
  ensureDhanData,
  importDhanCsv
};
