ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS additional_addresses JSONB NOT NULL DEFAULT '[]'::jsonb;