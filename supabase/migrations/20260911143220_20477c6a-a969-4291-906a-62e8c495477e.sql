REVOKE EXECUTE ON FUNCTION public.tg_refresh_dealer_money() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_attach_order_payments() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_sync_invoice_paid_state() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_entity_aggregates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_dealer_outstanding(uuid) FROM PUBLIC, anon, authenticated;