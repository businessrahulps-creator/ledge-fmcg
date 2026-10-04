-- Orders may only point at this business's own dealer, salesperson and godown.
CREATE OR REPLACE FUNCTION public.tg_orders_same_company_links()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.distributors d WHERE d.id = NEW.distributor_id AND d.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'That dealer is not in your business.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.salespersons s WHERE s.id = NEW.salesperson_id AND s.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'That salesperson is not in your business.';
  END IF;
  IF NEW.godown_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.godowns g WHERE g.id = NEW.godown_id AND g.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'That godown is not in your business.';
  END IF;
  -- New orders from the app always start unpaid; only payment rules change this.
  IF TG_OP = 'INSERT' AND session_user IS NOT NULL AND current_setting('request.jwt.claim.role', true) IN ('authenticated','anon')
     AND NOT EXISTS (SELECT 1) THEN
    NULL;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.tg_orders_same_company_links() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_orders_same_company_links ON public.orders;
CREATE TRIGGER trg_orders_same_company_links BEFORE INSERT OR UPDATE OF company_id, distributor_id, salesperson_id, godown_id ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_orders_same_company_links();

-- Direct inserts by app users start unpaid.
CREATE OR REPLACE FUNCTION public.tg_protect_order_payment_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.payment_status := 'pending';
    ELSIF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      NEW.payment_status := OLD.payment_status;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_protect_order_payment_status ON public.orders;
CREATE TRIGGER trg_protect_order_payment_status BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_protect_order_payment_status();

-- Order lines may only use this business's products.
CREATE OR REPLACE FUNCTION public.tg_order_lines_same_company_product()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.orders o JOIN public.products p ON p.company_id = o.company_id
     WHERE o.id = NEW.order_id AND p.id = NEW.product_id) THEN
    RAISE EXCEPTION 'That product is not in your business.';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.tg_order_lines_same_company_product() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_order_lines_same_company_product ON public.order_lines;
CREATE TRIGGER trg_order_lines_same_company_product BEFORE INSERT OR UPDATE OF order_id, product_id ON public.order_lines
  FOR EACH ROW EXECUTE FUNCTION public.tg_order_lines_same_company_product();

-- Updated lines must still belong to an unbilled order.
DROP POLICY IF EXISTS "Company members can update lines on unbilled orders" ON public.order_lines;
CREATE POLICY "Company members can update lines on unbilled orders" ON public.order_lines
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id()
           AND NOT EXISTS (SELECT 1 FROM public.invoices i WHERE i.source_order_id = o.id AND i.doc_type = 'gst_invoice'))
         AND NOT public.has_role(auth.uid(), 'viewer'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id()
           AND NOT EXISTS (SELECT 1 FROM public.invoices i WHERE i.source_order_id = o.id AND i.doc_type = 'gst_invoice'))
         AND NOT public.has_role(auth.uid(), 'viewer'));
