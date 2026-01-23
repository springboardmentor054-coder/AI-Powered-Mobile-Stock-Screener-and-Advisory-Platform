router.post("/query", async (req, res) => {
  const { query } = req.body;

  const dsl = await callParserService(query);
  const result = await callScreenerEngine(dsl);

  res.json(result);
});
