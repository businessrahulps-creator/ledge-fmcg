

# Fix Bug #18: Add Input Sanitization to All Forms

## Problem
No text inputs are sanitized before being written to the database, allowing potential HTML/script injection, control characters, and excessive whitespace.

## Approach
Create a reusable `sanitizeInput` utility and apply it at the data layer (where values are mapped to DB columns), keeping UI and validation unchanged.

## Changes

### 1. Create `src/utils/sanitize.ts`
New file with a single exported function:
```typescript
export function sanitizeInput(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')        // strip HTML/script tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars (keep \t \n \r)
    .replace(/\s+/g, ' ')           // collapse multiple whitespace
    .trim();
}
```

### 2. Edit `src/context/DataContext.tsx` — Sanitize CRUD mappers
Apply `sanitizeInput` to string fields in each `toDbInsert`/`toDbUpdate` mapper:

- **Distributors** (lines 762-766): sanitize `name`, `location`, `contact`
- **Salespersons** (lines 769-773): sanitize `name`, `phone`, `email`, `region`
- **Products** (lines 776-780): sanitize `name`, `sku`, `unit`
- **Godowns** (lines 783-787): sanitize `name`, `address`

Apply to **addOrder** (lines 592-608): sanitize `distributor_name`, `salesperson_name`, `vehicle`, `driver_name`, `dispatch_remarks`, and each order line's `product_name`.

Apply to **updateOrder** (lines 649-656): sanitize `vehicle`, `driverName`, `dispatchRemarks` when present in updates.

### 3. Edit `src/pages/Settings.tsx` — Sanitize company & team saves
- Company save (~line 271): sanitize `companyName`, `companyAddress`, `companyGstin`
- Order prefix save: sanitize prefix value
- Team member edit (~line 312): sanitize `editMember.name`, `editMember.phone`

### 4. Edit `src/pages/Stock.tsx` — Sanitize stock item fields if any text inputs exist
Stock items only have numeric fields (quantity, threshold) — no text sanitization needed.

## Scope
- New file: `src/utils/sanitize.ts`
- Modified: `src/context/DataContext.tsx`, `src/pages/Settings.tsx`
- No UI, validation, or rendering changes
- All existing behavior preserved

