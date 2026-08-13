import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/**
 * Create Supabase server client.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL.'
    );
  }

  if (!supabaseKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
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
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {
            /*
             * Server Components can have a read-only
             * cookie context. Middleware will handle
             * session refresh when necessary.
             */
          }
        },
      },
    }
  );
}