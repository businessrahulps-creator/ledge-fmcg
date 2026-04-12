

# Add Search/Filter to Schemes, Targets, and Claims Pages

## What Changes

Add a search input below the header on each page, matching the existing pattern used on Orders/Dealers/Stock. Each search filters the visible list in real-time.

### 1. Claims (`src/pages/Claims.tsx`)
- Add a `Search` icon input between the header and the Tabs
- Filter `filtered` claims by: order number, dealer name, claim type, reason text
- Uses `useState` for search + `useMemo` for filtered results

### 2. Schemes (`src/pages/Schemes.tsx`)
- Add search input between header and the active/inactive sections
- Filter schemes by: name, type (flat/percent/bogo), product names, dealer names
- Both active and inactive sections respect the filter

### 3. Targets (`src/pages/Targets.tsx`)
- Add search input between the summary stats and the Tabs
- Filter salespersons/dealers by name, region/location
- Each tab's list is independently filtered by the same search term

## Implementation Pattern (same for all 3)

```tsx
const [search, setSearch] = useState("");

// In JSX, between header and list:
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Search schemes…"
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="pl-9 h-9"
  />
</div>
```

Filter logic uses `useMemo` with lowercase `.includes()` matching against relevant fields.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Claims.tsx` | Add search state + Input + filter claims by order/dealer/type |
| `src/pages/Schemes.tsx` | Add search state + Input + filter schemes by name/type/products |
| `src/pages/Targets.tsx` | Add search state + Input + filter entities by name/region |

**3 files modified. No new files. No new dependencies. No database changes.**

