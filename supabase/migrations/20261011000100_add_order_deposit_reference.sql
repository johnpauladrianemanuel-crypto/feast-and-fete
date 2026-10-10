ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2);
