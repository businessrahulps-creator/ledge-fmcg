import { describe, it, expect } from "vitest";
import { computeAchievement, statusFor, TARGET_STATUS_THRESHOLDS, periodWindow, normalizeStoredStart, findTarget, canonicalStart, type AchOrder, type AchCreditNote } from "./target-achievement";

const o = (id: string, p: Partial<AchOrder> = {}): AchOrder => ({ id, salespersonId: "sp1", distributorId: "d1", netAmount: 1000, deliveredDay: "2026-11-10", cancelled: false, delivered: true, billedQty: 10, ...p });
const cn = (id: string, orderId: string, p: Partial<AchCreditNote> = {}): AchCreditNote => ({ id, orderId, noteDay: "2026-11-12", amount: 300, qty: 3, issued: true, ...p });
const nov = periodWindow("monthly", "2026-11-01");

describe("returns", () => {
  it("claim and its credit note for the same return count once (same note listed twice)", () => {
    const r = computeAchievement([o("a")], [cn("n1", "a"), cn("n1", "a")], nov);
    expect(r.returnsDeducted).toBe(300);
    expect(r.net).toBe(700);
  });
  it("a return with no issued credit note (open claim / cancelled note) deducts nothing", () => {
    const r = computeAchievement([o("a")], [cn("n1", "a", { issued: false })], nov);
    expect(r.returnsDeducted).toBe(0);
  });
  it("partial return deducts only the credit-note value and keeps the delivered count", () => {
    const r = computeAchievement([o("a")], [cn("n1", "a", { amount: 250, qty: 2 })], nov);
    expect(r).toMatchObject({ gross: 1000, returnsDeducted: 250, net: 750, deliveredCount: 1, fullyReturnedCount: 0 });
  });
  it("full return is shown separately and does not reduce delivered orders", () => {
    const r = computeAchievement([o("a")], [cn("n1", "a", { amount: 1000, qty: 10 })], nov);
    expect(r).toMatchObject({ deliveredCount: 1, fullyReturnedCount: 1, net: 0 });
  });
  it("return on an earlier delivery is deducted in the credit-note period and flagged", () => {
    const orders = [o("old", { deliveredDay: "2026-10-20" })];
    const r = computeAchievement(orders, [cn("n1", "old")], nov);
    expect(r).toMatchObject({ gross: 0, returnsDeducted: 300, returnsOnEarlierOrders: 300 });
    expect(computeAchievement(orders, [cn("n1", "old")], periodWindow("monthly", "2026-10-01")).returnsDeducted).toBe(0);
  });
  it("return belongs to the original order's salesperson and dealer", () => {
    const orders = [o("a", { salespersonId: "spOld", distributorId: "d1" })];
    const notes = [cn("n1", "a")];
    expect(computeAchievement(orders, notes, nov, { entityType: "salesperson", entityId: "spOld" }).returnsDeducted).toBe(300);
    expect(computeAchievement(orders, notes, nov, { entityType: "salesperson", entityId: "spNew" }).returnsDeducted).toBe(0);
    expect(computeAchievement(orders, notes, nov, { entityType: "dealer", entityId: "d1" }).returnsDeducted).toBe(300);
  });
});

describe("delivered orders", () => {
  it("counts each delivered order once; cancelled and undelivered are excluded", () => {
    const r = computeAchievement([o("a"), o("b", { cancelled: true }), o("c", { delivered: false })], [], nov);
    expect(r.deliveredCount).toBe(1);
    expect(r.gross).toBe(1000);
  });
  it("dealer calculation only counts that dealer's orders", () => {
    const r = computeAchievement([o("a"), o("b", { distributorId: "d2", netAmount: 500 })], [], nov, { entityType: "dealer", entityId: "d2" });
    expect(r).toMatchObject({ gross: 500, deliveredCount: 1 });
  });
});

describe("status thresholds", () => {
  it("uses the shared 100 / 70 / 40 edges", () => {
    expect(TARGET_STATUS_THRESHOLDS).toEqual({ achieved: 100, onTrack: 70, behind: 40 });
    expect(statusFor(100, 100)).toBe("exceeded");
    expect(statusFor(70, 100)).toBe("on_track");
    expect(statusFor(69.9, 100)).toBe("behind");
    expect(statusFor(40, 100)).toBe("behind");
    expect(statusFor(39, 100)).toBe("needs_attention");
    expect(statusFor(5, 0)).toBe("no_target");
  });
});

describe("historical records (lookup only)", () => {
  const t = (id: string, periodType: string, periodStart: string) => ({ id, entityType: "salesperson", entityId: "sp1", periodType, periodStart });
  it("Sunday-start weekly target belongs to the following Monday's week", () => {
    expect(normalizeStoredStart("weekly", "2026-04-12")).toBe("2026-04-13");
    expect(findTarget([t("w", "weekly", "2026-04-12")], "weekly", "2026-04-15", "salesperson", "sp1")?.id).toBe("w");
  });
  it("monthly target stored on the 31st belongs to the next month", () => {
    expect(normalizeStoredStart("monthly", "2026-10-31")).toBe("2026-11-01");
    expect(findTarget([t("m", "monthly", "2026-10-31")], "monthly", "2026-11-01", "salesperson", "sp1")?.id).toBe("m");
  });
  it("an exact Monday record wins over a legacy Sunday one", () => {
    expect(findTarget([t("old", "weekly", "2026-04-12"), t("new", "weekly", "2026-04-13")], "weekly", "2026-04-13", "salesperson", "sp1")?.id).toBe("new");
  });
  it("quarterly targets never appear in daily/weekly/monthly views", () => {
    expect(normalizeStoredStart("quarterly", "2026-04-01")).toBeNull();
    expect(findTarget([t("q", "quarterly", "2026-11-01")], "monthly", "2026-11-01", "salesperson", "sp1")).toBeUndefined();
  });
  it("new targets save on Monday / the 1st", () => {
    expect(canonicalStart("weekly", "2026-11-29")).toBe("2026-11-23");
    expect(canonicalStart("monthly", "2026-11-27")).toBe("2026-11-01");
    expect(periodWindow("weekly", "2026-11-23")).toEqual({ from: "2026-11-23", to: "2026-11-29" });
    expect(periodWindow("monthly", "2026-02-10")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });
});
