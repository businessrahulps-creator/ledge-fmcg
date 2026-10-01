import { useMemo } from "react";
import { useApi } from "@/services/api";
import { todayKey } from "@/utils/dateKey";
import { monthForecast } from "@/lib/intelligence";
import { formatCurrency } from "@/data/mock-data";

/** "Expected sales this month" — an estimate, only from day 7 of the month. */
export function ForecastCard() {
  const orders = useApi().orders.list();
  const f = useMemo(() => monthForecast(orders, todayKey()), [orders]);
  if (!f) return null;
  const diff = f.lastMonthSameDay > 0 ? Math.round(((f.soFar - f.lastMonthSameDay) / f.lastMonthSameDay) * 100) : null;
  return (
    <section aria-label="Expected sales this month" className="rounded-md border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">Expected sales this month · estimate</p>
      <p className="mt-1 text-2xl font-semibold num tabular-nums">{formatCurrency(f.expected)}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        Likely between {formatCurrency(f.low)} and {formatCurrency(f.high)}, if sales continue at this speed.
      </p>
      <p className="text-sm mt-2">
        {formatCurrency(f.soFar)} so far in {f.day} of {f.daysInMonth} days
        {diff !== null && <> · {Math.abs(diff)}% {diff >= 0 ? "more" : "less"} than the same days last month</>}.
      </p>
      <p className="text-[11px] text-muted-foreground mt-1">Sales after offers, before GST. Cancelled orders not counted.</p>
    </section>
  );
}
