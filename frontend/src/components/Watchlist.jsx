import { useAppStore } from "../store/useAppStore";
import "./Watchlist.css";

function Watchlist() {
  const {
    watchlist,
    removeFromWatchlist,
    setSelectedStock,
  } = useAppStore();

  if (watchlist.length === 0) {
    return (
      <div className="watchlist empty">
        <p>⭐ Your watchlist is empty</p>
      </div>
    );
  }

  return (
    <div className="watchlist">
      <h3>⭐ Watchlist</h3>

      <ul>
        {watchlist.map((stock) => (
          <li key={stock.id} className="watchlist-item">
            <span
              className="watchlist-name"
              onClick={() => setSelectedStock(stock)}
            >
              {stock.company_name} ({stock.symbol})
            </span>

            <div className="watchlist-actions">
              <button onClick={() => setSelectedStock(stock)}>
                Open
              </button>
              <button
                className="remove"
                onClick={() => removeFromWatchlist(stock.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Watchlist;
