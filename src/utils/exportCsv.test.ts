import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { csvFilename } from "./exportCsv";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2025-06-15T12:00:00Z")); });
afterEach(() => { vi.useRealTimers(); });

describe("csvFilename", () => {
  it("generates dated filename", () => {
    expect(csvFilename("orders")).toBe("orders_2025-06-15.csv");
  });

  it("uses entity name", () => {
    expect(csvFilename("dealers")).toBe("dealers_2025-06-15.csv");
  });
});
