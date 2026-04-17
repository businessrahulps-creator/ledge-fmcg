-- Drop ALL refresh-aggregate triggers and re-create exactly one per table
DROP TRIGGER IF EXISTS trg_orders_aggregates ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_refresh_aggregates ON public.orders;
DROP TRIGGER IF EXISTS trg_refresh_aggregates_orders ON public.orders;

DROP TRIGGER IF EXISTS trg_order_lines_aggregates ON public.order_lines;
DROP TRIGGER IF EXISTS trg_order_lines_refresh_aggregates ON public.order_lines;
DROP TRIGGER IF EXISTS trg_refresh_aggregates_order_lines ON public.order_lines;

CREATE TRIGGER trg_refresh_aggregates_orders
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.refresh_entity_aggregates();

CREATE TRIGGER trg_refresh_aggregates_order_lines
AFTER INSERT OR UPDATE OR DELETE ON public.order_lines
FOR EACH ROW EXECUTE FUNCTION public.refresh_entity_aggregates();

-- Drop legacy seed_company_data function (replaced by edge function)
DROP FUNCTION IF EXISTS public.seed_company_data(uuid);