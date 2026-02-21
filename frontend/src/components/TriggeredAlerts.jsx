import { useAppStore } from "../store/useAppStore";

function TriggeredAlerts() {
  const { alerts } = useAppStore();

  const triggered = alerts.filter(a => a.status === "triggered");

  if (triggered.length === 0) return null;

  return (
    <div style={{
      background: "#ffe6e6",
      padding: "16px",
      margin: "20px 0",
      borderRadius: "8px"
    }}>
      <h3>🚨 Triggered Alerts</h3>

      {triggered.map(alert => (
        <div key={alert.id} style={{ marginBottom: "8px" }}>
          {alert.symbol} {alert.metric} {alert.condition} {alert.value}
        </div>
      ))}
    </div>
  );
}

export default TriggeredAlerts;
