

## Phase 2 — Every Page, UI/UX & Visual Polish (audit plan)

I'll audit each route by reading the page files, checking for layout/locale/responsiveness issues, and only fixing concrete bugs (no redesigns, no new features).

### Routes to inspect
1. `/` (Index/landing) — already polished, skim only
2. `/login`, `/signup`, `/reset-password`
3. `/dashboard`
4. `/orders`, `/orders/new`, `/orders/:id`
5. `/distributors`, `/distributors/:id`
6. `/salespersons`, `/salespersons/:id`
7. `/stock`, `/schemes`, `/claims`, `/targets`, `/billing`, `/performance`, `/reports`
8. `/settings`, `/help`, `/company`
9. Legal: `/privacy-policy`, `/terms-of-service`, `/refund-policy`, `/about-us`, `/contact`
10. `*` (NotFound)

### What I'm specifically looking for
- **Mobile sticky-bar overlap** — same class of bug as OrderDetail. Check Distributors/Salesperson detail pages, NewOrder, Settings.
- **INR formatting consistency** — `toLocaleString('en-IN')` everywhere, no raw `$` or `toFixed(2)` without locale.
- **GSTIN/phone validation** on Settings (Company tab) and Distributor forms.
- **Skeleton loaders** present on heavy pages.
- **Bottom-nav overlap** on mobile pages (pages need `pb-20` or similar).
- **Empty states** on tables.
- **Broken imports / dead routes** in `App.tsx`.

### Approach
1. Read `App.tsx` to enumerate active routes.
2. Batch-read top-suspect pages in parallel (Settings, Distributors, NewOrder, Stock, Reports, NotFound).
3. Grep for `toFixed(2)` without `en-IN`, raw `$` symbols, missing `pb-` on mobile.
4. Fix only confirmed bugs (no speculative refactors).

### Out of scope
- Visual redesigns, animation tweaks, copy changes.
- Anything covered by Phase 3 (calculations) or Phase 4 (security).

Reply with `PHASE 2 COMPLETE` listing concrete fixes + changed files.

