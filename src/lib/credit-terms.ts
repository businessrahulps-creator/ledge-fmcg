import { addDaysToKey, istDateKey } from "@/utils/dateKey";

export const validCreditDays = (days: number | null | undefined): boolean =>
  days == null || (Number.isInteger(days) && days >= 1 && days <= 365);

/** Current dealer terms, for collection tracking only. Never persisted on bills. */
export function dueDateFor(invoiceDate: string, days: number | null | undefined): string | null {
  if (days == null || !validCreditDays(days)) return null;
  const key = invoiceDate.slice(0, 10);
  const time = Date.parse(`${key}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== key) return null;
  return addDaysToKey(key, days);
}

export function daysLateFor(dueDate: string | null, unpaid: number, today: Date | string): number {
  if (!dueDate || unpaid <= 0) return 0;
  const key = typeof today === "string" ? today : istDateKey(today);
  return Math.max(0, Math.round((Date.parse(`${key}T00:00:00Z`) - Date.parse(`${dueDate}T00:00:00Z`)) / 86400000));
}

export const dealerCreditDays = (dealer?: { creditMode?: string; creditDays?: number | null }): number | null =>
  dealer?.creditMode === "cash_only" ? null : dealer?.creditDays ?? null;