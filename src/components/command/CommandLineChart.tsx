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
  ReferenceLine,
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

  const { peak, zeroRuns, maxActual, perBucketTarget, targetUnreachable, projectedClose, periodTarget, paceLabel } = useMemo(() => {
    if (!hasAny) {
      return {
        peak: null as TrendPoint | null,
        zeroRuns: [] as Array<{ from: string; to: string }>,
        maxActual: 0,
        perBucketTarget: 0,
        targetUnreachable: false,
        projectedClose: 0,
        periodTarget: 0,
        paceLabel: "",
      };
    }
    let peak: TrendPoint | null = null;
    let maxA = 0;
    let totalActual = 0;
    for (const p of data) {
      if (p.actual > 0 && (!peak || p.actual > peak.actual)) peak = p;
      if (p.actual > maxA) maxA = p.actual;
      totalActual += p.actual;
    }
    const perBucketTarget = data[0]?.target || 0;
    const periodTarget = perBucketTarget * data.length;
    // Project close: simple linear extrapolation from buckets elapsed (any bucket
    // with actual>0 counts as "elapsed"; if none, fall back to all elapsed).
    const elapsed = Math.max(1, data.filter((p) => p.actual > 0).length);
    const projectedClose = (totalActual / elapsed) * data.length;
    const pace = periodTarget > 0 ? Math.round((projectedClose / periodTarget) * 100) : 0;
    const paceLabel = periodTarget > 0 ? `${pace}% of target pace` : "";
    // If the target line would dwarf the actual series, hide it and show context
    // as a caption instead — the chart should breathe.
    const targetUnreachable = perBucketTarget > 0 && maxA > 0 && perBucketTarget > maxA * 2.5;

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
    return { peak, zeroRuns: runs, maxActual: maxA, perBucketTarget, targetUnreachable, projectedClose, periodTarget, paceLabel };
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

  // Y-axis domain — when target is unreachable, scale to actuals only so the
  // series isn't crushed into the floor.
  const yMax = targetUnreachable
    ? Math.max(maxActual, 1) * 1.2
    : Math.max(maxActual, perBucketTarget, 1) * 1.1;

  return (
    <div className="space-y-1.5">
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
              domain={[0, yMax]}
              allowDataOverflow={false}
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
            {!targetUnreachable && perBucketTarget > 0 && (
              <Line
                type="monotone"
                dataKey="target"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
            {/* Projected close — dashed run-rate line at average actual */}
            {targetUnreachable && projectedClose > 0 && (
              <ReferenceLine
                y={projectedClose / data.length}
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
                label={{
                  value: `Run-rate · ${formatCurrency(projectedClose / data.length)}/bucket`,
                  position: "insideTopRight",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                }}
              />
            )}

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
      {targetUnreachable && periodTarget > 0 && (
        <p className="px-1 text-[11px] text-muted-foreground">
          Period target {formatCurrency(periodTarget)} · projected close{" "}
          <span className="num font-medium text-foreground">{formatCurrency(projectedClose)}</span>
          {paceLabel && <> · {paceLabel}</>}
        </p>
      )}
    </div>
  );
}
export const CommandLineChart = memo(CommandLineChartInner);
