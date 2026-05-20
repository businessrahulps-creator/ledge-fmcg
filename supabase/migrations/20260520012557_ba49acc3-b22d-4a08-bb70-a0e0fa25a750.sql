
DO $$
DECLARE
  v_keep_user uuid := 'b7242b16-8dad-4131-b719-8138b875afe7';
  v_keep_company uuid := '65cacbde-915f-4e39-9a07-35d8c5ff680e';
BEGIN
  DELETE FROM public.order_lines WHERE order_id IN (SELECT id FROM public.orders WHERE company_id <> v_keep_company);
  DELETE FROM public.order_schemes WHERE order_id IN (SELECT id FROM public.orders WHERE company_id <> v_keep_company);
  DELETE FROM public.invoice_lines WHERE invoice_id IN (SELECT id FROM public.invoices WHERE company_id <> v_keep_company);
  DELETE FROM public.claim_lines WHERE claim_id IN (SELECT id FROM public.claims WHERE company_id <> v_keep_company);

  DELETE FROM public.activity_log WHERE company_id <> v_keep_company;
  DELETE FROM public.signal_acknowledgements WHERE company_id <> v_keep_company;
  DELETE FROM public.command_saved_views WHERE company_id <> v_keep_company;
  DELETE FROM public.notifications WHERE company_id <> v_keep_company;
  DELETE FROM public.dealer_aging_state WHERE company_id <> v_keep_company;
  DELETE FROM public.team_invites WHERE company_id <> v_keep_company;
  DELETE FROM public.secondary_sales WHERE company_id <> v_keep_company;
  DELETE FROM public.targets WHERE company_id <> v_keep_company;
  DELETE FROM public.claims WHERE company_id <> v_keep_company;
  DELETE FROM public.invoices WHERE company_id <> v_keep_company;
  DELETE FROM public.schemes WHERE company_id <> v_keep_company;
  DELETE FROM public.stock_deductions WHERE company_id <> v_keep_company;
  DELETE FROM public.stock_items WHERE company_id <> v_keep_company;
  DELETE FROM public.orders WHERE company_id <> v_keep_company;
  DELETE FROM public.products WHERE company_id <> v_keep_company;
  DELETE FROM public.godowns WHERE company_id <> v_keep_company;
  DELETE FROM public.distributors WHERE company_id <> v_keep_company;
  DELETE FROM public.salespersons WHERE company_id <> v_keep_company;
  DELETE FROM public.error_log WHERE company_id IS NOT NULL AND company_id <> v_keep_company;

  DELETE FROM public.user_capability_overrides
    WHERE user_id IN (SELECT user_id FROM public.profiles WHERE user_id <> v_keep_user);
  DELETE FROM public.user_roles
    WHERE user_id IN (SELECT user_id FROM public.profiles WHERE user_id <> v_keep_user);

  DELETE FROM public.profiles WHERE user_id <> v_keep_user;
  DELETE FROM public.companies WHERE id <> v_keep_company;
  DELETE FROM auth.identities WHERE user_id <> v_keep_user;
  DELETE FROM auth.users WHERE id <> v_keep_user;
END $$;
