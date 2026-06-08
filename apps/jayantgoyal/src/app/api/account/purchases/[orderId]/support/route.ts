import { NextRequest, NextResponse } from "next/server"

import {
  commerceErrorResponse,
  getAuthenticatedCommerceUser,
} from "@/lib/commerce/api.server"
import { getPaidPurchaseWithDetailsForUser } from "@/lib/commerce/database.server"
import { triggerSupportOpenedEmail } from "@/lib/commerce/emails.server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { ConversationRow } from "@/lib/messenger/server"
import type { Json } from "@/lib/messenger/database.types"

function normalizeMessage(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, 2000)
}

async function findSupportConversation(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orderId: string
) {
  const { data, error } = await admin
    .schema("jg_app")
    .from("messenger_conversations")
    .select("*")
    .eq("conversation_type", "support")
    .eq("is_archived", false)
    .filter("metadata->>order_id", "eq", orderId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as ConversationRow | null) ?? null
}

async function getSupportAgentIds(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const { data, error } = await admin
    .schema("jg_account")
    .from("profiles")
    .select("user_id")
    .in("role", ["admin", "super_admin"])

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Array<{ user_id: string }>).map((profile) => profile.user_id)
}

async function ensureParticipants({
  admin,
  conversationId,
  buyerUserId,
  supportAgentIds,
}: {
  admin: ReturnType<typeof createSupabaseAdminClient>
  conversationId: string
  buyerUserId: string
  supportAgentIds: string[]
}) {
  const rows = new Map<string, { conversation_id: string; user_id: string; role: string }>()

  rows.set(buyerUserId, {
    conversation_id: conversationId,
    user_id: buyerUserId,
    role: "owner",
  })

  for (const supportAgentId of supportAgentIds) {
    if (supportAgentId === buyerUserId) continue
    rows.set(supportAgentId, {
      conversation_id: conversationId,
      user_id: supportAgentId,
      role: "support_agent",
    })
  }

  const { error } = await admin
    .schema("jg_app")
    .from("messenger_conversation_participants")
    .upsert([...rows.values()], { onConflict: "conversation_id,user_id" })

  if (error) {
    throw new Error(error.message)
  }
}

async function seedBuyerMessage({
  admin,
  conversationId,
  userId,
  content,
}: {
  admin: ReturnType<typeof createSupabaseAdminClient>
  conversationId: string
  userId: string
  content: string
}) {
  if (!content) return

  const now = new Date().toISOString()
  const { error } = await admin.schema("jg_app").from("messenger_messages").insert({
    conversation_id: conversationId,
    user_id: userId,
    sender_id: userId,
    content,
    message_type: "text",
    metadata: { source: "purchase_support" } satisfies Json,
    is_read: true,
  })

  if (error) {
    throw new Error(error.message)
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
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getAuthenticatedCommerceUser()
    const { orderId } = await params
    const purchase = await getPaidPurchaseWithDetailsForUser({
      orderId,
      userId: user.id,
    })

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const message = normalizeMessage((body as { message?: unknown }).message)
    const admin = createSupabaseAdminClient()
    const supportAgentIds = await getSupportAgentIds(admin)

    let conversation = await findSupportConversation(admin, purchase.id)

    if (!conversation) {
      const productName = purchase.product?.name ?? "Paid product"
      const { data, error } = await admin
        .schema("jg_app")
        .from("messenger_conversations")
        .insert({
          conversation_type: "support",
          title: `Support: ${productName}`,
          created_by: user.id,
          metadata: {
            source: "account_purchases",
            support_status: "open",
            order_id: purchase.id,
            product_id: purchase.product_id,
            price_id: purchase.price_id,
            product_name: productName,
            order_status: purchase.status,
          } satisfies Json,
        })
        .select("*")
        .single()

      if (error || !data) {
        const existing = await findSupportConversation(admin, purchase.id)
        if (!existing) {
          throw new Error(error?.message ?? "Unable to create support conversation")
        }
        conversation = existing
      } else {
        conversation = data as ConversationRow
      }
    }

    await ensureParticipants({
      admin,
      conversationId: conversation.id,
      buyerUserId: user.id,
      supportAgentIds,
    })
    await seedBuyerMessage({
      admin,
      conversationId: conversation.id,
      userId: user.id,
      content: message,
    })
    triggerSupportOpenedEmail({
      conversationId: conversation.id,
      orderId: purchase.id,
      buyerUserId: user.id,
      productName: purchase.product?.name ?? "Paid product",
    })

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    return commerceErrorResponse(error)
  }
}
