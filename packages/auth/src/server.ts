import { createServerClient, type CookieOptions } from "@supabase/ssr";

import {
  legacyCookieNameForSupabaseUrl,
  resolveAuthSessionMode,
  resolveSessionCookieOptions,
  selectRequestSessionSource,
  type AuthSessionMode,
  type SessionCookieOptions,
} from "./cookies";

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

type PromotionClient = {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string } | null };
      error: unknown;
    }>;
    getSession(): Promise<{
      data: {
        session: {
          access_token: string;
          refresh_token: string;
        } | null;
      };
      error: unknown;
    }>;
    setSession(credentials: {
      access_token: string;
      refresh_token: string;
    }): Promise<{ data: unknown; error: unknown }>;
  };
};

export type LegacySessionPromotionResult =
  | "invalid"
  | "promoted"
  | "valid-unpromoted";

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

export async function promoteLegacySession({
  legacyClient,
  platformClient,
}: {
  legacyClient: PromotionClient;
  platformClient: PromotionClient;
}): Promise<LegacySessionPromotionResult> {
  const {
    data: { user: legacyUser },
    error: legacyUserError,
  } = await legacyClient.auth.getUser();

  if (legacyUserError || !legacyUser) return "invalid";

  // getSession() is used only after getUser() has authenticated the legacy
  // request. Its credentials are never trusted for authorization, exposed to
  // a URL, or logged; the promoted client validates the identity again.
  const {
    data: { session },
    error: legacySessionError,
  } = await legacyClient.auth.getSession();

  if (legacySessionError || !session) return "valid-unpromoted";

  const { error: setSessionError } = await platformClient.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (setSessionError) return "valid-unpromoted";

  const {
    data: { user: platformUser },
    error: platformUserError,
  } = await platformClient.auth.getUser();

  if (
    platformUserError ||
    !platformUser ||
    platformUser.id !== legacyUser.id
  ) {
    return "valid-unpromoted";
  }

  return "promoted";
}

function createRequestClient({
  supabaseUrl,
  supabaseAnonKey,
  requestCookies,
  responseCookies,
  responseHeaders,
  cookieOptions,
}: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  requestCookies: ReadableCookieStore;
  responseCookies: WritableCookieStore;
  responseHeaders: WritableHeaders;
  cookieOptions?: SessionCookieOptions;
}) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    ...(cookieOptions ? { cookieOptions } : {}),
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

export async function createSupabaseRequestClient({
  supabaseUrl,
  supabaseAnonKey,
  requestCookies,
  responseCookies,
  responseHeaders,
  hostname,
  sessionMode,
}: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  requestCookies: ReadableCookieStore;
  responseCookies: WritableCookieStore;
  responseHeaders: WritableHeaders;
  hostname?: string | null;
  sessionMode?: AuthSessionMode;
}) {
  const mode = resolveAuthSessionMode(sessionMode);
  const requestCookieValues = (await requestCookies.getAll()) ?? [];
  const requestCookieSnapshot: ReadableCookieStore = {
    getAll: () => requestCookieValues,
  };
  const legacyCookieName = legacyCookieNameForSupabaseUrl(supabaseUrl);
  const platformCookieOptions = resolveSessionCookieOptions({ hostname, mode });

  if (!platformCookieOptions) {
    return createRequestClient({
      supabaseUrl,
      supabaseAnonKey,
      requestCookies: requestCookieSnapshot,
      responseCookies,
      responseHeaders,
    });
  }

  const sessionSource = selectRequestSessionSource({
    mode,
    cookies: requestCookieValues,
    legacyCookieName,
    platformCookieName: platformCookieOptions.name,
  });
  const platformClient = createRequestClient({
    supabaseUrl,
    supabaseAnonKey,
    requestCookies: requestCookieSnapshot,
    responseCookies,
    responseHeaders,
    cookieOptions: platformCookieOptions,
  });

  if (sessionSource === "platform") return platformClient;

  const legacyClient = createRequestClient({
    supabaseUrl,
    supabaseAnonKey,
    requestCookies: requestCookieSnapshot,
    responseCookies,
    responseHeaders,
    cookieOptions: { name: legacyCookieName },
  });

  const promotionResult = await promoteLegacySession({
    legacyClient,
    platformClient,
  });

  return promotionResult === "promoted" || promotionResult === "invalid"
    ? platformClient
    : legacyClient;
}

export function createSupabaseServerComponentClient(
  cookieStore: ReadableCookieStore & WritableCookieStore,
  {
    hostname,
    sessionMode,
  }: { hostname?: string | null; sessionMode?: AuthSessionMode } = {},
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const mode = resolveAuthSessionMode(sessionMode);
  const cookieOptions = resolveSessionCookieOptions({ hostname, mode });

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    ...(cookieOptions ? { cookieOptions } : {}),
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
