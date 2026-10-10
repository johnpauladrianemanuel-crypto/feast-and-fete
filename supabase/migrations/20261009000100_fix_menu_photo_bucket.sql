-- Match the menu-photo uploader to the MENU bucket created in Supabase.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'MENU',
  'MENU',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "menu_items_public_read" ON storage.objects;
CREATE POLICY "menu_items_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'MENU');

DROP POLICY IF EXISTS "menu_items_auth_upload" ON storage.objects;
CREATE POLICY "menu_items_auth_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'MENU' AND public.is_admin_from_auth());

DROP POLICY IF EXISTS "menu_items_auth_update" ON storage.objects;
CREATE POLICY "menu_items_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'MENU' AND public.is_admin_from_auth())
WITH CHECK (bucket_id = 'MENU' AND public.is_admin_from_auth());

DROP POLICY IF EXISTS "menu_items_auth_delete" ON storage.objects;
CREATE POLICY "menu_items_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'MENU' AND public.is_admin_from_auth());
