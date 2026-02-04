const db = require('../config/db');
const redis = require('../config/redis'); 
const { processUserQuery } = require('../utils/aiHandler');
const { compileToSQL } = require('../utils/sqlCompiler');
const { trackSearch } = require('./userController');

exports.handleUserQuery = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!query) return res.status(400).json({ error: "Query is required" });

    // DEBUG 1: Log the generated key
    const cacheKey = `query_cache:${query.trim().toLowerCase()}`;
    console.log(`🔑 Checking Cache Key: "${cacheKey}"`);

    // ---------------------------------------------------------
    // A. CHECK REDIS CACHE
    // ---------------------------------------------------------
    let cachedResult = null;
    try {
      cachedResult = await redis.get(cacheKey);
    } catch (redisErr) {
      console.error("⚠️ Redis GET failed:", redisErr.message);
    }

    if (cachedResult) {
      console.log('⚡ HIT: Serving result from Redis Cache');
      
      if (userId) trackSearch(userId, query).catch(e => console.error(e));
      
      return res.json(JSON.parse(cachedResult));
    }

    console.log('🐢 MISS: Fetching from AI & Database...');

    // ---------------------------------------------------------
    // B. PROCESS QUERY
    // ---------------------------------------------------------
    const dsl = await processUserQuery(query);
    const sqlQuery = compileToSQL(dsl);
    const result = await db.query(sqlQuery.text, sqlQuery.values);

    const responseData = {
      message: 'Query executed successfully!',
      dsl: dsl,           
      sql: sqlQuery.text, 
      count: result.rows.length,
      data: result.rows   
    };

    // ---------------------------------------------------------
    // C. SAVE TO REDIS
    // ---------------------------------------------------------
    try {
      console.log(`💾 Saving to Redis Key: "${cacheKey}"`);
      
      // Using 'set' with options is the modern v4 way, but setEx works too.
      // Let's explicitly wait for it.
      await redis.set(cacheKey, JSON.stringify(responseData), {
        EX: 3600 // Expires in 1 hour
      });
      
      console.log('✅ Successfully saved to Redis!');
    } catch (saveErr) {
      console.error("❌ Redis SAVE failed:", saveErr.message);
    }

    if (userId) trackSearch(userId, query).catch(e => console.error(e));

    res.json(responseData);

  } catch (err) {
    console.error('❌ Screener Controller Error:', err.message);
    res.status(500).json({ error: 'Failed to process query' });
  }
};