-- 1. Dealer credit terms: stop overloading "0" as unlimited
ALTER TABLE public.distributors
  ADD COLUMN IF NOT EXISTS credit_mode text NOT NULL DEFAULT 'unlimited';

UPDATE public.distributors
   SET credit_mode = CASE WHEN COALESCE(credit_limit, 0) > 0 THEN 'limited' ELSE 'unlimited' END;

ALTER TABLE public.distributors
  ADD CONSTRAINT distributors_credit_mode_chk
  CHECK (credit_mode IN ('unlimited', 'limited', 'cash_only'));

-- 2. Scheme stacking rule
ALTER TABLE public.schemes
  ADD COLUMN IF NOT EXISTS is_combinable boolean NOT NULL DEFAULT false;

-- 3. GSTIN state helper: first two digits are the state of registration
CREATE OR REPLACE FUNCTION public.state_code_of_gstin(p_gstin text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_gstin IS NULL THEN NULL
    WHEN LENGTH(TRIM(p_gstin)) < 2 THEN NULL
    WHEN SUBSTRING(TRIM(p_gstin) FROM 1 FOR 2) ~ '^[0-9]{2}$'
      THEN SUBSTRING(TRIM(p_gstin) FROM 1 FOR 2)
    ELSE NULL
  END
$$;

-- 4. Indian rupee amount in words (used when a GST bill is created)
CREATE OR REPLACE FUNCTION public.words_below_hundred(n int)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  ones text[] := ARRAY['One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  tens text[] := ARRAY['Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
BEGIN
  IF n <= 0 THEN RETURN ''; END IF;
  IF n < 20 THEN RETURN ones[n]; END IF;
  RETURN TRIM(tens[(n / 10) - 1] || CASE WHEN n % 10 > 0 THEN ' ' || ones[n % 10] ELSE '' END);
END;
$$;

CREATE OR REPLACE FUNCTION public.amount_in_words_inr(p_amount numeric)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_amt numeric := ROUND(COALESCE(p_amount, 0), 2);
  v_rupees bigint;
  v_paise int;
  v_out text := '';
  v_part int;
BEGIN
  v_rupees := FLOOR(v_amt)::bigint;
  v_paise := ROUND((v_amt - FLOOR(v_amt)) * 100)::int;

  IF v_rupees = 0 THEN
    v_out := 'Zero';
  ELSE
    v_part := (v_rupees / 10000000)::int;
    IF v_part > 0 THEN
      v_out := v_out || public.words_below_hundred(v_part) || ' Crore ';
      v_rupees := v_rupees % 10000000;
    END IF;

    v_part := (v_rupees / 100000)::int;
    IF v_part > 0 THEN
      v_out := v_out || public.words_below_hundred(v_part) || ' Lakh ';
      v_rupees := v_rupees % 100000;
    END IF;

    v_part := (v_rupees / 1000)::int;
    IF v_part > 0 THEN
      v_out := v_out || public.words_below_hundred(v_part) || ' Thousand ';
      v_rupees := v_rupees % 1000;
    END IF;

    v_part := (v_rupees / 100)::int;
    IF v_part > 0 THEN
      v_out := v_out || public.words_below_hundred(v_part) || ' Hundred ';
      v_rupees := v_rupees % 100;
    END IF;

    IF v_rupees > 0 THEN
      v_out := v_out || public.words_below_hundred(v_rupees::int) || ' ';
    END IF;
  END IF;

  v_out := 'Rupees ' || TRIM(v_out);
  IF v_paise > 0 THEN
    v_out := v_out || ' and ' || public.words_below_hundred(v_paise) || ' Paise';
  END IF;
  RETURN v_out || ' Only';
END;
$$;

REVOKE ALL ON FUNCTION public.state_code_of_gstin(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.words_below_hundred(int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.amount_in_words_inr(numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.state_code_of_gstin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.words_below_hundred(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.amount_in_words_inr(numeric) TO authenticated;