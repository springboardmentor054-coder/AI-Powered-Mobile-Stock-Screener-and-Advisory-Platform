import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "../store/useAppStore";
import "./StockDrawer.css";
import StockCharts from "./StockCharts";
import PriceHistoryChart from "./PriceHistoryChart";

function StockDrawer() {
  // ======================
  // 🔒 ALL HOOKS FIRST
  // ======================
  const {
    selectedStock,
    clearSelectedStock,
    watchlist,
    addToWatchlist,
    portfolio,
    addToPortfolio,
    addAlert,
  } = useAppStore();

  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [metric, setMetric] = useState("price");
  const [condition, setCondition] = useState(">");
  const [alertValue, setAlertValue] = useState("");

  // ======================
  // ✅ SAFE GUARD AFTER HOOKS
  // ======================
  if (
    !selectedStock ||
    typeof selectedStock !== "object" ||
    !selectedStock.id ||
    !selectedStock.symbol
  ) {
    return null;
  }

  // ======================
  // Derived flags
  // ======================
  const isInWatchlist = watchlist.some(
    (s) => s.id === selectedStock.id
  );

  const isInPortfolio = portfolio.some(
    (s) => s.id === selectedStock.id
  );

  // ======================
  // Handlers
  // ======================
  const handleAddToPortfolio = () => {
    if (!quantity || !buyPrice) return;

    addToPortfolio({
      ...selectedStock,
      quantity: Number(quantity),
      buyPrice: Number(buyPrice),
    });

    setQuantity("");
    setBuyPrice("");
  };

  const handleCreateAlert = () => {
    if (!alertValue) return;

    addAlert({
      id: Date.now(),
      stockId: selectedStock.id,
      symbol: selectedStock.symbol,
      metric,
      condition,
      value: Number(alertValue),
    });

    setAlertValue("");
  };

  // ======================
  // PORTAL RENDER
  // ======================
  return createPortal(
    <div className="drawer-overlay" onClick={clearSelectedStock}>
      <div
        className="drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawer-header">
          <h2>{selectedStock.company_name}</h2>
          <button onClick={clearSelectedStock}>✖</button>
        </div>

        {/* Content */}
        <div className="drawer-content">
          <p><strong>Symbol:</strong> {selectedStock.symbol}</p>
          <p><strong>Price:</strong> ${selectedStock.price}</p>
          <p><strong>Market Cap:</strong> {selectedStock.market_cap}</p>
          <p><strong>Volume:</strong> {selectedStock.volume}</p>
          <p><strong>PE Ratio:</strong> {selectedStock.pe_ratio}</p>

          <hr />
          {/* 📊 STEP 6 — Charts */}
  <StockCharts stock={selectedStock} />
<PriceHistoryChart stock={selectedStock} />

          {/* Watchlist */}
          <button
            onClick={() => !isInWatchlist && addToWatchlist(selectedStock)}
            disabled={isInWatchlist}
          >
            {isInWatchlist ? "⭐ In Watchlist" : "⭐ Add to Watchlist"}
          </button>

          <hr />

          {/* Portfolio */}
          <h3>💼 Add to Portfolio</h3>

          {isInPortfolio ? (
            <p>Already added to portfolio</p>
          ) : (
            <>
              <input
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <input
                type="number"
                placeholder="Buy Price"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
              />

              <button onClick={handleAddToPortfolio}>
                ➕ Add to Portfolio
              </button>
            </>
          )}

          <hr />

          {/* Alerts */}
          <h3>🔔 Create Alert</h3>

          <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="price">Price</option>
            <option value="volume">Volume</option>
            <option value="pe_ratio">PE Ratio</option>
          </select>

          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value=">">{">"}</option>
            <option value="<">{"<"}</option>
          </select>

          <input
            type="number"
            placeholder="Value"
            value={alertValue}
            onChange={(e) => setAlertValue(e.target.value)}
          />

          <button onClick={handleCreateAlert}>
            🔔 Create Alert
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default StockDrawer;
