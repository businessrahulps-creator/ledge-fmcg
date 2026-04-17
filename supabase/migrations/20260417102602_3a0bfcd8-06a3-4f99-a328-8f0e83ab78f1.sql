UPDATE storage.buckets SET public = true WHERE id = 'company-logos';

-- Restore public SELECT so anonymous PDF rendering / shared invoice links still work.
DROP POLICY IF EXISTS "Authenticated users can read company logos" ON storage.objects;
CREATE POLICY "Public can read company logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-logos');