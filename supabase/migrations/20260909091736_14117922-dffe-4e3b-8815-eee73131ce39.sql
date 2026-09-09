REVOKE SELECT ON public.dealer_balances FROM anon;
REVOKE SELECT ON public.invoice_balances FROM anon;
GRANT SELECT ON public.dealer_balances TO authenticated;
GRANT SELECT ON public.invoice_balances TO authenticated;