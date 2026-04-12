

# Feature #8: Targets & Achievements

## Overview
A new dedicated page and database table for setting monthly/quarterly revenue or order targets for salespersons and dealers, with progress tracking integrated into detail views and the Performance page.

## Database

### New table: `targets`
```sql
CREATE TABLE public.targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'salesperson',  -- 'salesperson' | 'dealer'
  entity_id uuid NOT NULL,
  entity_name text NOT NULL DEFAULT '',
  period_type text NOT NULL DEFAULT 'monthly',       -- 'monthly' | 'quarterly'
  period_start date NOT NULL,
  target_revenue numeric NOT NULL DEFAULT 0,
  target_orders integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, entity_type, entity_id, period_type, period_start)
);

ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
-- Company-scoped SELECT, INSERT, UPDATE, DELETE policies
```

## Files to Create

### 1. `src/pages/Targets.tsx` — Dedicated page
- Two tabs: "Sales Team" and "Dealers"
- Period selector (month/quarter picker, defaulting to current month)
- For each tab: list all entities with inline target setting (revenue + orders) and visual progress bars
- Progress computed from actual orders in that period
- Status badges: "Exceeded" (green, >100%), "On Track" (blue, ≥70%), "Behind Target" (amber, ≥40%), "Needs Attention" (red, <40%)
- Empty state when no targets set yet

### 2. DataContext additions
- Add `targets` state array, `addTarget`, `updateTarget`, `deleteTarget` functions
- Fetch on load alongside other entities

### 3. `src/services/api.ts` — Expose targets CRUD

## Files to Modify

### 4. `src/components/layout/AppSidebar.tsx`
- Add `{ title: "Targets", url: "/targets", icon: Target }` to `manageNav` after Schemes

### 5. `src/App.tsx`
- Add route: `/targets` → `<Targets />`

### 6. `src/pages/Distributors.tsx` — Dealer detail view
- Add "Targets & Achievements" section showing current period target vs actual with progress bar and status

### 7. `src/pages/Salespersons.tsx` — Salesperson detail view
- Same "Targets & Achievements" section

### 8. `src/pages/Performance.tsx`
- Add "Targets Overview" widget showing top performers and those behind target

## UX Proposal (Better Flow)
Rather than a separate modal for each target, the Targets page uses **inline editing** — each row has editable revenue/orders fields that auto-save on blur. This eliminates modal fatigue and lets the admin set all targets in one sweep. The period selector at the top (month dropdown) applies globally, making it trivial to set targets for the whole team in under a minute.

Progress bars use a gradient fill (green when >100%, blue for on-track, amber/red for behind) so status is instantly visible at a glance without reading numbers.

## Files Touched Summary
- **New migration**: `targets` table
- **New file**: `src/pages/Targets.tsx`
- **Modified**: `src/context/DataContext.tsx`, `src/services/api.ts`, `src/App.tsx`, `src/components/layout/AppSidebar.tsx`, `src/pages/Distributors.tsx`, `src/pages/Salespersons.tsx`, `src/pages/Performance.tsx`

