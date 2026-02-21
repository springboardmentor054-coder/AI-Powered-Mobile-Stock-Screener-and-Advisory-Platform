import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function StockCharts({ stock }) {
  if (!stock) return null;

  const data = [
    {
      name: "Price ($)",
      value: stock.price,
      color: "#2563eb", // blue
    },
    {
      name: "PE Ratio",
      value: stock.pe_ratio,
      color: "#f59e0b", // amber
    },
    {
      name: "Volume (M)",
      value: stock.volume / 1_000_000, // normalize
      color: "#16a34a", // green
    },
  ];

  return (
    <div style={{ height: 260 }}>
      <h3>📊 Stock Metrics</h3>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value">
            {data.map((entry, index) => (
              <rect key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StockCharts;
