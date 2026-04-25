## Root causes verified

1. **Logo not rendering after upload** — The `company-logos` storage bucket is **private** (`public = false`). The upload code calls `getPublicUrl()` and saves that URL to `companies.logo_url`, but the public-object endpoint only works when the bucket itself is marked public. The existing "Public can read company logos" SELECT policies on `storage.objects` do **not** override the bucket-level privacy flag for the public URL endpoint. Result: URL is stored, but `<img>` requests return an error and the logo fails to display.

2. **Logo showing in top-left nav** — `src/components/layout/AppSidebar.tsx` (lines 150–164) renders `<img src={logoUrl}>` next to the "Ledge" wordmark in the `SidebarHeader` whenever a logo is set. The user wants this area to be branding-only.

## Changes

### 1. Migration: make `company-logos` bucket public
- `UPDATE storage.buckets SET public = true WHERE id = 'company-logos';`
- Drop the redundant duplicate SELECT policy `Public can read company-logos objects` (the other one covers it).
- Keep the existing folder-scoped INSERT/UPDATE/DELETE policies — only members of the matching company can write/replace/delete their own logo, so making the file readable is safe and consistent with logos appearing on invoices/PDFs.

Why public is correct here: logos are non-sensitive brand assets already embedded in customer-facing PDFs (invoices, statements). Signed URLs would force every render path (sidebar, PDF generator, etc.) to refresh URLs and add complexity for zero security benefit.

### 2. `src/components/layout/AppSidebar.tsx` — remove logo from header
- Remove the `logoUrl` state, the `useEffect` that fetches it, and the realtime channel subscription (no longer needed here).
- Replace the `SidebarHeader` content so it always shows the "Ledge" wordmark only:
  - Expanded: just the `Ledge` wordmark (no avatar/logo block).
  - Collapsed: the existing "L" monogram tile (kept so the collapsed sidebar still has a visible brand mark).
- Remove the `supabase` and `useAuth` imports if they're no longer used elsewhere in the file (verify before removing — `useAuth` is also used for `companyId` via `useOnboarding`, so keep what's still referenced).

### 3. `src/pages/Company.tsx` — no logic change needed
After the bucket is public, the existing `getPublicUrl()` flow will work as-is. The "Company logo" card on this page already renders the logo correctly when `logoUrl` is set. Upload button text and other UI remain untouched.

## What is intentionally NOT changed
- Upload button text, dialog copy, validation messages — untouched.
- The Company page logo preview/upload/remove flow — untouched.
- Any other header/topbar component — only the sidebar header had the logo.

## Verification after apply
- Upload a logo on `/company` → it appears in the Company logo card immediately and persists on reload.
- Sidebar top-left shows only the "Ledge" wordmark (expanded) or "L" tile (collapsed) — never the company logo.
- PDFs/invoices that embed `logo_url` continue to render (same public URL, now actually serving).
