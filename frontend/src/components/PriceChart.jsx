import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function PriceChart({ data }) {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <h4>Price Trend</h4>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#1976d2"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PriceChart;
