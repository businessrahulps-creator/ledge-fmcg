## Goal

Close the gaps from today's QA so **every** numeric form field in the app uses the canonical `NumberInput`. No new features, no behavior change for users — just consistency, and removal of the last places where a leading-zero / can't-empty bug *could* sneak back in.

## Scope (4 surgical edits)

### 1. `src/pages/Targets.tsx` — `InlineTargetRow`
**Current:** raw `<Input type="text">` + manual regex + `Number(input) || 0`. Functionally OK today, but bypasses the standard.
**Fix:** Replace both Revenue Target and Orders Target inputs with `<NumberInput>`.
- Revenue: `allowDecimal={true}`, `allowEmpty={true}`, `min={0}`.
- Orders: `allowDecimal={false}`, `allowEmpty={true}`, `min={0}`.
- Drop the local `revInput` / `ordInput` string state — store numbers directly (`targetRev: number | null`).
- Keep the existing `onBlur={handleSave}` autosave behavior. `dirty` flag stays.
- Empty field → treat as `0` only at save time (so users can fully clear without flicker).

### 2. `src/pages/NewOrder.tsx` — order line quantity
**Current:** shadow-string `quantityStr` + `parseInt`, with `quantity: 0` when empty.
**Fix:**
- Drop `quantityStr` from `OrderLineState`.
- Change `quantity` to `number | null` in the line model.
- Use `<NumberInput allowEmpty={true} min={1}>` for the input.
- Update `getLineTotal` and `orderTotal` to treat `null` as `0`.
- Update validation: existing "must have at least one line with qty > 0" check stays; just read `l.quantity ?? 0`.
- Remove `handleQuantityBlur` — `NumberInput`'s built-in blur clamp replaces it.

### 3. `src/pages/OrderDetail.tsx` — line quantity edit
**Current:** same shadow-string pattern as NewOrder (line 179).
**Fix:** Mirror the NewOrder change exactly — same model shift (`number | null`), same `NumberInput` swap, same null-as-zero treatment in totals.

### 4. `src/pages/Billing.tsx` — read-only quantity / unit price (lines 940, 948)
**Current:** `<Input type="number" readOnly />` for display-only cells.
**Fix:** Change to `<Input type="text" readOnly value={String(line.quantity)} />` (or just render as text in the cell). `type="number"` on a read-only field still shows browser spinners on some platforms and is semantically wrong for display.

## Out of scope
- No DataContext schema change.
- No change to `saveOrderFn` / API payload shape (a `null` quantity is normalized to `0` at save, exactly matching today's behavior on submit).
- Targets autosave timing untouched.
- Stock page already migrated this morning — not retouched.

## Verification
- `tsc --noEmit` clean.
- `bunx vitest run` green (114 tests, no input-specific tests should break).
- Manual smoke (mental walkthrough only — no preview test required from the user):
  - Targets: clear a value → field stays empty, save → persists as 0. Type `50` → no leading zero.
  - NewOrder: clear quantity → line total recalculates as 0, can't submit; type `2` → totals update; backspace works freely.
  - OrderDetail: same as NewOrder while editing an existing order.
  - Billing read-only cells: no native spinners, value renders identically.

## Memory
Append a one-line note to `mem://style/number-inputs.md`: *"Verified: all numeric form fields across Stock, Targets, Orders (NewOrder + OrderDetail), Schemes, Performance, Distributors, Claims, DealerDetail, Billing now use NumberInput. Read-only numeric displays should use `type="text"`, not `type="number"`."*

## Why this is safe to ship today
Every change is a like-for-like swap to a component that has already been in production for the rest of the app since this morning. No new pathways, no API changes, no migrations. The only user-visible difference is *good* — empty fields actually stay empty on these last four screens too.
