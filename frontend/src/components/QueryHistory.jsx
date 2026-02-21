import { useAppStore } from "../store/useAppStore";


function QueryHistory({ onSelect }) {
  const { queryHistory } = useAppStore();

  if (queryHistory.length === 0) return null;

  return (
    <div className="query-history">
      <h4>Recent Queries</h4>
      <ul>
        {queryHistory.map((q, index) => (
          <li key={index} onClick={() => onSelect(q.text)}>
            <span>{q.text}</span>
            <small>{q.time}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default QueryHistory;
