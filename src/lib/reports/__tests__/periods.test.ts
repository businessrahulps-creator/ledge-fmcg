import { describe, it, expect } from "vitest";
import { periodRange, previousRange } from "../periods";
import { totalsOf } from "../format";

describe("report periods", () => {
  it("financial year starts 1 April", () => {
    expect(periodRange("fy", "2026-10-01")).toEqual({ from: "2026-04-01", to: "2026-10-01" });
    expect(periodRange("fy", "2027-02-10")).toEqual({ from: "2026-04-01", to: "2027-02-10" });
  });
  it("last month handles January and month lengths", () => {
    expect(periodRange("last_month", "2026-01-15")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(periodRange("last_month", "2026-03-05")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });
  it("week starts Monday", () => {
    expect(periodRange("week", "2026-10-01").from).toBe("2026-09-28"); // Thursday -> Monday
  });
  it("previous range is the same length just before", () => {
    expect(previousRange("2026-10-01", "2026-10-10")).toEqual({ from: "2026-09-21", to: "2026-09-30" });
  });
  it("totals round to paise", () => {
    expect(totalsOf([{ key: "a", header: "A", total: true }], [{ a: 0.1 }, { a: 0.2 }])).toEqual({ a: 0.3 });
  });
});
