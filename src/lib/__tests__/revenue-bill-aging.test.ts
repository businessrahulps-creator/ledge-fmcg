import { describe, it, expect } from "vitest";
import {
  netTotal,
  isCancelled,
  isDelivered,
  isBooked,
  deliveredRevenue,
  bookedRevenue,
  orderInScope,
} from "../revenue";
import { billStateFromMoney, billStatusView } from "../bill-status";
import { bucketize, sortByRisk, BUCKET_RANK } from "../aging";

const o = (over: Record<string, unknown> = {}) =>
  ({
    id: "o1",
    date: "2026-09-01",
    total: 1000,
    schemeSavings: 0,
    deliveryStatus: "pending",
    ...over,
  }) as any;

describe("revenue", () => {
  it("nets scheme savings off and never goes below zero", () => {
    expect(netTotal(o({ total: 1000, schemeSavings: 250 }))).toBe(750);
    expect(netTotal(o({ total: 100, schemeSavings: 400 }))).toBe(0);
  });

  it("cancelled orders count as neither delivered nor booked", () => {
    const c = o({ cancelledAt: "2026-09-05", deliveryStatus: "delivered" });
    expect(isCancelled(c)).toBe(true);
    expect(isDelivered(c)).toBe(false);
    expect(isBooked(c)).toBe(false);
    expect(orderInScope(c, "delivered")).toBe(false);
    expect(orderInScope(c, "booked")).toBe(false);
  });

  it("keeps cancelled orders out of both revenue totals", () => {
    const orders = [
      o({ id: "a", deliveryStatus: "delivered", total: 500 }),
      o({ id: "b", deliveryStatus: "delivered", total: 900, cancelledAt: "2026-09-05" }),
      o({ id: "c", deliveryStatus: "pending", total: 300 }),
      o({ id: "d", deliveryStatus: "pending", total: 700, cancelledAt: "2026-09-06" }),
    ];
    expect(deliveredRevenue(orders)).toBe(500);
    expect(bookedRevenue(orders)).toBe(300);
  });
});

describe("billStateFromMoney", () => {
  it("is paid only at exact zero", () => {
    expect(billStateFromMoney(1000, 1000, 0)).toBe("paid");
    expect(billStateFromMoney(1000, 600, 400)).toBe("paid");
    expect(billStateFromMoney(1000, 1200, 0)).toBe("paid");
  });

  it("treats a paise remainder as a short payment", () => {
    expect(billStateFromMoney(1000, 999.5, 0)).toBe("partial");
  });

  it("is posted when nothing has come in", () => {
    expect(billStateFromMoney(1000, 0, 0)).toBe("posted");
    expect(billStatusView("posted").locked).toBe(true);
    expect(billStatusView("draft").locked).toBe(false);
  });
});

describe("aging buckets", () => {
  it("splits on the bucket boundaries", () => {
    expect(bucketize(0)).toBe("b0");
    expect(bucketize(30)).toBe("b0");
    expect(bucketize(31)).toBe("b31");
    expect(bucketize(60)).toBe("b31");
    expect(bucketize(61)).toBe("b61");
    expect(bucketize(90)).toBe("b61");
    expect(bucketize(91)).toBe("b90");
  });

  it("sorts the worst dealer first", () => {
    const rows = [
      { distributorId: "a", worstBucket: "b0" },
      { distributorId: "b", worstBucket: "b90" },
      { distributorId: "c", worstBucket: "b31" },
    ] as any;
    expect(sortByRisk(rows).map((r: any) => r.distributorId)[0]).toBe("b");
    expect(BUCKET_RANK.b90).toBeGreaterThan(BUCKET_RANK.b0);
  });
});
