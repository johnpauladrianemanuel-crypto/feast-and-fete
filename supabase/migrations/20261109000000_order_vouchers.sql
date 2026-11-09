ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS voucher_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.validate_order_voucher(p_code TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  local_now TIMESTAMP := statement_timestamp() AT TIME ZONE 'Asia/Manila';
  percentage INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'customer'
  ) THEN
    RAISE EXCEPTION 'Vouchers are available to signed-in customers only.';
  END IF;

  percentage := CASE upper(trim(p_code))
    WHEN 'FEAST20' THEN 20
    WHEN 'FETE30' THEN 30
    WHEN 'CELEBRATE50' THEN 50
    ELSE NULL
  END;

  IF percentage IS NULL THEN
    RAISE EXCEPTION 'Invalid voucher code.';
  END IF;
  IF local_now::date < DATE '2026-11-15'
    OR local_now::date > DATE '2026-12-24'
    OR local_now::time < TIME '08:00'
    OR local_now::time >= TIME '17:00' THEN
    RAISE EXCEPTION 'Voucher available November 15 to December 24, 2026, 8 AM to 5 PM Philippine time.';
  END IF;
  RETURN percentage;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_order_voucher(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_order_voucher(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_order_voucher()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  percentage INTEGER;
  expected_discount NUMERIC(10,2);
  expected_total NUMERIC(10,2);
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.voucher_code IS DISTINCT FROM OLD.voucher_code
      OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
      OR (OLD.voucher_code IS NOT NULL AND (
        NEW.subtotal IS DISTINCT FROM OLD.subtotal
        OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
        OR NEW.priority_fee IS DISTINCT FROM OLD.priority_fee
        OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
        OR (NEW.user_id IS DISTINCT FROM OLD.user_id AND NEW.user_id IS NOT NULL)
      )) THEN
      RAISE EXCEPTION 'Voucher order pricing cannot be changed after submission.';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.voucher_code IS NULL THEN
    IF NEW.discount_amount <> 0 THEN
      RAISE EXCEPTION 'A voucher is required for a discount.';
    END IF;
    IF NEW.total_amount IS DISTINCT FROM NEW.subtotal + NEW.delivery_fee + NEW.priority_fee THEN
      RAISE EXCEPTION 'Order total must match its subtotal and fees.';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid()
    OR NEW.guest_profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'Vouchers are available to signed-in customers only.';
  END IF;
  NEW.voucher_code := upper(trim(NEW.voucher_code));
  percentage := public.validate_order_voucher(NEW.voucher_code);
  expected_discount := round((NEW.subtotal + NEW.delivery_fee + NEW.priority_fee) * percentage / 100, 2);
  expected_total := NEW.subtotal + NEW.delivery_fee + NEW.priority_fee - expected_discount;
  IF NEW.discount_amount IS DISTINCT FROM expected_discount
    OR NEW.total_amount IS DISTINCT FROM expected_total THEN
    RAISE EXCEPTION 'Voucher total changed. Please review your order and try again.';
  END IF;
  IF NEW.deposit_amount IS NOT NULL AND NEW.deposit_amount IS DISTINCT FROM round(expected_total * 0.5, 2) THEN
    RAISE EXCEPTION 'Deposit does not match the discounted total.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_order_voucher ON public.orders;
CREATE TRIGGER check_order_voucher
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_order_voucher();
