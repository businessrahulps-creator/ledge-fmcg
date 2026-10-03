CREATE OR REPLACE FUNCTION public.my_capabilities()
RETURNS public.capability_key[]
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(c), '{}')
  FROM unnest(enum_range(NULL::public.capability_key)) AS c
  WHERE auth.uid() IS NOT NULL AND public.has_capability(auth.uid(), c);
$$;
REVOKE ALL ON FUNCTION public.my_capabilities() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_capabilities() TO authenticated;