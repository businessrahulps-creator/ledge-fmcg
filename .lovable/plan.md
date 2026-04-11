

# Add Loading Spinner to PDF Export Modal

## Problem
The "Generate PDF" button shows "Generating…" text when clicked, but there's no visual spinner or progress indicator — just a text change. Users need clearer visual feedback during the PDF generation process.

## Changes — `src/components/pdf/ExportPdfModal.tsx`

**Single file, minimal change:**

1. Import `Loader2` from `lucide-react` (spinning icon)
2. When `loading` is true, replace the checkbox section with a centered spinner + "Generating your PDF…" message with a subtle animation
3. Hide the Cancel button during generation, and show the spinner icon inside the Generate button
4. Disable closing the modal (via `onOpenChange`) while generating to prevent accidental dismissal

This keeps the existing `loading` state — just adds visual treatment on top.

**Before (loading state):**
- Button text changes to "Generating…"
- Checkboxes still visible and interactive-looking

**After (loading state):**
- Checkboxes fade out / are replaced by a centered animated spinner with status text
- Button shows `<Loader2 className="animate-spin" />` + "Generating…"
- Modal cannot be dismissed until complete
- Cancel button hidden

~15 lines changed in one file. No new dependencies.

