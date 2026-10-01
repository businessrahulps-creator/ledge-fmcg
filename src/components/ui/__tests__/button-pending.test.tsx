import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Button } from "../button";

describe("Button auto-pending", () => {
  it("stays busy while an async onClick runs and ignores extra taps", async () => {
    let resolve!: () => void;
    const fn = vi.fn(() => new Promise<void>((r) => { resolve = r; }));
    render(<Button onClick={fn}>Save</Button>);
    const btn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(btn);
    expect(fn).toHaveBeenCalledTimes(1);
    await act(async () => { resolve(); });
    expect(btn.getAttribute("aria-busy")).toBeNull();
  });

  it("does nothing special for a plain onClick", () => {
    render(<Button onClick={() => {}}>Open</Button>);
    const btn = screen.getByRole("button", { name: /open/i });
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-busy")).toBeNull();
  });
});
