import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function getProjectRef(): string {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    return url.match(/https:\/\/([^.]+)\./)?.[1] ?? '';
  } catch {
    return '';
  }
}

function injectTokenFromHeader(request: NextRequest): void {
  try {
    const token = request.headers.get('x-sb-token');
    if (!token) return;
    const hasCookie = request.cookies.getAll().some((c) => c.name.includes('auth-token'));
    if (hasCookie) return;
    const ref = getProjectRef();
    if (ref) {
      request.cookies.set(`sb-${ref}-auth-token`, token);
    }
  } catch {
    // ignore
  }
}

export async function middleware(request: NextRequest) {
  try {
    injectTokenFromHeader(request);
  } catch {
    // ignore
  }

  const supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip Supabase auth check if env vars are missing
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              supabaseResponse.cookies.set(name, value, options);
            });
          } catch {
            // ignore cookie errors
          }
        },
      },
    });

    // Use Promise.race with a timeout to avoid hanging middleware
    await Promise.race([
      supabase.auth.getUser(),
      new Promise<void>((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch {
    // Network errors or fetch failures — continue without auth
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
