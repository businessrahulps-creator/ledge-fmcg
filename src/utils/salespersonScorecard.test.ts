import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getPerformanceHealth,
  getPerformanceInsight,
  buildSalespersonScorecard,
} from "./salespersonScorecard";
import type { Order } from "@/data/mock-data";

const NOW = new Date("2025-06-15T12:00:00Z");

function makeOrder(
  daysAgo: number,
  paymentStatus: "paid" | "partial" | "pending" = "paid",
  total = 1000,
  schemeSavings = 100
): Partial<Order> {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return { date: d.toISOString().slice(0, 10), paymentStatus, total, schemeSavings };
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => { vi.useRealTimers(); });

describe("getPerformanceHealth", () => {
  it("empty → low", () => expect(getPerformanceHealth([])).toBe("low"));

  it("recent + paid → high", () => {
    expect(getPerformanceHealth([makeOrder(10, "paid")] as Order[])).toBe("high");
  });

  it("old → low", () => {
    expect(getPerformanceHealth([makeOrder(90, "pending")] as Order[])).toBe("low");
  });
});

describe("getPerformanceInsight", () => {
  it("high health + high efficiency", () => {
    const sc = buildSalespersonScorecard([makeOrder(5, "paid")] as Order[]);
    const insight = getPerformanceInsight("high", sc);
    expect(insight).toContain("Consistent performer");
  });

  it("low health + 90 days inactive", () => {
    const sc = buildSalespersonScorecard([makeOrder(90, "pending")] as Order[]);
    const insight = getPerformanceInsight("low", sc);
    expect(insight).toContain("Needs attention");
  });
});

describe("buildSalespersonScorecard", () => {
  it("scheme-adjusted revenue", () => {
    // total=1000, schemeSavings=100, effective=900
    const orders = [makeOrder(5, "paid", 1000, 100)] as Order[];
    const sc = buildSalespersonScorecard(orders);
    expect(sc.totalRevenue).toBe(900);
    expect(sc.totalRevenue30d).toBe(900);
    expect(sc.avgOrderValue).toBe(900);
  });

  it("order frequency over 90d", () => {
    const orders = Array.from({ length: 13 }, (_, i) => makeOrder(i * 7)) as Order[];
    const sc = buildSalespersonScorecard(orders);
    expect(sc.orderFrequency).toBeGreaterThan(0);
  });

  it("empty orders", () => {
    const sc = buildSalespersonScorecard([]);
    expect(sc.totalRevenue).toBe(0);
    expect(sc.daysSinceLastOrder).toBeNull();
  });
});
