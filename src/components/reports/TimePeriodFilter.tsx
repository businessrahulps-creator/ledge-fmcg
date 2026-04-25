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

/** Get start date (cutoff) and end date (today) for the selected period */
export function getPeriodRange(period: TimePeriod): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  switch (period) {
    case "daily":
      // from = today 00:00, to = now
      break;
    case "weekly":
      from.setDate(to.getDate() - 6); // last 7 days inclusive of today
      break;
    case "monthly":
      from.setDate(to.getDate() - 29); // last 30 days inclusive
      break;
    case "yearly":
      from.setDate(to.getDate() - 364); // last 365 days inclusive
      break;
  }
  return { from, to };
}

/** Human-readable date range caption, e.g. "18 Mar 2026 – 17 Apr 2026" */
export function periodRangeLabel(period: TimePeriod): string {
  const { from, to } = getPeriodRange(period);
  if (period === "daily") return formatIndianDate(to);
  return `${formatIndianDate(from)} – ${formatIndianDate(to)}`;
}

/** Filter items by time period relative to today's date (rolling window) */
export function filterByTimePeriod<T extends { date: string }>(items: T[], period: TimePeriod): T[] {
  const now = new Date();
  const cutoff = new Date();

  switch (period) {
    case "daily":
      cutoff.setDate(now.getDate() - 1);
      break;
    case "weekly":
      cutoff.setDate(now.getDate() - 7);
      break;
    case "monthly":
      cutoff.setMonth(now.getMonth() - 1);
      break;
    case "yearly":
      cutoff.setFullYear(now.getFullYear() - 1);
      break;
  }

  return items.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= cutoff;
  });
}

export function periodLabel(period: TimePeriod): string {
  return PERIOD_LABELS[period];
}
