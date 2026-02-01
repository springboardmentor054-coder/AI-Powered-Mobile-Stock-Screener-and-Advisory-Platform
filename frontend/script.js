fetch("/api/me")
  .then(res => {
    if (res.status === 401) {
      window.location = "/login.html";
    }
  });

console.log("✅ script.js loaded");

let chart = null;

/* =========================
   AUTH CHECK ON PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/screener", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "__auth_check__" })
    });

    if (res.status === 401) {
      alert("Please login to access the screener");
      window.location.href = "/login.html";
    }
  } catch (err) {
    console.error("Auth check failed", err);
    window.location.href = "/login.html";
  }
});

/* =========================
   SEARCH STOCKS
========================= */
async function searchStocks() {
  const query = document.getElementById("query").value.trim();
  if (!query) {
    alert("Please enter a query");
    return;
  }

  try {
    const res = await fetch("/api/screener", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    if (res.status === 401) {
      alert("Session expired. Please login again.");
      window.location.href = "/login.html";
      return;
    }

    const data = await res.json();
    console.log("📥 Backend response:", data);

    renderResults(data);

  } catch (err) {
    console.error("❌ Fetch error:", err);
  }
}

/* =========================
   QUICK QUERY
========================= */
function quickQuery(text) {
  document.getElementById("query").value = text;
  searchStocks();
}

/* =========================
   RENDER RESULTS
========================= */
function renderResults(data) {
  const resultDiv = document.getElementById("result");

  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    resultDiv.innerHTML = "<p>No results found</p>";
    destroyChart();
    return;
  }

  const headers = Object.keys(data.results[0]);

  let tableHTML = `<table><tr>`;
  headers.forEach(h => {
    tableHTML += `<th>${h.replace(/_/g, " ").toUpperCase()}</th>`;
  });
  tableHTML += `</tr>`;

  data.results.forEach(row => {
    tableHTML += `<tr>`;
    headers.forEach(h => {
      tableHTML += `<td>${row[h]}</td>`;
    });
    tableHTML += `</tr>`;
  });

  tableHTML += `</table>`;
  resultDiv.innerHTML = tableHTML;

  drawChart(data.results);
}

/* =========================
   DRAW CHART
========================= */
function drawChart(stocks) {
  const ctx = document.getElementById("stockChart");
  if (!ctx) return;

  destroyChart();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: stocks.map(s => s.name),
      datasets: [
        {
          label: "Current Price",
          data: stocks.map(s => s.current_price)
        },
        {
          label: "ROE",
          data: stocks.map(s => s.roe),
          type: "line"
        }
      ]
    }
  });
}

/* =========================
   DESTROY CHART
========================= */
function destroyChart() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}
