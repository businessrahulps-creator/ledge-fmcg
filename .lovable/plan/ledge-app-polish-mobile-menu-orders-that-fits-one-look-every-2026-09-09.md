# Ledge app polish — mobile menu, Orders that fits, one look everywhere

Using the Appllama app-design skill (native feel, one accent, real tap targets, honest hierarchy, restrained motion), adapted from mobile-app rules to our web app. Nothing is removed — same data, same actions, better fit and calmer look.

## What I checked first (real measurements, not guesses)

- **Orders needs sideways scrolling on your screen.** At your window width the table is 1154px wide inside a 943px area — it hangs over by 211px, which is exactly why the Billing column is off-screen. The cause is very wide column padding (48px on each side of every column) plus eight full columns.
- **The mobile menu hides Sign out.** The menu sheet opens 92% tall, and the "Sign out" row sits 4px below the bottom of the phone screen, so you must scroll a panel that gives no hint it scrolls. The top of the sheet also wastes space.
- **The menu uses three different accent colours** (terracotta, navy, green) for the little icon tiles in one list — the skill's "one accent, locked" rule.
- **Mobile Orders header** shows two unlabelled square icon buttons next to New Order; the four number tiles form an uneven 2x2 block with stray divider lines.
- **Dashboard on mobile** has the same uneven 2x2 number block.

## Answer to your question about Orders

Do not keep the sideways scroll, and do not stretch the page wider. Make the table fit:

- Tighten column padding to the app's normal rhythm (16-20px instead of 48px).
- Merge **Payment + Delivery + Billing** into one "Status" column showing the chips in a row, so eight columns become six.
- Move **Sales Person** to a small second line under the dealer name (still visible, still exportable).
- Result: the whole row fits on a 1280px laptop with no sideways scroll. On genuinely narrow desktop windows the table still scrolls, but with a soft fade on the right edge so it's obvious there's more.

## The work

### 1. Mobile menu (highest priority)
- Sheet sits just under the top bar, ends above the phone's home bar, and always keeps **Sign out** visible as a fixed footer instead of hidden below the fold.
- Scrollable middle area with a fade at the bottom, so it's obvious there's more.
- All icon tiles use one neutral treatment with the single Ledge accent for the active item — no rainbow.
- Every row at least 44px tall, press feedback on tap-down, and the sheet closes on selection.

### 2. Orders (desktop + mobile)
- Column changes above, plus tabular figures so amounts line up.
- Mobile order cards: order number and amount on one line, dealer and date beneath, status chips in a single non-wrapping row, and a right chevron so it reads as tappable.
- Mobile header: the two export icon buttons get labels ("Excel", "PDF") or collapse into one "Export" menu, so nothing is a mystery square.
- Extra bottom padding on the list so the last order is never hidden behind the bottom bar.

### 3. Number tiles (Orders, Dashboard, and the other pages using the same block)
- One shared responsive strip: a clean 2x2 on phones with even spacing and a single divider system, four across on desktop.
- Values keep tabular numerals; zero values read as plain muted text, not ghosted.

### 4. Consistency pass across the app
- One radius, one card padding, one spacing step (already partly done) applied to the pages still off-rhythm.
- One accent rule: navy is structure, terracotta only for attention/warning, green only for success. No decorative colour.
- Press feedback and entrances under 300ms with a strong ease-out; existing reduced-motion support respected.

### 5. Verification
- Desktop 1280 and 1440, tablet 834, phone 390 screenshots of Orders, Dashboard, Stock, Dealers, Sales Team, Money to Collect, My Business.
- Confirm zero horizontal scrolling on Orders at 1280.
- Confirm Sign out is reachable without scrolling on a 390x844 phone.
- Typecheck, full test suite, build.

## Technical notes

- Files: `src/pages/Orders.tsx`, `src/components/layout/AppLayout.tsx` (More sheet), the shared KPI/stat strip component, `src/index.css` utilities, `src/components/ui/status-badge.tsx`.
- Uses `100dvh` and `env(safe-area-inset-bottom)` for the sheet, so browser chrome on iOS Safari can't clip the footer.
- No backend, data, or business-logic changes. Landing page styles (`.lp-theme`) untouched.

## Out of scope
- Reseeding the demo data so offers and dashboard totals fall in the current month (say the word and I'll do it separately).
