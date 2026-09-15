import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatCurrencyPdf, formatMoneyPdf, pdfFilename } from "./exportPdf";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2025-06-15T12:00:00Z")); });
afterEach(() => { vi.useRealTimers(); });

describe("formatCurrencyPdf", () => {
  it("prefixes with the rupee sign", () => {
    expect(formatCurrencyPdf(1000)).toBe("₹1,000");
  });

  it("Indian comma grouping for lakhs", () => {
    expect(formatCurrencyPdf(100000)).toBe("₹1,00,000");
  });

  it("zero", () => {
    expect(formatCurrencyPdf(0)).toBe("₹0");
  });

  it("keeps paise when asked", () => {
    expect(formatCurrencyPdf(2124.5, 2)).toBe("₹2,124.50");
  });

  it("guards against non-finite input", () => {
    expect(formatCurrencyPdf(Number.NaN)).toBe("₹0");
  });
});

describe("formatMoneyPdf", () => {
  it("always shows two decimals", () => {
    expect(formatMoneyPdf(66080)).toBe("₹66,080.00");
    expect(formatMoneyPdf(1234.567)).toBe("₹1,234.57");
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
