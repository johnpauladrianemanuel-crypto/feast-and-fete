import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyGuestLinkToken } from '@/lib/guestLink';

export async function POST(request: Request) {
  const { token } = (await request.json().catch(() => ({}))) as { token?: string };
  const guestProfileId = typeof token === 'string' ? verifyGuestLinkToken(token) : null;
  if (!guestProfileId) {
    return NextResponse.json({ error: 'This link is invalid or expired.' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data } = await supabase
    .from('guest_profiles')
    .select('contact_type, contact_value, full_name, phone, address')
    .eq('id', guestProfileId)
    .maybeSingle();

  return NextResponse.json({
    id: guestProfileId,
    contactType: data?.contact_type ?? 'phone',
    contactValue: data?.contact_value ?? '',
    fullName: data?.full_name ?? '',
    phone: data?.phone ?? '',
    address: data?.address ?? null,
  });
}
