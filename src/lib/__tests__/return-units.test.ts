import { describe, it, expect } from "vitest";
import { toMainUnits, checkReturnLine } from "../return-units";

describe("return units", () => {
  it("24 Bottles at 24 per Case is 1 Case", () => expect(toMainUnits(24, 24)).toBe(1));
  it("6 Bottles at 24 per Case is refused as a part-unit", () => expect(toMainUnits(6, 24)).toBeNull());
  it("main unit entries pass straight through", () => expect(toMainUnits(5, 1)).toBe(5));
  it("half a main unit is refused", () => expect(toMainUnits(0.5, 1)).toBeNull());
  it("remaining counts good, damaged-with-credit and damaged-without-credit together", () => {
    const r = checkReturnLine({ good: 24, damaged: 24, noCredit: 24 }, 24, 2);
    expect(r.totalMain).toBe(3);
    expect(r.overLimit).toBe(true);
  });
  it("exactly the remaining amount is allowed", () => {
    expect(checkReturnLine({ good: 48, damaged: 0, noCredit: 24 }, 24, 3).overLimit).toBe(false);
  });
});
