import { describe, it, expect } from "vitest";
import { sanitizeInput } from "./sanitize";

describe("sanitizeInput", () => {
  it("strips HTML tags", () => {
    expect(sanitizeInput("<b>bold</b>")).toBe("bold");
  });

  it("strips script tags and content between them", () => {
    expect(sanitizeInput("<script>alert(1)</script>Hello")).toBe("alert(1)Hello");
  });

  it("removes control characters", () => {
    expect(sanitizeInput("a\x00b")).toBe("ab");
  });

  it("preserves tabs and newlines as single space", () => {
    expect(sanitizeInput("a\tb\nc")).toBe("a b c");
  });

  it("collapses multiple spaces", () => {
    expect(sanitizeInput("  too   many   spaces  ")).toBe("too many spaces");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitizeInput("")).toBe("");
  });
});
