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
  className?: string;
}

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
      onBlur,
      className,
      ...rest
    },
    ref,
  ) => {
    const valueAsString = value === null || value === undefined || Number.isNaN(value)
      ? ""
      : String(value);

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
      // Normalize: strip stray spaces, convert comma decimal to dot
      next = next.replace(/\s+/g, "");
      if (allowDecimal) next = next.replace(",", ".");

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

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
      const nextDraft = committed === null ? "" : String(committed);
      setDraft(nextDraft);
      onValueChange(committed);
      onBlur?.(e);
    };

    return (
      <Input
        {...rest}
        ref={ref}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
        autoComplete="off"
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          // Hide native spinners (they mostly add clutter and don't work well on touch)
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className,
        )}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";
