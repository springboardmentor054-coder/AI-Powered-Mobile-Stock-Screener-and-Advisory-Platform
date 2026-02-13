const pool = require("../database");
const DataFreshnessService = require("../services/dataFreshness.service");
const responseFormatter = require("../utils/responseFormatter");
const logger = require("../utils/logger");

const ALLOWED_SORT_FIELDS = new Set([
	"market_cap_cr",
	"pe_ratio",
	"ltp",
	"change_pct",
	"volume",
	"return_1m",
	"return_3m",
	"return_1y",
	"return_3y",
	"return_5y",
	"rsi"
]);

async function getStocks(req, res) {
	try {
		const search = (req.query.search || "").trim();
		const minMarketCap = parseNumeric(req.query.min_market_cap_cr);
		const maxMarketCap = parseNumeric(req.query.max_market_cap_cr);
		const minPe = parseNumeric(req.query.min_pe_ratio);
		const maxPe = parseNumeric(req.query.max_pe_ratio);
		const limit = clamp(parseInt(req.query.limit, 10) || 100, 1, 500);
		const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
		const sort = ALLOWED_SORT_FIELDS.has(req.query.sort) ? req.query.sort : "market_cap_cr";
		const order = (req.query.order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

		const where = [];
		const params = [];

		if (search) {
			params.push(`%${search}%`);
			where.push(`name ILIKE $${params.length}`);
		}

		if (minMarketCap !== null) {
			params.push(minMarketCap);
			where.push(`market_cap_cr >= $${params.length}`);
		}

		if (maxMarketCap !== null) {
			params.push(maxMarketCap);
			where.push(`market_cap_cr <= $${params.length}`);
		}

		if (minPe !== null) {
			params.push(minPe);
			where.push(`pe_ratio >= $${params.length}`);
		}

		if (maxPe !== null) {
			params.push(maxPe);
			where.push(`pe_ratio <= $${params.length}`);
		}

		let sql = `SELECT * FROM dhan_stocks`;
		if (where.length > 0) {
			sql += ` WHERE ${where.join(" AND ")}`;
		}

		params.push(limit);
		params.push(offset);
		sql += ` ORDER BY ${sort} ${order} NULLS LAST LIMIT $${params.length - 1} OFFSET $${params.length}`;

		const [stocksResult, freshnessResult] = await Promise.all([
			pool.query(sql, params),
			pool.query("SELECT MAX(updated_at) AS last_updated FROM dhan_stocks")
		]);

		const lastUpdated = freshnessResult.rows[0]?.last_updated || null;

		const metadata = {
			...DataFreshnessService.augmentBatchResponse(
				stocksResult.rows,
				lastUpdated,
				"DHAN_CSV"
			).metadata,
			query_params: {
				search,
				filters: { minMarketCap, maxMarketCap, minPe, maxPe },
				sort,
				order,
				limit,
				offset
			}
		};

		res.json(responseFormatter.list(stocksResult.rows, metadata));
	} catch (error) {
		logger.error(logger.LOG_CATEGORIES.API, 'Get stocks error', { error: error.message });
		res.status(500).json(
			responseFormatter.error(
				'Failed to retrieve stock data',
				'STOCKS_FETCH_ERROR',
				{ detail: error.message }
			)
		);
	}
}

function parseNumeric(value) {
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

function clamp(value, min, max) {
	if (!Number.isFinite(value)) {
		return min;
	}

	return Math.min(Math.max(value, min), max);
}

module.exports = {
	getStocks
};
