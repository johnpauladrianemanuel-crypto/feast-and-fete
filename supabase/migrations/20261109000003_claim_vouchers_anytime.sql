CREATE OR REPLACE FUNCTION public.claim_voucher(p_code TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_code TEXT := upper(trim(p_code));
  percentage INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'customer'
  ) THEN
    RAISE EXCEPTION 'Vouchers are available to signed-in customers only.';
  END IF;

  percentage := CASE normalized_code
    WHEN 'FEAST20' THEN 20
    WHEN 'FETE30' THEN 30
    WHEN 'CELEBRATE50' THEN 50
    ELSE NULL
  END;
  IF percentage IS NULL THEN
    RAISE EXCEPTION 'Invalid voucher code.';
  END IF;

  INSERT INTO public.claimed_vouchers (user_id, voucher_code)
  VALUES (auth.uid(), normalized_code)
  ON CONFLICT (user_id, voucher_code) DO NOTHING;
  RETURN percentage;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_voucher(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_voucher(TEXT) TO authenticated;
