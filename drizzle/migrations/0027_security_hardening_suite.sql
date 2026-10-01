-- 1) Stock deductions: only server functions may change them (deleting one restored stock via trigger).
DROP POLICY IF EXISTS "Users can update stock_deductions in their company" ON public.stock_deductions;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='stock_deductions' AND cmd IN ('INSERT','UPDATE','DELETE') LOOP
    EXECUTE format('DROP POLICY %I ON public.stock_deductions', r.policyname);
  END LOOP;
END $$;
REVOKE INSERT, UPDATE, DELETE ON public.stock_deductions FROM authenticated, anon;

-- 2) Atomic order delete: all-or-nothing, tenant + guard checks under lock.
CREATE OR REPLACE FUNCTION public.delete_order_atomic(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid := public.get_company_id(); v_o public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL THEN RAISE EXCEPTION 'Please sign in again.'; END IF;
  IF public.has_role(auth.uid(), 'viewer') THEN RAISE EXCEPTION 'You do not have permission to delete orders.'; END IF;
  SELECT * INTO v_o FROM public.orders WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This order was not found.'; END IF;
  IF v_o.delivery_status <> 'pending' THEN RAISE EXCEPTION 'Only orders not yet sent can be deleted.'; END IF;
  IF EXISTS (SELECT 1 FROM public.invoices WHERE source_order_id = v_o.id AND doc_type = 'gst_invoice') THEN
    RAISE EXCEPTION 'This order has a GST bill and cannot be deleted.'; END IF;
  IF EXISTS (SELECT 1 FROM public.invoice_payments WHERE order_id = v_o.id) THEN
    RAISE EXCEPTION 'This order has money recorded against it. Cancel the payments first.'; END IF;
  DELETE FROM public.stock_deductions WHERE order_id = v_o.id;
  DELETE FROM public.order_schemes WHERE order_id = v_o.id;
  DELETE FROM public.order_lines WHERE order_id = v_o.id;
  DELETE FROM public.orders WHERE id = v_o.id;
  INSERT INTO public.activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata)
  VALUES (v_company, auth.uid(), '', 'order', v_o.id, 'deleted', 'Deleted order ' || v_o.order_number, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true, 'order_number', v_o.order_number);
END $$;
REVOKE ALL ON FUNCTION public.delete_order_atomic(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_order_atomic(uuid) TO authenticated;

-- 3) Protected money columns: clients can't set balances/totals or raise credit limits without permission.
CREATE OR REPLACE FUNCTION public.tg_protect_distributor_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.outstanding_amount := 0; NEW.total_orders := 0; NEW.total_value := 0;
    ELSE
      NEW.outstanding_amount := OLD.outstanding_amount;
      NEW.total_orders := OLD.total_orders;
      NEW.total_value := OLD.total_value;
      IF (NEW.credit_limit IS DISTINCT FROM OLD.credit_limit OR NEW.credit_mode IS DISTINCT FROM OLD.credit_mode)
         AND NOT (public.has_capability(auth.uid(),'override_credit_limit') OR public.has_capability(auth.uid(),'manage_team')) THEN
        RAISE EXCEPTION 'Only an owner or manager can change a dealer''s credit limit.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_protect_distributor_columns ON public.distributors;
CREATE TRIGGER trg_protect_distributor_columns BEFORE INSERT OR UPDATE ON public.distributors
FOR EACH ROW EXECUTE FUNCTION public.tg_protect_distributor_columns();

CREATE OR REPLACE FUNCTION public.tg_protect_product_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN NEW.total_sold := 0; NEW.avg_cost := COALESCE(NEW.avg_cost,0);
    ELSE NEW.total_sold := OLD.total_sold; NEW.avg_cost := OLD.avg_cost; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_protect_product_columns ON public.products;
CREATE TRIGGER trg_protect_product_columns BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.tg_protect_product_columns();