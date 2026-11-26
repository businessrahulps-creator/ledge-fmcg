import { getPeriodKeys, type TimePeriod } from "@/components/reports/TimePeriodFilter";
import { istDateKey } from "@/utils/dateKey";
import { formatIndianDate } from "@/utils/formatDate";

/** Money to Collect date choice: All time, a rolling preset, or picked From/To days. */
export type BillingPeriod = TimePeriod | "all" | "custom";
export type DayWindow = { fromKey: string; toKey: string };

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Inclusive India-calendar window, or null for "everything". From after To is refused (null + invalid). */
export function resolveWindow(period: BillingPeriod, from?: string, to?: string): DayWindow | null {
  if (period === "all") return null;
  if (period === "custom") {
    if (!from || !to || !KEY_RE.test(from) || !KEY_RE.test(to) || from > to) return null;
    return { fromKey: from, toKey: to };
  }
  return getPeriodKeys(period);
}

/** Pure dates ("YYYY-MM-DD") are used as-is; timestamps become the India day they fall on. */
export function dayKeyOf(value: string | null | undefined): string {
  if (!value) return "";
  if (KEY_RE.test(value)) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? value.slice(0, 10) : istDateKey(d);
}

/** Both ends inclusive — a record late on the To day is kept. */
export function inWindow(value: string | null | undefined, w: DayWindow | null): boolean {
  if (!w) return true;
  const k = dayKeyOf(value);
  return !!k && k >= w.fromKey && k <= w.toKey;
}

const keyDate = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };

export function windowLabel(w: DayWindow | null): string {
  if (!w) return "All time";
  if (w.fromKey === w.toKey) return formatIndianDate(keyDate(w.toKey));
  return `${formatIndianDate(keyDate(w.fromKey))} – ${formatIndianDate(keyDate(w.toKey))}`;
}
