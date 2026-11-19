import { describe, it, expect } from "vitest";
import { orderBalanceDue } from "./order-balance";
describe("orderBalanceDue", () => {
  it("₹150 bill, ₹25 paid, ₹50 returned leaves ₹75", () => expect(orderBalanceDue(150, 50, 25)).toBe(75));
  it("never goes below zero", () => expect(orderBalanceDue(100, 80, 50)).toBe(0));
});
