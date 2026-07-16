import type { SupabasePublicConfig, SupabaseServiceConfig } from "./types";

export function requireSupabasePublicConfig(
  config: Partial<SupabasePublicConfig>,
): SupabasePublicConfig {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
  };
}

export function requireSupabaseServiceConfig(
  config: Partial<SupabaseServiceConfig>,
): SupabaseServiceConfig {
  if (!config.supabaseUrl || !config.serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.");
  }

  return {
    supabaseUrl: config.supabaseUrl,
    serviceRoleKey: config.serviceRoleKey,
  };
}
