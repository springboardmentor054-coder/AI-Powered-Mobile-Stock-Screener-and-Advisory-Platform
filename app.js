function searchStocks() {
  const query = document.getElementById("query").value.toLowerCase();
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = "";

  // Dummy data (acts like backend response)
  const stocks = [
    { name: "Infosys", symbol: "INFY", pe: 9, sector: "IT" },
    { name: "TCS", symbol: "TCS", pe: 8, sector: "IT" },
    { name: "Wipro", symbol: "WIPRO", pe: 12, sector: "IT" }
  ];

  const filtered = stocks.filter(stock => {
    if (query.includes("pe") && query.includes("less")) {
      return stock.pe < 10;
    }
    return false;
  });

  if (filtered.length === 0) {
    resultsDiv.innerHTML =
      "<p class='placeholder'>No stocks matched your criteria.</p>";
    return;
  }

  filtered.forEach(stock => {
    const card = document.createElement("div");
    card.className = "stock-card";

    card.innerHTML = `
      <div>
        <div class="stock-name">${stock.name} (${stock.symbol})</div>
        <div class="stock-meta">Sector: ${stock.sector}</div>
      </div>
      <div class="stock-meta">PE Ratio: ${stock.pe}</div>
    `;

    resultsDiv.appendChild(card);
  });
}


