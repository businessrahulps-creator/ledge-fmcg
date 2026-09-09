-- Phase 5: freeze posted documents against direct writes from the app.
-- All posting happens through SECURITY DEFINER RPCs, which bypass RLS,
-- so removing client write policies does not affect the real flows.

-- Invoices: view-only from the app
DROP POLICY IF EXISTS "Company members can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Company members can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Company members can delete invoices" ON public.invoices;

DROP POLICY IF EXISTS "Company members can insert invoice lines" ON public.invoice_lines;
DROP POLICY IF EXISTS "Company members can update invoice lines" ON public.invoice_lines;
DROP POLICY IF EXISTS "Company members can delete invoice lines" ON public.invoice_lines;

REVOKE INSERT, UPDATE, DELETE ON public.invoices FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.invoice_lines FROM authenticated;

-- Claims (returns record): view-only from the app
DROP POLICY IF EXISTS "Company members can insert claims" ON public.claims;
DROP POLICY IF EXISTS "Company members can update claims" ON public.claims;
DROP POLICY IF EXISTS "Company members can delete claims" ON public.claims;

DROP POLICY IF EXISTS "Company members can insert claim lines" ON public.claim_lines;
DROP POLICY IF EXISTS "Company members can update claim lines" ON public.claim_lines;
DROP POLICY IF EXISTS "Company members can delete claim lines" ON public.claim_lines;

REVOKE INSERT, UPDATE, DELETE ON public.claims FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.claim_lines FROM authenticated;

-- Orders: no edits or deletes once billed; no deletes once dispatched
DROP POLICY IF EXISTS "Company members can update orders" ON public.orders;
CREATE POLICY "Company members can update unbilled orders"
ON public.orders FOR UPDATE TO authenticated
USING (
  company_id = public.get_company_id()
  AND NOT public.has_role(auth.uid(), 'viewer'::app_role)
  AND NOT EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.source_order_id = orders.id AND i.doc_type = 'gst_invoice'
  )
)
WITH CHECK (
  company_id = public.get_company_id()
  AND NOT public.has_role(auth.uid(), 'viewer'::app_role)
);

DROP POLICY IF EXISTS "Company members can delete orders" ON public.orders;
CREATE POLICY "Company members can delete pending unbilled orders"
ON public.orders FOR DELETE TO authenticated
USING (
  company_id = public.get_company_id()
  AND NOT public.has_role(auth.uid(), 'viewer'::app_role)
  AND delivery_status = 'pending'::delivery_status
  AND NOT EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.source_order_id = orders.id AND i.doc_type = 'gst_invoice'
  )
);

-- Order lines follow the same rule as their order
DROP POLICY IF EXISTS "Company members can insert order lines" ON public.order_lines;
DROP POLICY IF EXISTS "Company members can update order lines" ON public.order_lines;
DROP POLICY IF EXISTS "Company members can delete order lines" ON public.order_lines;

CREATE POLICY "Company members can insert lines on unbilled orders"
ON public.order_lines FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_lines.order_id
      AND o.company_id = public.get_company_id()
      AND NOT EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.source_order_id = o.id AND i.doc_type = 'gst_invoice'
      )
  )
  AND NOT public.has_role(auth.uid(), 'viewer'::app_role)
);

CREATE POLICY "Company members can update lines on unbilled orders"
ON public.order_lines FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_lines.order_id
      AND o.company_id = public.get_company_id()
      AND NOT EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.source_order_id = o.id AND i.doc_type = 'gst_invoice'
      )
  )
  AND NOT public.has_role(auth.uid(), 'viewer'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id()
  )
  AND NOT public.has_role(auth.uid(), 'viewer'::app_role)
);

CREATE POLICY "Company members can delete lines on unbilled orders"
ON public.order_lines FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_lines.order_id
      AND o.company_id = public.get_company_id()
      AND NOT EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.source_order_id = o.id AND i.doc_type = 'gst_invoice'
      )
  )
  AND NOT public.has_role(auth.uid(), 'viewer'::app_role)
);