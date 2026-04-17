

## Final Review — Remaining Polish Opportunities

After re-auditing the post-Category-1–5 + QA-fix codebase, here's what's actually left. No new features, all tiny.

---

IMPROVEMENT SUGGESTIONS

### UX / Polish

1. **Telephone & numeric inputs use `inputMode="tel"` / `"decimal"` everywhere**
   Phone fields (Distributors, Salespersons, Company) and price/amount fields still use plain `type="text"` — adding `inputMode` pops the right Android keypad and saves taps for field salespeople.
   *Impact: High · Effort: Very Small*

2. **Tabular numerics in money columns**
   Several tables (Orders totals column, OrderDetail lines, Billing list) don't use `tabular-nums` — adding the class makes columns of ₹ amounts align cleanly during scroll.
   *Impact: Medium · Effort: Very Small*

### Performance & Responsiveness

3. **Strip `console.*` in production builds**
   90 `console.log/warn/error` calls ship to users; adding Vite's `esbuild.drop: ["console", "debugger"]` in `vite.config.ts` (prod only) shrinks bundle slightly and stops leaking internal errors to end-user devtools.
   *Impact: Medium · Effort: Very Small*

### Reliability & Edge Cases

4. **Replace remaining `.toLocaleString("en-IN")` direct calls with `formatCurrency`**
   ~15 sites in `Billing.tsx`, `OrderDetail.tsx`, `shareWhatsApp.ts` still hand-roll currency. Funnelling through the canonical helper guarantees one source of truth for ₹ symbol, decimals, and the lakh/crore grouping fix shipped in Category 1.
   *Impact: High · Effort: Very Small*

5. **Tighten `: any` usage in domain hooks**
   `useBillingDomain.ts` row-mapping uses `(data as any[]).map((inv: any) => …)` — the Supabase generated `Database` types are available, casting to the row type instead of `any` catches column-rename bugs at compile time.
   *Impact: Medium · Effort: Small*

### Code Quality / Maintainability

6. **Extract row-mappers from domain hooks**
   The 200-char inline `inv => ({...})` mappers in `useBillingDomain` (and similar in orders/stock domains) are hard to read and duplicated between fetch + realtime paths. Move each to a `mapInvoiceRow(row)` function in the same file.
   *Impact: Medium · Effort: Small*

### Indian FMCG Specific Improvements

7. **Phone number normalization on save**
   When a user pastes "+91 98765 43210" or "098765-43210" into a dealer/salesperson phone field, store it as the canonical 10-digit form. Prevents WhatsApp share failures and duplicate-dealer bugs from cosmetic-only differences.
   *Impact: High · Effort: Very Small*

8. **GST validation on invoice generation**
   When generating a GST invoice, verify the dealer has a valid GSTIN and a state code matching the first 2 digits — otherwise auto-fall-back to a non-GST cash bill and show a soft warning. Prevents filing-time chaos for the accountant.
   *Impact: High · Effort: Small*

---

8 suggestions, all "tiny but high-impact". Awaiting your pick before any code changes.

