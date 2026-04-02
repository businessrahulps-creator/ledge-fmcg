

# Redesign KPI Cards to Match App Aesthetic

## Problem
The KPI cards use colored backgrounds, gradient blobs, and oversized styled icon containers that clash with the app's monochrome, minimal "Light Premium" aesthetic. Every other page uses plain white cards with subtle borders.

## Design Direction
Strip the cards to match the rest of the app: white `glass-card` background, no color tints, no blobs. Use the standard 18px icon size. Keep it data-focused and clean.

## Layout per card
```text
┌─────────────────────┐
│ Label        +12% ↑ │
│ ₹14,82,000          │
└─────────────────────┘
```

- Label and trend badge on top row (label left, badge right)
- Value below, prominent but not oversized
- No icon container, no blob, no colored background

## Changes — `src/pages/Dashboard.tsx`

### 1. Remove color system
Delete the entire `kpiColors` object and the `color` property from the `kpis` array. Remove `TrendingUp`/`TrendingDown` icon imports if we simplify the badge to text-only, or keep them small.

### 2. Simplify KPI array
```ts
const kpis = [
  { label: "Revenue", value: formatCurrency(totalRevenue), change: "+12%", up: true },
  { label: "Orders", value: totalOrders.toString(), change: "+8%", up: true },
  { label: "Pending", value: pendingOrders.toString(), change: "-3%", up: false },
  { label: "Dispatched", value: dispatchedOrders.toString(), change: "+5%", up: true },
];
```

No `icon` or `color` properties needed.

### 3. New card markup
```tsx
<motion.div
  key={kpi.label}
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
  className="glass-card p-5"
>
  <div className="flex items-center justify-between mb-3">
    <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
    <span className={`text-[11px] font-semibold ${kpi.up ? "text-emerald-600" : "text-red-500"}`}>
      {kpi.change}
    </span>
  </div>
  <p className="text-xl font-semibold tracking-tight">{kpi.value}</p>
</motion.div>
```

Key decisions:
- `glass-card` class (white bg, subtle border, rounded-2xl) — same as every other card in the app
- No icon containers, no blobs, no colored backgrounds
- Trend indicator is just colored text (green/red), no pill background, no trend arrow icon — minimal
- Value at `text-xl` (20px) with `font-semibold` — fits any currency amount
- Remove `whileHover` scale/translate — other cards in the app don't do this

### 4. Clean up imports
Remove: `Wallet`, `ShoppingBag`, `Clock`, `PackageCheck`, `TrendingUp`, `TrendingDown` from lucide-react imports.

## Result
KPI cards that look like they belong to the same app as Orders, Distributors, and Stock — clean, white, data-forward, no visual clutter.

