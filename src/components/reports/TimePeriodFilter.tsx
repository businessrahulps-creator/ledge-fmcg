import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TimePeriod = "daily" | "weekly" | "monthly" | "yearly";

interface TimePeriodFilterProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

export function TimePeriodFilter({ value, onChange }: TimePeriodFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TimePeriod)}>
      <SelectTrigger className="h-10 w-40 rounded-lg">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="daily">Daily</SelectItem>
        <SelectItem value="weekly">Weekly</SelectItem>
        <SelectItem value="monthly">Monthly</SelectItem>
        <SelectItem value="yearly">Yearly</SelectItem>
      </SelectContent>
    </Select>
  );
}

/** Filter orders by time period relative to today's date */
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
  switch (period) {
    case "daily": return "Today";
    case "weekly": return "Last 7 Days";
    case "monthly": return "Last 30 Days";
    case "yearly": return "Last Year";
  }
}
