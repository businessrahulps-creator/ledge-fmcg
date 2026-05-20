
# Fix: Logo upload fails during onboarding

## Root cause (one line)

`src/pages/Welcome.tsx` uploads to **`{companyId}/logo-{ts}.{ext}`** but the storage RLS policy requires **`logos/{companyId}/...`** — the `logos/` prefix is missing, so the INSERT policy denies every onboarding upload.

## Evidence

- Storage policy `Company members can upload logos` (INSERT on `storage.objects`) checks:
  ```
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = 'logos'
  AND (storage.foldername(name))[2] = get_company_id()::text
  ```
- `src/pages/Welcome.tsx:139`:
  ```ts
  const path = `${companyId}/logo-${Date.now()}.${ext}`;   // ❌ folder[1] = companyId, no 'logos/' prefix
  ```
- `src/pages/Company.tsx:124` (Settings page) already uses the correct path: `logos/${companyId}/logo.${ext}` ✅ — that's why Settings works but onboarding doesn't.

Bucket exists and is public; column `companies.logo_url` exists; only the path shape is wrong.

## Fix (surgical, 2 lines)

`src/pages/Welcome.tsx`:
- Line 139: `` `logos/${companyId}/logo-${Date.now()}.${ext}` ``
- (Public URL fetch on line 145 already uses the same `path` variable, so it auto-corrects.)

That's it. One file, one line of meaningful change.

## What I will NOT touch

- Storage RLS policies (they're correct and consistent with Company.tsx).
- The bucket configuration.
- Company.tsx logo flow (already correct).
- Any onboarding navigation, validation, or the `finish()` flow.

## Verification

1. Sign up → reach Welcome step 3 (logo).
2. Upload a <2MB image → expect "Logo saved" toast → redirect to /dashboard.
3. Visit Settings → Company → logo preview appears.
4. Reload Settings → logo persists.

If the user reports any pre-existing onboarding accounts had partially-failed uploads, no cleanup is needed — failed uploads never created a `storage.objects` row.
