REVOKE ALL ON public.return_line_ledger FROM anon, authenticated;
GRANT SELECT ON public.return_line_ledger TO authenticated;
REVOKE ALL ON public.product_units FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.product_units FROM authenticated;