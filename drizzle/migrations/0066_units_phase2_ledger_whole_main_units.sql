ALTER TABLE public.return_line_ledger
  ADD CONSTRAINT rll_base_quantity_whole CHECK (base_quantity = trunc(base_quantity));
COMMENT ON CONSTRAINT rll_base_quantity_whole ON public.return_line_ledger IS 'Returns are saved only as whole main units.';