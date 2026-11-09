CREATE TABLE IF NOT EXISTS public.item_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id TEXT NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_profile_id UUID REFERENCES public.guest_profiles(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'item_reviews'
      AND column_name = 'menu_item_id' AND data_type <> 'text'
  ) THEN
    FOR constraint_record IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.item_reviews'::regclass
        AND c.contype = 'f' AND a.attname = 'menu_item_id'
    LOOP
      EXECUTE format('ALTER TABLE public.item_reviews DROP CONSTRAINT %I', constraint_record.conname);
    END LOOP;
    ALTER TABLE public.item_reviews ALTER COLUMN menu_item_id TYPE TEXT USING menu_item_id::text;
    ALTER TABLE public.item_reviews
      ADD CONSTRAINT item_reviews_menu_item_id_fkey
      FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_item_reviews_menu_item_id ON public.item_reviews(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_item_reviews_order_id ON public.item_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_item_reviews_user_id ON public.item_reviews(user_id);

ALTER TABLE public.item_reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.item_reviews TO anon, authenticated;
GRANT INSERT ON public.item_reviews TO anon, authenticated;
GRANT UPDATE ON public.item_reviews TO authenticated;

DROP POLICY IF EXISTS "public_read_item_reviews" ON public.item_reviews;
CREATE POLICY "public_read_item_reviews" ON public.item_reviews
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "users_insert_own_reviews" ON public.item_reviews;
CREATE POLICY "users_insert_own_reviews" ON public.item_reviews
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_reviews" ON public.item_reviews;
CREATE POLICY "users_update_own_reviews" ON public.item_reviews
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "anon_insert_guest_reviews" ON public.item_reviews;
CREATE POLICY "anon_insert_guest_reviews" ON public.item_reviews
FOR INSERT TO anon WITH CHECK (user_id IS NULL);
