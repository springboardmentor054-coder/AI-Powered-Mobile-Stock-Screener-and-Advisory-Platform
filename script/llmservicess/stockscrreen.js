const path = require("path");
const { runQuery } = require("./queryselector.js");

const getArgValue = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
};

const main = async () => {
  const query = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith("--"))
    .join(" ")
    .trim();
  const limitArg = getArgValue("--limit");
  const limit = limitArg ? Number(limitArg) : 20;

  if (!query) {
    console.error(
      'Provide a query string. Example: node script/llmservicess/stockscrreen.js "pe < 15 and roce > 20"',
    );
    process.exitCode = 1;
    return;
  }

  const result = await runQuery(query);

  if (result.error) {
    console.error("Query failed:", result.message);
    process.exitCode = 1;
    return;
  }

  console.log("Parsed DSL:");
  console.log(JSON.stringify(result.dsl, null, 2));
  console.log(`Matches: ${result.count}`);

  const rows = result.rows || [];
  if (!rows.length) {
    console.log("No matching rows.");
    return;
  }

  const preview = rows.slice(0, Number.isNaN(limit) ? 20 : limit);
  console.table(preview);
};

main().catch((error) => {
  console.error("Unexpected error:", error.message);
  process.exitCode = 1;
});
