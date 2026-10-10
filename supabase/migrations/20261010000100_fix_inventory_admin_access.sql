-- Align ingredient inventory access with the user_profiles admin role.
-- Keep metadata-based admins working while also recognizing profile-based admins.

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

DROP POLICY IF EXISTS "admin_manage_inventory" ON public.inventory_items;
CREATE POLICY "admin_manage_inventory"
  ON public.inventory_items
  FOR ALL
  TO authenticated
  USING (public.is_admin_from_auth())
  WITH CHECK (public.is_admin_from_auth());

DROP POLICY IF EXISTS "admin_manage_menu_item_ingredients"
  ON public.menu_item_ingredients;
CREATE POLICY "admin_manage_menu_item_ingredients"
  ON public.menu_item_ingredients
  FOR ALL
  TO authenticated
  USING (public.is_admin_from_auth())
  WITH CHECK (public.is_admin_from_auth());
