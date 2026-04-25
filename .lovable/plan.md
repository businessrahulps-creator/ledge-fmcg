# Add first-order celebration to NewOrder save flow

## Verification (already done)
- `src/pages/NewOrder.tsx` lines 324–330: success path uses a plain `toast.success(...)` then `navigate("/orders")` after 800ms. **No confetti, no milestone messaging.**
- `mem://features/orders` documents an "enterprise-calm" feedback style — no celebration on every save. The user-facing report ("missing confetti on first order") is consistent with treating the *very first* order as a milestone exception, while keeping subsequent saves calm.
- `canvas-confetti` and `@types/canvas-confetti` are already in `package.json` — no new dependency.
- A helper `trackFirstOrderCreated()` already exists in `src/hooks/use-install-prompt.ts` and is already called on every successful save (it's a localStorage flag for the install prompt, not for celebration).

## UX decision
Celebrate **only the first order ever saved** in this workspace. Every subsequent order keeps the existing calm toast + redirect. This honors the "enterprise-calm" memory while still giving the founder a real "you shipped it" moment on the milestone.

## Plan

### 1. `src/pages/NewOrder.tsx` — celebrate the first order
In the `executeSave` success branch (around lines 324–330):

- Detect the milestone using the in-memory `orders` array (already in scope from `useData`): `const isFirstEverOrder = orders.length === 0;` — evaluated **before** `addOrder` runs so the new order doesn't count itself. Stash it in a local before the `await addOrder(order)` call.
- On success:
  - If `isFirstEverOrder`:
    - Fire `canvas-confetti` with a tasteful 2-burst sequence (origin slightly left + slightly right, ~120 particles total, brand colors from the design tokens — primary blue + neutral accents). Spread 70, ticks 200, gravity 0.9. Wrapped in `try/catch` so a failure never blocks navigation.
    - Show a richer toast: `toast.success("Your first order is in! 🎉", { description: \`#${result.orderNumber} for ${dealer?.name} — ${formatCurrency(netOrderTotal)}\`, duration: 4500 })`.
    - Extend the redirect delay to ~1800ms so the confetti has room to breathe.
  - Else: keep the existing calm toast + 800ms redirect exactly as today.
- Keep the existing `addNotification(...)` call and `trackFirstOrderCreated()` call unchanged for both branches.

### 2. Import
Add `import confetti from "canvas-confetti";` at the top of `NewOrder.tsx`. No other files change.

### 3. Memory update
Append a short note to `mem://features/orders` clarifying: *"First order ever saved triggers a confetti burst + milestone toast. All subsequent saves stay calm (single toast + redirect)."* This reconciles the contradiction between the index ("multi-phase celebration") and the current calm pattern.

## Out of scope (intentionally)
- No celebration on every save — would clash with the "enterprise-calm" rule.
- No changes to validation, save logic, credit-limit gate, scheme calculation, navigation route, or notification center.
- No new dependency — `canvas-confetti` already installed.
- No changes to the Orders list page or detail page.

## Result
- The very first order a workspace ever creates triggers a confetti burst + a "Your first order is in! 🎉" toast with the order number, dealer, and amount.
- Every order after that uses the existing calm toast + 800ms redirect — unchanged.
- Zero risk to save logic, validation, or any other order flow.
