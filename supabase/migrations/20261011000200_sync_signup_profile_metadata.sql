CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_full_name TEXT := NULLIF(BTRIM(NEW.raw_user_meta_data->>'full_name'), '');
  signup_phone TEXT := NULLIF(BTRIM(NEW.raw_user_meta_data->>'phone'), '');
  signup_address TEXT := NULLIF(BTRIM(NEW.raw_user_meta_data->>'address'), '');
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, phone, address, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(signup_full_name, ''),
    signup_phone,
    signup_address,
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(
      NULLIF(BTRIM(public.user_profiles.full_name), ''),
      NULLIF(BTRIM(EXCLUDED.full_name), ''),
      ''
    ),
    phone = COALESCE(
      NULLIF(BTRIM(public.user_profiles.phone), ''),
      NULLIF(BTRIM(EXCLUDED.phone), '')
    ),
    address = COALESCE(
      NULLIF(BTRIM(public.user_profiles.address), ''),
      NULLIF(BTRIM(EXCLUDED.address), '')
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
