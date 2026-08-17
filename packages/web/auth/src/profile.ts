import type { SupabaseClient, User, UserIdentity } from "@supabase/supabase-js";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";
export const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ProfileAvatarMode = "provider" | "upload" | "initials";

export interface ProfileAvatarRecord {
  avatar_mode?: ProfileAvatarMode | string | null;
  avatar_url?: string | null;
  avatar_storage_path?: string | null;
}

type IdentityMetadata = Record<string, unknown>;

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

function identityMetadata(identity: UserIdentity): IdentityMetadata {
  return (identity.identity_data ?? {}) as IdentityMetadata;
}

function identityTimestamp(identity: UserIdentity) {
  const timestamp = identity.last_sign_in_at
    ? Date.parse(identity.last_sign_in_at)
    : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function identitiesByRecentUse(user: Pick<User, "identities">) {
  return [...(user.identities ?? [])].sort(
    (left, right) => identityTimestamp(right) - identityTimestamp(left),
  );
}

function avatarUrlFromMetadata(metadata: IdentityMetadata) {
  return (
    nonBlank(metadata.avatar_url) ??
    nonBlank(metadata.picture) ??
    nonBlank(metadata.avatar_url_https)
  );
}

function avatarUrlFromIdentity(identity: UserIdentity) {
  return avatarUrlFromMetadata(identityMetadata(identity));
}

function identityName(identity: UserIdentity) {
  const metadata = identityMetadata(identity);
  const fullName =
    nonBlank(metadata.full_name) ??
    nonBlank(metadata.name) ??
    nonBlank(metadata.user_name) ??
    nonBlank(metadata.login);
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
  };
}

/** Provider data is read from Supabase identities, never auth user metadata. */
export function profileMetadataFromIdentities(user: Pick<User, "identities">) {
  const identity = identitiesByRecentUse(user).find((candidate) => {
    const name = identityName(candidate);
    return Boolean(name.firstName || name.lastName);
  });

  return identity
    ? identityName(identity)
    : { firstName: null, lastName: null };
}

/**
 * Resolve the avatar for the current account without mutating profiles on
 * login. The most recently used connected provider wins, which lets Google
 * and GitHub each show their own avatar after their respective sign-in.
 */
export function providerAvatarUrl(user: Pick<User, "identities">) {
  return (
    identitiesByRecentUse(user)
      .filter(
        (identity) =>
          identity.provider === "google" || identity.provider === "github",
      )
      .map(avatarUrlFromIdentity)
      .find(Boolean) ?? null
  );
}

export function profileDisplayName(
  profile: { first_name?: string | null; last_name?: string | null },
  fallback = "Account",
) {
  return (
    [profile.first_name, profile.last_name]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(" ") || fallback
  );
}

export async function resolveProfileAvatar(
  supabase: SupabaseClient,
  user: Pick<User, "identities">,
  profile: ProfileAvatarRecord,
) {
  if (profile.avatar_mode === "initials") return null;

  if (profile.avatar_mode === "upload" && profile.avatar_storage_path) {
    const { data } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .createSignedUrl(profile.avatar_storage_path, 60 * 60);
    if (data?.signedUrl) return data.signedUrl;
  }

  return providerAvatarUrl(user) ?? nonBlank(profile.avatar_url);
}

/**
 * Provider names may prefill an empty profile once. Existing profile names
 * remain authoritative and are never overwritten by a later sign-in.
 */
export async function syncProfileNamesFromIdentities(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "identities">,
) {
  const metadata = profileMetadataFromIdentities(user);
  if (!metadata.firstName && !metadata.lastName) return;

  const { data: profile } = await supabase
    .schema("iam")
    .from("profiles")
    .select("first_name, last_name")
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
  if (Object.keys(updates).length === 0) return;

  await supabase
    .schema("iam")
    .from("profiles")
    .update(updates)
    .eq("user_id", user.id);
}
