---
name: Brand placement PR-D (Bone stationery + audit sweep)
description: PDFs render on Bone (#F5EFE6); raw color survivors swept to semantic tokens
type: design
---
PR-D of the Brand Color Placement Plan shipped.

**Bone stationery:**
- `src/components/pdf/PdfStyles.ts` page: `backgroundColor: "#F5EFE6"` (Bone) + body text color Midnight `#0F1F3A`. Printed Ledge documents now read as branded stationery, not generic white.

**Raw-color audit sweep (semantic tokens):**
- `src/pages/DealerDetail.tsx`: credit limit ring red/amber/emerald-500 → destructive/warning/success.
- `src/pages/ResetPassword.tsx`: success check emerald-500 → text-success.
- `src/components/ui/save-indicator.tsx`: amber-600 → text-warning.
- `src/components/layout/NotificationCenter.tsx`: order/stock/team left-borders emerald/amber/blue-500 → success/warning/primary.
- `src/components/layout/AppLayout.tsx`: offline banner blue/amber-500 → primary/warning.

**Not swept (intentional):**
- `src/components/ui/toast.tsx` — shadcn base, keep as-is.
- `src/pages/AdminErrors.tsx` — internal admin page, low user-visible priority.
- `src/components/landing/**` and `src/components/pdf/**` — landing has its own palette; PDF colors that are intentional (scheme green #059669) stay until landing rebrand or finance review.

Rule: any new component must use semantic tokens. The next sweep should target AdminErrors and the residual shadcn defaults that bleed through.
