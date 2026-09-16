-- Store customer notes for individual menu items in an order.

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS notes TEXT;
