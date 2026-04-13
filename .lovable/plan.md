

# Fix: Onboarding Logo Step Not Updating After Upload

## Root Cause

`Company.tsx` uploads the logo and updates the database directly, but never updates `DataContext.companyInfo`. The onboarding checklist reads `api.companyInfo.logoUrl` from DataContext, which stays stale until a full page reload.

The same issue affects all Company page fields (GSTIN, address, etc.) — saving company details doesn't propagate to DataContext either.

## Fix

### 1. Add `updateCompanyInfo` to DataContext

Expose a function that merges partial updates into the `companyInfo` state:

```typescript
updateCompanyInfo: (updates: Partial<CompanyInfo>) => void;
```

Implementation: `setCompanyInfo(prev => ({ ...prev, ...updates }))`.

Add it to the context interface and the provider's value object.

### 2. Call `updateCompanyInfo` from Company.tsx

- After logo upload succeeds: call `updateCompanyInfo({ logoUrl: publicUrl })`
- After logo removal: call `updateCompanyInfo({ logoUrl: "" })`
- After saving company details (the main save handler): call `updateCompanyInfo({ name, address, gstin, phone, email, ... })`

This ensures the onboarding checklist (and any other consumer of `companyInfo`) updates immediately without requiring a page reload.

## Files Changed

- `src/context/DataContext.tsx` — add `updateCompanyInfo` to interface + provider
- `src/pages/Company.tsx` — import and call `updateCompanyInfo` after logo upload/remove and company save

