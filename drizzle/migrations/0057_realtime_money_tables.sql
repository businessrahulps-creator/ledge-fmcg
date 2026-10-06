DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['invoice_payments','credit_notes','invoices','claims','targets','secondary_sales'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS invoice_payments_dealer_status_amt_idx ON public.invoice_payments (distributor_id, status) INCLUDE (amount);