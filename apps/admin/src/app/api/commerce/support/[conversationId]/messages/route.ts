import { NextRequest, NextResponse } from "next/server";
import {
  authorizeCommerceAdmin,
  commerceAdminErrorResponse,
} from "../../../helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type SupportMessageRow = {
  id: string;
  conversation_id: string | null;
  sender_id: string | null;
  user_id: string;
  content: string;
  message_type: "text" | "code";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeMessage(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 2000);
}

async function loadSupportConversation(
  app: ReturnType<ReturnType<typeof createSupabaseAdminClient>["schema"]>,
  conversationId: string,
) {
  const { data, error } = await app
    .from("messenger_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("conversation_type", "support")
    .eq("is_archived", false)
    .maybeSingle();

  if (error) throw new Error("Unable to load support thread.");
  return data;
}

async function ensureSupportAgentParticipant({
  app,
  conversationId,
  userId,
}: {
  app: ReturnType<ReturnType<typeof createSupabaseAdminClient>["schema"]>;
  conversationId: string;
  userId: string;
}) {
  const { error } = await app
    .from("messenger_conversation_participants")
    .upsert(
      {
        conversation_id: conversationId,
        user_id: userId,
        role: "support_agent",
      },
      { onConflict: "conversation_id,user_id" },
    );

  if (error) throw new Error("Unable to join support thread.");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const { conversationId } = await params;
    if (!UUID_PATTERN.test(conversationId)) {
      return NextResponse.json(
        { error: "Support thread id is invalid." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const app = supabase.schema("jg_app");
    const conversation = await loadSupportConversation(app, conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Support thread not found" },
        { status: 404 },
      );
    }

    const { data: messages, error } = await app
      .from("messenger_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(300);

    if (error) {
      return NextResponse.json(
        { error: "Unable to load support messages." },
        { status: 500 },
      );
    }

    const messageRows = (messages ?? []) as SupportMessageRow[];
    const senderIds = [
      ...new Set(
        messageRows
          .map((message) => message.sender_id ?? message.user_id)
          .filter(Boolean),
      ),
    ];
    const { data: profiles } = senderIds.length
      ? await supabase
          .schema("jg_account")
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", senderIds)
      : { data: [] };

    return NextResponse.json({
      conversation,
      messages: messageRows,
      profiles: (profiles ?? []) as ProfileRow[],
    });
  } catch (error) {
    return commerceAdminErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const { conversationId } = await params;
    if (!UUID_PATTERN.test(conversationId)) {
      return NextResponse.json(
        { error: "Support thread id is invalid." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const app = supabase.schema("jg_app");
    const conversation = await loadSupportConversation(app, conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Support thread not found" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const content = normalizeMessage((body as { content?: unknown }).content);

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 },
      );
    }

    await ensureSupportAgentParticipant({
      app,
      conversationId,
      userId: auth.user.id,
    });

    const now = new Date().toISOString();
    const { data: message, error } = await app
      .from("messenger_messages")
      .insert({
        conversation_id: conversationId,
        user_id: auth.user.id,
        sender_id: auth.user.id,
        content,
        message_type: "text",
        metadata: { source: "admin_support" },
        is_read: true,
      })
      .select("*")
      .single();

    if (error || !message) {
      return NextResponse.json(
        { error: "Unable to send support reply." },
        { status: 500 },
      );
    }

    await Promise.all([
      app
        .from("messenger_conversations")
        .update({ last_message_at: now })
        .eq("id", conversationId),
      app
        .from("messenger_conversation_participants")
        .update({ last_read_at: now })
        .eq("conversation_id", conversationId)
        .eq("user_id", auth.user.id),
    ]);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return commerceAdminErrorResponse(error);
  }
}
