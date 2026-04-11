

# UI/UX Stress-Test Audit & Polish Plan
## Current State: 8/10 → Target: 10/10

---

## AUDIT FINDINGS

### A. Typography & Hierarchy Issues
1. **KPI card labels** (`text-[11px]`) are too small on desktop — feels data-sparse
2. **Section headers** ("Top Dealers", "Top Products") at `text-sm` are undersized on desktop — lack weight distinction from body text
3. **Page subtitles** ("Manage and track all sales orders") feel disconnected — gap between title and subtitle is inconsistent across pages (`mt-0.5` vs `mt-1`)

### B. Spacing & Breathing Room
4. **KPI cards** — unequal padding between mobile (`p-5`) and the visual weight of the `text-2xl`/`text-3xl` numbers. Cards feel slightly cramped vertically
5. **Dashboard day-picker buttons** — `gap-2.5` makes them float disconnected on wider screens. Should self-contain better
6. **Progress bars** in Dealers/Products sections — `h-1` is nearly invisible, hard to parse at a glance
7. **Mobile order cards** — `space-y-2.5` gap between cards is tight; no visual separation beyond the gap

### C. Interactive Feedback & Touch
8. **Button default variant** has `hover:-translate-y-0.5` lift — this is jarring and non-standard for a business app. Linear/Apple never lifts buttons
9. **Day-picker buttons** lack focus-visible ring — keyboard-inaccessible
10. **Ghost icon buttons** (edit/delete on Dealer cards) — `h-10 w-10` is good, but lack visible pressed state (`active:scale`)
11. **Status toggle buttons** in Order dialog — no `active:scale` feedback, feels dead on press
12. **"View all" links** — no underline or arrow hint that they're navigable; too low contrast at `text-muted-foreground/60`

### D. Visual Consistency
13. **Auth pages** — Login/Signup cards use `shadow-md` while the rest of the app uses `.glass-card` with `shadow-[0_1px_3px]`. Inconsistent depth language
14. **Notification center button** — `h-9 w-9` is smaller than sidebar icon buttons. Header icons should be uniform
15. **Dialog widths** — Order dialog is `sm:max-w-2xl`, Dealer edit is `sm:max-w-md`. This is correct, but the inner padding (`space-y-4`) varies without reason
16. **Info cards** in dialogs (Date, Dealer, etc.) use `bg-muted/20` which is barely visible in light mode — feels like a missing element

### E. Mobile-Specific Issues
17. **Bottom nav** — the "More" label sits at the same visual weight as primary items. No visual cue that it's a menu vs. a destination
18. **Mobile KPI grid** — 2-col grid with `gap-4` creates uneven visual weight between Revenue (large number) and Orders (small number)
19. **Pagination on mobile** — "X / Y" text is too subtle at `text-xs text-muted-foreground`

### F. Missing Polish Details
20. **No active:scale on primary buttons** — feels flat on mobile tap
21. **Table headers** — `font-medium` is too light for the header role; should be `font-semibold` or use a subtle background wash
22. **Empty states** — Dashboard empty state icon is raw SVG inline, not matching the lucide icon system used everywhere else
23. **Progress bar animation** — eases in nicely but the bar color `bg-foreground/20` is too subtle in light mode

---

## IMPLEMENTATION PLAN

### Pass 1: Design Token & Global Refinements (`src/index.css`, `src/components/ui/button.tsx`)
- Remove `hover:-translate-y-0.5` from default button variant (finding #8)
- Add `active:scale-[0.98]` to default and outline button variants for tactile mobile press feedback
- Bump `.glass-card` shadow slightly for light mode: `shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)]`
- Add `.row-hover` subtle active state
- Improve table header styling with slightly more weight

### Pass 2: Dashboard Polish (`src/pages/Dashboard.tsx`)
- KPI cards: add `md:p-7` for more desktop breathing room, bump desktop values to `md:text-3xl`
- Progress bars: increase to `h-1.5` and use `bg-foreground/25` for better visibility
- "View all" links: add a subtle `→` arrow and bump to `text-muted-foreground/70` with `hover:text-foreground` 
- Empty state: replace inline SVG with lucide `ListChecks` icon
- Day picker: add `focus-visible:ring-2 focus-visible:ring-ring` for keyboard accessibility

### Pass 3: Orders Page (`src/pages/Orders.tsx`)
- Status toggle buttons: add `active:scale-[0.97]` and `focus-visible:ring-2`
- Table headers: add `bg-muted/30` background wash for better visual separation
- Mobile order cards: slightly increase vertical gap to `space-y-3`

### Pass 4: Dealers & Salespersons (`src/pages/Distributors.tsx`, `src/pages/Salespersons.tsx`)
- Icon buttons: add `active:scale-95` for press feedback
- Dialog info cards: bump `bg-muted/20` to `bg-muted/30` for visibility

### Pass 5: Auth Pages (`src/pages/Login.tsx`, `src/pages/Signup.tsx`)
- Replace `shadow-md` with `shadow-sm` to match glass-card depth language
- Add `backdrop-blur-sm` to auth card for subtle frosted glass hint

### Pass 6: Layout & Navigation (`src/components/layout/AppLayout.tsx`, `AppSidebar.tsx`)
- Notification bell: normalize to same size as other header elements
- Mobile bottom nav "More" button: add a subtle dot indicator or different icon weight to hint it's a menu

### Pass 7: Micro-interaction polish
- Status toggle buttons in Order/NewOrder dialogs: add `transition-all` and `active:scale-[0.97]`
- All `card-hover` elements: ensure they have `active:scale-[0.98]` for mobile press

---

### Files Modified (no new files)
- `src/index.css` — glass-card shadow, row-hover active state
- `src/components/ui/button.tsx` — remove lift, add active:scale
- `src/pages/Dashboard.tsx` — KPI spacing, progress bars, view-all arrows, empty state, day-picker a11y
- `src/pages/Orders.tsx` — table headers, status buttons, mobile card spacing
- `src/pages/Distributors.tsx` — icon button press, dialog card contrast
- `src/pages/Salespersons.tsx` — icon button press, dialog card contrast
- `src/pages/Login.tsx` — shadow consistency
- `src/pages/Signup.tsx` — shadow consistency
- `src/components/layout/AppLayout.tsx` — notification size, bottom nav hint

### What Will NOT Change
- All data flow, API calls, realtime subscriptions
- All routing, auth, RBAC logic
- All pagination, CSV export, PDF export
- All Indian date formatting, IST clock
- All component structure and prop interfaces
- Dark mode token values
- Mobile bottom nav structure and routing

