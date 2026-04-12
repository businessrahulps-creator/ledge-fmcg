

# Enhancement #1: Polished Empty States on All List Pages

## Current State

Most pages already have basic empty states, but they're inconsistent in quality:

| Page | Icon | Headline | Description | CTA | Needs Work |
|------|------|----------|-------------|-----|------------|
| Orders | Filter ⚠️ | ✓ | Generic | ✓ | Better icon when truly empty vs filtered |
| Dealers | Search ⚠️ | ✓ | Generic | ✓ | Better icon + copy |
| Salespersons | UserCheck ✓ | ✓ | ✓ | ✓ | Good as-is |
| Stock → Products | Package ✓ | ✓ | ✓ | ✓ | Good as-is |
| Stock → Warehouses | Warehouse ✓ | ✓ | ✓ | **Missing** | Add CTA button |
| Schemes | Gift ✓ | ✓ | ✓ | ✓ | Good as-is |
| Targets (team) | **None** | **None** | Plain text | **None** | Full rework needed |
| Targets (dealers) | **None** | **None** | Plain text | **None** | Full rework needed |
| Claims | RotateCcw ✓ | ✓ | ✓ | **None** | Acceptable (claims come from orders) |
| Billing | FileText ✓ | ✓ | ✓ | **None** | Acceptable (invoices come from orders) |

## Changes

Only 4 files need updates — pages where empty states are missing or subpar:

### 1. `src/pages/Targets.tsx` — Full empty state rework
- **Sales team tab**: Add `UserCheck` icon, "No team members yet" headline, helpful description, CTA linking to `/salespersons`
- **Dealers tab**: Add `MapPin` icon, "No dealers yet" headline, CTA linking to `/dealers`

### 2. `src/pages/Stock.tsx` — Add warehouse CTA
- Add "Add Warehouse" CTA button to the warehouse empty state (respecting `isAccountant` role check)

### 3. `src/pages/Orders.tsx` — Differentiate empty vs no-results
- When `items.length === 0`: Show `ShoppingCart` icon with "No orders yet" + "Create your first order" CTA
- When filtered to zero: Keep current Filter icon with "No orders match your filters"

### 4. `src/pages/Distributors.tsx` — Better empty icon
- When `items.length === 0`: Use `MapPin` icon with "No dealers yet" + add CTA
- When filtered to zero: Keep Search icon with "No dealers match your search"

**4 files modified. No new files. No new dependencies. No database changes.**

