export const TOOL_SAVE_MAX_JSON_BYTES = 256 * 1024
export const TOOL_BULK_MAX_ITEM_BYTES = 64 * 1024

export const SAFE_SAVED_TOOL_ID_LIST = [
  "json-minify",
  "json-prettify",
] as const

export const SAFE_SAVED_TOOL_IDS = new Set<string>(SAFE_SAVED_TOOL_ID_LIST)

export const BLOCKED_SAVED_TOOL_IDS = new Set([
  "token-generator",
  "bip39-generator",
  "rsa-key-generator",
  "otp-generator",
  "hash-text",
  "bcrypt",
  "encrypt-decrypt",
  "hmac-generator",
  "password-strength",
  "jwt-parser",
  "basic-auth-generator",
  "string-obfuscator",
])

export function canPersistToolHistory(toolId: string) {
  return SAFE_SAVED_TOOL_IDS.has(toolId) && !BLOCKED_SAVED_TOOL_IDS.has(toolId)
}

export function normalizeSavedToolTitle(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }
  return value.replace(/\s+/g, " ").trim().slice(0, 120)
}

export function normalizeSavedToolCollection(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }
  return value.replace(/\s+/g, " ").trim().slice(0, 60)
}

export function normalizeSavedToolId(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }
  return value.trim().slice(0, 80)
}

export function getJsonByteSize(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

export function isAllowedSavedToolPayload(value: unknown) {
  return value === null || getJsonByteSize(value) <= TOOL_SAVE_MAX_JSON_BYTES
}

export function isAllowedBulkToolPayload(value: unknown) {
  return getJsonByteSize(value) <= TOOL_BULK_MAX_ITEM_BYTES
}
