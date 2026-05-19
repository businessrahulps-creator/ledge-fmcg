import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { formatCurrency, type Distributor } from "@/data/mock-data";
import { CommandEmptyState } from "./CommandEmptyState";

interface Props {
  distributors: Distributor[];
}

export function CreditAtRiskCard({ distributors }: Props) {
  const rows = distributors
    .filter((d) => d.creditLimit > 0 && d.outstandingAmount / d.creditLimit >= 0.7)
    .map((d) => ({ ...d, util: d.outstandingAmount / d.creditLimit }))
    .sort((a, b) => b.util - a.util)
    .slice(0, 5);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Credit at risk
        </h3>
        {rows.length > 0 && (
          <Link to="/distributors?filter=overdue" className="flex items-center gap-1 text-xs text-primary hover:underline">
            All <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {rows.length === 0 ? (
        <CommandEmptyState title="No dealers over 70% credit utilisation" hint="You're in the clear." />
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const pct = Math.min(100, Math.round(r.util * 100));
            const overred = pct >= 90;
            return (
              <li key={r.id}>
                <Link to={`/distributors/${r.id}`} className="block rounded-md px-2 -mx-2 py-1.5 hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-foreground">{r.name}</p>
                    <span className={`num text-xs font-medium ${overred ? "text-destructive" : "text-warning"}`}>{pct}%</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                    <span className="num">{formatCurrency(r.outstandingAmount)} of {formatCurrency(r.creditLimit)}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${overred ? "bg-destructive" : "bg-warning"}`} style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
