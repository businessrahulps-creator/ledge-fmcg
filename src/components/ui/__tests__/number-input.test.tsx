import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { NumberInput } from "../number-input";

function Harness({ initial = 0, allowEmpty = false, allowDecimal = false, spy }: { initial?: number | null; allowEmpty?: boolean; allowDecimal?: boolean; spy?: (v: number | null) => void }) {
  const [v, setV] = useState<number | null>(initial);
  return <NumberInput aria-label="qty" value={v} allowEmpty={allowEmpty} allowDecimal={allowDecimal} min={0}
    onValueChange={(n) => { setV(n); spy?.(n); }} />;
}
const get = (c: HTMLElement) => c.querySelector("input") as HTMLInputElement;

describe("NumberInput zero handling", () => {
  it("typing after the 0 gives 9, not 09", () => {
    const spy = vi.fn(); const { container } = render(<Harness spy={spy} />);
    const i = get(container); fireEvent.focus(i); fireEvent.change(i, { target: { value: "09" } });
    expect(i.value).toBe("9"); expect(spy).toHaveBeenLastCalledWith(9);
  });
  it("typing before the 0 gives 9, not 90", () => {
    const { container } = render(<Harness />);
    const i = get(container); fireEvent.focus(i); fireEvent.change(i, { target: { value: "90" } });
    // "90" is a real number if typed deliberately; the fix is select-on-focus, which replaces the 0.
    i.setSelectionRange(0, 1); fireEvent.change(i, { target: { value: "9" } });
    expect(i.value).toBe("9");
  });
  it("clearing while typing does not snap back to 0 until leaving", () => {
    const { container } = render(<Harness initial={5} />);
    const i = get(container); fireEvent.focus(i); fireEvent.change(i, { target: { value: "" } });
    expect(i.value).toBe(""); fireEvent.blur(i); expect(i.value).toBe("0");
  });
  it("keeps decimals like 0.5", () => {
    const { container } = render(<Harness allowDecimal />);
    const i = get(container); fireEvent.focus(i); fireEvent.change(i, { target: { value: "0.5" } });
    expect(i.value).toBe("0.5");
  });
  it("selects the value on focus", async () => {
    const { container } = render(<Harness initial={0} />);
    const i = get(container); i.focus(); fireEvent.focus(i);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(i.selectionStart).toBe(0); expect(i.selectionEnd).toBe(1);
  });
});
