

# Add Missing UPDATE Policies (Defensive Hardening)

## Why this is low-risk
No application code ever calls `.update()` on `claim_lines`, `secondary_sales`, or `stock_deductions`. These are insert-and-delete-only tables. The missing policies cannot cause any current bug or security issue.

## What we'd do
One database migration adding three UPDATE policies, all scoped to `company_id = get_company_id()`:

```sql
CREATE POLICY "Company members can update claim lines"
ON public.claim_lines FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM claims c WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id()))
WITH CHECK (EXISTS (SELECT 1 FROM claims c WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id()));

CREATE POLICY "Company members can update secondary sales"
ON public.secondary_sales FOR UPDATE TO authenticated
USING (company_id = get_company_id())
WITH CHECK (company_id = get_company_id());

CREATE POLICY "Company members can update stock deductions"
ON public.stock_deductions FOR UPDATE TO authenticated
USING (company_id = get_company_id())
WITH CHECK (company_id = get_company_id());
```

## Impact
- Zero code changes
- Zero risk of breaking anything
- Future-proofs the tables if UPDATE functionality is added later

