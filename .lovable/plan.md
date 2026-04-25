# Fix Number Input UX (Empty + Leading Zero + Mobile Keyboard)

## The Problem

Across the app, almost every numeric field uses this pattern:

```tsx
<Input
  type="number"
  value={state.qty}              // a number
  onChange={(e) => setState({ ...state, qty: parseInt(e.target.value) || 0 })}
/>
```

This causes three real-world UX failures users keep hitting:

1. **Can't clear the field.** Backspace empties the input → `parseInt("")` is `NaN` → `|| 0` snaps state back to `0` → display shows `0` → user must manually highlight and overwrite.
2. **Leading zero.** Field shows `0`, user types `5` → display becomes `05` (or `50` depending on cursor) instead of `5`.
3. **Wrong mobile keyboard.** `type="number"` on iOS shows a keyboard with `,` and `-` and the wrong layout; on Android it varies. The numeric keypad (`inputMode="numeric"` / `decimal"`) is what users actually want.

### Where this hurts (15+ inputs)

- **Stock**: `basePrice`, warehouse `quantity`, `threshold`, `addStockQty` (`Stock.tsx` lines 687, 795, 805, 866)
- **Schemes**: `discountPercent`, `buyQty`, `freeQty`, `flatAmount`, `minOrderValue`, `minQty` (`Schemes.tsx` lines 357–415)
- **Targets**: monthly/yearly target values (`Targets.tsx` lines 182, 203)
- **Performance**: `dailyTarget` (`Performance.tsx` line 549)
- **NewOrder**: line `unitPrice` (line 527) — note that `quantity` already uses the correct pattern with a `quantityStr` shadow
- **OrderDetail**: line `unitPrice` (line 476), claim `quantity` (line 848)
- **Claims**: claim `quantity` (line 356)
- **Distributors**: `creditLimit` (line 282)
- **DealerDetail**: standing-order `quantity` (line 531)
- **Billing**: editable `gstRate` (line 894)

The `quantityStr` pattern in `NewOrder.tsx` (lines 42, 154, 166–171) is the proven shape of the fix — we just need to extract and reuse it.

## The Fix: One Reusable `NumberInput` Component

Create `src/components/ui/number-input.tsx` that wraps the existing `<Input>` and handles the edge cases internally, so callers stay simple.

### Behavior (the "best-practice" UX)

| Action | Result |
|---|---|
| Empty field | Stays empty (no snap to `0`); state value is `null` (or `0` if `allowEmpty=false`) |
| Type `5` over `0` | Displays `5`, not `05` |
| Type `0` then `5` | Displays `5` |
| Type `1.2` (when `decimal`) | Allowed |
| Type letters / extra dots | Silently rejected (input doesn't update) |
| Blur with empty + `min` set | Snaps to `min` (or stays empty if `allowEmpty`) |
| Blur with value below `min` / above `max` | Clamps to range |
| Mobile keyboard | `inputMode="numeric"` (integer) or `inputMode="decimal"` |
| Desktop spinners | Hidden (CSS) — they're cluttered and rarely used |
| Increment buttons | Optional `showSteppers` prop renders large +/- buttons (useful for Qty fields, opt-in) |

### API

```tsx
<NumberInput
  value={state.qty}                 // number | null
  onValueChange={(n) => setState({ ...state, qty: n })}
  min={0}
  max={28}
  allowDecimal                      // false → integer-only
  allowEmpty                        // default true; false forces a number always
  placeholder="0"
  className="h-10 rounded-lg"
/>
```

Internally:
- Keep a local `string` state for what's typed (the `quantityStr` trick).
- On every keystroke, validate against a regex (`/^\d*$/` or `/^\d*\.?\d*$/`), reject invalid input, and emit the parsed number (or `null` for empty) to the parent.
- On blur, normalize: strip leading zeros (`"05"` → `"5"`), clamp to `min`/`max`, and re-sync the display string with the committed value.
- Use `type="text"` under the hood (not `type="number"`) — this is the only reliable way to prevent browser auto-formatting and get consistent behavior across iOS/Android/desktop.

### Files to add

- **`src/components/ui/number-input.tsx`** — new component (~80 lines)
- **`src/components/ui/__tests__/number-input.test.tsx`** — vitest coverage for: empty clearing, leading-zero stripping, decimal toggle, min/max clamping, paste handling

### Files to migrate (replace `<Input type="number" ...>` + `parseInt || 0`)

1. `src/pages/Stock.tsx` (4 inputs)
2. `src/pages/Schemes.tsx` (6 inputs)
3. `src/pages/NewOrder.tsx` (price field — keep existing qty pattern, optionally also swap it to `NumberInput` for consistency)
4. `src/pages/OrderDetail.tsx` (2 inputs)
5. `src/pages/Claims.tsx` (1 input)
6. `src/pages/Targets.tsx` (2 inputs)
7. `src/pages/Performance.tsx` (1 input — daily target)
8. `src/pages/Distributors.tsx` (credit limit)
9. `src/pages/DealerDetail.tsx` (standing-order qty)
10. `src/pages/Billing.tsx` (GST rate)

State types stay as `number` — the only call-site change is swapping the JSX and the `onChange` for `onValueChange`. For fields where `null` would break math (e.g. unitPrice in calculations), pass `allowEmpty={false}` so the value stays a number, while still avoiding the leading-zero bug during typing.

### Memory update

Add `mem://style/number-inputs` documenting the rule:
> All numeric form fields use `<NumberInput>` from `@/components/ui/number-input`. Never use `<Input type="number">` + `parseInt(e.target.value) || 0` — it traps users in a `0` state and prevents clearing.

## Out of Scope (intentionally)

- Currency formatting with thousand separators while typing (₹1,23,456) — adds complexity, can come later if requested.
- Long-press accelerating steppers — wait for real demand.
- Touch this in the AI features sprint (next month) — this is a foundational UX fix that should land first so the new screens use the right pattern.

## Risk

Very low. The change is mechanical, the proven pattern already exists in `NewOrder.tsx`, and each migrated input remains visually identical — only the typing behavior improves. Tests + a manual pass on Stock + Schemes (the highest-frequency pages) will confirm.
