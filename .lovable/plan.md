

# Redesign Dashboard KPI Cards

## Problem
1. The value text (`text-xl font-bold`) is too large for the card width — a revenue figure like ₹14,82,000 will overflow on mobile
2. The icon sits in a grey box with no color differentiation — all four cards look identical
3. The layout (icon top-left, change top-right, big number, tiny label) feels dated and cluttered
4. No color coding to help users scan at a glance

## Design Direction — Apple-style "tinted glass" cards

Each KPI gets a unique subtle tint so users can identify them instantly without reading labels:

- **Revenue**: Emerald tint (money = green)
- **Orders**: Blue tint (primary action)
- **Pending**: Amber tint (warning/attention)
- **Dispatched**: Violet tint (in-transit)

The tint applies as a very light background wash (~5-8% opacity) and a matching icon background (~12% opacity), keeping the light premium aesthetic.

## Changes

### `src/pages/Dashboard.tsx`

**KPI data structure** — add a `color` key to each KPI:
```ts
const kpis = [
  { label: "Revenue", value: formatCurrency(totalRevenue), icon: IndianRupee, change: "+12%", up: true, color: "emerald" },
  { label: "Orders", value: totalOrders.toString(), icon: Package, change: "+8%", up: true, color: "blue" },
  { label: "Pending", value: pendingOrders.toString(), icon: Truck, change: "-3%", up: false, color: "amber" },
  { label: "Dispatched", value: dispatchedOrders.toString(), icon: Truck, change: "+5%", up: true, color: "violet" },
];
```

**Card layout** — restructure to a cleaner vertical flow:
1. Top row: colored icon pill (left) + change badge (right)
2. Label in `text-xs text-muted-foreground font-medium` (above value — label-first is easier to scan)
3. Value in `text-lg font-bold tracking-tight` (down from `text-xl` to prevent overflow)

**Color mapping** — a simple object for card bg, icon bg, and icon text:
```ts
const kpiColors = {
  emerald: { card: "bg-emerald-50/60", icon: "bg-emerald-500/12 text-emerald-600" },
  blue:    { card: "bg-blue-50/60",    icon: "bg-blue-500/12 text-blue-600" },
  amber:   { card: "bg-amber-50/60",   icon: "bg-amber-500/12 text-amber-600" },
  violet:  { card: "bg-violet-50/60",  icon: "bg-violet-500/12 text-violet-600" },
};
```

**Dark mode** — these Tailwind colors already have dark variants built in, but we'll add dark-mode overrides if needed (e.g. `dark:bg-emerald-500/8`).

**Animation** — keep the existing staggered `motion.div` fade-up. Add a subtle `whileHover={{ y: -2 }}` for a micro-interaction feel, replacing the CSS `card-hover` class with Framer Motion's built-in hover.

**Value sizing** — `text-lg` (18px) instead of `text-xl` (20px) ensures even ₹14,82,000 fits comfortably in half-width mobile cards.

## Result
Four visually distinct, color-coded KPI cards with a modern tinted-glass look. Values are sized to never overflow. Subtle hover animation adds polish without distraction.

