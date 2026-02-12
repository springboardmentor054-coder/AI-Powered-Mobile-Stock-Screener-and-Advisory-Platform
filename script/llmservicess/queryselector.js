const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { parseQueryToDSL } = require("./llmparser.js");

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
  if (value === undefined || value === null) return null;
  const cleaned = String(value).replace(/[%$,]/g, "").trim();
  const numberMatch = cleaned.match(/-?\d+(\.\d+)?/);
  if (!numberMatch) return null;
  const parsed = Number(numberMatch[0]);
  return Number.isNaN(parsed) ? null : parsed;
};

const compare = (left, operator, right) => {
  if (left === null || left === undefined) return false;
  if (operator === "=") return left === right;
  if (operator === "!=") return left !== right;
  if (operator === ">") return left > right;
  if (operator === ">=") return left >= right;
  if (operator === "<") return left < right;
  if (operator === "<=") return left <= right;
  return false;
};

const evaluateCondition = (row, condition) => {
  const rawValue = row[condition.field];
  const expected = condition.value;

  if (typeof expected === "number") {
    const left = parseNumber(rawValue);
    return compare(left, condition.operator, expected);
  }

  if (condition.field === "uploaded_at") {
    const left = rawValue ? new Date(rawValue).getTime() : null;
    const right = expected ? new Date(expected).getTime() : null;
    return compare(left, condition.operator, right);
  }

  const leftText = rawValue ? String(rawValue).toLowerCase() : "";
  const rightText = expected ? String(expected).toLowerCase() : "";

  if (condition.operator === "=") return leftText === rightText;
  if (condition.operator === "!=") return leftText !== rightText;
  if (condition.operator === ">") return leftText > rightText;
  if (condition.operator === ">=") return leftText >= rightText;
  if (condition.operator === "<") return leftText < rightText;
  if (condition.operator === "<=") return leftText <= rightText;
  return false;
};

const applyDslFilter = (rows, dsl) => {
  return rows.filter((row) => {
    if (dsl.name && row.name && row.name !== dsl.name) {
      return false;
    }

    if (dsl.screener && row.screener && row.screener !== dsl.screener) {
      return false;
    }

    return dsl.conditions.every((condition) =>
      evaluateCondition(row, condition),
    );
  });
};

const fetchStocks = async () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("stocks_raw_upload")
    .select("*")
    .order("uploaded_at", { ascending: false })
    .limit(300);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const runQuery = async (query) => {
  loadDotEnv();
  const parsed = await parseQueryToDSL(query);

  if (parsed.error) {
    return parsed;
  }

  const rows = await fetchStocks();
  const filtered = applyDslFilter(rows, parsed.dsl);

  return {
    ...parsed,
    count: filtered.length,
    rows: filtered,
  };
};

if (process.argv[1] && process.argv[1].includes("queryselector.js")) {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    console.error("Provide a query string to run.");
    process.exitCode = 1;
  } else {
    runQuery(query)
      .then((result) => {
        console.log("Parsed DSL:");
        console.log(JSON.stringify(result.dsl, null, 2));
        console.log(`Matches: ${result.count}`);
        console.table(result.rows.slice(0, 10));
      })
      .catch((error) => {
        console.error("Query failed:", error.message);
        process.exitCode = 1;
      });
  }
}

module.exports = { runQuery };
