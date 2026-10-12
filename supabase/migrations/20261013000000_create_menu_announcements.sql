CREATE TABLE IF NOT EXISTS public.menu_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id TEXT NOT NULL UNIQUE,
  menu_item_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (email_status IN ('pending', 'sent', 'partial', 'not_configured')),
  email_sent_count INTEGER NOT NULL DEFAULT 0,
  email_error TEXT
);

ALTER TABLE public.menu_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read menu announcements"
  ON public.menu_announcements
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

GRANT SELECT ON public.menu_announcements TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'menu_announcements'
    )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_announcements;
  END IF;
END
$$;
