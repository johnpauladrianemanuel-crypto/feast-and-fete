-- Store guest contact details and default delivery address collected after OTP verification
ALTER TABLE public.guest_profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Make sure orders can link to guests
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_profile_id UUID REFERENCES public.guest_profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_guest_profile_id ON public.orders(guest_profile_id);

-- RLS: guests can be inserted; admins can read/manage all guests
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_guest_profile_insert" ON public.guest_profiles;
CREATE POLICY "allow_guest_profile_insert"
ON public.guest_profiles FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "admins_manage_guest_profiles" ON public.guest_profiles;
CREATE POLICY "admins_manage_guest_profiles"
ON public.guest_profiles FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin'));
