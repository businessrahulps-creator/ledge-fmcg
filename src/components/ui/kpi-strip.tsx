import * as React from "react";
import { cn } from "@/lib/utils";
import { ExplainButton } from "@/components/ui/explain-button";
import { ReconcileStamp } from "@/components/ui/reconcile-stamp";

export interface KpiCell {
  label: string;
  value: React.ReactNode;
  /** Optional small line under the value, typically <InsightLine />. */
  insight?: React.ReactNode;
  /** Dim the value (used for zero/empty states). */
  zero?: boolean;
  /** Optional click handler — wraps the cell in a button. */
  onClick?: () => void;
  /** Optional AI "explain this number" hookup. Renders a ✦ next to the label. */
  explain?: { value: string; context: string[] };
}

export interface KpiStripProps {
  cells: KpiCell[];
  className?: string;
  /** Optional trust stamp rendered above the strip, right-aligned. */
  reconciledAt?: Date;
}

/**
 * Hairline-separated horizontal stat strip. Replaces rows of identical KPI cards.
 * Zero values render dimmed instead of competing with real numbers.
 */
function KpiStripImpl({ cells, className, reconciledAt }: KpiStripProps) {
  const cols = cells.length;
  const gridCols = cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4";
  return (
    <div className={cn(reconciledAt && "space-y-1.5", className)}>
      {reconciledAt && (
        <div className="flex justify-end px-1">
          <ReconcileStamp updatedAt={reconciledAt} />
        </div>
      )}
      <div className={cn("grid border-y border-border/60 divide-x divide-border/60", gridCols)}>
      {cells.map((c, i) => {
        const Inner = (
          <>
            <div className="flex items-center gap-1">
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground/80">{c.label}</p>
              {c.explain && !c.zero && (
                <ExplainButton metric={c.label} value={c.explain.value} context={c.explain.context} />
              )}
            </div>
            <p
              className={cn(
                "font-heading text-[22px] md:text-[24px] font-medium tracking-[-0.015em] leading-[1.05] num mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis",
                c.zero && "text-muted-foreground/35",
              )}
            >
              {c.value}
            </p>
            {c.insight && <div className="mt-0">{c.insight}</div>}
          </>
        );
        const base = cn("py-4 px-4 text-left", i === 0 && "md:pl-0", i === cols - 1 && "md:pr-0");
        return c.onClick ? (
          <button key={c.label + i} type="button" onClick={c.onClick} className={cn(base, "hover:bg-muted/20 transition-colors")}>
            {Inner}
          </button>
        ) : (
          <div key={c.label + i} className={base}>
            {Inner}
          </div>
        );
      })}
    </div>
  );
}

export const KpiStrip = React.memo(KpiStripImpl);
