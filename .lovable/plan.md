

# Card Style Refinement — Premium Cursor Aesthetic

## Honest Design Critique

**Why the Cursor cards feel more premium:**

1. **Typography hierarchy is flatter.** Cursor uses a single weight system — name is bold but not oversized, metadata is regular weight. Ledge's cards have too many competing font sizes (name, location, phone, orders, currency, outstanding badge) creating visual noise.

2. **No icons in content rows.** Cursor relies on whitespace and text alone. Ledge cards have MapPin, Phone, ShoppingCart, UserCheck icons next to every line — this adds clutter and makes cards feel "busy".

3. **Minimal border/shadow.** Cursor cards use a single thin border with nearly invisible shadow. Ledge's `glass-card` has a multi-layer shadow (`0_0_0_1px`, `0_1px_2px`, `0_2px_8px`) that creates visible depth. Premium = flatter.

4. **Generous internal whitespace.** Cursor cards have more padding and more vertical spacing between elements. Ledge cards feel cramped — tight `gap-1`, `gap-1.5`, `mt-1` spacings.

5. **Muted action buttons.** Cursor's CTAs are understated (small rounded pills, gray bg). Ledge's edit/delete icons sit visually heavy with colored destructive red.

6. **No colored badges inside cards.** Cursor keeps cards monochrome. Ledge's "Outstanding" badge with red/amber/green backgrounds introduces noise.

## What to change

### Pass 1: `glass-card` utility (index.css)
- Flatten shadow to single subtle layer: `shadow-[0_1px_3px_rgba(0,0,0,0.04)]`
- Increase border radius to `rounded-xl` (keep `rounded-2xl`)
- Slightly increase border opacity for crispness: `border-border/50`

### Pass 2: Dealer cards (Distributors.tsx)
- Remove MapPin and Phone icons — show location and contact as plain text lines
- Reduce action button visual weight — smaller icons, remove red color from delete (use muted foreground)
- Increase card padding to `p-5 md:p-6`
- Use lighter separator: `border-border/30`
- Make Outstanding badge more subtle — remove colored backgrounds, use muted text with a small dot indicator

### Pass 3: Sales Team cards (Salespersons.tsx)
- Remove the circular avatar icon container (`bg-primary/10` circle) — just show name directly like Cursor
- Remove MapPin icon from region, Phone icon from phone — plain text
- Same padding/separator treatment as dealers
- Same muted action buttons

### Pass 4: Stock product cards (Stock.tsx)
- Same icon reduction and spacing treatment
- Flatten HealthBadge to text-only (remove bg colors, use colored dot + text)

### Pass 5: Dashboard Top Dealers/Products (Dashboard.tsx)
- Already minimal, just ensure consistent glass-card shadow

## Files Changed
| File | Change |
|------|--------|
| `src/index.css` | Flatten `glass-card` shadow, soften `card-hover` |
| `src/pages/Distributors.tsx` | Remove inline icons, increase spacing, mute action buttons, subtle outstanding badge |
| `src/pages/Salespersons.tsx` | Remove avatar circle, inline icons, increase spacing, mute action buttons |
| `src/pages/Stock.tsx` | Same icon/spacing treatment for product cards |
| `src/pages/Dashboard.tsx` | No changes needed — already minimal |

## What will NOT change
- All component structure, props, data flow, navigation
- All existing functionality and interactivity
- Dark mode token values
- Card grid layout (3-col responsive)

