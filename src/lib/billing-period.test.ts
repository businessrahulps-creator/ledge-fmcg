import { describe, it, expect } from "vitest";
import { resolveWindow, inWindow, dayKeyOf } from "./billing-period";
import { getPeriodKeys } from "@/components/reports/TimePeriodFilter";

describe("Money to Collect picked dates", () => {
  it("same From and To keeps only that day", () => {
    const w = resolveWindow("custom", "2026-11-10", "2026-11-10");
    expect(inWindow("2026-11-10", w)).toBe(true);
    expect(inWindow("2026-11-09", w)).toBe(false);
    expect(inWindow("2026-11-11", w)).toBe(false);
  });
  it("includes a record stamped 23:59 India time on the To day", () => {
    const w = resolveWindow("custom", "2026-11-01", "2026-11-10");
    expect(inWindow("2026-11-10T23:59:00+05:30", w)).toBe(true);
    expect(inWindow("2026-11-11T00:01:00+05:30", w)).toBe(false);
  });
  it("a UTC timestamp just before midnight UTC counts on the next India day", () => {
    expect(dayKeyOf("2026-11-10T20:00:00Z")).toBe("2026-11-11");
  });
  it("From after To is refused", () => {
    expect(resolveWindow("custom", "2026-11-12", "2026-11-10")).toBeNull();
  });
  it("presets keep their existing window and All time has none", () => {
    expect(resolveWindow("weekly")).toEqual(getPeriodKeys("weekly"));
    expect(resolveWindow("all")).toBeNull();
  });
});
