import { useAppStore } from "../store/useAppStore";
import "./QueryStatusBar.css";

function QueryStatusBar() {
  const { loading, error, executionTime } = useAppStore();

  if (!loading && !error && !executionTime) return null;

  return (
    <div className="query-status-bar">
      {loading && <span>⏳ Processing query...</span>}
      {executionTime && !loading && (
        <span>✅ Completed in {executionTime} ms</span>
      )}
      {error && <span className="error">❌ {error}</span>}
    </div>
  );
}

export default QueryStatusBar;
