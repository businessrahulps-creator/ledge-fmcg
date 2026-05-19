import { memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { CommandEmptyState } from "./CommandEmptyState";

export interface LeaderboardRow {
  id: string;
  name: string;
  primary: string; // formatted value (e.g. ₹ amount)
  secondary?: string; // optional sub-label
  href?: string; // deep link per-row
}

interface Props {
  title: string;
  icon?: LucideIcon;
  rows: LeaderboardRow[];
  emptyTitle: string;
  emptyHint?: string;
  viewAllHref?: string;
}

function LeaderboardCardInner({ title, icon: Icon, rows, emptyTitle, emptyHint, viewAllHref }: Props) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {title}
        </h3>
        {viewAllHref && rows.length > 0 && (
          <Link to={viewAllHref} className="flex items-center gap-1 text-xs text-primary hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {rows.length === 0 ? (
        <CommandEmptyState title={emptyTitle} hint={emptyHint} />
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((r, i) => {
            const inner = (
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-5 text-right text-xs font-medium tabular-nums text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{r.name}</p>
                    {r.secondary && <p className="truncate text-[11px] text-muted-foreground">{r.secondary}</p>}
                  </div>
                </div>
                <span className="num shrink-0 text-sm font-medium text-foreground">{r.primary}</span>
              </div>
            );
            return (
              <li key={r.id}>
                {r.href ? (
                  <Link to={r.href} className="block rounded-sm px-1 -mx-1 hover:bg-muted/40">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export const LeaderboardCard = memo(LeaderboardCardInner);
