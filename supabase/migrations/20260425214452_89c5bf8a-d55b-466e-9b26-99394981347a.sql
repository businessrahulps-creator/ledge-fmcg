UPDATE storage.buckets SET public = true WHERE id = 'company-logos';

DROP POLICY IF EXISTS "Public can read company-logos objects" ON storage.objects;