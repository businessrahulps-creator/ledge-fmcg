DROP POLICY IF EXISTS "Public can read company logos" ON storage.objects;

CREATE POLICY "Public can read individual company logo files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'company-logos'
  AND name IS NOT NULL
  AND (storage.foldername(name))[1] = 'logos'
  AND array_length(storage.foldername(name), 1) >= 2
);