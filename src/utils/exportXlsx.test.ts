import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { xlsxFilename } from "./exportXlsx";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2025-06-15T12:00:00Z")); });
afterEach(() => { vi.useRealTimers(); });

describe("xlsxFilename", () => {
  it("generates dated .xlsx filename", () => {
    expect(xlsxFilename("orders")).toBe("orders_2025-06-15.xlsx");
  });

  it("uses entity name", () => {
    expect(xlsxFilename("dealers")).toBe("dealers_2025-06-15.xlsx");
  });

  it("ends with .xlsx extension", () => {
    expect(xlsxFilename("orders")).toMatch(/\.xlsx$/);
  });
});
