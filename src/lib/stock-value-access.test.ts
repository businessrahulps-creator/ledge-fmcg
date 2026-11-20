import { describe, expect, it } from "vitest";
import { canViewStockValue } from "./stock-value-access";

describe("stock value access", () => {
  it("allows stock managers without money access", () => {
    expect(canViewStockValue(true, false)).toBe(true);
  });
  it("allows money access without stock-management access", () => {
    expect(canViewStockValue(false, true)).toBe(true);
  });
  it("allows both capabilities", () => {
    expect(canViewStockValue(true, true)).toBe(true);
  });
  it("denies valuations when neither capability is granted", () => {
    expect(canViewStockValue(false, false)).toBe(false);
  });
});