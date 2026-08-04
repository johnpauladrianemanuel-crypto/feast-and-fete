-- Item Reviews Migration
-- Allows customers to rate and review food items after order completion

CREATE TABLE IF NOT EXISTS public.item_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_profile_id UUID REFERENCES public.guest_profiles(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_reviews_menu_item_id ON public.item_reviews(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_item_reviews_order_id ON public.item_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_item_reviews_user_id ON public.item_reviews(user_id);

ALTER TABLE public.item_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read all reviews
DROP POLICY IF EXISTS "public_read_item_reviews" ON public.item_reviews;
CREATE POLICY "public_read_item_reviews"
ON public.item_reviews
FOR SELECT
TO public
USING (true);

-- Authenticated users can insert their own reviews
DROP POLICY IF EXISTS "users_insert_own_reviews" ON public.item_reviews;
CREATE POLICY "users_insert_own_reviews"
ON public.item_reviews
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Authenticated users can update their own reviews
DROP POLICY IF EXISTS "users_update_own_reviews" ON public.item_reviews;
CREATE POLICY "users_update_own_reviews"
ON public.item_reviews
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow anonymous/guest inserts (guest_profile_id set, user_id null)
DROP POLICY IF EXISTS "anon_insert_guest_reviews" ON public.item_reviews;
CREATE POLICY "anon_insert_guest_reviews"
ON public.item_reviews
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);
