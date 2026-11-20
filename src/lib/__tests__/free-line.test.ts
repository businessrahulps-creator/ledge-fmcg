import { describe, it, expect } from "vitest";
import { isFreeLine, freeName } from "../free-line";
describe("free bill lines", () => {
  it("₹0 price and amount with quantity is free", () => expect(isFreeLine({ quantity: 2, unitPrice: 0, amount: 0 })).toBe(true));
  it("paid line is not free", () => expect(isFreeLine({ quantity: 2, unitPrice: 50, amount: 100 })).toBe(false));
  it("labels name once", () => expect(freeName(freeName("Soap", true), true)).toBe("Soap (Free)"));
});
