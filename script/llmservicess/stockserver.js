const http = require("http");
const { runQuery } = require("./queryselector.js");

const PORT = Number(process.env.STOCKS_PROXY_PORT || 8788);

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
};

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "POST" || req.url !== "/query") {
    return sendJson(res, 404, { error: "Not found" });
  }

  try {
    const body = await parseBody(req);
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const limit = Number(body.limit || 0);

    if (!query) {
      return sendJson(res, 400, { error: "Missing query" });
    }

    const result = await runQuery(query);

    if (result.error) {
      return sendJson(res, 400, {
        error: result.message,
        validationErrors: result.validationErrors || [],
      });
    }

    const rows = Array.isArray(result.rows) ? result.rows : [];
    const limitedRows = limit > 0 ? rows.slice(0, limit) : rows;

    return sendJson(res, 200, {
      dsl: result.dsl,
      count: result.count,
      rows: limitedRows,
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Stocks proxy listening on http://localhost:${PORT}`);
});
