CREATE OR REPLACE FUNCTION public.check_order_voucher()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  percentage INTEGER;
  automatic_discount NUMERIC(10,2) := 0;
  expected_discount NUMERIC(10,2) := 0;
  expected_total NUMERIC(10,2);
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.voucher_code IS DISTINCT FROM OLD.voucher_code
      OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
      OR ((OLD.voucher_code IS NOT NULL OR OLD.discount_amount > 0) AND (
        NEW.subtotal IS DISTINCT FROM OLD.subtotal
        OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
        OR NEW.priority_fee IS DISTINCT FROM OLD.priority_fee
        OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
        OR (NEW.user_id IS DISTINCT FROM OLD.user_id AND NEW.user_id IS NOT NULL)
      )) THEN
      RAISE EXCEPTION 'Discounted order pricing cannot be changed after submission.';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NOT NULL THEN
    IF NEW.user_id IS DISTINCT FROM auth.uid() OR NEW.guest_profile_id IS NOT NULL
      OR NOT EXISTS (
        SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'customer'
      ) THEN
      RAISE EXCEPTION 'Customer discounts require a signed-in customer account.';
    END IF;
    automatic_discount := round(NEW.subtotal * 0.20, 2);
  END IF;

  expected_discount := automatic_discount;
  IF NEW.voucher_code IS NOT NULL THEN
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'Vouchers are available to signed-in customers only.';
    END IF;
    NEW.voucher_code := upper(trim(NEW.voucher_code));
    percentage := public.validate_order_voucher(NEW.voucher_code);
    expected_discount := round((NEW.subtotal + NEW.delivery_fee + NEW.priority_fee) * percentage / 100, 2);
    IF expected_discount <= automatic_discount THEN
      RAISE EXCEPTION 'The automatic customer discount is at least as large as this voucher.';
    END IF;
  END IF;

  expected_total := NEW.subtotal + NEW.delivery_fee + NEW.priority_fee - expected_discount;
  IF NEW.discount_amount IS DISTINCT FROM expected_discount
    OR NEW.total_amount IS DISTINCT FROM expected_total THEN
    RAISE EXCEPTION 'Order discount or total changed. Please review your order and try again.';
  END IF;
  IF NEW.deposit_amount IS NOT NULL AND NEW.deposit_amount IS DISTINCT FROM round(expected_total * 0.5, 2) THEN
    RAISE EXCEPTION 'Deposit does not match the order total.';
  END IF;
  RETURN NEW;
END;
$$;
