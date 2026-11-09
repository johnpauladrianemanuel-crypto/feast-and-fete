CREATE TABLE IF NOT EXISTS public.claimed_vouchers (
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  voucher_code TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, voucher_code)
);

ALTER TABLE public.claimed_vouchers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.claimed_vouchers FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.claimed_vouchers TO authenticated;

DROP POLICY IF EXISTS "customers_read_own_claimed_vouchers" ON public.claimed_vouchers;
CREATE POLICY "customers_read_own_claimed_vouchers"
ON public.claimed_vouchers FOR SELECT TO authenticated
USING (user_id = auth.uid());

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
  percentage := public.validate_order_voucher(normalized_code);
  INSERT INTO public.claimed_vouchers (user_id, voucher_code)
  VALUES (auth.uid(), normalized_code)
  ON CONFLICT (user_id, voucher_code) DO NOTHING;
  RETURN percentage;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_claimed_voucher(p_code TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_code TEXT := upper(trim(p_code));
  percentage INTEGER;
BEGIN
  percentage := public.validate_order_voucher(normalized_code);
  IF NOT EXISTS (
    SELECT 1 FROM public.claimed_vouchers
    WHERE user_id = auth.uid() AND voucher_code = normalized_code
  ) THEN
    RAISE EXCEPTION 'Claim this voucher on the menu page before using it.';
  END IF;
  RETURN percentage;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_voucher(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_claimed_voucher(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_voucher(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_claimed_voucher(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_claimed_order_voucher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.voucher_code IS NOT NULL THEN
    PERFORM public.validate_claimed_voucher(NEW.voucher_code);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.check_claimed_order_voucher() FROM PUBLIC;
DROP TRIGGER IF EXISTS check_claimed_order_voucher ON public.orders;
CREATE TRIGGER check_claimed_order_voucher
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_claimed_order_voucher();
