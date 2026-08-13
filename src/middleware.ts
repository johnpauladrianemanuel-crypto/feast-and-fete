import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr';

import {
  NextResponse,
  type NextRequest,
} from 'next/server';

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/**
 * Get the Supabase project reference from the URL.
 */
function getProjectRef(): string {
  try {
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

    return (
      url.match(
        /https:\/\/([^.]+)\./
      )?.[1] ?? ''
    );
  } catch {
    return '';
  }
}

/**
 * Inject the Supabase token from the custom
 * x-sb-token header when necessary.
 */
function injectTokenFromHeader(
  request: NextRequest
): void {
  try {
    const token =
      request.headers.get('x-sb-token');

    if (!token) {
      return;
    }

    const hasCookie = request.cookies
      .getAll()
      .some((cookie) =>
        cookie.name.includes('auth-token')
      );

    if (hasCookie) {
      return;
    }

    const projectRef = getProjectRef();

    if (projectRef) {
      request.cookies.set(
        `sb-${projectRef}-auth-token`,
        token
      );
    }
  } catch {
    // Ignore token injection errors.
  }
}

/**
 * Next.js middleware.
 */
export async function middleware(
  request: NextRequest
) {
  try {
    injectTokenFromHeader(request);
  } catch {
    // Ignore errors.
  }

  const supabaseResponse =
    NextResponse.next({
      request,
    });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  /*
   * Don't crash the application if the
   * environment variables aren't available.
   */
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    const supabase =
      createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },

            setAll(
              cookiesToSet: CookieToSet[]
            ) {
              try {
                cookiesToSet.forEach(
                  ({
                    name,
                    value,
                    options,
                  }) => {
                    request.cookies.set(
                      name,
                      value
                    );

                    supabaseResponse.cookies.set(
                      name,
                      value,
                      options
                    );
                  }
                );
              } catch {
                // Ignore cookie errors.
              }
            },
          },
        }
      );

    /*
     * Prevent middleware from hanging forever.
     */
    await Promise.race([
      supabase.auth.getUser(),

      new Promise<void>((resolve) => {
        setTimeout(resolve, 3000);
      }),
    ]);
  } catch {
    /*
     * If Supabase cannot be reached, allow
     * the request to continue.
     */
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};