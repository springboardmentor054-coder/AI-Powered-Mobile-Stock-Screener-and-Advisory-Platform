import StockCard from "./StockCard";
import "./StockCardGrid.css";

function StockCardGrid({ stocks }) {
  return (
    <div className="card-grid">
      {stocks.map((stock) => (
        <StockCard key={stock.id} stock={stock} />
      ))}
    </div>
  );
}

export default StockCardGrid;
