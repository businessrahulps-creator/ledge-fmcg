import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceDot,
} from "recharts";
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

  const { peak, zeroRuns } = useMemo(() => {
    if (!hasAny) return { peak: null as TrendPoint | null, zeroRuns: [] as Array<{ from: string; to: string }> };
    let peak: TrendPoint | null = null;
    for (const p of data) if (p.actual > 0 && (!peak || p.actual > peak.actual)) peak = p;

    // Identify contiguous zero-actual buckets between the first and last non-zero
    // so we can shade "no dispatches" bands without grey-ing the whole future tail.
    const firstNonZero = data.findIndex((p) => p.actual > 0);
    const lastNonZero = data.length - 1 - [...data].reverse().findIndex((p) => p.actual > 0);
    const runs: Array<{ from: string; to: string }> = [];
    if (firstNonZero >= 0 && lastNonZero > firstNonZero) {
      let runStart: number | null = null;
      for (let i = firstNonZero; i <= lastNonZero; i++) {
        if (data[i].actual === 0 && runStart === null) runStart = i;
        if (data[i].actual > 0 && runStart !== null) {
          runs.push({ from: data[runStart].label, to: data[i - 1].label });
          runStart = null;
        }
      }
    }
    return { peak, zeroRuns: runs };
  }, [data, hasAny]);

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
        <ComposedChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cmdActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.28} />
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

          {/* "No dispatches" grey bands */}
          {zeroRuns.map((r, i) => (
            <ReferenceArea
              key={`zero-${i}`}
              x1={r.from}
              x2={r.to}
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.06}
              stroke="none"
              ifOverflow="visible"
            />
          ))}

          <Area
            type="monotone"
            dataKey="actual"
            stroke="hsl(var(--success))"
            strokeWidth={2.25}
            fill="url(#cmdActual)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />

          {/* Peak annotation */}
          {peak && (
            <ReferenceDot
              x={peak.label}
              y={peak.actual}
              r={4}
              fill="hsl(var(--success))"
              stroke="hsl(var(--background))"
              strokeWidth={2}
              ifOverflow="visible"
              label={{
                value: `Peak · ${formatCurrency(peak.actual)}`,
                position: "top",
                offset: 10,
                fill: "hsl(var(--foreground))",
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
