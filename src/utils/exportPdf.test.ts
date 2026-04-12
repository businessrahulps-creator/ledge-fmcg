import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatCurrencyPdf, pdfFilename } from "./exportPdf";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2025-06-15T12:00:00Z")); });
afterEach(() => { vi.useRealTimers(); });

describe("formatCurrencyPdf", () => {
  it("prefixes with Rs.", () => {
    expect(formatCurrencyPdf(1000)).toBe("Rs. 1,000");
  });

  it("Indian comma grouping for lakhs", () => {
    expect(formatCurrencyPdf(100000)).toBe("Rs. 1,00,000");
  });

  it("zero", () => {
    expect(formatCurrencyPdf(0)).toBe("Rs. 0");
  });
});

describe("pdfFilename", () => {
  it("without suffix", () => {
    expect(pdfFilename("invoice")).toBe("invoice_2025-06-15.pdf");
  });

  it("with suffix", () => {
    expect(pdfFilename("invoice", "ORD-001")).toBe("invoice_ORD-001_2025-06-15.pdf");
  });
});
