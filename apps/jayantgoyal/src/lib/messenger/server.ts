import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/messenger/database.types"

type AdminClient = ReturnType<typeof createSupabaseAdminClient>

export type ConversationRow =
  Database["messenger"]["Tables"]["conversations"]["Row"]
export type ParticipantRow =
  Database["messenger"]["Tables"]["conversation_participants"]["Row"]
export type MessageRow = Database["messenger"]["Tables"]["messages"]["Row"]

export interface MessengerProfile {
  user_id: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

export interface MessengerParticipant extends ParticipantRow {
  profile: MessengerProfile | null
  display_label: string
  is_self: boolean
}

export interface ConversationSummary extends ConversationRow {
  participants: MessengerParticipant[]
  last_message: MessageRow | null
  unread_count: number
  display_title: string
}

export function getMessengerDisplayName(
  profile: MessengerProfile | null | undefined,
  fallbackUserId: string,
  selfUserId: string
) {
  if (fallbackUserId === selfUserId) return "You"

  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  return name || `User ${fallbackUserId.slice(0, 8)}`
}

export async function fetchProfilesByUserId(
  admin: AdminClient,
  userIds: string[]
) {
  const uniqueIds = Array.from(new Set(userIds)).filter(Boolean)

  if (uniqueIds.length === 0) {
    return new Map<string, MessengerProfile>()
  }

  const { data, error } = await admin
    .schema("jg_account")
    .from("profiles")
    .select("user_id, first_name, last_name, avatar_url")
    .in("user_id", uniqueIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map(
    ((data ?? []) as MessengerProfile[]).map((profile) => [
      profile.user_id,
      profile,
    ])
  )
}

export async function ensureSelfConversation(
  admin: AdminClient,
  userId: string
) {
  const { data: existing, error: existingError } = await admin
    .schema("jg_app")
    .from("messenger_conversations")
    .select("*")
    .eq("conversation_type", "self")
    .eq("created_by", userId)
    .eq("is_archived", false)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existing) {
    await admin
      .schema("jg_app")
      .from("messenger_conversation_participants")
      .upsert(
        {
          conversation_id: existing.id,
          user_id: userId,
          role: "owner",
        },
        { onConflict: "conversation_id,user_id" }
      )

    return existing as ConversationRow
  }

  const { data: conversation, error: conversationError } = await admin
    .schema("jg_app")
    .from("messenger_conversations")
    .insert({
      conversation_type: "self",
      title: "Self chat",
      created_by: userId,
    })
    .select()
    .single()

  if (conversationError || !conversation) {
    throw new Error(conversationError?.message ?? "Unable to create self chat")
  }

  const { error: participantError } = await admin
    .schema("jg_app")
    .from("messenger_conversation_participants")
    .insert({
      conversation_id: conversation.id,
      user_id: userId,
      role: "owner",
    })

  if (participantError) {
    throw new Error(participantError.message)
  }

  return conversation as ConversationRow
}

export function buildConversationSummary({
  conversation,
  participants,
  profiles,
  latestMessage,
  unreadCount,
  selfUserId,
}: {
  conversation: ConversationRow
  participants: ParticipantRow[]
  profiles: Map<string, MessengerProfile>
  latestMessage: MessageRow | null
  unreadCount: number
  selfUserId: string
}): ConversationSummary {
  const participantPayload = participants.map((participant) => {
    const profile = profiles.get(participant.user_id) ?? null

    return {
      ...participant,
      profile,
      display_label: getMessengerDisplayName(
        profile,
        participant.user_id,
        selfUserId
      ),
      is_self: participant.user_id === selfUserId,
    }
  })

  const otherParticipants = participantPayload.filter(
    (participant) => !participant.is_self
  )
  const displayTitle =
    conversation.title?.trim() ||
    (conversation.conversation_type === "self"
      ? "Self chat"
      : otherParticipants.map((participant) => participant.display_label).join(", ")) ||
    "Conversation"

  return {
    ...conversation,
    participants: participantPayload,
    last_message: latestMessage,
    unread_count: unreadCount,
    display_title: displayTitle,
  }
}
