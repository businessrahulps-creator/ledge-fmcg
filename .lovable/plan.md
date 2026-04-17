

## Fix: Redundant "Back" button cluttering mobile billing flow

### Problem
In `Billing.tsx` (line 988–1004), the create-invoice dialog footer renders three buttons: **Back**, **Cancel**, **Create as Draft / Create Document**. On mobile, `DialogFooter` stacks these vertically, putting a separate "Back" button below "Cancel" — visually redundant since Cancel already exits the flow, and "Back" looks like a third action competing with the primary CTA. Users complained it feels cluttered.

On desktop the layout is fine (buttons sit inline, right-aligned with Back pushed left via `mr-auto`).

### Fix (single-file, surgical)

**`src/pages/Billing.tsx`** — line ~988–1004 (DialogFooter in step 2 of create-invoice dialog)

- Move the "Back" affordance out of `DialogFooter` and render it as a subtle inline link/ghost button at the **top of step 2's content** (next to or above the section heading), where it acts as a navigational "go back to order selection" instead of competing with primary actions.
- On mobile this removes a stacked button entirely; on desktop it becomes a small ghost link near the top — cleaner and more conventional (matches the standard "wizard back arrow at top-left" pattern used elsewhere in the app, e.g. detail pages).
- Keep the existing reset logic (`setStep(1); setSourceOrderId(""); setLines([]); ...`) wired to the new top placement.
- Remove the `Back` button from `DialogFooter` so only **Cancel** + primary CTA remain — exactly what mobile users expect.

### Why this works
- Eliminates the third stacked button on mobile (the actual complaint).
- Preserves the ability to go back to step 1 — just relocates it to a less prominent, more discoverable spot.
- No behavioral change to step 1, edit mode, or desktop primary actions.
- No other files touched, no logic changes, no styling tokens changed.

### Out of scope
No changes to step 1, edit mode, validation, PDF generation, dialog open/close, or any other Billing logic.

