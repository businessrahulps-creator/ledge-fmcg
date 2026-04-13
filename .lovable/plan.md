

# Fix: Blob URL Showing in WhatsApp Shares

## Problem
When sharing invoices/reports via WhatsApp using the Web Share API, the blob URL (`blob:https://getledge.in/...`) appears as visible text in the message. This looks unprofessional and confusing.

## Root Cause
`navigator.share({ files: [file], text })` passes both the file and text body. On iOS/WhatsApp, the blob URL of the file attachment leaks into the message preview. The `text` field is also redundant when a PDF file is already attached.

## Fix
In `src/utils/shareWhatsApp.ts`, for both `shareOrderOnWhatsApp` and `shareInvoiceOnWhatsApp`:

1. When using Web Share API with files, pass **only** `files` and a short `title` — remove the `text` parameter so WhatsApp doesn't render any URL or duplicate summary alongside the PDF attachment
2. The PDF itself contains all the invoice details, so the text summary is unnecessary when the file is attached

**Before:**
```typescript
await navigator.share({ files: [file], text });
```

**After:**
```typescript
await navigator.share({ files: [file], title: `Invoice ${order.orderNumber}` });
```

Same pattern for `shareInvoiceOnWhatsApp` (line 218).

## Files Changed
- `src/utils/shareWhatsApp.ts` — remove `text` from `navigator.share()` calls when files are present (2 locations: lines 69 and 218)

