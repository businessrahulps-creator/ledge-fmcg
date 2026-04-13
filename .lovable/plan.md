
# Full Site-Wide QA, CTO Review, and Production Readiness Audit

## Fresh Audit Findings

### CRITICAL (Must fix before launch)

**C1. Landing page forces `light` theme — breaks dark mode users**
`src/pages/Index.tsx` line 28: `data-theme="light"` and `style={{ colorScheme: "light" }}` hardcoded. When a dark-mode user navigates to `/`, then back to `/dashboard`, residual style override may flash. This is intentional per memory, but the landing page violet/indigo tokens (`--violet: #7C3AED`) clash with the new teal primary on dashboard — returning users see a jarring palette shift.

**C2. `insert_order_atomic` has TWO versions in the database**
The DB functions list shows two `insert_order_atomic` — one with `p_scheme_savings` parameter, one without. The older version (without `p_scheme_savings`) will shadow or cause ambiguity. The migration may have added the new overload but not dropped the old one.

**C3. No foreign keys anywhere**
Every table shows "No foreign keys" — `distributor_id`, `product_id`, `order_id`, etc. are all unlinked. This means orphaned records are possible (delete a dealer, orders still reference it). While RLS is solid, referential integrity is absent.

### HIGH (Should fix before launch)

**H1. PDF: OrderInvoicePdf title says "Invoice" but it's an Order Summary**
`src/components/pdf/OrderInvoicePdf.tsx` line 54: `title="Invoice ${order.orderNumber}"` — this is misleading. The Order PDF from the order detail page is NOT a GST Invoice, it's an order summary. Calling it "Invoice" causes confusion with actual GST invoices from the Billing page.

**H2. Dashboard "Refresh" button calls `api.refreshAll()` without loading state**
Line 183: The inline refresh link doesn't show any feedback — no spinner, no disabled state. User may tap multiple times triggering parallel fetches.

**H3. Bottom nav "More" sheet — Activity link navigates to `/activity` which has no route**
`AppLayout.tsx` line 311: Activity is handled via a button that opens a Sheet, but the `item.url` is `/activity` which has no matching route in `App.tsx`. If the Sheet logic fails, clicking Activity would 404.

**H4. Billing page: GST Invoice requires vehicle/driver but error message says "Fill in dispatch details on the order first"**
This is confusing — the user is ON the billing page, not the order page. The vehicle and driver fields are editable right on the billing form. The error message should say "Fill in vehicle and driver details below."

**H5. Settings: "Invite Member" button is disabled with "Coming soon" — no alternative provided**
For a launch-ready product, this is a significant gap. At minimum, clarify that members must be invited by sharing the signup link + company code, or remove the button entirely to avoid dead UI.

**H6. Order date max constraint allows today but not future dates — no min constraint**
`NewOrder.tsx` line 312: `max={today}` prevents future orders, but no `min` prevents orders dated years in the past, which could corrupt reporting.

**H7. PDF currency uses "Rs." instead of "₹"**
`exportPdf.ts` uses `Rs.` prefix — while this is a Helvetica compatibility workaround, it's inconsistent with the UI which uses `₹`. This should be documented or ideally use a PDF font that supports ₹.

### MEDIUM (Polish before launch)

**M1. `animate-fade-in` class used in Login/Signup but not defined in CSS**
Lines reference `animate-fade-in` which isn't in `index.css` or Tailwind config. May be a no-op or rely on a Tailwind plugin.

**M2. Dashboard sparkline SVG viewBox hardcoded to 186x48**
7 data points at 30px spacing = 180px, but viewBox is 186. The last point at x=180 is at the edge. Minor but could clip on some renderers.

**M3. Mobile bottom nav safe area padding uses `max(8px, env(safe-area-inset-bottom))`**
This is correct but the floating nav at `bottom-3` (12px) plus safe area could feel tight on non-notch phones. Consider testing on older Android devices.

**M4. Pull-to-refresh only on Dashboard and Orders**
Stock, Dealers, Salespersons, Schemes pages don't have pull-to-refresh. Inconsistent UX on mobile.

**M5. Order detail page: `pb-24 md:pb-6`**
The 96px bottom padding on mobile accounts for bottom nav, but this is also applied via `AppLayout` (`pb-28`). Double padding means ~196px of empty space at the bottom on mobile.

**M6. Status badge: no "cancelled" status handling**
If an order were ever set to "cancelled" (not currently possible but could happen via DB), the StatusBadge would render unstyled.

**M7. Company page: logo upload has no file size validation**
Users could upload a 20MB image as company logo, slowing down all PDF generation and page loads.

**M8. `openNewMember` function in Settings is empty (line 240)**
Dead code — the function body is `// Invite-by-email not yet implemented; show placeholder` with no actual placeholder shown.

**M9. Performance page imports recharts (AreaChart, PieChart, BarChart)**
These are heavy dependencies. Lazy loading the page helps, but the charts themselves aren't code-split.

**M10. Landing page uses `WhyOrdra` component name — stale brand reference**
The component is named `WhyOrdra` (old brand) but renders "Why Ledge" content. File name should be updated for maintainability.

---

## Implementation Plan

### Pass 1 — Critical Fixes
| # | File | Fix |
|---|------|-----|
| C1 | No code change needed | Landing page light theme is intentional per memory. The palette shift is acceptable since landing = marketing, dashboard = app. |
| C2 | Migration SQL | Drop the old `insert_order_atomic` overload (without `p_scheme_savings`) to eliminate ambiguity |
| C3 | Deferred | Foreign keys require careful migration with existing data. Document as tech debt for post-launch. |

### Pass 2 — High Priority Fixes
| # | File | Fix |
|---|------|-----|
| H1 | `OrderInvoicePdf.tsx` | Change title from "Invoice" to "Order Summary" |
| H2 | `Dashboard.tsx` | Add loading/disabled state to refresh button |
| H4 | `Billing.tsx` | Fix error message for vehicle/driver validation |
| H5 | `Settings.tsx` | Remove disabled "Invite Member" button entirely, or replace with a helpful note |
| H6 | `NewOrder.tsx` | Add `min` date constraint (e.g., 1 year back) |

### Pass 3 — Medium Polish
| # | File | Fix |
|---|------|-----|
| M1 | `index.css` | Add `animate-fade-in` keyframe if missing |
| M5 | `OrderDetail.tsx` | Remove redundant `pb-24` since AppLayout already adds bottom padding |
| M7 | `Company.tsx` | Add file size validation (max 2MB) for logo upload |
| M8 | `Settings.tsx` | Remove dead `openNewMember` function |
| M10 | No code change | Cosmetic file rename deferred to avoid unnecessary churn |

### What will NOT change
- All component structure, props, data flow
- All existing classNames and semantic tokens
- Feature behavior, routing, state management
- Dark/light mode token values (just refined)
- Database schema (except dropping duplicate function)
- Landing page design or branding
