'use client';

import {
  createBrowserClient,
  type CookieOptions,
} from '@supabase/ssr';

const PFX = 'sb_';

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/**
 * Check whether browser cookies are available.
 */
const canUseCookies = (() => {
  let cache: boolean | null = null;

  return (): boolean => {
    if (typeof document === 'undefined') {
      return false;
    }

    if (cache !== null) {
      return cache;
    }

    const key = '__sb_test__';

    try {
      document.cookie =
        `${key}=1; Path=/; SameSite=None; Secure; Partitioned`;

      cache = document.cookie.includes(key);

      document.cookie =
        `${key}=; Path=/; Max-Age=0; SameSite=None; Secure`;

      return cache;
    } catch {
      cache = false;
      return false;
    }
  };
})();

/**
 * Read cookies from document.cookie.
 */
const fromCookies = (): Array<{
  name: string;
  value: string;
}> => {
  if (typeof document === 'undefined') {
    return [];
  }

  return document.cookie
    .split(';')
    .filter(Boolean)
    .map((cookie) => {
      const trimmed = cookie.trim();
      const equalIndex = trimmed.indexOf('=');

      const name =
        equalIndex >= 0
          ? trimmed.slice(0, equalIndex)
          : trimmed;

      let value = '';

      if (equalIndex >= 0) {
        try {
          value = decodeURIComponent(
            trimmed.slice(equalIndex + 1)
          );
        } catch {
          value = trimmed.slice(equalIndex + 1);
        }
      }

      return {
        name: name.trim(),
        value,
      };
    })
    .filter((cookie) => Boolean(cookie.name));
};

/**
 * Read Supabase values from localStorage.
 */
const fromStorage = (): Array<{
  name: string;
  value: string;
}> => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PFX))
      .map((key) => ({
        name: key.slice(PFX.length),
        value:
          window.localStorage.getItem(key) ?? '',
      }));
  } catch {
    return [];
  }
};

/**
 * Set browser cookie.
 */
const setCookie = (
  name: string,
  value: string,
  options?: CookieOptions
): void => {
  if (typeof document === 'undefined') {
    return;
  }

  let cookie =
    `${name}=${encodeURIComponent(value)}; ` +
    `Path=${options?.path ?? '/'}; ` +
    `SameSite=None; Secure; Partitioned`;

  if (options?.maxAge !== undefined) {
    cookie += `; Max-Age=${options.maxAge}`;
  }

  if (options?.domain) {
    cookie += `; Domain=${options.domain}`;
  }

  if (options?.expires) {
    const expires =
      options.expires instanceof Date
        ? options.expires
        : new Date(options.expires);

    if (!Number.isNaN(expires.getTime())) {
      cookie += `; Expires=${expires.toUTCString()}`;
    }
  }

  document.cookie = cookie;
};

/**
 * Delete browser cookie.
 */
const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const host =
    typeof window !== 'undefined'
      ? window.location.hostname
      : '';

  const domains = [
    '',
    host,
    host ? `.${host}` : '',
  ].filter(Boolean);

  const variants = [
    'Path=/; SameSite=Lax',
    'Path=/; SameSite=None; Secure',
    'Path=/; SameSite=None; Secure; Partitioned',
  ];

  variants.forEach((attributes) => {
    document.cookie =
      `${name}=; Max-Age=0; ${attributes}`;

    domains.forEach((domain) => {
      document.cookie =
        `${name}=; Max-Age=0; Domain=${domain}; ${attributes}`;
    });
  });
};

/**
 * Create Supabase browser client.
 */
export function createClient() {
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

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll: () => {
          return canUseCookies()
            ? fromCookies()
            : fromStorage();
        },

        setAll(
          cookiesToSet: CookieToSet[]
        ): void {
          if (typeof document === 'undefined') {
            return;
          }

          if (canUseCookies()) {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                if (value) {
                  setCookie(
                    name,
                    value,
                    options
                  );
                } else {
                  deleteCookie(name);
                }
              }
            );

            return;
          }

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              try {
                if (value) {
                  window.localStorage.setItem(
                    `${PFX}${name}`,
                    value
                  );
                } else {
                  window.localStorage.removeItem(
                    `${PFX}${name}`
                  );
                }
              } catch {
                // Ignore localStorage errors.
              }

              if (value) {
                setCookie(
                  name,
                  value,
                  options
                );
              }
            }
          );
        },
      },

      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
}