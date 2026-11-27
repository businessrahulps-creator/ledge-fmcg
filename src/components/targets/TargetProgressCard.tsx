import { Target as TargetIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/data/mock-data";
import { useApi } from "@/services/api";
import { useTargetAchievement, pickRow } from "@/hooks/use-target-achievement";
import { findTarget, statusFor, canonicalStart, type TargetPeriodType } from "@/lib/target-achievement";
import { istCalendarNow, toDateKey } from "@/utils/dateKey";
import { STATUS_LABEL, STATUS_TEXT, STATUS_BAR } from "./target-status";

/** Current-period target progress for one salesperson or dealer. Read-only. */
export function TargetProgressCard({ entityType, entityId, canSeeMoney }: { entityType: "salesperson" | "dealer"; entityId: string; canSeeMoney: boolean }) {
  const api = useApi();
  const today = toDateKey(istCalendarNow());
  const all = api.targets.list();
  const found = (["daily", "weekly", "monthly"] as TargetPeriodType[])
    .map(pt => ({ pt, t: findTarget(all, pt, today, entityType, entityId) }))
    .find(x => x.t);
  const pt = found?.pt ?? "monthly";
  const { data } = useTargetAchievement(pt, today);
  const target = found?.t;
  if (!target || ((!canSeeMoney || target.targetRevenue <= 0) && target.targetOrders <= 0)) return null;

  const row = pickRow(data, entityType, entityId);
  const net = row?.net ?? 0;
  const delivered = row?.deliveredCount ?? 0;
  const useMoney = canSeeMoney && target.targetRevenue > 0 && row?.net !== null;
  const status = useMoney ? statusFor(net, target.targetRevenue) : statusFor(delivered, target.targetOrders);
  const pct = useMoney ? Math.round((net / target.targetRevenue) * 100) : target.targetOrders > 0 ? Math.round((delivered / target.targetOrders) * 100) : 0;
  const label = pt === "daily" ? "Today" : pt === "weekly" ? "This Week" : new Date(canonicalStart("monthly", today)).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold md:text-sm flex items-center gap-2">
        <TargetIcon className="h-3.5 w-3.5 text-primary" />
        Targets & Achievements
        <span className="text-[10px] font-normal text-muted-foreground">({label})</span>
      </h3>
      <div className="glass-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold ${STATUS_TEXT[status]}`}>{STATUS_LABEL[status]}</span>
          <span className={`text-lg font-bold ${STATUS_TEXT[status]}`}>{pct}%</span>
        </div>
        <Progress value={Math.min(pct, 100)} className={`h-2 mb-3 ${STATUS_BAR[status]}`} />
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {useMoney && row && (
            <>
              <div><span className="text-muted-foreground">Gross sales</span><p className="font-semibold num">{formatCurrency(row.gross ?? 0)}</p></div>
              <div><span className="text-muted-foreground">Returns deducted</span><p className="font-semibold num">{formatCurrency(row.returnsDeducted ?? 0)}</p></div>
              <div><span className="text-muted-foreground">Net / goal</span><p className="font-semibold num">{formatCurrency(net)} / {formatCurrency(target.targetRevenue)}</p></div>
            </>
          )}
          <div><span className="text-muted-foreground">Delivered orders</span><p className="font-semibold num">{delivered}{target.targetOrders > 0 ? ` / ${target.targetOrders}` : ""}</p></div>
          {(row?.fullyReturnedCount ?? 0) > 0 && (
            <div><span className="text-muted-foreground">Fully returned</span><p className="font-semibold num">{row!.fullyReturnedCount}</p></div>
          )}
        </div>
        {useMoney && (row?.returnsOnEarlierOrders ?? 0) > 0 && (
          <p className="mt-2 text-[10px] text-muted-foreground">Includes {formatCurrency(row!.returnsOnEarlierOrders!)} returns on orders delivered earlier.</p>
        )}
      </div>
    </div>
  );
}
