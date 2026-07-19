import type { SupabaseClient, User } from "@supabase/supabase-js";

type UserMetadata = Record<string, unknown>;

function nonBlank(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function splitFullName(fullName: string | null) {
  if (!fullName) return { firstName: null, lastName: null };
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

export function profileMetadataFromUser(user: Pick<User, "user_metadata">) {
  const metadata = (user.user_metadata ?? {}) as UserMetadata;
  const fullName =
    nonBlank(metadata.full_name) ??
    nonBlank(metadata.name) ??
    nonBlank(metadata.user_name);
  const splitName = splitFullName(fullName);

  return {
    firstName:
      nonBlank(metadata.first_name) ??
      nonBlank(metadata.given_name) ??
      splitName.firstName,
    lastName:
      nonBlank(metadata.last_name) ??
      nonBlank(metadata.family_name) ??
      splitName.lastName,
    avatarUrl:
      nonBlank(metadata.avatar_url) ??
      nonBlank(metadata.picture) ??
      nonBlank(metadata.avatar_url_https),
  };
}

/**
 * Provider metadata is a safe fallback for an empty profile name. Avatar URLs
 * are provider-owned and are refreshed whenever the provider gives us a new
 * value. Explicitly entered profile names are never overwritten.
 */
export async function syncProfileFromAuthUser(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "user_metadata">,
) {
  const metadata = profileMetadataFromUser(user);
  if (!metadata.firstName && !metadata.lastName && !metadata.avatarUrl) return;

  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return;

  const updates: Record<string, string> = {};
  if (!profile.first_name && metadata.firstName) {
    updates.first_name = metadata.firstName;
  }
  if (!profile.last_name && metadata.lastName) {
    updates.last_name = metadata.lastName;
  }
  if (metadata.avatarUrl && metadata.avatarUrl !== profile.avatar_url) {
    updates.avatar_url = metadata.avatarUrl;
  }
  if (Object.keys(updates).length === 0) return;

  await supabase
    .schema("jg_account")
    .from("profiles")
    .update(updates)
    .eq("user_id", user.id);
}
