import { describe, it, expect } from "vitest";
import { roundQty, formatQty } from "../quantity";

describe("stock quantity helpers", () => {
  it("adding whole stock to a fractional balance keeps the fraction exactly", () => {
    expect(roundQty(120.25 + 50)).toBe(170.25);
    expect(roundQty(0.1 + 0.2)).toBe(0.3);
  });
  it("keeps 6 decimals (1/7 case)", () => {
    expect(roundQty(1 / 7)).toBe(0.142857);
  });
  it("shows up to 3 decimals without trailing zeros", () => {
    expect(formatQty(10)).toBe("10");
    expect(formatQty(10.25)).toBe("10.25");
  });
});
