
-- DELETE policy on orders
CREATE POLICY "Company members can delete orders"
ON public.orders FOR DELETE TO authenticated
USING (company_id = get_company_id());

-- DELETE policy on stock_deductions
CREATE POLICY "Company members can delete stock deductions"
ON public.stock_deductions FOR DELETE TO authenticated
USING (company_id = get_company_id());

-- Trigger function: restore stock when deduction is deleted
CREATE OR REPLACE FUNCTION public.restore_stock_on_deduction_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stock_items
  SET quantity = quantity + OLD.quantity_deducted,
      updated_at = now()
  WHERE product_id = OLD.product_id
    AND godown_id = OLD.godown_id
    AND company_id = OLD.company_id;
  RETURN OLD;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_restore_stock_on_deduction_delete
AFTER DELETE ON public.stock_deductions
FOR EACH ROW
EXECUTE FUNCTION public.restore_stock_on_deduction_delete();
