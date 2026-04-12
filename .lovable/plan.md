

# Feature #1: One-Tap WhatsApp Invoice/Share

## What it does
Adds a branded "WhatsApp" button (green, with WhatsApp icon) in three places. On tap, it generates a PDF invoice blob, creates a shareable link (or falls back to text summary), and opens WhatsApp via deep link with a pre-filled message containing the order summary.

## Technical approach

**WhatsApp limitation**: `wa.me` deep links only support text — you cannot attach a file via URL scheme. The approach:
1. Generate PDF blob using existing `@react-pdf/renderer` + `OrderInvoicePdf`
2. Try `navigator.share()` (Web Share API) first — this works on mobile and allows attaching the PDF file directly to WhatsApp
3. Fall back to `wa.me/?text=...` with a formatted order summary if Web Share API is unavailable (desktop browsers)

**WhatsApp icon**: Install `react-icons` or use an inline SVG. Since the project doesn't use `react-icons`, I'll create a small `WhatsAppIcon` SVG component to avoid adding a dependency.

## Changes

### 1. New file: `src/components/ui/WhatsAppIcon.tsx`
- Small SVG component rendering the official WhatsApp logo icon
- Accepts `className` prop for sizing

### 2. New file: `src/utils/shareWhatsApp.ts`
- `shareOrderOnWhatsApp(order, companyInfo)` function:
  - Generates PDF blob via `pdf(<OrderInvoicePdf ... />).toBlob()`
  - Builds text summary: order number, dealer, items, total
  - If `navigator.canShare` supports files → uses `navigator.share({ files: [pdfFile], text: summary })`
  - Otherwise → opens `https://wa.me/?text=...` with the text summary
  - Shows toast on success/failure

### 3. Modify: `src/pages/Orders.tsx`
- **Order detail dialog** (line ~533-547): Replace the existing plain-text Share button with the new WhatsApp button using `WhatsAppIcon`, green styling, calling `shareOrderOnWhatsApp`
- **Order table rows**: No three-dot menu exists currently — orders open a detail dialog on click. The WhatsApp button lives in the detail dialog, which is the natural place.

### 4. Modify: `src/pages/Distributors.tsx`
- **Dealer profile dialog** (line ~280-310): Add a "WhatsApp" button next to the existing "Export PDF" button
- This will share a dealer summary (name, location, contact, order count, total value) via WhatsApp
- Uses `navigator.share` with dealer PDF if available, else `wa.me/?text=...`

## What does NOT change
- No new pages, routes, or navigation
- No design system changes
- No database/auth/offline queue changes
- All existing classNames, data flows, and component behavior preserved

