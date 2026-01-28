const db = require('../config/db'); // Import your DB connection
const { processUserQuery } = require('../utils/aiHandler');
const { compileToSQL } = require('../utils/sqlCompiler'); // Import the compiler

exports.handleUserQuery = async (req, res) => {
  try {
    const { query } = req.body;
    console.log('1. Received user query:', query);

    // --- Step A: Get DSL from AI ---
    const dsl = await processUserQuery(query);
    console.log('2. Generated DSL:', JSON.stringify(dsl, null, 2));

    // --- Step B: Compile DSL to SQL ---
    const sqlQuery = compileToSQL(dsl);
    console.log('3. Generated SQL:', sqlQuery.text);
    console.log('4. SQL Params:', sqlQuery.values);

    // --- Step C: Execute in Database ---
    const result = await db.query(sqlQuery.text, sqlQuery.values);

    // --- Step D: Send Results ---
    res.json({
      message: 'Query executed successfully!',
      dsl: dsl,           // Send back for debugging
      sql: sqlQuery.text, // Optional: show user the SQL
      count: result.rows.length,
      data: result.rows   // The actual stock data
    });

  } catch (err) {
    console.error('Screener Controller Error:', err.message);
    res.status(500).json({ error: 'Failed to process query' });
  }
};