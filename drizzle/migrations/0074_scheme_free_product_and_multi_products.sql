ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS free_product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS product_ids uuid[] NULL;
ALTER TABLE public.order_lines ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;
ALTER TABLE public.order_lines ADD COLUMN IF NOT EXISTS scheme_id uuid NULL REFERENCES public.schemes(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.tg_schemes_same_company_products()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.free_product_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = NEW.free_product_id AND p.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'Free product must belong to this business';
  END IF;
  IF NEW.product_ids IS NOT NULL AND cardinality(NEW.product_ids) > 0 AND EXISTS (
    SELECT 1 FROM unnest(NEW.product_ids) pid
    WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = pid AND p.company_id = NEW.company_id)) THEN
    RAISE EXCEPTION 'Offer products must belong to this business';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.tg_schemes_same_company_products() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS schemes_same_company_products ON public.schemes;
CREATE TRIGGER schemes_same_company_products BEFORE INSERT OR UPDATE OF free_product_id, product_ids, company_id
ON public.schemes FOR EACH ROW EXECUTE FUNCTION public.tg_schemes_same_company_products();