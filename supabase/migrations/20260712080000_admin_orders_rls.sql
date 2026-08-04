-- Migration: Admin full access to orders and order_items
-- Timestamp: 20260712080000

-- Function: check if current user has admin role (queries user_profiles, safe for non-user_profiles tables)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE id = auth.uid() AND role = 'admin'
)
$$;

-- ============================================================
-- ORDERS: Admin full access
-- ============================================================
DROP POLICY IF EXISTS "admin_full_access_orders" ON public.orders;
CREATE POLICY "admin_full_access_orders"
ON public.orders
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- ORDER_ITEMS: Admin full access
-- ============================================================
DROP POLICY IF EXISTS "admin_full_access_order_items" ON public.order_items;
CREATE POLICY "admin_full_access_order_items"
ON public.order_items
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- ORDERS: Authenticated users can insert their own orders
-- ============================================================
DROP POLICY IF EXISTS "users_insert_own_orders" ON public.orders;
CREATE POLICY "users_insert_own_orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================
-- ORDERS: Authenticated users can read their own orders
-- ============================================================
DROP POLICY IF EXISTS "users_read_own_orders" ON public.orders;
CREATE POLICY "users_read_own_orders"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- ORDER_ITEMS: Authenticated users can insert items for their orders
-- ============================================================
DROP POLICY IF EXISTS "users_insert_own_order_items" ON public.order_items;
CREATE POLICY "users_insert_own_order_items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_id AND (user_id = auth.uid() OR user_id IS NULL)
  )
);

-- ============================================================
-- ORDER_ITEMS: Authenticated users can read items for their orders
-- ============================================================
DROP POLICY IF EXISTS "users_read_own_order_items" ON public.order_items;
CREATE POLICY "users_read_own_order_items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_id AND user_id = auth.uid()
  )
);
