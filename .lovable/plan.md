

# Company Logo Upload — Bug #7 Fix

## Overview
Make the "Upload Logo" button functional in Settings → Company tab. Add storage bucket, DB column, file upload logic, logo display in sidebar header.

## 1. Database Migration
- Add `logo_url text` column (default `''`) to `companies` table
- Create `company-logos` storage bucket (public)
- Add RLS policies on `storage.objects` for the bucket: authenticated users can upload/update/delete in their company path, anyone can read (public bucket)

## 2. Settings Page (`src/pages/Settings.tsx`)
- Add hidden `<input type="file" accept="image/*">` ref
- Wire "Upload Logo" button to trigger file picker
- On file select: validate ≤2MB, upload to `logos/${companyId}/${filename}`, get public URL, update `companies.logo_url`
- Add `logoUrl` state, fetch it alongside other company fields
- Display uploaded logo in the placeholder area (replace Building2 icon)
- Add "Remove Logo" button (visible when logo exists) that clears `logo_url` and optionally deletes the file
- Use Sonner `toast` for success/error feedback (switch from `useToast` for these operations)

## 3. Sidebar Header (`src/components/layout/AppSidebar.tsx`)
- Import `useAuth` to get `companyId`
- Fetch `logo_url` from companies table (or subscribe to realtime)
- Display small logo image next to "Ledge" text when available

## 4. Realtime
- Enable realtime on `companies` table so logo updates propagate across tabs

## Files Changed
| File | Change |
|------|--------|
| Migration SQL | Add `logo_url` column, create storage bucket + policies |
| `src/pages/Settings.tsx` | File upload, logo display, remove logo |
| `src/components/layout/AppSidebar.tsx` | Show company logo in header |

