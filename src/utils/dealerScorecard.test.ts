import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getChurnRisk, buildScorecard } from "./dealerScorecard";
import type { Order } from "@/data/mock-data";

const NOW = new Date("2025-06-15T12:00:00Z");

function makeOrder(daysAgo: number, paymentStatus: "paid" | "partial" | "pending" = "paid", total = 1000): Partial<Order> {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return {
    date: d.toISOString().slice(0, 10),
    paymentStatus,
    total,
    schemeSavings: 0,
  };
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => { vi.useRealTimers(); });

describe("getChurnRisk", () => {
  it("empty orders → high", () => {
    expect(getChurnRisk([])).toBe("high");
  });

  it("recent paid order → low", () => {
    expect(getChurnRisk([makeOrder(10, "paid")] as Order[])).toBe("low");
  });

  it("order 45 days ago, 50% paid → medium", () => {
    const orders = [makeOrder(45, "paid"), makeOrder(45, "pending")] as Order[];
    expect(getChurnRisk(orders)).toBe("medium");
  });

  it("old order 90 days ago → high", () => {
    expect(getChurnRisk([makeOrder(90, "pending")] as Order[])).toBe("high");
  });
});

describe("buildScorecard", () => {
  it("empty orders returns zeroes", () => {
    const sc = buildScorecard([]);
    expect(sc.orders30d).toBe(0);
    expect(sc.totalValue30d).toBe(0);
    expect(sc.daysSinceLastOrder).toBeNull();
  });

  it("aggregates values in 30d window", () => {
    const orders = [makeOrder(5, "paid", 2000), makeOrder(10, "paid", 3000)] as Order[];
    const sc = buildScorecard(orders);
    expect(sc.orders30d).toBe(2);
    expect(sc.totalValue30d).toBe(5000);
  });

  it("calculates payment timeliness", () => {
    const orders = [makeOrder(5, "paid"), makeOrder(5, "pending")] as Order[];
    const sc = buildScorecard(orders);
    expect(sc.paymentTimeliness).toBe(50);
  });

  it("daysSinceLastOrder is correct", () => {
    const orders = [makeOrder(7)] as Order[];
    const sc = buildScorecard(orders);
    expect(sc.daysSinceLastOrder).toBe(7);
  });
});
