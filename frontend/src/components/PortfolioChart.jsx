import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useAppStore } from "../store/useAppStore";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#14b8a6",
  "#a855f7",
];

function PortfolioChart() {
  const { portfolio } = useAppStore();

  if (!portfolio.length) return null;

  const data = portfolio.map((s) => ({
    name: s.symbol,
    value: s.quantity * s.price, // REAL VALUE
  }));

  return (
    <div style={{ height: 300, marginTop: 24 }}>
      <h3>📊 Portfolio Allocation</h3>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PortfolioChart;
