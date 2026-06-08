import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getFileStorageGate } from "@/lib/commerce/file-gates.server"
import type { Json } from "@/lib/messenger/database.types"

type MessengerAttachment = {
  id: string
  bucket_id: string
  storage_path: string
  name: string
  original_name?: string
  mime_type: string
  size_bytes: number
}

function normalizeAttachments(value: unknown): MessengerAttachment[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((attachment): attachment is MessengerAttachment => {
      if (
        !attachment ||
        typeof attachment !== "object" ||
        Array.isArray(attachment)
      ) {
        return false
      }

      return (
        typeof attachment.id === "string" &&
        typeof attachment.bucket_id === "string" &&
        typeof attachment.storage_path === "string" &&
        typeof attachment.name === "string" &&
        typeof attachment.mime_type === "string" &&
        typeof attachment.size_bytes === "number"
      )
    })
    .slice(0, 5)
}

async function getUserId() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  return user.id
}

async function verifyParticipant(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  conversationId: string,
  userId: string
) {
  const { data, error } = await admin
    .schema("jg_app")
    .from("messenger_conversation_participants")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .is("left_at", null)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params
    const admin = createSupabaseAdminClient()
    const participant = await verifyParticipant(admin, conversationId, userId)

    if (!participant) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { data: messages, error } = await admin
      .schema("jg_app")
      .from("messenger_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(300)

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unable to load messages" },
        { status: 500 }
      )
    }

    await admin
      .schema("jg_app")
      .from("messenger_conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)

    return NextResponse.json({ messages: messages ?? [] })
  } catch (error) {
    console.error("Error in GET conversation messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params
    const admin = createSupabaseAdminClient()
    const participant = await verifyParticipant(admin, conversationId, userId)

    if (!participant) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const body = await request.json()
    const content =
      typeof body.content === "string" ? body.content.trim() : ""
    const messageType = body.message_type === "code" ? "code" : "text"
    const language =
      messageType === "code" && typeof body.language === "string"
        ? body.language
        : null
    const attachments = normalizeAttachments(body.attachments)

    if (!content && attachments.length === 0) {
      return NextResponse.json(
        { error: "Message content or attachment is required" },
        { status: 400 }
      )
    }

    const invalidAttachment = attachments.find(
      (attachment) =>
        attachment.bucket_id !== "private-files" ||
        !attachment.storage_path.startsWith(`messenger/${userId}/${conversationId}/`)
    )

    if (invalidAttachment) {
      return NextResponse.json(
        { error: "Invalid attachment payload" },
        { status: 400 }
      )
    }

    const attachmentBytes = attachments.reduce(
      (total, attachment) => total + attachment.size_bytes,
      0
    )

    if (attachmentBytes > 0) {
      const storageGate = await getFileStorageGate({
        userId,
        incomingBytes: attachmentBytes,
      })

      if (!storageGate.allowed) {
        return NextResponse.json(
          {
            error: "Storage limit reached. Upgrade to Pro for more messenger attachments.",
            code: "MESSENGER_STORAGE_LIMIT_REACHED",
            gate: storageGate,
          },
          { status: 402 }
        )
      }
    }

    const metadata: Json =
      attachments.length > 0
        ? {
            attachments,
          }
        : {}

    const now = new Date().toISOString()
    const { data: message, error } = await admin
      .schema("jg_app")
      .from("messenger_messages")
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        sender_id: userId,
        content,
        message_type: messageType,
        language,
        metadata,
        is_read: true,
      })
      .select()
      .single()

    if (error || !message) {
      return NextResponse.json(
        { error: error?.message || "Unable to send message" },
        { status: 500 }
      )
    }

    await Promise.all([
      admin
        .schema("jg_app")
        .from("messenger_conversations")
        .update({ last_message_at: now })
        .eq("id", conversationId),
      admin
        .schema("jg_app")
        .from("messenger_conversation_participants")
        .update({ last_read_at: now })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId),
    ])

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("Error in POST conversation messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
