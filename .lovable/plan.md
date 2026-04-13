

# Final Site-Wide QA, CTO Review & Adversarial Stress Test

## Audit Results

### CRITICAL (Must fix before launch)

**C1. Billing.tsx — Double-nested Label tag (line 715)**
`<Label><Label>Document Type</Label></Label>` renders nested `<label>` elements — invalid HTML, screen readers will announce twice. This was flagged in a previous audit but the fix was not applied.

**C2. Landing page dark mode leak**
`Index.tsx` uses `className="light"` but this doesn't actually force light color scheme. The CSS class `light` has no definition — only `.dark` is defined. Users with system dark mode will see the landing page with dark theme variables. Need `style={{ colorScheme: "light" }}` and wrapping class that forces light tokens.

**C3. Pull-to-refresh scroll detection unreliable**
`usePullToRefresh` calls `getScrollParent(el)` which walks up from `containerRef` looking for `overflow-y: auto|scroll`. But `containerRef` is on the content div, while the actual scrollable parent is `<main ref={mainRef}>` in AppLayout. The hook may find `<main>` correctly sometimes but the `scrollTop > 0` check on the scroll parent should prevent false triggers. However, on pages where the content div has its own `overflow-y-auto` (if any remain from previous bugs), pull-to-refresh will break.

### HIGH (Fix before launch)

**H1. No `autoComplete` attributes on Login/Signup forms**
Login form lacks `autoComplete="email"` and `autoComplete="current-password"`. Signup form lacks `autoComplete="new-password"`. Password managers won't auto-fill correctly on mobile.

**H2. Signup flow calls `setup_new_company` before email verification**
`Signup.tsx` immediately calls `supabase.rpc("setup_new_company")` after `signUp()` and navigates to `/dashboard`. If email confirmation is required (which it should be per project rules), the user gets a company created but can't log in again until email is confirmed. The RPC should only be called after first login, not during signup.

**H3. Missing keyboard dismiss on mobile for order form**
On `NewOrder.tsx`, the quantity inputs use `inputMode="numeric"` which is correct, but the form doesn't dismiss the keyboard when tapping outside inputs. This is standard iOS behavior but causes the sticky save button to be obscured by the keyboard on some Android devices.

**H4. Dashboard empty state for Top Dealers/Products when no data**
If a new company has zero orders, `topDistributors` and `topProducts` arrays are empty, but the glass-cards still render (empty). Should show a minimal empty state or hide the sections.

**H5. Order total uses gross total, not net (after scheme savings)**
In `NewOrder.tsx`, `orderTotal` on line 173 is `lines.reduce(...)` — gross total. But the credit guard on line 178 uses this gross total for `projectedOutstanding`. It should use `orderTotal - totalSchemeSavings` for accurate credit projection. Same issue: the order is saved with `total: validLines.reduce(...)` (line 296) — gross total, while scheme savings are tracked separately. This is consistent but the credit guard is misleading.

**H6. Footer social links missing `key` stability**
`src/components/landing/sections/Footer.tsx` — if social links use array index as key, React may incorrectly recycle elements. Previous audit flagged using `href` as key — verify this was applied.

### MEDIUM (Fix for polish)

**M1. Login/Signup pages lack link back to landing page**
No way to navigate from `/login` or `/signup` back to the home page (`/`). Users who land directly on login have no escape route.

**M2. Settings page "Install App" card references `pwa-192.png`**
The file `public/pwa-192.png` may not exist. If missing, broken image renders.

**M3. Order date input allows future dates without warning**
`NewOrder.tsx` date input has no `max` constraint. Users can accidentally create orders dated in the future.

**M4. Distributor form `creditLimit` accepts negative values**
No validation prevents negative credit limits in the dealer form.

**M5. `animate-fade-in` class used on Login/Signup but not defined**
The class `animate-fade-in` is used in Login.tsx and Signup.tsx but may not be defined in Tailwind config or index.css.

**M6. Realtime channel doesn't subscribe to claims/invoices/targets/secondary_sales**
`DataContext.tsx` line 306-312 subscribes to 7 tables but omits `claims`, `invoices`, `targets`, and `secondary_sales`. Changes from other team members won't appear in real-time for these entities.

**M7. `DataContext.tsx` fetchAll uses `as any` casts extensively**
Lines 151-155, 169-170, 204, 207, 210 use `(company as any)`, `("claims" as any)`, etc. These bypass type safety and indicate the generated Supabase types are out of date.

---

## Implementation Plan

### Pass 1: Critical fixes
| File | Fix |
|------|-----|
| `src/pages/Billing.tsx:715` | Remove nested `<Label>` — change to single `<Label>` |
| `src/pages/Index.tsx:28` | Add `style={{ colorScheme: "light" }}` to force light theme |
| `src/components/landing/sections/Footer.tsx` | Verify `href` key on social links |

### Pass 2: High-priority fixes
| File | Fix |
|------|-----|
| `src/pages/Login.tsx` | Add `autoComplete` attributes to email/password inputs |
| `src/pages/Signup.tsx` | Add `autoComplete` attributes; add note about email verification flow |
| `src/pages/Dashboard.tsx` | Add empty-state guards for Top Dealers/Products sections |
| `src/pages/NewOrder.tsx:178` | Use net total (after scheme savings) for credit guard projection |

### Pass 3: Medium polish
| File | Fix |
|------|-----|
| `src/pages/Login.tsx` | Add "← Back to home" link |
| `src/pages/Signup.tsx` | Add "← Back to home" link |
| `src/pages/NewOrder.tsx` | Add `max={today}` to order date input |
| `src/context/DataContext.tsx` | Add realtime subscriptions for missing tables |

All fixes are surgical single-line or few-line edits. No new features. No behavior changes. Existing classNames and data flows preserved.

