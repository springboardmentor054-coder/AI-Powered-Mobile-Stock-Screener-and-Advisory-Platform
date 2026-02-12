import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const loadDotEnv = () => {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  contents.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith("#")) return;
    const index = line.indexOf("=");
    if (index === -1) return;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

const parseNumber = (value) => {
  if (!value) return null;
  const cleaned = String(value).replace(/[%$,]/g, "").trim();
  const numberMatch = cleaned.match(/-?\d+(\.\d+)?/);
  if (!numberMatch) return null;
  const parsed = Number(numberMatch[0]);
  return Number.isNaN(parsed) ? null : parsed;
};

const applyRuleFilter = (rows, ruleKey) => {
  return rows.filter((row) => {
    const pe = parseNumber(row.pe_ratio);
    const roce = parseNumber(row.roce);
    const marketCap = parseNumber(row.market_cap_cr);
    const profitGrowth = parseNumber(row.return_1y);
    const salesGrowth = parseNumber(row.return_3y);
    const dividendYield = parseNumber(row.dividend);

    if (ruleKey === "undervalued") {
      return (
        pe !== null &&
        roce !== null &&
        profitGrowth !== null &&
        pe < 20 &&
        roce > 15 &&
        profitGrowth > 10
      );
    }

    if (ruleKey === "growth") {
      return (
        salesGrowth !== null &&
        profitGrowth !== null &&
        salesGrowth > 20 &&
        profitGrowth > 20
      );
    }

    if (ruleKey === "dividend") {
      return (
        dividendYield !== null && pe !== null && dividendYield > 3 && pe < 25
      );
    }

    if (ruleKey === "largecap") {
      return (
        marketCap !== null && roce !== null && marketCap > 200000 && roce > 12
      );
    }

    return true;
  });
};

const summarizeRule = (ruleLabel, rows) => {
  console.log(`\n${ruleLabel}: ${rows.length} matches`);
  const sample = rows.slice(0, 5).map((row) => ({
    name: row.name,
    pe_ratio: row.pe_ratio,
    roce: row.roce,
    return_1y: row.return_1y,
    return_3y: row.return_3y,
    dividend: row.dividend,
    market_cap_cr: row.market_cap_cr,
  }));
  if (sample.length) {
    console.table(sample);
  }
};

const main = async () => {
  loadDotEnv();

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in environment.",
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("stocks_raw_upload")
    .select("*")
    .order("uploaded_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("Supabase query failed:", error.message);
    process.exitCode = 1;
    return;
  }

  const rows = data || [];
  console.log(`Fetched ${rows.length} rows.`);

  summarizeRule(
    "Undervalued (PE < 20, ROCE > 15, ProfitGrowth > 10)",
    applyRuleFilter(rows, "undervalued"),
  );
  summarizeRule(
    "Growth (SalesGrowth > 20, ProfitGrowth > 20)",
    applyRuleFilter(rows, "growth"),
  );
  summarizeRule(
    "Dividend (DividendYield > 3, PE < 25)",
    applyRuleFilter(rows, "dividend"),
  );
  summarizeRule(
    "Large Cap (MarketCap > 200000, ROCE > 12)",
    applyRuleFilter(rows, "largecap"),
  );
};

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});
