import { Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatIndianDate } from "@/utils/formatDate";

export type TimePeriod = "daily" | "weekly" | "monthly" | "yearly";

interface TimePeriodFilterProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

const PERIOD_LABELS: Record<TimePeriod, string> = {
  daily: "Today",
  weekly: "Last 7 days",
  monthly: "Last 30 days",
  yearly: "Last 365 days",
};

export function TimePeriodFilter({ value, onChange }: TimePeriodFilterProps) {
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Select value={value} onValueChange={(v) => onChange(v as TimePeriod)}>
        <SelectTrigger className="h-10 w-full rounded-lg sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Today</SelectItem>
          <SelectItem value="weekly">Last 7 days</SelectItem>
          <SelectItem value="monthly">Last 30 days</SelectItem>
          <SelectItem value="yearly">Last 365 days</SelectItem>
        </SelectContent>
      </Select>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="About time periods"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="max-w-xs text-xs">
            Time windows are rolling — "Last 7 days" means the last 7 days ending today, not the calendar week.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

/**
 * One window definition for both the caption and the filtering.
 *
 * Windows are whole India calendar days, so the caption always describes
 * exactly the rows the table shows — no UTC slip, no leap-year drift.
 */
const PERIOD_DAYS: Record<TimePeriod, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

/** Inclusive India-calendar window as "YYYY-MM-DD" keys. */
export function getPeriodKeys(period: TimePeriod): { fromKey: string; toKey: string } {
  const toKey = todayKey();
  return { fromKey: addDaysToKey(toKey, -(PERIOD_DAYS[period] - 1)), toKey };
}

const keyToDate = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Get start date (cutoff) and end date (today) for the selected period */
export function getPeriodRange(period: TimePeriod): { from: Date; to: Date } {
  const { fromKey, toKey } = getPeriodKeys(period);
  const from = keyToDate(fromKey);
  const to = keyToDate(toKey);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

/** Human-readable date range caption, e.g. "18 Mar 2026 – 17 Apr 2026" */
export function periodRangeLabel(period: TimePeriod): string {
  const { from, to } = getPeriodRange(period);
  if (period === "daily") return formatIndianDate(to);
  return `${formatIndianDate(from)} – ${formatIndianDate(to)}`;
}

/** Filter items by time period — the same window the caption prints. */
export function filterByTimePeriod<T extends { date: string }>(items: T[], period: TimePeriod): T[] {
  const { fromKey, toKey } = getPeriodKeys(period);
  return items.filter((item) => {
    const key = (item.date || "").slice(0, 10);
    return key >= fromKey && key <= toKey;
  });
}


export function periodLabel(period: TimePeriod): string {
  return PERIOD_LABELS[period];
}
