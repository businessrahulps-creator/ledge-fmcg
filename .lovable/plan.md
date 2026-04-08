

# Add GSTIN Input Field to Settings

## What
Add a visible GSTIN text input to the Company tab in Settings. The backend logic (fetch + save) is already wired — this is purely a UI addition.

## Change

**File: `src/pages/Settings.tsx`**

Insert a GSTIN input field between the Address textarea and the Order Prefix input. Approximately 12 lines:

```tsx
<div className="space-y-1.5 md:space-y-2">
  <Label className="text-xs md:text-sm">GSTIN</Label>
  <Input
    value={companyGstin}
    onChange={(e) => setCompanyGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
    maxLength={15}
    className="h-11 rounded-lg md:h-12 max-w-[300px] font-mono"
    placeholder="22AAAAA0000A1Z5"
  />
  <p className="text-[10px] text-muted-foreground md:text-xs">
    15-digit GST Identification Number
  </p>
</div>
```

- Auto-uppercases input, strips non-alphanumeric characters, caps at 15 chars
- No database migration, no RLS changes, no new dependencies

## Testing
Spot-check only: open Settings, verify field renders, enter a GSTIN, save, refresh, confirm persistence.

