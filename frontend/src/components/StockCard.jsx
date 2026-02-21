import { useAppStore } from "../store/useAppStore";
import "./StockCard.css";

function StockCard({ stock }) {
  const setSelectedStock = useAppStore((s) => s.setSelectedStock);

  return (
    <div
      className="stock-card"
      onClick={() => setSelectedStock(stock)}
    >
      <h3>{stock.company_name}</h3>
      <p><strong>Symbol:</strong> {stock.symbol}</p>
      <p><strong>Price:</strong> ${stock.price}</p>
      <p><strong>Market Cap:</strong> {stock.market_cap}</p>
      <p><strong>Volume:</strong> {stock.volume}</p>
      <p><strong>PE Ratio:</strong> {stock.pe_ratio}</p>
    </div>
  );
}

export default StockCard;
