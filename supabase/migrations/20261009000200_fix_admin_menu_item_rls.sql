-- Allow profile-based admins to manage menu items and menu photo objects.
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $function$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM auth.users AS users
      WHERE users.id = auth.uid()
        AND (
          users.raw_user_meta_data->>'role' = 'admin'
          OR users.raw_app_meta_data->>'role' = 'admin'
        )
    );
$function$;

DROP POLICY IF EXISTS "admin_manage_menu_items" ON public.menu_items;
CREATE POLICY "admin_manage_menu_items"
ON public.menu_items
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

DROP POLICY IF EXISTS "menu_items_auth_upload" ON storage.objects;
CREATE POLICY "menu_items_auth_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'MENU' AND public.is_admin_from_auth());

DROP POLICY IF EXISTS "menu_items_auth_update" ON storage.objects;
CREATE POLICY "menu_items_auth_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'MENU' AND public.is_admin_from_auth())
WITH CHECK (bucket_id = 'MENU' AND public.is_admin_from_auth());

DROP POLICY IF EXISTS "menu_items_auth_delete" ON storage.objects;
CREATE POLICY "menu_items_auth_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'MENU' AND public.is_admin_from_auth());
