-- Add FK constraints with ON DELETE CASCADE to child tables

-- order_lines → orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'order_lines_order_id_fkey' AND table_name = 'order_lines'
  ) THEN
    ALTER TABLE public.order_lines
      ADD CONSTRAINT order_lines_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- claim_lines → claims
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'claim_lines_claim_id_fkey' AND table_name = 'claim_lines'
  ) THEN
    ALTER TABLE public.claim_lines
      ADD CONSTRAINT claim_lines_claim_id_fkey
      FOREIGN KEY (claim_id) REFERENCES public.claims(id) ON DELETE CASCADE;
  END IF;
END $$;

-- invoice_lines → invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'invoice_lines_invoice_id_fkey' AND table_name = 'invoice_lines'
  ) THEN
    ALTER TABLE public.invoice_lines
      ADD CONSTRAINT invoice_lines_invoice_id_fkey
      FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
  END IF;
END $$;

-- order_schemes → orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'order_schemes_order_id_fkey' AND table_name = 'order_schemes'
  ) THEN
    ALTER TABLE public.order_schemes
      ADD CONSTRAINT order_schemes_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- stock_deductions → orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stock_deductions_order_id_fkey' AND table_name = 'stock_deductions'
  ) THEN
    ALTER TABLE public.stock_deductions
      ADD CONSTRAINT stock_deductions_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END $$;