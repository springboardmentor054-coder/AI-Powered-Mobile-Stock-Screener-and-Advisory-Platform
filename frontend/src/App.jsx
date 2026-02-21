import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";

import QueryInput from "./components/QueryInput";
import ResultsTable from "./components/ResultsTable";
import SQLDisplay from "./components/SQLDisplay";
import QueryHistory from "./components/QueryHistory";
import QueryStatusBar from "./components/QueryStatusBar";
import StockCardGrid from "./components/StockCardGrid";
import StockDrawer from "./components/StockDrawer";
import Watchlist from "./components/Watchlist";
import Portfolio from "./components/Portfolio";
import Alerts from "./components/Alerts";
import TriggeredAlerts from "./components/TriggeredAlerts";
import Login from "./pages/Login";

import "./App.css";
import useAlertEngine from "./hooks/useAlertEngine";

function App() {
  // 🔐 AUTH (SUBSCRIBE PROPERLY)
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);

  // 🔄 QUERY STATE
  const results = useAppStore((state) => state.results);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);

  const viewMode = useAppStore((state) => state.viewMode);
  const alerts = useAppStore((state) => state.alerts);

  // 🛠 ACTIONS
  const setLoading = useAppStore((state) => state.setLoading);
  const setResults = useAppStore((state) => state.setResults);
  const setError = useAppStore((state) => state.setError);
  const setExecutionTime = useAppStore((state) => state.setExecutionTime);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const addQueryToHistory = useAppStore((state) => state.addQueryToHistory);
  const triggerAlert = useAppStore((state) => state.triggerAlert);
  const clearSelectedStock = useAppStore((state) => state.clearSelectedStock);

  // 🔐 AUTH GUARD
  if (!isLoggedIn) {
    return <Login />;
  }

  // 🔒 Close drawer on refresh
  useEffect(() => {
    clearSelectedStock();
  }, [clearSelectedStock]);

  // 🔔 Alert engine hook
  useAlertEngine();

  const handleSubmit = async (queryText) => {
    addQueryToHistory(queryText);

    setLoading(true);
    setError(null);
    setResults(null);
    setExecutionTime(null);

    try {
      const response = await fetch("http://localhost:8000/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process query");
      }

      const data = await response.json();

      setResults(data);
      setExecutionTime(data.execution_time);

      // 🔔 ALERT CHECK
      alerts.forEach((alert) => {
        const stock = data.results?.find(
          (s) => s.id === alert.stockId
        );

        if (!stock) return;

        const currentValue = stock[alert.metric];

        if (
          (alert.condition === ">" && currentValue > alert.value) ||
          (alert.condition === "<" && currentValue < alert.value)
        ) {
          triggerAlert(alert);
          window.alert(
            `🔔 Alert Triggered: ${alert.symbol} ${alert.metric} ${alert.condition} ${alert.value}`
          );
        }
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">

        {/* HEADER */}
        <header className="header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1>🤖 AI Stock Retrieval</h1>
              <p>Welcome {user?.email}</p>
            </div>

            <button
              onClick={logout}
              style={{ padding: "8px 12px", cursor: "pointer" }}
            >
              🚪 Logout
            </button>
          </div>
        </header>

        {/* QUERY INPUT */}
        <QueryInput onSubmit={handleSubmit} loading={loading} />

        {/* STATUS + HISTORY */}
        <QueryStatusBar />
        <QueryHistory onSelect={handleSubmit} />

        {/* ERROR */}
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* VIEW TOGGLE */}
        {results && (
          <div className="view-toggle">
            <button
              className={viewMode === "table" ? "active" : ""}
              onClick={() => setViewMode("table")}
            >
              Table View
            </button>
            <button
              className={viewMode === "card" ? "active" : ""}
              onClick={() => setViewMode("card")}
            >
              Card View
            </button>
          </div>
        )}

        {/* RESULTS */}
        {results && (
          <>
            {viewMode === "table" && (
              <>
                <SQLDisplay
                  sqlQuery={results.sql_query}
                  parsedJson={results.parsed_json}
                  executionTime={results.execution_time}
                />
                <ResultsTable results={results.results} />
              </>
            )}

            {viewMode === "card" && (
              <StockCardGrid stocks={results.results} />
            )}
          </>
        )}

        {/* USER SECTIONS */}
        <Watchlist />
        <Portfolio />
        <Alerts />
        <TriggeredAlerts />

        {/* EXAMPLES */}
        <div className="examples">
          <h3>Example Queries:</h3>
          <ul>
            <li onClick={() => handleSubmit("Show me stocks with price above $100")}>
              "Show me stocks with price above $100"
            </li>
            <li
              onClick={() =>
                handleSubmit("Find tech stocks with market cap greater than 1 billion")
              }
            >
              "Find tech stocks with market cap greater than 1 billion"
            </li>
            <li
              onClick={() =>
                handleSubmit(
                  "Get stocks where volume is above 1 million and price is between $50 and $200"
                )
              }
            >
              "Get stocks where volume is above 1 million and price is between $50 and $200"
            </li>
          </ul>
        </div>

      </div>

      {/* DRAWER */}
      <StockDrawer />
    </div>
  );
}

export default App;
