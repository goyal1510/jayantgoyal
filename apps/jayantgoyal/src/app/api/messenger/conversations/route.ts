import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  buildConversationSummary,
  ensureSelfConversation,
  fetchProfilesByUserId,
  type ConversationRow,
  type MessageRow,
  type ParticipantRow,
} from "@/lib/messenger/server"

async function findExistingDirectConversation(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  participantUserId: string
) {
  const { data: myRows, error: myRowsError } = await admin
    .schema("jg_app")
    .from("messenger_conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId)
    .is("left_at", null)

  if (myRowsError) {
    throw new Error(myRowsError.message)
  }

  const conversationIds = (myRows ?? []).map((row) => row.conversation_id)

  if (conversationIds.length === 0) return null

  const { data: conversations, error: conversationsError } = await admin
    .schema("jg_app")
    .from("messenger_conversations")
    .select("*")
    .eq("conversation_type", "direct")
    .eq("is_archived", false)
    .in("id", conversationIds)

  if (conversationsError) {
    throw new Error(conversationsError.message)
  }

  const directIds = ((conversations ?? []) as ConversationRow[]).map(
    (conversation) => conversation.id
  )

  if (directIds.length === 0) return null

  const { data: participants, error: participantsError } = await admin
    .schema("jg_app")
    .from("messenger_conversation_participants")
    .select("*")
    .in("conversation_id", directIds)
    .is("left_at", null)

  if (participantsError) {
    throw new Error(participantsError.message)
  }

  const grouped = new Map<string, ParticipantRow[]>()
  ;((participants ?? []) as ParticipantRow[]).forEach((participant) => {
    const group = grouped.get(participant.conversation_id) ?? []
    group.push(participant)
    grouped.set(participant.conversation_id, group)
  })

  return (
    ((conversations ?? []) as ConversationRow[]).find((conversation) => {
      const participantIds = (grouped.get(conversation.id) ?? []).map(
        (participant) => participant.user_id
      )

      return (
        participantIds.length === 2 &&
        participantIds.includes(userId) &&
        participantIds.includes(participantUserId)
      )
    }) ?? null
  )
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()
    await ensureSelfConversation(admin, user.id)

    const { data: myParticipants, error: participantError } = await admin
      .schema("jg_app")
      .from("messenger_conversation_participants")
      .select("*")
      .eq("user_id", user.id)
      .is("left_at", null)

    if (participantError) {
      return NextResponse.json(
        { error: participantError.message || "Unable to load conversations" },
        { status: 500 }
      )
    }

    const myParticipantRows = (myParticipants ?? []) as ParticipantRow[]
    const conversationIds = myParticipantRows.map((row) => row.conversation_id)

    if (conversationIds.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    const { data: conversations, error: conversationsError } = await admin
      .schema("jg_app")
      .from("messenger_conversations")
      .select("*")
      .in("id", conversationIds)
      .eq("is_archived", false)
      .order("last_message_at", {
        ascending: false,
        nullsFirst: false,
      })

    if (conversationsError) {
      return NextResponse.json(
        { error: conversationsError.message || "Unable to load conversations" },
        { status: 500 }
      )
    }

    const { data: allParticipants, error: allParticipantsError } = await admin
      .schema("jg_app")
      .from("messenger_conversation_participants")
      .select("*")
      .in("conversation_id", conversationIds)
      .is("left_at", null)

    if (allParticipantsError) {
      return NextResponse.json(
        {
          error:
            allParticipantsError.message || "Unable to load conversation members",
        },
        { status: 500 }
      )
    }

    const { data: messages, error: messagesError } = await admin
      .schema("jg_app")
      .from("messenger_messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500)

    if (messagesError) {
      return NextResponse.json(
        { error: messagesError.message || "Unable to load latest messages" },
        { status: 500 }
      )
    }

    const participantRows = (allParticipants ?? []) as ParticipantRow[]
    const messageRows = (messages ?? []) as MessageRow[]
    const profiles = await fetchProfilesByUserId(
      admin,
      participantRows.map((participant) => participant.user_id)
    )

    const latestByConversation = new Map<string, MessageRow>()
    messageRows.forEach((message) => {
      if (message.conversation_id && !latestByConversation.has(message.conversation_id)) {
        latestByConversation.set(message.conversation_id, message)
      }
    })

    const myParticipantByConversation = new Map(
      myParticipantRows.map((participant) => [
        participant.conversation_id,
        participant,
      ])
    )

    const unreadCounts = new Map<string, number>()
    messageRows.forEach((message) => {
      if (!message.conversation_id || message.sender_id === user.id) return

      const myParticipant = myParticipantByConversation.get(message.conversation_id)
      const lastRead = myParticipant?.last_read_at
        ? new Date(myParticipant.last_read_at).getTime()
        : 0

      if (new Date(message.created_at).getTime() > lastRead) {
        unreadCounts.set(
          message.conversation_id,
          (unreadCounts.get(message.conversation_id) ?? 0) + 1
        )
      }
    })

    const participantsByConversation = new Map<string, ParticipantRow[]>()
    participantRows.forEach((participant) => {
      const group = participantsByConversation.get(participant.conversation_id) ?? []
      group.push(participant)
      participantsByConversation.set(participant.conversation_id, group)
    })

    const summaries = ((conversations ?? []) as ConversationRow[]).map(
      (conversation) =>
        buildConversationSummary({
          conversation,
          participants: participantsByConversation.get(conversation.id) ?? [],
          profiles,
          latestMessage: latestByConversation.get(conversation.id) ?? null,
          unreadCount: unreadCounts.get(conversation.id) ?? 0,
          selfUserId: user.id,
        })
    )

    return NextResponse.json({ conversations: summaries })
  } catch (error) {
    console.error("Error in GET /api/messenger/conversations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()
    const body = await request.json()
    const participantUserId =
      typeof body.participant_user_id === "string"
        ? body.participant_user_id
        : user.id

    if (body.conversation_type === "self" || participantUserId === user.id) {
      const conversation = await ensureSelfConversation(admin, user.id)
      return NextResponse.json({ conversation }, { status: 201 })
    }

    const { data: profile, error: profileError } = await admin
      .schema("jg_account")
      .from("profiles")
      .select("user_id")
      .eq("user_id", participantUserId)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message || "Unable to validate contact" },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      )
    }

    const existingConversation = await findExistingDirectConversation(
      admin,
      user.id,
      participantUserId
    )

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation })
    }

    const { data: conversation, error: conversationError } = await admin
      .schema("jg_app")
      .from("messenger_conversations")
      .insert({
        conversation_type: "direct",
        created_by: user.id,
      })
      .select()
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json(
        {
          error:
            conversationError?.message || "Unable to create direct conversation",
        },
        { status: 500 }
      )
    }

    const { error: participantsError } = await admin
      .schema("jg_app")
      .from("messenger_conversation_participants")
      .insert([
        {
          conversation_id: conversation.id,
          user_id: user.id,
          role: "owner",
        },
        {
          conversation_id: conversation.id,
          user_id: participantUserId,
          role: "member",
        },
      ])

    if (participantsError) {
      return NextResponse.json(
        { error: participantsError.message || "Unable to add participants" },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/messenger/conversations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
