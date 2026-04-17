-- Flip company-logos bucket to non-public so listing via the storage API is denied.
-- The public SELECT policy on storage.objects (added in the previous migration) still
-- allows anonymous reads of individual objects in this bucket — which keeps logo URLs
-- rendering inside invoices, PDFs, and the app header — but `LIST` is no longer permitted.
UPDATE storage.buckets SET public = false WHERE id = 'company-logos';