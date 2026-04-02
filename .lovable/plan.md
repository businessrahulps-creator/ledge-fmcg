

# Better Icons for KPI Cards

## Problem
Both "Pending" and "Dispatched" use the same `Truck` icon — they're visually indistinguishable. The icons overall feel generic and don't communicate each metric's meaning well enough.

## Solution — Distinct, expressive icons

| KPI | Current | New | Why |
|-----|---------|-----|-----|
| Revenue | `IndianRupee` | `Wallet` | A wallet feels richer and more modern than a bare currency symbol |
| Orders | `Package` | `ShoppingBag` | Shopping bag is more recognizable as "orders placed" |
| Pending | `Truck` | `Clock` | Clock = waiting/pending — immediately communicates delay |
| Dispatched | `Truck` | `PackageCheck` | A package with a checkmark = shipped/confirmed |

## Change

### `src/pages/Dashboard.tsx`

Update imports:
```ts
import { Wallet, ShoppingBag, Clock, PackageCheck, TrendingUp, TrendingDown } from "lucide-react";
```

Update the `kpis` array icons:
```ts
{ label: "Revenue",    icon: Wallet,       ... }
{ label: "Orders",     icon: ShoppingBag,  ... }
{ label: "Pending",    icon: Clock,        ... }
{ label: "Dispatched", icon: PackageCheck, ... }
```

Remove old imports: `IndianRupee`, `Package`, `Truck`.

## Result
Each KPI card has a visually distinct, meaningful icon — no two look alike, and each communicates its metric at a glance.

