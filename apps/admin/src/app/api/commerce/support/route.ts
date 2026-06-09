import { NextResponse } from "next/server";
import { authorizeCommerceAdmin, commerceAdminErrorResponse } from "../helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type SupportMetadata = {
  support_status?: string;
  order_id?: string;
  product_id?: string | null;
  price_id?: string | null;
  product_name?: string;
};

type SupportConversationRow = {
  id: string;
  title: string | null;
  created_by: string;
  metadata: SupportMetadata;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type SupportMessageRow = {
  id: string;
  conversation_id: string | null;
  sender_id: string | null;
  content: string;
  message_type: "text" | "code";
  created_at: string;
  deleted_at: string | null;
};

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

function metadataStatus(metadata: SupportMetadata) {
  const status = metadata.support_status;
  return status === "pending" || status === "resolved" ? status : "open";
}

function displayName(
  profile: ProfileRow | null,
  email: string | null,
  fallbackId: string,
) {
  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || email || `User ${fallbackId.slice(0, 8)}`;
}

export async function GET() {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const supabase = createSupabaseAdminClient();
    const app = supabase.schema("jg_app");
    const { data: conversations, error } = await app
      .from("messenger_conversations")
      .select(
        "id, title, created_by, metadata, last_message_at, created_at, updated_at",
      )
      .eq("conversation_type", "support")
      .eq("is_archived", false)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: "Unable to load support conversations." },
        { status: 500 },
      );
    }

    const typedConversations = (conversations ??
      []) as SupportConversationRow[];
    if (!typedConversations.length) {
      return NextResponse.json({ data: [] });
    }

    const conversationIds = typedConversations.map(
      (conversation) => conversation.id,
    );
    const buyerIds = [
      ...new Set(
        typedConversations.map((conversation) => conversation.created_by),
      ),
    ];

    const [{ data: latestMessages }, { data: profiles }, buyerEntries] =
      await Promise.all([
        app
          .from("messenger_messages")
          .select(
            "id, conversation_id, sender_id, content, message_type, created_at, deleted_at",
          )
          .in("conversation_id", conversationIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .schema("jg_account")
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", buyerIds),
        Promise.all(
          buyerIds.map(async (userId) => {
            const { data } = await supabase.auth.admin.getUserById(userId);
            return [userId, data.user?.email ?? null] as const;
          }),
        ),
      ]);

    const latestByConversation = new Map<string, SupportMessageRow>();
    for (const message of (latestMessages ?? []) as SupportMessageRow[]) {
      if (
        message.conversation_id &&
        !latestByConversation.has(message.conversation_id)
      ) {
        latestByConversation.set(message.conversation_id, message);
      }
    }

    const profilesByUser = new Map(
      ((profiles ?? []) as ProfileRow[]).map((profile) => [
        profile.user_id,
        profile,
      ]),
    );
    const emailsByUser = new Map(buyerEntries);

    return NextResponse.json({
      data: typedConversations.map((conversation) => {
        const metadata = conversation.metadata ?? {};
        const profile = profilesByUser.get(conversation.created_by) ?? null;
        const buyerEmail = emailsByUser.get(conversation.created_by) ?? null;

        return {
          id: conversation.id,
          title: conversation.title,
          status: metadataStatus(metadata),
          order_id: metadata.order_id ?? null,
          product_id: metadata.product_id ?? null,
          price_id: metadata.price_id ?? null,
          product_name: metadata.product_name ?? "Paid product",
          buyer_user_id: conversation.created_by,
          buyer_email: buyerEmail,
          buyer_name: displayName(profile, buyerEmail, conversation.created_by),
          latest_message: latestByConversation.get(conversation.id) ?? null,
          last_message_at: conversation.last_message_at,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
        };
      }),
    });
  } catch (error) {
    return commerceAdminErrorResponse(error);
  }
}
