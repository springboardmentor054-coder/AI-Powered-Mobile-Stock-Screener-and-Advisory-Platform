import { useAppStore } from "../store/useAppStore";
import "./QueryInput.css";

function QueryInput({ onSubmit, loading }) {
  const { query, setQuery } = useAppStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSubmit(query.trim());
    }
  };

  return (
    <form className="query-input" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query in natural language... e.g., 'Show me tech stocks with price above $100'"
          rows={3}
          disabled={loading}
          className="query-textarea"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="submit-button"
        >
          {loading ? "Processing..." : "Search"}
        </button>
      </div>
    </form>
  );
}

export default QueryInput;
