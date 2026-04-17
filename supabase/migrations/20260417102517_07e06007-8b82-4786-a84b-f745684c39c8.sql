-- 1. Tenant-scoped has_role: a user only "has" a role inside their own company.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p_caller ON p_caller.user_id = auth.uid()
    JOIN public.profiles p_target ON p_target.user_id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND p_caller.company_id IS NOT NULL
      AND p_caller.company_id = p_target.company_id
  )
$$;

-- 2. Lock down company-logos storage: drop the broad-public SELECT policy and
--    require the caller to be authenticated. Bucket stays "public" so existing
--    public URLs in invoices keep resolving server-side, but anonymous list/get
--    is no longer possible against unknown paths.
DROP POLICY IF EXISTS "Public can read company logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read company logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for company logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Authenticated users can read company logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'company-logos');