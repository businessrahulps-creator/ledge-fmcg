

# Fix: "Something went wrong" crashes on Billing page

## Root Cause

The database contains an invoice with `doc_type = 'invoice'` instead of `'gst_invoice'`. In `Billing.tsx` line 625, this code crashes:

```js
docTypeLabels[d.docType].slice(0, 3).toUpperCase()
```

`docTypeLabels['invoice']` is `undefined`, so `.slice()` throws `TypeError: Cannot read properties of undefined (reading 'slice')`.

Additionally, line 111 misuses `useState(() => {...})` to run side effects — this should be `useEffect`.

## Fixes

| File | Change |
|------|--------|
| **DB Migration** | Update the invoice record: `UPDATE invoices SET doc_type = 'gst_invoice' WHERE doc_type = 'invoice'` |
| `src/pages/Billing.tsx` | 1. Line 625: Add fallback — `(docTypeLabels[d.docType] \|\| d.docType).slice(0, 3)` |
| | 2. Line 111: Replace `useState(() => {...})` with `useEffect(() => {...}, [])` for the auto-open logic |
| | 3. Add `docTypeLabels` fallback for unknown doc types in the table rendering (line 439) |

## Why it auto-refreshes

The `PageErrorBoundary` shows "Reload Page" button. After reload, the same bad data is fetched, causing the same crash — an infinite loop if the user keeps clicking Reload.

## 3 changes, surgical fix

1. Fix the data in the DB (migration)
2. Make the code defensive against unexpected `doc_type` values
3. Fix the `useState` misuse

