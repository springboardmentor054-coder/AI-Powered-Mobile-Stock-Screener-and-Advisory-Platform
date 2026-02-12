function getLastNQuarters(financials, n) {
  if (!financials) return [];
  return financials.slice(0, n);
}

module.exports = { getLastNQuarters };
