import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { CommerceError } from "@/lib/commerce/types"
import { getWorkspaceAccessForUser } from "@/lib/commerce/entitlements.server"

export interface FileStorageGate {
  allowed: boolean
  plan: "free" | "pro"
  isPro: boolean
  usedBytes: number
  incomingBytes: number
  replacingBytes: number
  projectedBytes: number
  limitBytes: number
  remainingBytes: number
}

type MessengerAttachmentMetadata = {
  size_bytes?: unknown
}

function getMessengerAttachmentBytes(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return 0
  }

  const attachments = (metadata as { attachments?: unknown }).attachments
  if (!Array.isArray(attachments)) return 0

  return attachments.reduce((total, attachment: MessengerAttachmentMetadata) => {
    const size = attachment?.size_bytes
    return total + (typeof size === "number" && Number.isFinite(size) ? size : 0)
  }, 0)
}

async function getFileManagerUsageBytes(userId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .schema("jg_app")
    .from("file_manager_files")
    .select("size_bytes,is_directory")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .limit(10000)

  if (error) {
    throw new CommerceError(
      "file_usage_unavailable",
      `Unable to load file usage: ${error.message}`,
      500
    )
  }

  return (data ?? []).reduce(
    (total, row) => total + (row.is_directory ? 0 : row.size_bytes ?? 0),
    0
  )
}

async function getMessengerAttachmentUsageBytes(userId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .schema("jg_app")
    .from("messenger_messages")
    .select("metadata")
    .or(`sender_id.eq.${userId},user_id.eq.${userId}`)
    .limit(10000)

  if (error) {
    throw new CommerceError(
      "messenger_attachment_usage_unavailable",
      `Unable to load messenger attachment usage: ${error.message}`,
      500
    )
  }

  return (data ?? []).reduce(
    (total, row) => total + getMessengerAttachmentBytes(row.metadata),
    0
  )
}

export async function getPrivateStorageUsageBytes(userId: string) {
  const [fileManagerBytes, messengerAttachmentBytes] = await Promise.all([
    getFileManagerUsageBytes(userId),
    getMessengerAttachmentUsageBytes(userId),
  ])

  return fileManagerBytes + messengerAttachmentBytes
}

export async function getFileStorageGate({
  userId,
  incomingBytes,
  replacingBytes = 0,
}: {
  userId: string
  incomingBytes: number
  replacingBytes?: number
}): Promise<FileStorageGate> {
  const [access, usedBytes] = await Promise.all([
    getWorkspaceAccessForUser(userId),
    getPrivateStorageUsageBytes(userId),
  ])
  const projectedBytes = Math.max(0, usedBytes - replacingBytes) + incomingBytes
  const limitBytes = access.limits.fileStorageBytes

  return {
    allowed: projectedBytes <= limitBytes,
    plan: access.plan,
    isPro: access.isPro,
    usedBytes,
    incomingBytes,
    replacingBytes,
    projectedBytes,
    limitBytes,
    remainingBytes: Math.max(0, limitBytes - usedBytes),
  }
}
