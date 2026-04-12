
-- C5: Attach refresh_entity_aggregates triggers to orders and order_lines
CREATE TRIGGER trg_orders_refresh_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_entity_aggregates();

CREATE TRIGGER trg_order_lines_refresh_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON public.order_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_entity_aggregates();
