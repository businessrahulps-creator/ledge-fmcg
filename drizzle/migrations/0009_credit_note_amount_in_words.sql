DO $mig$
DECLARE
  s text;
  old_block text := '    total_tax = v_cgst + v_sgst + v_igst, round_off = v_roundoff, grand_total = v_rounded
  WHERE id = v_cn_id;';
  new_block text := '    total_tax = v_cgst + v_sgst + v_igst, round_off = v_roundoff, grand_total = v_rounded,
    amount_in_words = public.amount_in_words_inr(v_rounded)
  WHERE id = v_cn_id;';
BEGIN
  SELECT p.prosrc INTO s
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'record_return_and_credit_atomic';

  IF position(old_block in s) = 0 THEN RAISE EXCEPTION 'update block not found'; END IF;

  EXECUTE 'CREATE OR REPLACE FUNCTION public.record_return_and_credit_atomic(p_order_id uuid, p_lines jsonb, p_reason text DEFAULT ''''::text, p_godown_id uuid DEFAULT NULL::uuid, p_note_date date DEFAULT NULL::date) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''public'' AS '
    || quote_literal(replace(s, old_block, new_block));
END
$mig$;

REVOKE ALL ON FUNCTION public.record_return_and_credit_atomic(uuid, jsonb, text, uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_return_and_credit_atomic(uuid, jsonb, text, uuid, date) TO authenticated;