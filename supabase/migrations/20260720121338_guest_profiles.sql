-- Migration: Guest Profiles — verified guest contact data
-- Timestamp: 20260720121338

-- ============================================================
-- 1. TABLE
-- ============================================================

-- Guest profiles: stores verified phone/email for guest users
-- No FK to auth.users — guests are unauthenticated
CREATE TABLE IF NOT EXISTS public.guest_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'email')),
  contact_value TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_guest_profiles_contact_value ON public.guest_profiles(contact_value);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_contact_type ON public.guest_profiles(contact_type);

-- ============================================================
-- 3. ENABLE RLS
-- ============================================================
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- Allow anyone (including anon) to insert a guest profile (guest checkout flow)
DROP POLICY IF EXISTS "allow_guest_profile_insert" ON public.guest_profiles;
CREATE POLICY "allow_guest_profile_insert"
ON public.guest_profiles
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to read guest profiles (needed to look up by contact value)
DROP POLICY IF EXISTS "allow_guest_profile_select" ON public.guest_profiles;
CREATE POLICY "allow_guest_profile_select"
ON public.guest_profiles
FOR SELECT
TO public
USING (true);

-- Admins can manage all guest profiles
DROP POLICY IF EXISTS "admins_manage_guest_profiles" ON public.guest_profiles;
CREATE POLICY "admins_manage_guest_profiles"
ON public.guest_profiles
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());
