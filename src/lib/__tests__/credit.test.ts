import { describe, it, expect } from "vitest";
import { creditCeiling, exceedsCredit, creditBlockMessage } from "../credit";

describe("credit rules", () => {
  it("cash-only dealers may not owe anything", () => {
    const d = { creditMode: "cash_only" as const, creditLimit: 0 };
    expect(creditCeiling(d)).toBe(0);
    expect(exceedsCredit(d, 1)).toBe(true);
    expect(exceedsCredit(d, 0)).toBe(false);
    expect(creditBlockMessage(d, "Sharma Traders")).toContain("no credit");
  });

  it("limited dealers are blocked past their limit", () => {
    const d = { creditMode: "limited" as const, creditLimit: 50000 };
    expect(exceedsCredit(d, 50000)).toBe(false);
    expect(exceedsCredit(d, 50000.01)).toBe(true);
  });

  it("unlimited dealers are never blocked", () => {
    const d = { creditMode: "unlimited" as const, creditLimit: 0 };
    expect(creditCeiling(d)).toBeNull();
    expect(exceedsCredit(d, 9_99_999)).toBe(false);
  });

  it("falls back to the old meaning only when no mode is stored", () => {
    expect(creditCeiling({ creditLimit: 0 })).toBeNull();
    expect(creditCeiling({ creditLimit: 1000 })).toBe(1000);
  });
});
