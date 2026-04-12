import { describe, it, expect } from "vitest";
import { numberToWords } from "./numberToWords";

describe("numberToWords", () => {
  it("zero", () => {
    expect(numberToWords(0)).toBe("Zero Rupees Only");
  });

  it("single digit", () => {
    expect(numberToWords(5)).toBe("Five Rupees Only");
  });

  it("teens", () => {
    expect(numberToWords(13)).toBe("Thirteen Rupees Only");
  });

  it("tens", () => {
    expect(numberToWords(40)).toBe("Forty Rupees Only");
  });

  it("tens with ones", () => {
    expect(numberToWords(73)).toBe("Seventy Three Rupees Only");
  });

  it("hundreds", () => {
    expect(numberToWords(500)).toBe("Five Hundred Rupees Only");
  });

  it("hundreds with remainder", () => {
    expect(numberToWords(215)).toBe("Two Hundred and Fifteen Rupees Only");
  });

  it("thousands", () => {
    expect(numberToWords(1234)).toBe(
      "One Thousand Two Hundred and Thirty Four Rupees Only"
    );
  });

  it("lakhs", () => {
    expect(numberToWords(123456)).toContain("One Lakh");
    expect(numberToWords(123456)).toBe(
      "One Lakh Twenty Three Thousand Four Hundred and Fifty Six Rupees Only"
    );
  });

  it("crores", () => {
    expect(numberToWords(10000000)).toBe("One Crore Rupees Only");
  });

  it("large amount with all groups", () => {
    // 1,23,45,678
    expect(numberToWords(12345678)).toBe(
      "One Crore Twenty Three Lakh Forty Five Thousand Six Hundred and Seventy Eight Rupees Only"
    );
  });

  it("paise only", () => {
    expect(numberToWords(0.50)).toBe("Fifty Paise Only");
  });

  it("rupees and paise", () => {
    expect(numberToWords(1234.56)).toBe(
      "One Thousand Two Hundred and Thirty Four Rupees and Fifty Six Paise Only"
    );
  });

  it("negative amount", () => {
    expect(numberToWords(-100)).toBe("Minus One Hundred Rupees Only");
  });

  it("99,99,99,999.99 — max Indian grouping", () => {
    const result = numberToWords(999999999.99);
    expect(result).toContain("Ninety Nine Crore");
    expect(result).toContain("Ninety Nine Lakh");
    expect(result).toContain("Ninety Nine Thousand");
    expect(result).toContain("Paise Only");
  });
});
