

# Align Icon to Left Edge of Label/Value

## Problem
The icon container is centered within its 44px box, but the label and value text below are left-aligned to the card padding. This creates a visual misalignment — the icon appears slightly off from the text column beneath it.

## Change — `src/pages/Dashboard.tsx` (lines 99-109)

Remove `justify-between` from the top row so icon and badge stack differently. Instead, keep the icon on its own line (left-aligned), and move the change badge inline with the label row:

**Updated layout:**
```
[Icon]
Label  [+12%]
Value
```

Actually, simpler fix that preserves the current layout but ensures left-alignment: the icon and indicator stay on the same row, but both the icon row and the text below share the same left edge. Currently they already do since `p-5` padding applies uniformly. The real issue is the icon is `justify-center` inside its container.

Looking again — the icon IS left-aligned (it's in a flex row with `justify-between`). The label and value below also start from the left edge. They should already be aligned.

The user likely wants the icon+indicator row to not use `justify-between` (which pushes the badge to the far right), and instead have both elements grouped on the left side together. Let me re-read the request.

> "the icon should be aligned left, according to you, for example where there is written revenue and the numbers, so the icons on top should be aligned left accordingly"

The user wants the icon to visually align with the label and value text below it. Currently `justify-between` spreads icon left and badge right. The icon IS left-aligned. But perhaps on the user's viewport (390px), the cards look off.

The simplest improvement: keep `justify-between` but ensure consistent left alignment. The icon, label, and value all start at the same `p-5` left edge — they should be aligned. 

Let me just propose making the layout cleaner with the icon strictly left-aligned and the badge next to it (not pushed to far right):

## Change

### `src/pages/Dashboard.tsx` — lines 99-109

Replace the top row from `justify-between` to a simple left-aligned flow with the badge next to the icon:

```tsx
<div className="flex items-center gap-3 mb-4">
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

Key change: `justify-between` → `gap-3`, so the icon and indicator sit together on the left, directly above the label and value. Everything flows from the same left edge.

