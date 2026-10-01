import { addDaysToKey, todayKey } from "@/utils/dateKey";

export type PeriodId = "today" | "week" | "month" | "last_month" | "fy" | "custom";

export const PERIODS: { value: PeriodId; label: string }[] = [
  { value: "today", label: "Today" }, { value: "week", label: "This week" }, { value: "month", label: "This month" },
  { value: "last_month", label: "Last month" }, { value: "fy", label: "This year" }, { value: "custom", label: "Pick dates" },
];

const pad = (x: number) => String(x).padStart(2, "0");
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-based

/** All ranges are Indian calendar days, inclusive. */
export function periodRange(id: PeriodId, today = todayKey()): { from: string; to: string } {
  const [y, m, d] = today.split("-").map(Number);
  switch (id) {
    case "today": return { from: today, to: today };
    case "week": { const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return { from: addDaysToKey(today, -((dow + 6) % 7)), to: today }; }
    case "month": return { from: `${y}-${pad(m)}-01`, to: today };
    case "last_month": { const ly = m === 1 ? y - 1 : y, lm = m === 1 ? 12 : m - 1; return { from: `${ly}-${pad(lm)}-01`, to: `${ly}-${pad(lm)}-${pad(lastDay(ly, lm))}` }; }
    case "fy": { const fy = m >= 4 ? y : y - 1; return { from: `${fy}-04-01`, to: today }; }
    default: return { from: `${y}-${pad(m)}-01`, to: today };
  }
}

/** The same number of days just before this range. */
export function previousRange(from: string, to: string) {
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  return { from: addDaysToKey(from, -days), to: addDaysToKey(from, -1) };
}

const nice = (k: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${k}T00:00:00Z`));
export function rangeLabel(from: string, to: string) {
  return from === to ? nice(from) : `${nice(from)} – ${nice(to)}`;
}
