import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MiniChartProps {
  data: { date: string; price: number }[];
  isPositive: boolean;
}

export function MiniChart({ data, isPositive }: MiniChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={isPositive ? "#14b8a6" : "#f87171"}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
