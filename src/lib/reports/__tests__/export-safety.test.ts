import { describe, it, expect } from "vitest";
import { csvSafeText } from "../exporters";

describe("csvSafeText", () => {
  it("neutralises formula-looking text", () => {
    for (const s of ["=cmd|' /C calc'!A0", "+1", "-2+3", "@SUM(A1)", "\t=x"]) expect(csvSafeText(s).startsWith("'")).toBe(true);
  });
  it("leaves normal names alone", () => {
    expect(csvSafeText("Adyar Wholesale")).toBe("Adyar Wholesale");
    expect(csvSafeText("श्री गणेश ट्रेडर्स 🙏")).toBe("श्री गणेश ट्रेडर्स 🙏");
  });
});
