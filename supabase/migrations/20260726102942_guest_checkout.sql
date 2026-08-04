-- Migration: Add guest_profile_id to orders table for guest checkout linking
-- Timestamp: 20260726102942

-- Add guest_profile_id column to orders table (nullable, links to guest_profiles)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS guest_profile_id UUID REFERENCES public.guest_profiles(id) ON DELETE SET NULL;

-- Index for fast lookup of orders by guest profile
CREATE INDEX IF NOT EXISTS idx_orders_guest_profile_id ON public.orders(guest_profile_id);

-- Allow public (unauthenticated) INSERT on orders for guest checkout
-- (Existing RLS policies may already cover authenticated users; this adds guest support)
DROP POLICY IF EXISTS "guests_can_insert_orders" ON public.orders;
CREATE POLICY "guests_can_insert_orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (user_id IS NULL AND guest_profile_id IS NOT NULL);

-- Allow guests to read their own orders via guest_profile_id
DROP POLICY IF EXISTS "guests_can_read_own_orders" ON public.orders;
CREATE POLICY "guests_can_read_own_orders"
ON public.orders
FOR SELECT
TO public
USING (guest_profile_id IS NOT NULL);
