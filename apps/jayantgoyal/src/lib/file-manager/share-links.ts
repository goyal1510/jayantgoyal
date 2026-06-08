import { createHash, randomBytes } from "crypto"

export const FILE_SHARE_TOKEN_BYTES = 32
export const FILE_SHARE_SIGNED_URL_SECONDS = 120
export const FILE_SHARE_DEFAULT_EXPIRY_HOURS = 24
export const FILE_SHARE_MAX_EXPIRY_HOURS = 168

export interface FileShareLink {
  id: string
  file_id: string
  user_id: string
  expires_at: string
  revoked_at: string | null
  last_accessed_at: string | null
  download_count: number
  created_at: string
  updated_at: string
}

export function createShareToken() {
  return randomBytes(FILE_SHARE_TOKEN_BYTES).toString("base64url")
}

export function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function normalizeExpiryHours(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed)) return FILE_SHARE_DEFAULT_EXPIRY_HOURS

  return Math.max(1, Math.min(FILE_SHARE_MAX_EXPIRY_HOURS, Math.floor(parsed)))
}

export function buildShareUrl(origin: string, token: string) {
  return `${origin.replace(/\/$/, "")}/api/files/share/${token}`
}
