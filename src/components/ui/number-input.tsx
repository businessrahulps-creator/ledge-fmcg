import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "min" | "max"> {
  /** Current numeric value. `null` represents an empty field (only when allowEmpty). */
  value: number | null | undefined;
  /** Called with the parsed number, or `null` when the field is empty. */
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Allow decimal input. Defaults to false (integer-only). */
  allowDecimal?: boolean;
  /**
   * Allow the field to be empty (emits `null`). Defaults to true.
   * When false, blurring an empty field snaps to `min ?? 0`.
   */
  allowEmpty?: boolean;
  /**
   * Render as a rupee amount: prefixes ₹ inside the input and formats the
   * committed value with Indian commas on blur. While focused the field shows
   * raw digits so cursor/selection behaviour stays sane.
   */
  currency?: boolean;
  className?: string;
}

const inrFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/**
 * Numeric input with sane UX:
 *  - Can be cleared (no auto-snap to 0 while typing)
 *  - No leading-zero artifacts when overwriting
 *  - Correct mobile keyboard via inputMode
 *  - Clamps to min/max on blur
 *  - Rejects non-numeric keystrokes silently
 *
 * Always prefer this over `<Input type="number" />` for form fields.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onValueChange,
      min,
      max,
      allowDecimal = false,
      allowEmpty = true,
      currency = false,
      onBlur,
      onFocus,
      className,
      ...rest
    },
    ref,
  ) => {
    const valueAsString = value === null || value === undefined || Number.isNaN(value)
      ? ""
      : String(value);

    const [focused, setFocused] = React.useState(false);
    // Local string mirror so the user can type "0.", "", "5" etc. without the parent
    // value yanking the display back. We re-sync from props when the parent value
    // diverges from what we have parsed.
    const [draft, setDraft] = React.useState<string>(valueAsString);

    React.useEffect(() => {
      const parsedDraft = draft === "" ? null : Number(draft);
      const parentValue = value === undefined ? null : value;
      if (parsedDraft !== parentValue && !(Number.isNaN(parsedDraft) && parentValue === null)) {
        setDraft(valueAsString);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const validPattern = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
    const allowNegative = typeof min === "number" ? min < 0 : true;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let next = e.target.value;
      // Strip whitespace, commas (so users can paste "1,20,000"), normalise decimal.
      next = next.replace(/\s+/g, "").replace(/,/g, "");
      if (allowDecimal) next = next.replace(/(?!^)-/g, ""); // keep only leading minus
      // (comma already stripped; allow comma-as-decimal only when decimals allowed)

      if (next !== "" && !validPattern.test(next)) return; // reject keystroke
      if (!allowNegative && next.startsWith("-")) return;

      setDraft(next);

      if (next === "" || next === "-" || next === "." || next === "-.") {
        onValueChange(allowEmpty ? null : (min ?? 0));
        return;
      }
      const parsed = allowDecimal ? parseFloat(next) : parseInt(next, 10);
      if (Number.isNaN(parsed)) {
        onValueChange(allowEmpty ? null : (min ?? 0));
        return;
      }
      onValueChange(parsed);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      // When currency, switch to raw digits for editing.
      if (currency) {
        const raw = valueAsString;
        setDraft(raw);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      let committed: number | null;
      if (draft === "" || draft === "-" || draft === "." || draft === "-.") {
        committed = allowEmpty ? null : (min ?? 0);
      } else {
        const parsed = allowDecimal ? parseFloat(draft) : parseInt(draft, 10);
        committed = Number.isNaN(parsed) ? (allowEmpty ? null : (min ?? 0)) : parsed;
      }
      if (committed !== null) {
        if (typeof min === "number" && committed < min) committed = min;
        if (typeof max === "number" && committed > max) committed = max;
      }
      const nextDraft = committed === null
        ? ""
        : currency
          ? inrFormatter.format(committed)
          : String(committed);
      setDraft(nextDraft);
      onValueChange(committed);
      onBlur?.(e);
    };

    // When NOT focused and currency, show formatted version (overrides draft for display only).
    const displayValue = currency && !focused && draft !== "" && !Number.isNaN(Number(draft.replace(/,/g, "")))
      ? inrFormatter.format(Number(draft.replace(/,/g, "")))
      : draft;

    const input = (
      <Input
        {...rest}
        ref={ref}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          // Hide native spinners (they mostly add clutter and don't work well on touch)
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          currency && "pl-6",
          className,
        )}
      />
    );

    if (!currency) return input;

    return (
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/80 num"
        >
          ₹
        </span>
        {input}
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";
