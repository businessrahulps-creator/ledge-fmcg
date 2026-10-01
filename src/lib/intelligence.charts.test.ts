import { describe, it, expect } from "vitest";
import { stockRunway, weeklySales, forecastNext4Weeks, topUnpaidDealers, buyingLessPairs, topReturnedProducts } from "./intelligence";
import { sumDue } from "./receivables";
import { addDaysToKey } from "@/utils/dateKey";

const T = "2026-10-01";
const order = (date: string, total: number, d = "d1", cancelled: string | null = null) =>
  ({ id: date + d + total, date, distributorId: d, distributorName: d, total, schemeSavings: 0, cancelledAt: cancelled, lines: [] }) as any;
const row = (d: string, due: number) => ({ distributorId: d, distributorName: d, due }) as any;

describe("weeklySales", () => {
  it("buckets by 7-day blocks ending yesterday and skips cancelled and today", () => {
    const w = weeklySales([order(addDaysToKey(T, -1), 100), order(addDaysToKey(T, -8), 50), order(addDaysToKey(T, -1), 999, "d1", "x"), order(T, 7)], T, 4);
    expect(w.map(x => x.sales)).toEqual([0, 0, 50, 100]);
  });
  it("empty data gives zeros", () => expect(weeklySales([], T, 3).every(x => x.sales === 0)).toBe(true));
});

describe("forecastNext4Weeks", () => {
  it("explains what is missing", () => {
    expect(forecastNext4Weeks([], T)).toMatchObject({ ok: false, reason: "no_sales" });
    const three = [1, 8, 15].map(d => order(addDaysToKey(T, -d), 100));
    expect(forecastNext4Weeks(three, T)).toMatchObject({ ok: false, reason: "few_sale_weeks", have: 3, need: 5 });
  });
  it("steady sales: 4 × weekly average with a tight backtested range", () => {
    const os = Array.from({ length: 140 }, (_, i) => order(addDaysToKey(T, -1 - i), 1000));
    const f = forecastNext4Weeks(os, T) as any;
    expect(f.ok).toBe(true);
    expect(f.total).toBeCloseTo(28000);
    expect(f.range.checks).toBeGreaterThanOrEqual(3);
    expect(f.range.high - f.range.low).toBeLessThan(1000);
    expect(f.uncertain).toBe(false);
  });
  it("hides the range until 3 backtests exist", () => {
    const os = Array.from({ length: 8 }, (_, i) => order(addDaysToKey(T, -1 - i * 7), 1000));
    const f = forecastNext4Weeks(os, T) as any;
    expect(f.ok).toBe(true);
    expect(f.range).toBeNull();
  });
  it("range covers what actually happened in most past periods", () => {
    const os = Array.from({ length: 30 }, (_, i) => order(addDaysToKey(T, -1 - i * 7), 1000 + (i % 3) * 400));
    const f = forecastNext4Weeks(os, T) as any;
    expect(f.range.low).toBeLessThanOrEqual(f.total);
    expect(f.range.high).toBeGreaterThan(f.total);
  });
  it("jumpy sales are marked uncertain", () => {
    const os = Array.from({ length: 10 }, (_, i) => order(addDaysToKey(T, -1 - i * 7), i % 2 ? 100 : 10000));
    expect((forecastNext4Weeks(os, T) as any).uncertain).toBe(true);
  });
});

describe("topUnpaidDealers", () => {
  it("total matches the canonical unpaid sum", () => {
    const rows = [row("a", 100), row("a", 50), row("b", 300), row("c", 0), row("d", 10), row("e", 5), row("f", 1), row("g", 2)];
    const r = topUnpaidDealers(rows);
    expect(r.total).toBe(sumDue(rows));
    expect(r.items[0]).toMatchObject({ id: "b", value: 300 });
    expect(r.items[1]).toMatchObject({ id: "a", value: 150, note: "2 bills" });
    expect(r.items).toHaveLength(5);
  });
});

describe("buyingLessPairs", () => {
  it("ranks by rupee drop and skips new dealers", () => {
    const os = [
      order(addDaysToKey(T, -45), 10000, "big"), order(addDaysToKey(T, -5), 2000, "big"),
      order(addDaysToKey(T, -45), 3000, "small"), order(addDaysToKey(T, -61), 1, "small"), order(addDaysToKey(T, -61), 1, "big"),
      order(addDaysToKey(T, -20), 9000, "new"),
      order(addDaysToKey(T, -70), 1, "grow"), order(addDaysToKey(T, -40), 100, "grow"), order(addDaysToKey(T, -2), 900, "grow"),
    ];
    expect(buyingLessPairs(os, T).items.map(p => p.id)).toEqual(["big", "small"]);
  });
  it("uses two complete windows ending yesterday (today ignored)", () => {
    const os = [order(addDaysToKey(T, -70), 1, "x"), order(addDaysToKey(T, -40), 500, "x"), order(T, 9999, "x")];
    const r = buyingLessPairs(os, T);
    expect(r.to).toBe(addDaysToKey(T, -1));
    expect(r.items[0]).toMatchObject({ id: "x", before: 500, now: 0 });
  });
});

describe("topReturnedProducts", () => {
  it("sums quantities, ignores rejected and old returns", () => {
    const c = (status: string, days: number, qty: number, p = "p1") => ({ status, createdAt: addDaysToKey(T, -days) + "T10:00:00Z", lines: [{ productId: p, productName: p, quantity: qty }] });
    const r = topReturnedProducts([c("open", 5, 3), c("resolved", 10, 2), c("rejected", 5, 50), c("open", 200, 40), c("open", 5, 4, "p2"), c("open", -3, 99)], T);
    expect(r).toEqual([{ id: "p1", label: "p1", value: 5 }, { id: "p2", label: "p2", value: 4 }]);
  });
});

describe("stockRunway (chart fixes)", () => {
  const prod = { id: "p", name: "P", unit: "box", basePrice: 10 } as any;
  const sent = (daysAgo: number, qty: number) => ({ ...order(addDaysToKey(T, -daysAgo), 100), deliveryStatus: "dispatched", dispatchDate: addDaysToKey(T, -daysAgo), lines: [{ productId: "p", quantity: qty }] });
  const S = { lateDays: 3, runwayDays: 1e9, dropPct: 40 };
  it("a little stock lasting under a day is not 'Out of stock'", () => {
    const r = stockRunway({ orders: [sent(100, 1), sent(2, 300)], stockItems: [{ productId: "p", godownName: "G", quantity: 5 }] as any, products: [prod], settings: S, today: T });
    expect(r.low[0].fact).toBe("Less than 1 day of stock left");
    expect(r.low[0].meta!.days).toBeLessThan(1);
  });
  it("uses the real number of days when history is short, and ignores future sends", () => {
    const r = stockRunway({ orders: [sent(10, 100), sent(-5, 5000)], stockItems: [{ productId: "p", godownName: "G", quantity: 100 }] as any, products: [prod], settings: S, today: T });
    expect(r.historyDays).toBe(10);
    expect(r.low[0].meta!.days).toBeCloseTo(10);
  });
});
