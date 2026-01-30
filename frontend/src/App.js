
import { useState } from "react";
import { runScreener } from "./api";
import "./App.css";

function App() {

  const [query, setQuery] = useState("");
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const data = await runScreener(query);
    setStocks(data);
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>AI Stock Screener</h1>

      <textarea
        placeholder="Type your query..."
        value={query}
        onChange={(e)=>setQuery(e.target.value)}
      />

      <button onClick={handleSearch}>
        Run Screener
      </button>

      {loading && <p>Loading...</p>}

      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Company</th>
            <th>PEG</th>
            <th>Price</th>
            <th>Target</th>
          </tr>
        </thead>

        <tbody>
          {stocks.map((s)=>(
            <tr key={s.symbol}>
              <td>{s.symbol}</td>
              <td>{s.company}</td>
              <td>{s.peg}</td>
              <td>{s.current_price}</td>
              <td>{s.analyst_target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
