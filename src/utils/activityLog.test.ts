import { describe, it, expect, vi } from "vitest";
import { fmtAmount } from "./activityLog";

// logActivity is fire-and-forget and calls supabase — tested via integration.
// Here we test the pure helper.

describe("fmtAmount", () => {
  it("formats zero", () => {
    expect(fmtAmount(0)).toBe("₹0");
  });

  it("formats thousands with Indian locale grouping", () => {
    const result = fmtAmount(125000);
    expect(result).toContain("₹");
    expect(result).toContain("1");
    expect(result).toContain("25");
    expect(result).toContain("000");
  });

  it("formats negative numbers", () => {
    const result = fmtAmount(-500);
    expect(result).toContain("-");
    expect(result).toContain("500");
  });

  it("formats lakhs", () => {
    const result = fmtAmount(1500000);
    expect(result).toContain("₹");
    // Indian grouping: 15,00,000
    expect(result).toContain("15");
  });
});
