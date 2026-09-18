import { describe, it, expect } from "vitest";
import { billStateFromMoney } from "../bill-status";

describe("a bill is paid only at exactly zero due", () => {
  it("keeps a few paise short as partly paid", () => {
    expect(billStateFromMoney(1000, 999.6, 0)).toBe("partial");
    expect(billStateFromMoney(1000, 999.99, 0)).toBe("partial");
  });

  it("marks it paid when nothing is left", () => {
    expect(billStateFromMoney(1000, 1000, 0)).toBe("paid");
    expect(billStateFromMoney(1000, 600, 400)).toBe("paid");
  });

  it("is still unpaid when no money has landed", () => {
    expect(billStateFromMoney(1000, 0, 0)).toBe("posted");
  });
});
