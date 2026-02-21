import { useAppStore } from "../store/useAppStore";
import "./Portfolio.css";
import PortfolioChart from "./PortfolioChart";

function Portfolio() {
  const { portfolio } = useAppStore();

  if (portfolio.length === 0) {
    return (
      <div className="portfolio empty">
        💼 Your portfolio is empty
      </div>
    );
  }

  const totalInvested = portfolio.reduce(
    (sum, s) => sum + s.quantity * s.buyPrice,
    0
  );

  const currentValue = portfolio.reduce(
    (sum, s) => sum + s.quantity * s.price,
    0
  );

  const pnl = currentValue - totalInvested;
  const pnlPercent = ((pnl / totalInvested) * 100).toFixed(2);

  return (
    <div className="portfolio">
      <h2>💼 Portfolio</h2>

      <div className="portfolio-summary">
        <div>
          <strong>Invested:</strong> ${totalInvested.toFixed(2)}
        </div>
        <div>
          <strong>Current Value:</strong> ${currentValue.toFixed(2)}
        </div>
        <div className={pnl >= 0 ? "profit" : "loss"}>
          <strong>P/L:</strong> ${pnl.toFixed(2)} ({pnlPercent}%)
        </div>
      </div>
       {/* ✅ ADD THIS LINE HERE */}
      <PortfolioChart />

      <ul>
        {portfolio.map((s) => (
          <li key={s.id}>
            <strong>{s.symbol}</strong> — {s.quantity} × ${s.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Portfolio;
