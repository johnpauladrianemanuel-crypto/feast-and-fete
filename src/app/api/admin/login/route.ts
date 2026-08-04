import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Query password from Supabase
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'admin_password')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Admin password not found in database.' },
        { status: 500 }
      );
    }

    // Verify password match
    if (password === data.value) {
      const response = NextResponse.json({ success: true });

      // Set session cookie
      response.cookies.set('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Incorrect password. Please try again.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Server error processing request.' },
      { status: 500 }
    );
  }
}