-- Revoke EXECUTE on trigger-only functions from API roles
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_delivered_at_on_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_entity_aggregates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_stock_on_deduction_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_auth_user_created() FROM PUBLIC, anon, authenticated;

-- Admin / cron only
REVOKE EXECUTE ON FUNCTION public.check_aging_transitions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.aging_bucket_rank(text) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.aging_bucket_rank(text) SET search_path = public;

-- RLS helpers: not needed by anon (still callable inside RLS predicates by authenticated)
REVOKE EXECUTE ON FUNCTION public.get_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;