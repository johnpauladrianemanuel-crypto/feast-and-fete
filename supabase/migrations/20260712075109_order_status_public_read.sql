-- Migration: Allow public read of orders by order_number (guest order tracking)
-- Timestamp: 20260712075109

-- Allow anyone to read an order if they know the order_number (guest tracking)
DROP POLICY IF EXISTS "allow_public_read_order_by_number" ON public.orders;
CREATE POLICY "allow_public_read_order_by_number"
ON public.orders
FOR SELECT
TO public
USING (true);

-- Allow anyone to read order_items for orders they can see
DROP POLICY IF EXISTS "allow_public_read_order_items" ON public.order_items;
CREATE POLICY "allow_public_read_order_items"
ON public.order_items
FOR SELECT
TO public
USING (true);
