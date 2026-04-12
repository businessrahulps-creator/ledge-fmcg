

# Feature #7: Quick Secondary Sale Capture

## Analysis & Decision: ACCEPTED

Secondary sale tracking provides genuine value for FMCG distributors who want to understand dealer sell-through rates. The key insight: "Is my dealer actually selling what I supply, or just hoarding?" This directly impacts reorder decisions and credit decisions. Implementation must be dead-simple and fully optional — zero friction for users who don't want it.

## Database

### New table: `secondary_sales`
```sql
CREATE TABLE secondary_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  distributor_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  retailer_name text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE secondary_sales ENABLE ROW LEVEL SECURITY;

-- RLS: company-scoped CRUD
CREATE POLICY "Company members can view secondary sales" ON secondary_sales FOR SELECT TO authenticated USING (company_id = get_company_id());
CREATE POLICY "Company members can insert secondary sales" ON secondary_sales FOR INSERT TO authenticated WITH CHECK (company_id = get_company_id());
CREATE POLICY "Company members can delete secondary sales" ON secondary_sales FOR DELETE TO authenticated USING (company_id = get_company_id());
```

## Files to Create/Modify

### 1. `src/context/DataContext.tsx` — Add secondary sales state + CRUD
- Add `secondarySales` array to context state
- Add `addSecondarySale`, `deleteSecondarySale` functions
- Fetch from `secondary_sales` table on load
- Expose via context

### 2. `src/services/api.ts` — Expose secondary sales via API hook
- Add `secondarySales` section: `list()`, `create()`, `remove()`

### 3. `src/pages/Distributors.tsx` — Dealer detail enhancements
- Add "Record Secondary Sale" button (prominent, after scorecard)
- Simple modal: Retailer Name (text), Product (dropdown), Quantity (number), Date (default today), Remarks (optional)
- Below the button, show a compact "Secondary Sales Summary" section:
  - Total secondary sales count + total quantity for this dealer
  - Collapsible list of recent secondary sales (last 10)
  - Each row: date, retailer, product, qty

### 4. `src/pages/Performance.tsx` — Secondary Sales widget
- Small card showing: total secondary sale records in period, top 3 retailers by quantity
- Simple, non-intrusive placement after existing widgets

## Design Principles
- The "Record Secondary Sale" button is visible but not dominant — secondary to the Statement PDF button
- Modal is extremely minimal: 4-5 fields, large touch targets, instant save
- Summary is collapsible so it doesn't overwhelm the dealer detail view
- All amounts are quantities only (no pricing) — secondary sales track units moved, not revenue
- Fully optional: if no secondary sales exist, the section shows a subtle empty state

## Files Touched
- **New migration**: `secondary_sales` table
- `src/context/DataContext.tsx` — Add secondary sales state + CRUD
- `src/services/api.ts` — Expose via hook
- `src/pages/Distributors.tsx` — Record button, modal, summary section
- `src/pages/Performance.tsx` — Small widget

