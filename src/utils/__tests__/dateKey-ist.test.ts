import { describe, it, expect, vi, afterEach } from "vitest";
import { todayKey, istDateKey, addDaysToKey } from "../dateKey";

afterEach(() => vi.useRealTimers());

describe("calendar days follow India, not UTC", () => {
  it("late-evening UTC is already the next day in India", () => {
    // 2026-03-10 20:00 UTC = 2026-03-11 01:30 IST
    expect(istDateKey(new Date("2026-03-10T20:00:00Z"))).toBe("2026-03-11");
  });

  it("early-morning UTC is still the same India day", () => {
    expect(istDateKey(new Date("2026-03-10T02:00:00Z"))).toBe("2026-03-10");
  });

  it("today uses the India clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T19:30:00Z"));
    expect(todayKey()).toBe("2026-03-11");
  });

  it("shifting days stays on the calendar", () => {
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
  });
});
