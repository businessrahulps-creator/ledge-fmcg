REVOKE EXECUTE ON FUNCTION public.setup_new_company(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_next_order_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_next_invoice_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.insert_order_atomic(uuid, date, uuid, text, uuid, text, numeric, payment_mode, payment_status, date, text, text, delivery_status, text, uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.dispatch_order_atomic(uuid, date, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reverse_dispatch_for_order(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.preview_dispatch_impact(uuid) FROM PUBLIC, anon;