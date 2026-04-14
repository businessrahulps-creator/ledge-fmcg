

# Fix: Replace Receipt Icon in WhyOrdra Section

## Problem
The `Receipt` icon from Lucide contains a dollar sign (`$`), which is inappropriate for an Indian FMCG brand.

## Fix — 1 file

### `src/components/landing/sections/WhyOrdra.tsx`
- Replace `Receipt` import with `FileText` (a clean document icon with no currency symbol — appropriate for billing/invoicing context)
- Update the icon reference in the `blocks` array

One import change, one reference change. Nothing else touched.

