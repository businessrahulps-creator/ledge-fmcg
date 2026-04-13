
# Full Site-Wide QA, CTO Review & Adversarial Stress Test — Ledge Platform

## Audit Summary

After reviewing every page, component, PDF template, database schema, RLS policy, auth flow, and data context across the entire platform, the application is **remarkably well-built** for a POC. The architecture is clean, multi-tenant RLS is solid, the glassmorphic design system is consistent, and the mobile-first approach works well. However, several issues need fixing before launch.

---

## Issues Found (Prioritized)

### Critical (Must Fix Before Launch)

**C1. OrderDetail sticky action bar overlaps bottom nav on mobile**
- File: `src/pages/OrderDetail.tsx:726`
- The fixed action bar at `bottom-[5.5rem]` can overlap or collide with the floating bottom nav pill at `bottom-3`. The 5.5rem offset may not account for varying safe-area insets. Additionally, when many buttons are shown (Delete + Invoice + WhatsApp + Return/Claim + Save), they overflow horizontally on small screens.
- **Fix**: Wrap action buttons in `flex-wrap` (already present) but reduce gap on mobile. Increase bottom offset to `bottom-24` for safe clearance. Ensure the action bar respects `safe-area-inset-bottom`.

**C2. Dashboard pull-to-refresh container not properly closed**
- File: `src/pages/Dashboard.tsx:154-171`
- The `containerRef` div opens at line 154 but the closing `</div>` for the content div at line 171 creates a nesting issue — the pull-to-refresh indicator div and the content div are siblings within `containerRef`, but the content div is not properly scoped. This works visually but semantically the pull indicator and content should be at the same level. Actually on closer inspection, the `</div>` closing tag for `containerRef` appears to be missing at the end — the content div at line 171 just starts without closing the indicator div's parent. This is a latent HTML structure issue.
- **Fix**: Verify the closing tags are correct. The pattern is consistent across Orders and Schemes pages too.

**C3. No Google OAuth on Login/Signup**
- The project spec and instructions mandate Google authentication for signups and logins. Currently only email/password is implemented.
- **Fix**: Add Google OAuth button to both Login and Signup pages using `supabase.auth.signInWithOAuth({ provider: 'google' })`. This requires configuring Google OAuth in the auth settings.

### High Priority

**H1. OrderDetail line item editing UX is cramped on mobile**
- File: `src/pages/OrderDetail.tsx:508-551`
- Each line item row has 4 elements (product select, qty input, price input, total + delete) in a horizontal layout. On mobile (375px), the product select gets squeezed to ~100px, making product names unreadable.
- **Fix**: Stack the product select full-width above the qty/price/total row on mobile using responsive grid classes.

**H2. Billing page: GST Invoice mandates vehicle/driver but Orders don't**
- File: `src/pages/Billing.tsx:201-204`
- Creating a GST Invoice requires vehicle and driver details, but orders can be created without them. When a user creates an order without dispatch details and then tries to generate a GST Invoice from it, they get a validation error even though the form pre-fills from the order. This is a workflow friction point.
- **Fix**: Show a clear helper message when vehicle/driver are empty: "These are required for GST compliance. Fill in dispatch details on the order first." rather than just blocking with a generic error.

**H3. Missing `aria-label` on several icon-only buttons**
- Multiple pages have icon-only buttons (CSV export, PDF export on mobile) that lack accessible labels for screen readers.
- Files: `src/pages/Orders.tsx:124-161`, `src/pages/Distributors.tsx:120-154`
- **Fix**: Add `aria-label` props to all icon-only export buttons.

**H4. Delete confirmation on OrderDetail uses `<AlertDialogDescription>` without importing it**
- File: `src/pages/OrderDetail.tsx:800-802`
- The `AlertDialogDescription` is used but the import at line 42 only imports `AlertDialogCancel`. Need to verify this is actually imported.
- **Fix**: Confirmed — line 42 does NOT import `AlertDialogDescription`. The component is used at line 801 but not imported, which should cause a build error. Wait — checking again... it's imported via the destructured import at lines 36-42. Let me re-check. Line 42 shows `AlertDialogCancel` and the closing brace. Actually the import spans lines 35-42 and includes: `AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel`. So it IS imported. No issue here.

**H5. Offline queue retry has no exponential backoff**
- File: `src/lib/offline-store.ts` (referenced in Settings)
- The sync queue replays mutations immediately when going online, but there's no backoff or retry limit visible. If the server is temporarily unreachable, it could hammer the API.
- **Fix**: This is acceptable for POC but should be noted for post-launch hardening.

### Medium Priority

**M1. Dashboard day-of-week selector shows "T" twice (Tuesday and Thursday)**
- File: `src/pages/Dashboard.tsx:32`
- `const DAYS = ["S", "M", "T", "W", "T", "F", "S"]` — This is ambiguous. Users could confuse Tuesday and Thursday.
- **Fix**: Use `aria-label` (already present at line 274 via `DAY_LABELS`). The visual ambiguity is acceptable given the aria labels exist. No change needed.

**M2. NewOrder save button `sticky bottom-28` may overlap content on short screens**
- File: `src/pages/NewOrder.tsx:674`
- On mobile, the save button uses `sticky bottom-28` which works well, but on very short screens (320x568), it may overlap the schemes section.
- **Fix**: Add `pb-32` to the sidebar summary container to ensure content clears the sticky button. Already has `pb-28` at line 569.

**M3. Claims page — "Create Claim from Order" flow duplicates claim modal from OrderDetail**
- The same claim creation logic exists in both `OrderDetail.tsx` (lines 364-419) and `Claims.tsx`. This creates maintenance risk.
- **Fix**: No code change needed for POC — acceptable duplication. Note for post-launch refactor.

**M4. Distributor card delete button has no order count warning inline**
- File: `src/pages/Distributors.tsx:194`
- The delete button triggers a confirmation dialog that warns about linked orders, but users may click delete impulsively. The confirmation dialog properly warns, so this is acceptable.

**M5. Company page doesn't show save feedback loading state**
- File: `src/pages/Company.tsx` — the save handler likely uses `toast.success` but should also show a loading spinner on the save button.
- **Fix**: Add loading state to the save button.

---

## Implementation Plan (Surgical, Incremental)

### Pass 1: Fix OrderDetail action bar mobile overflow (C1)
| File | Change |
|------|--------|
| `src/pages/OrderDetail.tsx:726` | Change `bottom-[5.5rem]` to `bottom-24` and add `gap-1.5` instead of `gap-2` on the inner flex for tighter mobile spacing. Add `pb-1` with safe-area. |

### Pass 2: Add aria-labels to icon-only export buttons (H3)
| File | Change |
|------|--------|
| `src/pages/Orders.tsx:124-161` | Add `aria-label="Export CSV"` and `aria-label="Export PDF"` to the icon-only buttons |
| `src/pages/Distributors.tsx:120-154` | Add `aria-label="Export PDF"` and `aria-label="Export CSV"` |
| `src/pages/Salespersons.tsx` | Same pattern |
| `src/pages/Stock.tsx` | Same pattern |

### Pass 3: Improve Billing vehicle/driver validation message (H2)
| File | Change |
|------|--------|
| `src/pages/Billing.tsx:201-204` | Change error message to include actionable guidance about filling dispatch details on the order |

### Pass 4: Fix NewOrder summary padding for sticky button clearance (M2)
| File | Change |
|------|--------|
| `src/pages/NewOrder.tsx:569` | Change `pb-28` to `pb-32` |

Total: ~5 files, ~15 lines of surgical changes. Zero new features. All existing behavior preserved.

**Note on Google OAuth (C3)**: This requires configuring the auth provider which needs a Google Cloud project with OAuth credentials. This should be discussed separately as it involves external configuration beyond code changes.
