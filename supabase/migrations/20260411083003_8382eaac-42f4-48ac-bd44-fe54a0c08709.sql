
-- Add logo_url column to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT '';

-- Create public storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public bucket)
CREATE POLICY "Public read access for company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Authenticated users can upload to their company folder
CREATE POLICY "Company members can upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = 'logos'
  AND (storage.foldername(name))[2] = get_company_id()::text
);

-- Authenticated users can update their company logos
CREATE POLICY "Company members can update logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = 'logos'
  AND (storage.foldername(name))[2] = get_company_id()::text
);

-- Authenticated users can delete their company logos
CREATE POLICY "Company members can delete logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = 'logos'
  AND (storage.foldername(name))[2] = get_company_id()::text
);

-- Enable realtime on companies table
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
