import { describe, it, expect } from "vitest";
import {
  collectQueue, readyOrders, decliningDealers, stockRunway, rankTop3, isHidden, monthForecast,
  readIntelSettings, DEFAULT_INTEL_SETTINGS, type IntelCard,
} from "./intelligence";

const S = DEFAULT_INTEL_SETTINGS;
const order = (o: any) => ({
  id: o.id, orderNumber: o.id, date: o.date, distributorId: o.d ?? "d1", distributorName: "Dealer",
  salespersonId: "s1", salesperson: "Ravi", lines: o.lines ?? [], total: o.total ?? 1000, paymentMode: "cash",
  paymentStatus: "pending", dispatchDate: o.sent ?? null, vehicle: "", driverName: "",
  deliveryStatus: o.sent ? "dispatched" : "pending", cancelledAt: o.cancelled ?? null, dispatchRemarks: "",
  godownId: o.godownId, schemeSavings: o.savings ?? 0, appliedSchemes: [],
}) as any;
const row = (r: any) => ({ invoiceId: r.id, invoiceNumber: r.id, invoiceDate: "2026-01-01", orderId: null, orderNumber: "", distributorId: r.d, distributorName: r.d, billed: r.due, received: 0, credited: 0, due: r.due, ageDays: r.age, bucket: "b0" }) as any;
const dealer = (id: string, extra: any = {}) => ({ id, name: id, contact: "999", creditLimit: 0, creditMode: "unlimited", ...extra }) as any;

describe("collectQueue", () => {
  it("ranks old unpaid money above a bigger but fresh balance", () => {
    const cards = collectQueue({
      rows: [row({ id: "a", d: "big", due: 500000, age: 5 }), row({ id: "b", d: "old", due: 50000, age: 75 })],
      distributors: [dealer("big"), dealer("old")], orders: [], receipts: [], today: "2026-10-01",
    });
    expect(cards[0].dealerId).toBe("old");
    expect(cards[1].score).toBe(0);
  });
  it("skips dealers who paid today and says when no limit is set", () => {
    const cards = collectQueue({
      rows: [row({ id: "a", d: "x", due: 100, age: 40 }), row({ id: "b", d: "y", due: 100, age: 40 })],
      distributors: [dealer("x"), dealer("y")], orders: [],
      receipts: [{ distributorId: "x", amount: 10, paidOn: "2026-10-01", status: "posted" }], today: "2026-10-01",
    });
    expect(cards.map(c => c.dealerId)).toEqual(["y"]);
    expect(cards[0].why.join(" ")).toContain("No credit limit set");
  });
});

describe("readyOrders", () => {
  const stock = [{ productId: "p1", godownId: "g1", quantity: 10 }] as any;
  it("flags late orders and splits ready vs short", () => {
    const cards = readyOrders({
      orders: [
        order({ id: "ready", date: "2026-09-25", lines: [{ productId: "p1", productName: "A", quantity: 5 }] }),
        order({ id: "short", date: "2026-09-25", lines: [{ productId: "p1", productName: "A", quantity: 50 }] }),
        order({ id: "fresh", date: "2026-09-30", lines: [] }),
        order({ id: "cancel", date: "2026-09-01", cancelled: "x", lines: [] }),
      ], stockItems: stock, settings: S, today: "2026-10-01",
    });
    expect(cards.map(c => c.subjectId)).toEqual(["order:ready", "order:short"]);
    expect(cards[1].score).toBe(0);
  });
});

describe("decliningDealers", () => {
  it("needs history and flags a real drop", () => {
    const hist = ["2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01", "2026-09-10"].map((d, i) => order({ id: "o" + i, date: d, total: i === 4 ? 100 : 30000 }));
    const cards = decliningDealers({ orders: hist, distributors: [dealer("d1")], settings: S, today: "2026-10-01" });
    expect(cards).toHaveLength(1);
    const few = decliningDealers({ orders: hist.slice(3), distributors: [dealer("d1")], settings: S, today: "2026-10-01" });
    expect(few).toHaveLength(0);
  });
});

describe("stockRunway", () => {
  it("warns when stock lasts fewer days than the setting", () => {
    const { low } = stockRunway({
      orders: [order({ id: "o", date: "2026-09-20", sent: "2026-09-21", lines: [{ productId: "p1", productName: "A", quantity: 30 }] })],
      stockItems: [{ productId: "p1", godownId: "g", godownName: "Main", quantity: 5 }] as any,
      products: [{ id: "p1", name: "A", unit: "box", basePrice: 10 }] as any, settings: S, today: "2026-10-01",
    });
    expect(low[0].meta!.days).toBeCloseTo(5 / (30 / 11)); // only 11 days of history
  });
});

describe("isHidden + rankTop3", () => {
  const card = { kind: "collect", subjectId: "collect:d1", dealerId: "d1", score: 5 } as IntelCard;
  it("done hides until a new event; snooze until its date", () => {
    const done = [{ kind: "collect", subjectId: "collect:d1", state: "done" as const, untilDate: null, promisedAmount: null, createdAt: "2026-09-30T10:00:00Z" }];
    expect(isHidden(card, done, "2026-10-01", "2026-09-29")).toBe(true);
    expect(isHidden(card, done, "2026-10-01", "2026-10-01")).toBe(false);
    const snooze = [{ ...done[0], state: "snoozed" as const, untilDate: "2026-10-01" }];
    expect(isHidden(card, snooze, "2026-10-01")).toBe(true);
    expect(isHidden(card, snooze, "2026-10-02")).toBe(false);
  });
  it("keeps one card per dealer", () => {
    const top = rankTop3([card, { ...card, subjectId: "order:x", score: 9 }, { kind: "stock", subjectId: "s", score: 1 } as IntelCard]);
    expect(top.map(c => c.subjectId)).toEqual(["order:x", "s"]);
  });
});

describe("monthForecast + settings", () => {
  it("waits until day 7 and projects at the current speed", () => {
    expect(monthForecast([], "2026-10-05")).toBeNull();
    const f = monthForecast([order({ id: "a", date: "2026-10-01", total: 1000 }), order({ id: "b", date: "2026-10-10", total: 1000 })], "2026-10-10")!;
    expect(f.soFar).toBe(2000);
    expect(Math.round(f.expected)).toBe(6200);
  });
  it("falls back to defaults on bad values", () => {
    expect(readIntelSettings({ lateDays: 999, runwayDays: 10 })).toEqual({ lateDays: 3, runwayDays: 10, dropPct: 40 });
  });
});
