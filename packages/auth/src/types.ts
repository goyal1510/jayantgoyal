import type {
  CookieOptions,
  GetAllCookies,
  SetAllCookies,
  SetCookie,
} from "@supabase/ssr";

export type SupabasePublicConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type SupabaseServiceConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
};

/** Cookie store exposed by a server framework's request context. */
export type ServerCookieStore = {
  getAll: GetAllCookies;
  set: (name: string, value: string, options: CookieOptions) => unknown;
};

/** Cookie and response-header operations exposed by middleware/route handlers. */
export type ResponseCookieStore = {
  getAll: GetAllCookies;
  setCookie: SetCookie;
  setHeader: (name: string, value: string) => void;
};

export type SupabaseCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export type SupabaseSetAllCookies = SetAllCookies;
