import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { CommandEmptyState } from "./CommandEmptyState";
import { LineChart as LineChartIcon } from "lucide-react";
import { formatCurrency } from "@/data/mock-data";
import type { TrendPoint } from "@/lib/command-signals";

interface Props {
  data: TrendPoint[];
  height?: number;
}

export function CommandLineChart({ data, height = 240 }: Props) {
  const hasAny = data.some((p) => p.actual > 0 || p.target > 0);
  if (!hasAny) {
    return (
      <CommandEmptyState
        icon={LineChartIcon}
        title="No revenue in this period yet"
        hint="Dispatched orders will plot here once they ship."
      />
    );
  }
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cmdActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 12,
              color: "hsl(var(--foreground))",
            }}
            formatter={(v: number, name) => [formatCurrency(v), name === "actual" ? "Actual" : "Target"]}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            fill="url(#cmdActual)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
