import { describe, it, expect } from "vitest";
import { weeklySales, forecastNext4Weeks, topUnpaidDealers, buyingLessPairs, topReturnedProducts } from "./intelligence";
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
  it("hides with too little history", () => {
    expect(forecastNext4Weeks([order(addDaysToKey(T, -3), 100)], T)).toBeNull();
    expect(forecastNext4Weeks([], T)).toBeNull();
  });
  it("steady sales give a tight range around 4 × weekly average", () => {
    const os = Array.from({ length: 70 }, (_, i) => order(addDaysToKey(T, -1 - i), 1000));
    const f = forecastNext4Weeks(os, T)!;
    expect(f.total).toBeCloseTo(28000);
    expect(f.high - f.low).toBeLessThan(2000);
    expect(f.uncertain).toBe(false);
    expect(f.next).toHaveLength(4);
  });
  it("jumpy sales are marked uncertain", () => {
    const os = Array.from({ length: 10 }, (_, i) => order(addDaysToKey(T, -1 - i * 7), i % 2 ? 100 : 10000));
    expect(forecastNext4Weeks(os, T)!.uncertain).toBe(true);
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
      order(addDaysToKey(T, -45), 3000, "small"),
      order(addDaysToKey(T, -20), 9000, "new"),
      order(addDaysToKey(T, -70), 1, "grow"), order(addDaysToKey(T, -40), 100, "grow"), order(addDaysToKey(T, -2), 900, "grow"),
    ];
    expect(buyingLessPairs(os, T).map(p => p.id)).toEqual(["big", "small"]);
  });
});

describe("topReturnedProducts", () => {
  it("sums quantities, ignores rejected and old returns", () => {
    const c = (status: string, days: number, qty: number, p = "p1") => ({ status, createdAt: addDaysToKey(T, -days) + "T10:00:00Z", lines: [{ productId: p, productName: p, quantity: qty }] });
    const r = topReturnedProducts([c("open", 5, 3), c("resolved", 10, 2), c("rejected", 5, 50), c("open", 200, 40), c("open", 5, 4, "p2")], T);
    expect(r).toEqual([{ id: "p1", label: "p1", value: 5 }, { id: "p2", label: "p2", value: 4 }]);
  });
});
