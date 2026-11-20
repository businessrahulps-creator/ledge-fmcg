# New Offer form: start blank, no preset numbers

## What changes for you
- **New offer** opens with empty number boxes and a light grey hint instead of preset values:
  - Percentage: discount box empty (hint "e.g. 10")
  - Buy X Get Y: Buy quantity (hint "e.g. 10") and Free quantity (hint "e.g. 1") empty
  - Flat: discount amount empty (hint "e.g. 500")
  - Min order value: empty (hint "0 = no minimum"); blank means no minimum
- **Edit offer** still shows the saved numbers, fully editable.
- Boxes can be cleared while typing without jumping back to a number.
- Saving with a required box empty is stopped with a clear message, e.g. "Enter the buy quantity" or "Enter a discount percentage".
- The Buy X Get Y summary line waits until both quantities are filled.

## Steps
1. Form starts blank (Schemes page) and switching offer type does not inject numbers.
2. Validation messages for empty required boxes (scheme-form rules).
3. Checks: small tests for the empty-box rules, then a live run creating and editing one offer of each type.

## Not changing
Existing offers, how offers apply to orders, bills, stock, or prices.

## Technical details
- `Schemes.tsx`: default form values for discountPercent/buyQty/freeQty/flatAmount/minOrderValue become empty (undefined in form state, kept numeric on save); NumberInput `allowEmpty` + placeholders.
- `scheme-form.ts`: `validateSchemeForm` rejects missing/≤0 required values per type; `normalizeSchemeForm` turns blank min order value into 0; `buyXGetYSummary` returns null until both quantities valid.
- Tests added to existing scheme-form test file.
