import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { xlsxFilename, parseMoney, parseDateCell, buildWorksheet } from "./exportXlsx";
import * as XLSX from "xlsx";

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

describe("parseMoney", () => {
  it("reads rupee-formatted amounts", () => {
    expect(parseMoney("₹1,23,456.50")).toBe(123456.5);
    expect(parseMoney("-1234.5")).toBe(-1234.5);
    expect(parseMoney("(500)")).toBe(-500);
  });
  it("leaves non-numbers alone", () => {
    expect(parseMoney("-")).toBeNull();
    expect(parseMoney("Cash")).toBeNull();
    expect(parseMoney("")).toBeNull();
  });
});

describe("parseDateCell", () => {
  it("reads the date formats the app exports", () => {
    expect(parseDateCell("2026-09-15")?.getFullYear()).toBe(2026);
    expect(parseDateCell("15/09/2026")?.getMonth()).toBe(8);
    expect(parseDateCell("15 Sep 2026")?.getDate()).toBe(15);
  });
  it("ignores anything else", () => {
    expect(parseDateCell("not a date")).toBeNull();
  });
});

describe("buildWorksheet", () => {
  it("writes money as numbers and dates as dates", () => {
    const ws = buildWorksheet(XLSX, ["Date", "Dealer", "Amount"], [["2026-09-15", "Adyar", "₹1,200.50"]]);
    expect(ws.C2.t).toBe("n");
    expect(ws.C2.v).toBe(1200.5);
    expect(ws.A2.t).toBe("d");
    expect(ws.B2.t).toBe("s");
  });
});
