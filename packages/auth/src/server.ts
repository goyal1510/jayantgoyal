import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieValue = { name: string; value: string };
type CookieToSet = CookieValue & { options: CookieOptions };

type ReadableCookieStore = {
  getAll(): Promise<CookieValue[] | null> | CookieValue[] | null;
};

type WritableCookieStore = {
  set(name: string, value: string, options?: CookieOptions): unknown;
};

type WritableHeaders = {
  set(name: string, value: string): unknown;
};

type ReadableHeaders = {
  get(name: string): string | null;
};

const AUTH_CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

export function copyAuthCacheHeaders(
  sourceHeaders: ReadableHeaders,
  targetHeaders: WritableHeaders,
) {
  AUTH_CACHE_HEADERS.forEach((name) => {
    const value = sourceHeaders.get(name);
    if (value !== null) targetHeaders.set(name, value);
  });
}

export function writeAuthResponse({
  cookies,
  headers,
  cookieStore,
  responseHeaders,
}: {
  cookies: CookieToSet[];
  headers: Record<string, string>;
  cookieStore: WritableCookieStore;
  responseHeaders: WritableHeaders;
}) {
  cookies.forEach(({ name, value, options }) => {
    cookieStore.set(name, value, options);
  });
  Object.entries(headers).forEach(([name, value]) => {
    responseHeaders.set(name, value);
  });
}

export function createSupabaseRequestClient({
  supabaseUrl,
  supabaseAnonKey,
  requestCookies,
  responseCookies,
  responseHeaders,
}: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  requestCookies: ReadableCookieStore;
  responseCookies: WritableCookieStore;
  responseHeaders: WritableHeaders;
}) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => requestCookies.getAll(),
      setAll(cookies, headers) {
        writeAuthResponse({
          cookies,
          headers,
          cookieStore: responseCookies,
          responseHeaders,
        });
      },
    },
  });
}

export function createSupabaseServerComponentClient(
  cookieStore: ReadableCookieStore & WritableCookieStore,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookies) {
        try {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can expose a read-only cookie store. Proxy refresh
          // remains responsible for committing refreshed cookies and headers.
        }
      },
    },
  });
}
