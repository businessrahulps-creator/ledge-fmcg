-- Phase 2 (additive part): product units, return ledger, snapshots, backfill.
-- Widening stock/claim/credit-note quantity columns to numeric(18,6) is applied separately.

CREATE TABLE public.product_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  unit_name text NOT NULL CHECK (length(btrim(unit_name)) BETWEEN 1 AND 40),
  conversion_factor numeric(18,6) NOT NULL CHECK (conversion_factor > 0),
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX product_units_active_name_uq ON public.product_units (product_id, lower(btrim(unit_name))) WHERE NOT is_archived;
CREATE INDEX product_units_company_idx ON public.product_units (company_id, product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_units TO authenticated;
GRANT ALL ON public.product_units TO service_role;
ALTER TABLE public.product_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members read units" ON public.product_units FOR SELECT TO authenticated
  USING (company_id = public.get_company_id());
CREATE POLICY "Stock managers add units" ON public.product_units FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'manage_stock'::capability_key));
CREATE POLICY "Stock managers change units" ON public.product_units FOR UPDATE TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'manage_stock'::capability_key))
  WITH CHECK (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'manage_stock'::capability_key));
CREATE POLICY "Stock managers remove units" ON public.product_units FOR DELETE TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'manage_stock'::capability_key));

CREATE TABLE public.return_line_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  invoice_line_id uuid NOT NULL REFERENCES public.invoice_lines(id),
  product_id uuid REFERENCES public.products(id),
  kind text NOT NULL CHECK (kind IN ('good','damaged_credit','damaged_no_credit')),
  entered_quantity numeric(18,3) NOT NULL CHECK (entered_quantity > 0),
  entered_unit text NOT NULL,
  product_unit_id uuid REFERENCES public.product_units(id),
  conversion_factor numeric(18,6) NOT NULL CHECK (conversion_factor > 0),
  base_quantity numeric(18,6) NOT NULL CHECK (base_quantity > 0),
  claim_line_id uuid REFERENCES public.claim_lines(id),
  credit_note_line_id uuid REFERENCES public.credit_note_lines(id),
  source text NOT NULL DEFAULT 'return' CHECK (source IN ('return','backfill')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rll_credit_link_by_kind CHECK (
    (kind = 'damaged_no_credit' AND credit_note_line_id IS NULL) OR
    (kind <> 'damaged_no_credit' AND credit_note_line_id IS NOT NULL))
);
CREATE UNIQUE INDEX rll_claim_line_kind_uq ON public.return_line_ledger (claim_line_id, kind) WHERE claim_line_id IS NOT NULL;
CREATE UNIQUE INDEX rll_cn_line_kind_uq ON public.return_line_ledger (credit_note_line_id, kind) WHERE credit_note_line_id IS NOT NULL;
CREATE INDEX rll_invoice_line_idx ON public.return_line_ledger (invoice_line_id);
CREATE INDEX rll_company_idx ON public.return_line_ledger (company_id, invoice_id);
GRANT SELECT ON public.return_line_ledger TO authenticated;
GRANT ALL ON public.return_line_ledger TO service_role;
ALTER TABLE public.return_line_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members read return ledger" ON public.return_line_ledger FOR SELECT TO authenticated
  USING (company_id = public.get_company_id());

ALTER TABLE public.credit_note_lines
  ADD COLUMN entered_quantity numeric(18,3),
  ADD COLUMN entered_unit text,
  ADD COLUMN conversion_factor numeric(18,6),
  ADD COLUMN base_quantity numeric(18,6),
  ADD COLUMN product_unit_id uuid REFERENCES public.product_units(id);
ALTER TABLE public.claim_lines
  ADD COLUMN entered_quantity numeric(18,3),
  ADD COLUMN entered_unit text,
  ADD COLUMN conversion_factor numeric(18,6),
  ADD COLUMN base_quantity numeric(18,6),
  ADD COLUMN product_unit_id uuid REFERENCES public.product_units(id),
  ADD COLUMN invoice_line_id uuid REFERENCES public.invoice_lines(id),
  ADD COLUMN return_kind text CHECK (return_kind IS NULL OR return_kind IN ('good','damaged_credit','damaged_no_credit','mixed'));

CREATE OR REPLACE FUNCTION public.tg_return_ledger_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE
  v_inv public.invoices%ROWTYPE;
  v_line public.invoice_lines%ROWTYPE;
  v_done numeric;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'Return records cannot be changed or deleted';
  END IF;
  SELECT * INTO v_inv FROM public.invoices WHERE id = NEW.invoice_id;
  IF NOT FOUND OR v_inv.company_id <> NEW.company_id THEN
    RAISE EXCEPTION 'Return record: bill does not belong to this business';
  END IF;
  SELECT * INTO v_line FROM public.invoice_lines WHERE id = NEW.invoice_line_id FOR UPDATE;
  IF NOT FOUND OR v_line.invoice_id <> NEW.invoice_id THEN
    RAISE EXCEPTION 'Return record: bill line does not belong to this bill';
  END IF;
  IF v_line.product_id IS NOT NULL AND NEW.product_id IS DISTINCT FROM v_line.product_id THEN
    RAISE EXCEPTION 'Return record: product does not match the bill line';
  END IF;
  IF NEW.product_unit_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM public.product_units u
        WHERE u.id = NEW.product_unit_id AND u.company_id = NEW.company_id AND u.product_id = NEW.product_id) THEN
    RAISE EXCEPTION 'Return record: unit does not belong to this product';
  END IF;
  IF NEW.credit_note_line_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM public.credit_note_lines cl JOIN public.credit_notes cn ON cn.id = cl.credit_note_id
        WHERE cl.id = NEW.credit_note_line_id AND cn.company_id = NEW.company_id
          AND cn.invoice_id = NEW.invoice_id AND cl.invoice_line_id = NEW.invoice_line_id) THEN
    RAISE EXCEPTION 'Return record: credit note line does not match this bill line';
  END IF;
  IF NEW.claim_line_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM public.claim_lines ql JOIN public.claims c ON c.id = ql.claim_id
        WHERE ql.id = NEW.claim_line_id AND c.company_id = NEW.company_id
          AND (NEW.product_id IS NULL OR ql.product_id = NEW.product_id)) THEN
    RAISE EXCEPTION 'Return record: claim line does not match this business or product';
  END IF;
  SELECT COALESCE(SUM(base_quantity), 0) INTO v_done
    FROM public.return_line_ledger WHERE invoice_line_id = NEW.invoice_line_id;
  IF v_done + NEW.base_quantity > v_line.quantity + 0.000005 THEN
    RAISE EXCEPTION 'Return is more than what is left on this bill line (left: %)', trim_scale(GREATEST(v_line.quantity - v_done, 0));
  END IF;
  RETURN NEW;
END $f$;
REVOKE ALL ON FUNCTION public.tg_return_ledger_guard() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_return_ledger_guard BEFORE INSERT OR UPDATE OR DELETE ON public.return_line_ledger
  FOR EACH ROW EXECUTE FUNCTION public.tg_return_ledger_guard();

CREATE OR REPLACE FUNCTION public.tg_product_units_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE v_used boolean;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    IF NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = NEW.product_id AND p.company_id = NEW.company_id) THEN
      RAISE EXCEPTION 'Product not found in this business';
    END IF;
    NEW.unit_name := btrim(NEW.unit_name);
    NEW.updated_at := now();
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.product_id <> OLD.product_id OR NEW.company_id <> OLD.company_id) THEN
    RAISE EXCEPTION 'A unit cannot move to another product';
  END IF;
  IF TG_OP IN ('UPDATE','DELETE') THEN
    SELECT EXISTS (SELECT 1 FROM public.return_line_ledger WHERE product_unit_id = OLD.id) INTO v_used;
    IF v_used AND TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'This unit is used in returns. Archive it instead.';
    END IF;
    IF v_used AND TG_OP = 'UPDATE' AND (NEW.conversion_factor <> OLD.conversion_factor OR NEW.unit_name <> OLD.unit_name) THEN
      RAISE EXCEPTION 'This unit is used in returns. Add a new unit instead of changing it.';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $f$;
REVOKE ALL ON FUNCTION public.tg_product_units_guard() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_product_units_guard BEFORE INSERT OR UPDATE OR DELETE ON public.product_units
  FOR EACH ROW EXECUTE FUNCTION public.tg_product_units_guard();

-- Backfill snapshots (main unit, conversion 1)
UPDATE public.credit_note_lines cl
   SET entered_quantity = cl.quantity, conversion_factor = 1, base_quantity = cl.quantity,
       entered_unit = COALESCE(NULLIF(cl.unit, ''), p.unit, '')
  FROM public.credit_note_lines x LEFT JOIN public.products p ON p.id = x.product_id
 WHERE x.id = cl.id;
UPDATE public.claim_lines ql
   SET entered_quantity = ql.quantity, conversion_factor = 1, base_quantity = ql.quantity,
       entered_unit = COALESCE(p.unit, '')
  FROM public.claim_lines x LEFT JOIN public.products p ON p.id = x.product_id
 WHERE x.id = ql.id;

-- Backfill ledger from existing credit note lines only (claim lines from the same save are not re-counted)
INSERT INTO public.return_line_ledger (company_id, invoice_id, invoice_line_id, product_id, kind,
  entered_quantity, entered_unit, conversion_factor, base_quantity, credit_note_line_id, source, created_by, created_at)
SELECT cn.company_id, cn.invoice_id, cl.invoice_line_id, il.product_id, 'good',
  cl.restocked_quantity, COALESCE(NULLIF(cl.unit,''), ''), 1, cl.restocked_quantity, cl.id, 'backfill', cn.posted_by, cl.created_at
  FROM public.credit_note_lines cl
  JOIN public.credit_notes cn ON cn.id = cl.credit_note_id
  JOIN public.invoice_lines il ON il.id = cl.invoice_line_id
 WHERE cl.restocked_quantity > 0;
INSERT INTO public.return_line_ledger (company_id, invoice_id, invoice_line_id, product_id, kind,
  entered_quantity, entered_unit, conversion_factor, base_quantity, credit_note_line_id, source, created_by, created_at)
SELECT cn.company_id, cn.invoice_id, cl.invoice_line_id, il.product_id, 'damaged_credit',
  cl.quantity - cl.restocked_quantity, COALESCE(NULLIF(cl.unit,''), ''), 1, cl.quantity - cl.restocked_quantity, cl.id, 'backfill', cn.posted_by, cl.created_at
  FROM public.credit_note_lines cl
  JOIN public.credit_notes cn ON cn.id = cl.credit_note_id
  JOIN public.invoice_lines il ON il.id = cl.invoice_line_id
 WHERE cl.quantity - cl.restocked_quantity > 0;

COMMENT ON TABLE public.return_line_ledger IS 'Only source for how much of each bill line has been returned (good, damaged with credit, damaged without credit). Written only by the return function.';