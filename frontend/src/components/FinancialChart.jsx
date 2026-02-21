import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function FinancialChart({ data }) {
  return (
    <div style={{ width: "100%", height: 200, marginTop: 20 }}>
      <h4>Quarterly Profit</h4>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="quarter" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="profit" fill="#2e7d32" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FinancialChart;
