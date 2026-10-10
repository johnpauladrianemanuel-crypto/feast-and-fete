'use client';

import {
  createBrowserClient,
  type CookieOptions,
} from '@supabase/ssr';

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/**
 * Determine if current browser path belongs to Admin domain/routes
 */
const isAdminRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin');
};

/**
 * Get prefix based on route to separate Admin and User sessions completely
 */
const getPrefix = (): string => {
  return isAdminRoute() ? 'sb-admin-' : 'sb-user-';
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
      document.cookie = `${key}=1; Path=/; SameSite=None; Secure; Partitioned`;
      cache = document.cookie.includes(key);
      document.cookie = `${key}=; Path=/; Max-Age=0; SameSite=None; Secure`;
      return cache;
    } catch {
      cache = false;
      return false;
    }
  };
})();

/**
 * Read cookies from document.cookie filtered by current scope prefix.
 */
const fromCookies = (): Array<{
  name: string;
  value: string;
}> => {
  if (typeof document === 'undefined') {
    return [];
  }

  const currentPrefix = getPrefix();

  return document.cookie
    .split(';')
    .filter(Boolean)
    .map((cookie) => {
      const trimmed = cookie.trim();
      const equalIndex = trimmed.indexOf('=');

      const rawName =
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
        name: rawName.trim(),
        value,
      };
    })
    .filter((cookie) => cookie.name.startsWith(currentPrefix))
    .map((cookie) => ({
      name: cookie.name.slice(currentPrefix.length),
      value: cookie.value,
    }));
};

/**
 * Read Supabase values from localStorage filtered by current scope prefix.
 */
const fromStorage = (): Array<{
  name: string;
  value: string;
}> => {
  if (typeof window === 'undefined') {
    return [];
  }

  const currentPrefix = getPrefix();

  try {
    return Object.keys(window.localStorage)
      .filter((key) => key.startsWith(currentPrefix))
      .map((key) => ({
        name: key.slice(currentPrefix.length),
        value: window.localStorage.getItem(key) ?? '',
      }));
  } catch {
    return [];
  }
};

/**
 * Set browser cookie with prefix scope.
 */
const setCookie = (
  name: string,
  value: string,
  options?: CookieOptions
): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const prefixedName = `${getPrefix()}${name}`;

  let cookie =
    `${prefixedName}=${encodeURIComponent(value)}; ` +
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
 * Delete browser cookie with prefix scope.
 */
const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const prefixedName = `${getPrefix()}${name}`;

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
      `${prefixedName}=; Max-Age=0; ${attributes}`;

    domains.forEach((domain) => {
      document.cookie =
        `${prefixedName}=; Max-Age=0; Domain=${domain}; ${attributes}`;
    });
  });
};

/**
 * Create Supabase browser client with isolated session scope.
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

        setAll(cookiesToSet: CookieToSet[]): void {
          if (typeof document === 'undefined') {
            return;
          }

          const currentPrefix = getPrefix();

          if (canUseCookies()) {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                if (value) {
                  setCookie(name, value, options);
                } else {
                  deleteCookie(name);
                }
              }
            );
            return;
          }

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              try {
                if (value) {
                  window.localStorage.setItem(
                    `${currentPrefix}${name}`,
                    value
                  );
                } else {
                  window.localStorage.removeItem(
                    `${currentPrefix}${name}`
                  );
                }
              } catch {
                // Ignore localStorage errors.
              }

              if (value) {
                setCookie(name, value, options);
              }
            }
          );
        },
      },

      auth: {
        storageKey: `${getPrefix()}auth-token`,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
}