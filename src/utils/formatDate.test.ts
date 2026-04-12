import { describe, it, expect } from "vitest";
import { formatIndianDate } from "./formatDate";

describe("formatIndianDate", () => {
  it("null returns dash", () => {
    expect(formatIndianDate(null)).toBe("—");
  });

  it("undefined returns dash", () => {
    expect(formatIndianDate(undefined)).toBe("—");
  });

  it("empty string returns dash", () => {
    expect(formatIndianDate("")).toBe("—");
  });

  it("invalid string returns dash", () => {
    expect(formatIndianDate("garbage")).toBe("—");
  });

  it("YYYY-MM-DD string formats as DD/MM/YYYY", () => {
    const result = formatIndianDate("2025-01-15");
    expect(result).toBe("15/01/2025");
  });

  it("ISO string formats correctly", () => {
    const result = formatIndianDate("2025-06-30T14:30:00Z");
    // In IST (UTC+5:30) this is 30/06/2025 at 8pm — same day
    expect(result).toBe("30/06/2025");
  });

  it("Date object formats correctly", () => {
    // Use a date that's the same in UTC and IST
    const result = formatIndianDate(new Date("2025-03-10T12:00:00Z"));
    expect(result).toBe("10/03/2025");
  });

  it("output is DD/MM/YYYY format (not MM/DD/YYYY)", () => {
    // 15th of February — if DD/MM, should start with "15"
    const result = formatIndianDate("2025-02-15");
    expect(result.startsWith("15")).toBe(true);
  });
});
