ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS priority_fee NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_priority_created_at
ON public.orders (is_priority DESC, created_at DESC);
