

# Enrich Dealer Profile + Add Account Holder Name

## Changes

### 1. Database Migration

**`distributors` table** — add 9 columns:
- `email`, `address`, `gstin`, `pan`, `state_code` (tax/contact info)
- `bank_name`, `bank_account_name`, `bank_account`, `bank_ifsc` (bank details)

**`companies` table** — add 1 column:
- `bank_account_name` (the missing account holder name)

All columns: `text`, default `''`, not null.

### 2. Update Distributor Type (`src/data/mock-data.ts`)

Add the 9 new fields to the `Distributor` interface.

### 3. Update Dealer Form (`src/pages/Distributors.tsx`)

Expand the Add/Edit dialog into sections:
- **Basic Info**: Name, Location, Contact, Email, Credit Limit
- **Tax Details**: GSTIN, PAN, State Code
- **Address**: Full address textarea
- **Bank Details**: Bank Name, Account Holder Name, Account Number, IFSC

### 4. Update Company Page (`src/pages/Company.tsx`)

Add "Account Holder Name" field in the Bank Details section.

### 5. Update API/DataContext

Map the new snake_case DB columns in `src/context/DataContext.tsx` for dealer and company read/write operations.

## Files

| File | Change |
|------|--------|
| Migration SQL | Add 9 cols to `distributors`, 1 to `companies` |
| `src/data/mock-data.ts` | Extend `Distributor` interface |
| `src/pages/Distributors.tsx` | Expand dealer form with new fields |
| `src/pages/Company.tsx` | Add Account Holder Name field |
| `src/context/DataContext.tsx` | Map new columns in CRUD |

No RLS changes needed — existing policies already cover these tables.

