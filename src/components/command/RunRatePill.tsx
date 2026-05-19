import { Card } from "@/components/ui/card";
import { TrendingUp, Target, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface Props {
  /** Period actual revenue so far (dispatched). */
  actualRevenue: number;
  /** Period actual collections so far. */
  actualCollections: number;
  /** Sum of salesperson targets for period. */
  periodTarget: number;
  /** Days elapsed in period (>=1 to avoid div/0). */
  daysElapsed: number;
  /** Total days in period. */
  daysTotal: number;
}

function projectClose(actual: number, elapsed: number, total: number): number {
  if (elapsed <= 0) return 0;
  const rate = actual / elapsed;
  return Math.round(rate * total);
}

function pace(actualPctOfTarget: number, daysElapsedPct: number): "ahead" | "ontrack" | "behind" {
  const diff = actualPctOfTarget - daysElapsedPct;
  if (diff > 0.05) return "ahead";
  if (diff < -0.05) return "behind";
  return "ontrack";
}

export function RunRatePill({ actualRevenue, actualCollections, periodTarget, daysElapsed, daysTotal }: Props) {
  const projectedRevenue = projectClose(actualRevenue, daysElapsed, daysTotal);
  const projectedCollections = projectClose(actualCollections, daysElapsed, daysTotal);
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);

  const hasTarget = periodTarget > 0;
  const hitProbability = hasTarget
    ? Math.max(0, Math.min(100, Math.round((projectedRevenue / periodTarget) * 100)))
    : null;

  const daysPct = daysTotal > 0 ? daysElapsed / daysTotal : 0;
  const actualPct = hasTarget ? actualRevenue / periodTarget : 0;
  const paceState = hasTarget ? pace(actualPct, daysPct) : "ontrack";

  const paceTone =
    paceState === "ahead"
      ? "text-success"
      : paceState === "behind"
        ? "text-destructive"
        : "text-muted-foreground";
  const PaceIcon = paceState === "ahead" ? CheckCircle2 : paceState === "behind" ? AlertCircle : TrendingUp;
  const paceLabel =
    paceState === "ahead"
      ? "Ahead of pace"
      : paceState === "behind"
        ? "Behind pace"
        : "On pace";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Forecast
          </p>
          <span className="text-[11px] text-muted-foreground">
            · {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left
          </span>
        </div>
        {hasTarget && (
          <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", paceTone)}>
            <PaceIcon className="h-3 w-3" />
            {paceLabel}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Projected revenue
          </p>
          <p className="num mt-1 text-lg font-semibold text-foreground">
            {formatCurrency(projectedRevenue)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            at current run-rate
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Projected collections
          </p>
          <p className="num mt-1 text-lg font-semibold text-foreground">
            {formatCurrency(projectedCollections)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            by period end
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Target hit probability
          </p>
          {hasTarget && hitProbability !== null ? (
            <>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="num text-lg font-semibold text-foreground">{hitProbability}%</span>
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted/50">
                <div
                  className={cn(
                    "h-full transition-[width] duration-500",
                    hitProbability >= 100 ? "bg-success" : hitProbability >= 70 ? "bg-primary" : "bg-warning",
                  )}
                  style={{ width: `${Math.min(100, hitProbability)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No target set</p>
          )}
        </div>
      </div>
    </Card>
  );
}
