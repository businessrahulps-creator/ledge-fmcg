

# Fix All Remaining Issues (Critical → Medium)

## Issues to Fix

| # | Priority | Issue | File |
|---|----------|-------|------|
| 1 | High | Orders page: empty state + pagination render outside the list conditional — lists show even when `filtered.length === 0` | `Orders.tsx:178-263` |
| 2 | High | Dashboard mobile cards missing salesperson name | `Dashboard.tsx:271-281` |
| 3 | High | OrderDetail: `crypto.randomUUID()` regenerates line IDs on every useEffect trigger (status changes, etc.) | `OrderDetail.tsx:125-146` |
| 4 | Medium | Dashboard Recent Orders section `pb-8` insufficient clearance for mobile bottom nav | `Dashboard.tsx:206` |
| 5 | Medium | Orders mobile cards missing billing status badge (desktop has it) | `Orders.tsx:225-244` |

## Fix Plan

### 1. Orders.tsx — Fix empty state / pagination structure + add mobile billing badge

**Current**: Desktop table (lines 179-223) and mobile cards (lines 225-245) render unconditionally. Empty state (line 247) appears after both.

**Fix**: Wrap the entire glass-card div content in a `filtered.length > 0` conditional. Move empty state outside the glass-card. Add billing status badge to mobile cards.

```
{filtered.length === 0 ? (
  <EmptyState />
) : (
  <div className="glass-card overflow-hidden">
    {/* desktop table */}
    {/* mobile cards */}
    <ListPagination ... />
  </div>
)}
```

Add billing badge to mobile cards:
```
{billingStatus && (
  <span className={`... ${billingStatus.color}`}>{billingStatus.label}</span>
)}
```

### 2. Dashboard.tsx — Add salesperson to mobile cards + increase bottom padding

Add `o.salesperson` line to mobile order cards (between dealer name and order number row). Change `pb-8` to `pb-20`.

### 3. OrderDetail.tsx — Stabilize line IDs

Split the useEffect into two:
- One for status/dispatch fields (triggers on status changes)
- One for lines (triggers only on `order?.id` change, using a ref to track previous ID)

This prevents `crypto.randomUUID()` from running when only status fields change.

## Files Changed

| File | Changes |
|------|---------|
| `src/pages/Orders.tsx` | Restructure conditional rendering; add billing badge to mobile cards |
| `src/pages/Dashboard.tsx` | Add salesperson to mobile cards; increase section bottom padding |
| `src/pages/OrderDetail.tsx` | Split useEffect to stabilize line IDs |

**3 files, 5 surgical edits. No new dependencies, no schema changes.**

