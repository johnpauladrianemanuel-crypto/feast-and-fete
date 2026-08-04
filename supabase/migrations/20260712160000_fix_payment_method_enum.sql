-- Add missing payment method enum values to match frontend options
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'cash_on_delivery';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'card';
