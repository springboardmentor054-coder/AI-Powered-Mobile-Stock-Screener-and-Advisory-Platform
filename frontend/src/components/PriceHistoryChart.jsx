import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function PriceHistoryChart({ stock }) {
  if (!stock) return null;

  // TEMP: simulate last 7 days (backend later)
  const data = Array.from({ length: 7 }).map((_, i) => ({
    day: `Day ${i + 1}`,
    price:
      stock.price *
      (1 + (Math.random() - 0.5) * 0.05),
  }));

  return (
    <div style={{ height: 220, marginTop: 24 }}>
      <h3>📈 Price History (7 Days)</h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2563eb"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PriceHistoryChart;
