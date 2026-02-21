import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAppStore } from "../store/useAppStore";

export default function useAlertEngine() {
  const { alerts, results, triggerAlert } = useAppStore();

  useEffect(() => {
    if (!results || !alerts.length) return;

    const stocks = results.results;

    alerts.forEach((alert) => {
      const stock = stocks.find((s) => s.id === alert.stockId);
      if (!stock) return;

      const value = stock[alert.metric];
      if (value === undefined) return;

      const triggered =
        alert.condition === ">"
          ? value > alert.value
          : value < alert.value;

      if (triggered) {
        // 🔥 Move alert to triggered list
        triggerAlert(alert);

        // 🔔 Toast notification
        toast.success(
          `${stock.symbol}: ${alert.metric} ${alert.condition} ${alert.value}`,
          { duration: 5000 }
        );
      }
    });
  }, [alerts, results, triggerAlert]);
}
