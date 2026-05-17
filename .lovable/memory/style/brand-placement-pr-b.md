---
name: Brand placement PR-B (Forest promotion)
description: Forest is now the canonical "money in / goal beaten" hue — Dashboard revenue underline, Targets Exceeded
type: design
---
PR-B of the Brand Color Placement Plan shipped. Forest (`--success`) is the canonical hue for money in and growth goals beaten.

Canonical placements:
- **Dashboard "Delivered Revenue"** (`src/pages/Dashboard.tsx`): 2px Forest underline accent under the number when non-zero. Marks "money in" without coloring the number itself.
- **Targets "Exceeded"** (`src/pages/Targets.tsx` STATUS_CONFIG): amplified to bold Forest text + `bg-success/12` + 1px Forest ring. Distinct from "On Track" (primary). The brand moment when a goal is beaten.
- **Stock "healthy" badge** (`src/pages/Stock.tsx`): already canonical `bg-success`. No change needed.
- **Billing "Final" pill** (`src/pages/Billing.tsx`): already canonical `bg-success/10 text-success`. No change needed.

Rule: Forest never appears as decoration. Only promote it when the meaning is "money received, target beaten, healthy state confirmed." Do not color KPI numbers themselves with Forest — accent them with a thin rule beneath.
