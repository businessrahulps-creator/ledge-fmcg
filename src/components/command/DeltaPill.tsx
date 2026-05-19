import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  pct: number | null;
  /** When true, "down" is good (e.g. outstanding). */
  inverse?: boolean;
  className?: string;
}

export function DeltaPill({ pct, inverse = false, className }: Props) {
  if (pct === null || !isFinite(pct)) {
    return <span className={cn("inline-flex items-center gap-0.5 text-[11px] text-muted-foreground", className)}>
      <Minus className="h-3 w-3" /> No prior data
    </span>;
  }
  const up = pct >= 0;
  const positive = inverse ? !up : up;
  const tone = Math.abs(pct) < 0.5 ? "neutral" : positive ? "good" : "bad";
  const cls = tone === "good" ? "text-success" : tone === "bad" ? "text-destructive" : "text-muted-foreground";
  const Icon = Math.abs(pct) < 0.5 ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium num", cls, className)}>
      <Icon className="h-3 w-3" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}
