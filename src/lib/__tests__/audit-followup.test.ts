import { describe, it, expect } from "vitest";
import { ordersInPeriod, dispatchedRevenue, dispatchedOrdersInPeriod, getPeriodRange } from "@/lib/command-signals";
import { applyRevenueScope } from "@/components/reports/RevenueScopeFilter";
import { filterByTimePeriod, getPeriodKeys, getPeriodRange as reportRange } from "@/components/reports/TimePeriodFilter";
import { buildScorecard } from "@/utils/dealerScorecard";
import { todayKey, addDaysToKey } from "@/utils/dateKey";
import type { Order } from "@/data/mock-data";

const order = (o: Partial<Order>): Order => ({
  id: o.id || "o1",
  orderNumber: "SO-1",
  date: o.date || todayKey(),
  distributorId: o.distributorId || "d1",
  distributorName: "Dealer",
  salespersonId: "s1",
  salespersonName: "Sales",
  lines: [],
  total: o.total ?? 1000,
  schemeSavings: o.schemeSavings ?? 0,
  paymentMode: "cash",
  paymentStatus: o.paymentStatus || "pending",
  deliveryStatus: o.deliveryStatus || "pending",
  dispatchDate: o.dispatchDate,
  vehicle: "",
  driverName: "",
  dispatchRemarks: "",
  cancelledAt: o.cancelledAt,
} as Order);

describe("cancelled orders never count", () => {
  const range = getPeriodRange("30d");

  it("are dropped from the period order list", () => {
    const rows = [order({ id: "a" }), order({ id: "b", cancelledAt: new Date().toISOString() })];
    expect(ordersInPeriod(rows, range).map(o => o.id)).toEqual(["a"]);
  });

  it("are dropped from dispatched revenue and its order count", () => {
    const rows = [
      order({ id: "a", deliveryStatus: "dispatched", dispatchDate: todayKey(), total: 500 }),
      order({ id: "b", deliveryStatus: "dispatched", dispatchDate: todayKey(), total: 700, cancelledAt: new Date().toISOString() }),
    ];
    expect(dispatchedRevenue(rows, range)).toBe(500);
    expect(dispatchedOrdersInPeriod(rows, range)).toHaveLength(1);
  });

  it("are dropped by the report scope filter, in both scopes", () => {
    const rows = [
      order({ id: "a", deliveryStatus: "delivered" }),
      order({ id: "b", deliveryStatus: "delivered", cancelledAt: new Date().toISOString() }),
    ];
    expect(applyRevenueScope(rows, "delivered").map(o => o.id)).toEqual(["a"]);
    expect(applyRevenueScope(rows, "all").map(o => o.id)).toEqual(["a"]);
  });

  it("are dropped from the dealer scorecard", () => {
    const rows = [order({ id: "a" }), order({ id: "b", cancelledAt: new Date().toISOString() })];
    expect(buildScorecard(rows).orders30d).toBe(1);
  });
});

describe("dealer scorecard payment timeliness", () => {
  it("uses the receipt-derived payment state, not the order flag", () => {
    const rows = [order({ id: "a", paymentStatus: "pending" }), order({ id: "b", paymentStatus: "pending" })];
    const sc = buildScorecard(rows, (o) => (o.id === "a" ? "paid" : "pending"));
    expect(sc.paymentTimeliness).toBe(50);
  });
});

describe("report period window", () => {
  it("caption range and filtered rows use the same window", () => {
    const { fromKey, toKey } = getPeriodKeys("monthly");
    const rows = [
      { date: fromKey },
      { date: toKey },
      { date: addDaysToKey(fromKey, -1) },
    ];
    expect(filterByTimePeriod(rows, "monthly").map(r => r.date)).toEqual([fromKey, toKey]);
    const range = reportRange("monthly");
    expect(range.from.getDate()).toBe(Number(fromKey.slice(8)));
    expect(range.to.getDate()).toBe(Number(toKey.slice(8)));
  });

  it("today means today only", () => {
    const today = todayKey();
    const rows = [{ date: today }, { date: addDaysToKey(today, -1) }];
    expect(filterByTimePeriod(rows, "daily")).toEqual([{ date: today }]);
  });

  it("last 365 days is exactly 365 days, leap year or not", () => {
    const { fromKey, toKey } = getPeriodKeys("yearly");
    const days = (Date.parse(toKey) - Date.parse(fromKey)) / 86_400_000;
    expect(days).toBe(364);
  });
});
