import { describe, it, expect } from "vitest";
import { collectQueue, isHidden, type IntelCard, type IntelAction } from "@/lib/intelligence";

const row = (over: Record<string, unknown> = {}) => ({
  distributorId: "d1", distributorName: "Shop", due: 1000, ageDays: 40, invoiceDate: "2026-08-01", ...over,
}) as any;

describe("collectQueue advances", () => {
  it("subtracts advance money from what the dealer owes", () => {
    const cards = collectQueue({ rows: [row()], distributors: [], orders: [], receipts: [], today: "2026-10-04", advances: new Map([["d1", 400]]) });
    expect(cards[0].meta!.due).toBe(600);
  });
  it("drops the reminder when advances cover everything", () => {
    const cards = collectQueue({ rows: [row()], distributors: [], orders: [], receipts: [], today: "2026-10-04", advances: new Map([["d1", 1000]]) });
    expect(cards).toHaveLength(0);
  });
});

describe("isHidden for stock cards", () => {
  const card = { kind: "low_stock", subjectId: "low:p1", score: 1 } as unknown as IntelCard;
  const done = (createdAt: string): IntelAction[] => [{ kind: "low_stock", subjectId: "low:p1", state: "done", untilDate: null, promisedAmount: null, createdAt } as IntelAction];
  it("stays hidden for a week after Done", () => {
    expect(isHidden(card, done("2026-10-01T10:00:00Z"), "2026-10-04")).toBe(true);
  });
  it("comes back after 7 days", () => {
    expect(isHidden(card, done("2026-09-20T10:00:00Z"), "2026-10-04")).toBe(false);
  });
});
