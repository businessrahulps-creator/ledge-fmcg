import { cn } from "@/lib/utils";

/** Tiny trend line for tables and tiles. Pure SVG, no chart library. */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  className,
  label,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  label?: string;
}) {
  if (data.length < 2) return <span className={cn("inline-block", className)} style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label ?? "Trend"}
      className={cn("text-foreground", className)}
    >
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
