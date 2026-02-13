/**
 * Multi-user isolation + load test.
 *
 * Usage:
 *   node tests/user-isolation-load-test.js
 *
 * Env options:
 *   TEST_BASE_URL=http://localhost:5000
 *   TEST_USER_COUNT=100
 *   TEST_CONCURRENCY=20
 */

require("dotenv").config();
const axios = require("axios");
const pool = require("../database");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";
const USER_COUNT = parseInt(process.env.TEST_USER_COUNT || "100", 10);
const CONCURRENCY = parseInt(process.env.TEST_CONCURRENCY || "20", 10);
const REQUEST_TIMEOUT_MS = 30000;

const SYMBOLS = ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "HDFCBANK", "ICICIBANK", "SBIN"];

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function acceptedStatus(status, accepted) {
  return accepted.includes(status);
}

async function runWithConcurrency(items, limit, fn) {
  const results = [];
  let index = 0;

  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) {
        return;
      }

      results[current] = await fn(items[current], current);
    }
  });

  await Promise.all(workers);
  return results;
}

async function createTestUsers(runId) {
  const users = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const email = `loadtest_${runId}_${i}@example.local`;
    const name = `Load Test User ${i}`;
    const result = await pool.query(
      `INSERT INTO users (email, name)
       VALUES ($1, $2)
       RETURNING id, email, name`,
      [email, name]
    );
    users.push(result.rows[0]);
  }
  return users;
}

async function cleanupUsers(userIds) {
  if (!userIds.length) return;
  await pool.query("DELETE FROM users WHERE id = ANY($1::int[])", [userIds]);
}

function client() {
  return axios.create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
    validateStatus: () => true,
  });
}

async function checkHealth(http) {
  const endpoints = ["/health", "/api/health"];
  for (const endpoint of endpoints) {
    const res = await http.get(endpoint);
    if (res.status === 200) {
      return endpoint;
    }
  }
  return null;
}

async function seedDataForUser(http, user, idx) {
  const symbol = SYMBOLS[idx % SYMBOLS.length];

  const watchlistRes = await http.post("/api/watchlist/add", {
    userId: user.id,
    symbol,
  });

  const portfolioRes = await http.post("/api/portfolio/add", {
    userId: user.id,
    symbol,
    quantity: 1 + (idx % 5),
    avgPrice: 100 + idx,
  });

  const screenerRes = await http.post("/api/screeners", {
    userId: user.id,
    name: `Load Test Screener ${user.id}`,
    description: `User scoped screener ${user.id}`,
    dslQuery: {
      filters: [{ field: "pe_ratio", operator: "<", value: 25 }],
    },
    notificationEnabled: false,
  });

  const alertRes = await http.post("/api/alerts", {
    userId: user.id,
    symbol,
    alertType: "price_above",
    targetPrice: 1000 + idx,
    severity: "low",
  });

  return {
    userId: user.id,
    symbol,
    statuses: {
      watchlist: watchlistRes.status,
      portfolio: portfolioRes.status,
      screener: screenerRes.status,
      alert: alertRes.status,
    },
  };
}

function findSeedIssues(seedRow) {
  const issues = [];

  if (!acceptedStatus(seedRow.statuses.watchlist, [201])) {
    issues.push(`watchlist ${seedRow.statuses.watchlist}`);
  }
  if (!acceptedStatus(seedRow.statuses.portfolio, [201])) {
    issues.push(`portfolio ${seedRow.statuses.portfolio}`);
  }
  if (!acceptedStatus(seedRow.statuses.screener, [201])) {
    issues.push(`screener ${seedRow.statuses.screener}`);
  }
  if (!acceptedStatus(seedRow.statuses.alert, [200, 201])) {
    issues.push(`alert ${seedRow.statuses.alert}`);
  }

  return issues;
}

async function verifyIsolationForUser(http, user) {
  const issues = [];

  const watchlistRes = await http.get(`/api/watchlist/${user.id}`);
  if (watchlistRes.status !== 200) {
    issues.push(`watchlist status ${watchlistRes.status}`);
  } else {
    const payloadUser = watchlistRes.data?.data?.user_id;
    const rows = watchlistRes.data?.data?.watchlist || [];
    if (payloadUser !== user.id) {
      issues.push(`watchlist payload user_id mismatch (${payloadUser} != ${user.id})`);
    }
    if (rows.some((row) => parseInt(row.user_id, 10) !== user.id)) {
      issues.push("watchlist row user_id leakage");
    }
    if (rows.length === 0) {
      issues.push("watchlist empty after seed");
    }
  }

  const portfolioRes = await http.get(`/api/portfolio/${user.id}`);
  if (portfolioRes.status !== 200) {
    issues.push(`portfolio status ${portfolioRes.status}`);
  } else {
    const payloadUser = portfolioRes.data?.data?.user_id;
    const holdings = portfolioRes.data?.data?.holdings || [];
    if (payloadUser !== user.id) {
      issues.push(`portfolio payload user_id mismatch (${payloadUser} != ${user.id})`);
    }
    if (holdings.some((row) => parseInt(row.user_id, 10) !== user.id)) {
      issues.push("portfolio row user_id leakage");
    }
    if (holdings.length === 0) {
      issues.push("portfolio empty after seed");
    }
  }

  const alertsRes = await http.get(`/api/alerts/${user.id}`);
  if (alertsRes.status !== 200) {
    issues.push(`alerts status ${alertsRes.status}`);
  } else {
    const payloadUser = alertsRes.data?.data?.user_id;
    const alerts = alertsRes.data?.data?.alerts || [];
    if (payloadUser !== user.id) {
      issues.push(`alerts payload user_id mismatch (${payloadUser} != ${user.id})`);
    }
    if (alerts.some((row) => parseInt(row.user_id, 10) !== user.id)) {
      issues.push("alerts row user_id leakage");
    }
    if (alerts.length === 0) {
      issues.push("alerts empty after seed");
    }
  }

  const screenerRes = await http.get(`/api/screeners/${user.id}`);
  if (screenerRes.status !== 200) {
    issues.push(`screeners status ${screenerRes.status}`);
  } else {
    const payloadUser = screenerRes.data?.data?.user_id;
    const screeners = screenerRes.data?.data?.screeners || [];
    if (payloadUser !== user.id) {
      issues.push(`screeners payload user_id mismatch (${payloadUser} != ${user.id})`);
    }
    if (screeners.some((row) => parseInt(row.user_id, 10) !== user.id)) {
      issues.push("screeners row user_id leakage");
    }
    if (screeners.length === 0) {
      issues.push("screeners empty after seed");
    }
  }

  return issues;
}

async function verifyDbIsolation(userIds) {
  const checks = [
    { table: "watchlist", minRowsPerUser: 1 },
    { table: "portfolio_items", minRowsPerUser: 1 },
    { table: "saved_screeners", minRowsPerUser: 1 },
    { table: "alerts", minRowsPerUser: 1 },
  ];

  const issues = [];
  for (const check of checks) {
    const result = await pool.query(
      `SELECT user_id, COUNT(*)::int AS row_count
       FROM ${check.table}
       WHERE user_id = ANY($1::int[])
       GROUP BY user_id`,
      [userIds]
    );

    const byUser = new Map(result.rows.map((row) => [parseInt(row.user_id, 10), row.row_count]));

    for (const userId of userIds) {
      const rowCount = byUser.get(userId) || 0;
      if (rowCount < check.minRowsPerUser) {
        issues.push(`${check.table}: user ${userId} has ${rowCount} rows`);
      }
    }
  }

  return issues;
}

async function verifyAlertDeleteScope(http, users) {
  const sourceUser = users[0];
  const wrongUser = users[1];

  const listSource = await http.get(`/api/alerts/${sourceUser.id}`);
  const alertId = listSource.data?.data?.alerts?.[0]?.id;

  if (!alertId) {
    return ["no alert found for delete scope test"];
  }

  const noUserRes = await http.delete(`/api/alerts/${alertId}`);
  const wrongUserRes = await http.delete(`/api/alerts/${alertId}?userId=${wrongUser.id}`);
  const rightUserRes = await http.delete(`/api/alerts/${alertId}?userId=${sourceUser.id}`);

  const issues = [];
  if (noUserRes.status !== 400) {
    issues.push(`delete without userId should be 400, got ${noUserRes.status}`);
  }
  if (wrongUserRes.status !== 404) {
    issues.push(`delete with wrong user should be 404, got ${wrongUserRes.status}`);
  }
  if (rightUserRes.status !== 200) {
    issues.push(`delete with owner should be 200, got ${rightUserRes.status}`);
  }

  return issues;
}

async function runReadLoad(http, users) {
  const durations = [];
  let failures = 0;
  let totalRequests = 0;

  await runWithConcurrency(users, CONCURRENCY, async (user) => {
    const started = Date.now();
    const [watchlistRes, portfolioRes, alertStatsRes, screenerRes] = await Promise.all([
      http.get(`/api/watchlist/${user.id}`),
      http.get(`/api/portfolio/${user.id}`),
      http.get(`/api/alerts/${user.id}/stats`),
      http.get(`/api/screeners/${user.id}`),
    ]);
    const elapsed = Date.now() - started;
    durations.push(elapsed);
    totalRequests += 4;

    if (
      watchlistRes.status !== 200 ||
      portfolioRes.status !== 200 ||
      alertStatsRes.status !== 200 ||
      screenerRes.status !== 200
    ) {
      failures++;
    }
  });

  const totalMs = durations.reduce((acc, value) => acc + value, 0);
  const requestsPerSecond = totalMs > 0 ? Number(((totalRequests / totalMs) * 1000).toFixed(2)) : 0;

  return {
    failures,
    total_requests: totalRequests,
    requests_per_second: requestsPerSecond,
    p50_ms: percentile(durations, 50),
    p95_ms: percentile(durations, 95),
    max_ms: durations.length ? Math.max(...durations) : 0,
  };
}

async function main() {
  const startedAt = Date.now();
  const runId = Date.now();
  const http = client();
  const summary = {
    users: USER_COUNT,
    concurrency: CONCURRENCY,
    base_url: BASE_URL,
  };

  const healthEndpoint = await checkHealth(http);
  if (!healthEndpoint) {
    throw new Error("Backend health check failed on /health and /api/health");
  }
  summary.health_endpoint = healthEndpoint;

  let users = [];
  try {
    console.log(`[TEST] Creating ${USER_COUNT} test users...`);
    users = await createTestUsers(runId);
    summary.created_users = users.length;

    console.log("[TEST] Seeding watchlist/portfolio/screeners/alerts...");
    const seedResults = await runWithConcurrency(
      users,
      CONCURRENCY,
      async (user, idx) => seedDataForUser(http, user, idx)
    );
    const seedFailures = seedResults
      .map((row) => ({ userId: row.userId, issues: findSeedIssues(row), statuses: row.statuses }))
      .filter((row) => row.issues.length > 0);
    summary.seed_failure_count = seedFailures.length;
    summary.seed_failure_examples = seedFailures.slice(0, 10);

    console.log("[TEST] Verifying API-level user isolation...");
    const isolation = await runWithConcurrency(users, CONCURRENCY, async (user) => {
      const issues = await verifyIsolationForUser(http, user);
      return { userId: user.id, issues };
    });
    const isolationFailures = isolation.filter((row) => row.issues.length > 0);
    summary.api_isolation_failure_count = isolationFailures.length;
    summary.api_isolation_failure_examples = isolationFailures.slice(0, 10);

    console.log("[TEST] Verifying DB-level per-user row isolation...");
    const dbIsolationIssues = await verifyDbIsolation(users.map((user) => user.id));
    summary.db_isolation_issue_count = dbIsolationIssues.length;
    summary.db_isolation_issue_examples = dbIsolationIssues.slice(0, 20);

    console.log("[TEST] Verifying alert delete ownership guard...");
    const deleteScopeIssues = await verifyAlertDeleteScope(http, users);
    summary.alert_delete_scope_issues = deleteScopeIssues;

    console.log("[TEST] Running concurrent read load...");
    const load = await runReadLoad(http, users);
    summary.read_load = load;

    summary.duration_ms = Date.now() - startedAt;

    const pass =
      summary.seed_failure_count === 0 &&
      summary.api_isolation_failure_count === 0 &&
      summary.db_isolation_issue_count === 0 &&
      deleteScopeIssues.length === 0 &&
      load.failures === 0;

    console.log("\n=== MULTI-USER TEST SUMMARY ===");
    console.log(JSON.stringify(summary, null, 2));

    if (!pass) {
      process.exitCode = 1;
    }
  } finally {
    console.log("[TEST] Cleaning up test users...");
    await cleanupUsers(users.map((user) => user.id));
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error("[TEST] Fatal error:", error.message);
  await pool.end();
  process.exit(1);
});
