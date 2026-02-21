import { useAppStore } from "../store/useAppStore";
import "./Alerts.css";

function Alerts() {
  const { alerts, removeAlert } = useAppStore();
  
  if (alerts.length === 0) {
    return (
      <div className="alerts empty">
        <p>🔔 No alerts created</p>
      </div>
    );
  }

  return (
    <div className="alerts">
      <h3>🔔 Alerts</h3>

      <ul>
        {alerts.map((alert) => (
          <li key={alert.id} className="alert-item">
            <span>
              <strong>{alert.symbol}</strong> →{" "}
              {alert.metric.toUpperCase()} {alert.condition}{" "}
              {alert.value}
            </span>

            <button
              className="remove"
              onClick={() => removeAlert(alert.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Alerts;
