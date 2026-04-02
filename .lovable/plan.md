

# Move KPI Change Indicators Next to Icon

## Current Layout (vertical)
```
[Icon]
Label
Value
[+12% badge]
```

The change indicator sits at the bottom, disconnected from the icon. It's small and easy to miss.

## New Layout
```
[Icon]  [+12% badge]     ← top row, icon left, badge right
Label
Value
```

## Changes — `src/pages/Dashboard.tsx` (lines 98-107)

Replace the current icon block + bottom indicator with a single top row using `flex items-center justify-between`, then label and value below:

```tsx
{/* Top row: icon + change indicator */}
<div className="flex items-center justify-between mb-4">
  <div className={`flex items-center justify-center w-11 h-11 rounded-2xl ${colors.icon}`}>
    <kpi.icon className="w-5 h-5" />
  </div>
  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${kpi.up ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-500 dark:text-red-400"}`}>
    {kpi.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
    {kpi.change}
  </div>
</div>
<p className="text-xs text-muted-foreground font-medium mb-1">{kpi.label}</p>
<p className="text-[22px] font-bold tracking-tight leading-none">{kpi.value}</p>
```

Key tweaks:
- Badge padding increased from `px-2 py-0.5` to `px-2.5 py-1` for a slightly larger, more tappable feel
- Font bumped from `text-xs` (12px) to `text-[11px]` — keeping it compact but the extra padding makes it feel bigger
- Removed `mb-2` from value since indicator is no longer below it

