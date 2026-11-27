/**
 * Targets & Achievements — one shared set of rules.
 * Mirrors the `target_achievement_summary` database function (which is what
 * screens read, so money figures never reach users without money access).
 */
import { addDaysToKey } from "@/utils/dateKey";

export type TargetPeriodType = "daily" | "weekly" | "monthly";

/** Status thresholds, as % of target. Change here only. */
export const TARGET_STATUS_THRESHOLDS = { achieved: 100, onTrack: 70, behind: 40 } as const;

export type TargetStatus = "exceeded" | "on_track" | "behind" | "needs_attention" | "no_target";

export function statusFor(actual: number, target: number): TargetStatus {
  if (!(target > 0)) return "no_target";
  const pct = (actual / target) * 100;
  if (pct >= TARGET_STATUS_THRESHOLDS.achieved) return "exceeded";
  if (pct >= TARGET_STATUS_THRESHOLDS.onTrack) return "on_track";
  if (pct >= TARGET_STATUS_THRESHOLDS.behind) return "behind";
  return "needs_attention";
}

const parse = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const fmt = (d: Date) => d.toISOString().slice(0, 10);

/** Monday of the week containing `key` (Monday–Sunday weeks). */
export function mondayOf(key: string): string {
  const d = parse(key);
  const dow = d.getUTCDay(); // 0 = Sunday
  return addDaysToKey(key, dow === 0 ? -6 : 1 - dow);
}
export function firstOfMonth(key: string): string { return `${key.slice(0, 7)}-01`; }

/** The start key a NEW target of this type is saved with. */
export function canonicalStart(type: TargetPeriodType, key: string): string {
  return type === "weekly" ? mondayOf(key) : type === "monthly" ? firstOfMonth(key) : key;
}

/** Inclusive India-calendar day window for a period. */
export function periodWindow(type: TargetPeriodType, start: string): { from: string; to: string } {
  const from = canonicalStart(type, start);
  if (type === "daily") return { from, to: from };
  if (type === "weekly") return { from, to: addDaysToKey(from, 6) };
  const d = parse(from);
  return { from, to: fmt(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))) };
}

/**
 * Which canonical period an EXISTING stored record belongs to (lookup only —
 * records are never rewritten). Older weekly targets were stored on the
 * Sunday before the Monday, and some monthly ones on the last day of the
 * previous month (a one-day timezone shift).
 */
export function normalizeStoredStart(type: string, stored: string): string | null {
  if (type === "daily") return stored;
  if (type === "weekly") {
    const dow = parse(stored).getUTCDay();
    if (dow === 0) return addDaysToKey(stored, 1);
    return mondayOf(stored);
  }
  if (type === "monthly") {
    const next = addDaysToKey(stored, 1);
    if (next.endsWith("-01") && !stored.endsWith("-01")) return next;
    return firstOfMonth(stored);
  }
  return null; // quarterly and anything else: never shown in these views
}

export interface TargetLike { id: string; entityType: string; entityId: string; periodType: string; periodStart: string }

/** Find the target for an entity in a period; an exact canonical match wins. */
export function findTarget<T extends TargetLike>(targets: T[], type: TargetPeriodType, start: string, entityType: string, entityId: string): T | undefined {
  const want = canonicalStart(type, start);
  const mine = targets.filter(t => t.entityType === entityType && t.entityId === entityId && t.periodType === type);
  return mine.find(t => t.periodStart === want) ?? mine.find(t => normalizeStoredStart(type, t.periodStart) === want);
}

// ---------- Achievement calculation (mirror of the database function) ----------

export interface AchOrder {
  id: string; salespersonId: string | null; distributorId: string | null;
  netAmount: number; deliveredDay: string | null; cancelled: boolean; delivered: boolean;
  billedQty: number;
}
export interface AchCreditNote { id: string; orderId: string; noteDay: string; amount: number; qty: number; issued: boolean }

export interface Achievement {
  gross: number; returnsDeducted: number; returnsOnEarlierOrders: number; net: number;
  deliveredCount: number; fullyReturnedCount: number;
}

export const EMPTY_ACHIEVEMENT: Achievement = { gross: 0, returnsDeducted: 0, returnsOnEarlierOrders: 0, net: 0, deliveredCount: 0, fullyReturnedCount: 0 };

/**
 * Claims are never inputs: a return is counted only through its issued credit
 * note, once per credit note, and owned by the ORIGINAL order's salesperson
 * and dealer (not whoever looks after the dealer today).
 */
export function computeAchievement(
  orders: AchOrder[], creditNotes: AchCreditNote[], window: { from: string; to: string },
  scope: { entityType: "company" | "salesperson" | "dealer"; entityId?: string | null } = { entityType: "company" },
): Achievement {
  const owns = (o: AchOrder) => scope.entityType === "company" ? true
    : scope.entityType === "salesperson" ? o.salespersonId === scope.entityId : o.distributorId === scope.entityId;
  const byId = new Map(orders.map(o => [o.id, o]));
  const notes = new Map<string, AchCreditNote>();
  for (const cn of creditNotes) if (cn.issued) notes.set(cn.id, cn);

  const res = { ...EMPTY_ACHIEVEMENT };
  for (const o of orders) {
    if (o.cancelled || !o.delivered || !o.deliveredDay) continue;
    if (o.deliveredDay < window.from || o.deliveredDay > window.to || !owns(o)) continue;
    res.gross += o.netAmount;
    res.deliveredCount += 1;
    const credited = [...notes.values()].filter(n => n.orderId === o.id).reduce((s, n) => s + n.qty, 0);
    if (o.billedQty > 0 && credited >= o.billedQty) res.fullyReturnedCount += 1;
  }
  for (const n of notes.values()) {
    if (n.noteDay < window.from || n.noteDay > window.to) continue;
    const o = byId.get(n.orderId);
    if (!o || !owns(o)) continue;
    res.returnsDeducted += n.amount;
    if (o.deliveredDay && o.deliveredDay < window.from) res.returnsOnEarlierOrders += n.amount;
  }
  res.net = res.gross - res.returnsDeducted;
  return res;
}

/** This month's monthly targets (legacy-date aware); quarterly/other types excluded. */
export function monthlyTargetsFor<T extends TargetLike>(targets: T[], dayKey: string, entityType = "salesperson"): T[] {
  const want = firstOfMonth(dayKey);
  return targets.filter(t => t.entityType === entityType && t.periodType === "monthly" && normalizeStoredStart("monthly", t.periodStart) === want);
}
