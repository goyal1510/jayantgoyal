import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/messenger/database.types";

const VALID_REACTIONS = new Set([
  "thumbs_up",
  "heart",
  "laugh",
  "celebrate",
  "eyes",
]);

type MessageMetadata = {
  reactions?: Record<string, string[]>;
} & Record<string, Json | undefined>;

function normalizeMetadata(value: Json): MessageMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as MessageMetadata;
}

async function getUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return user.id;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: messageId } = await params;
    const body = await request.json();
    const reaction = typeof body.reaction === "string" ? body.reaction : "";

    if (!VALID_REACTIONS.has(reaction)) {
      return NextResponse.json(
        { error: "Unsupported reaction" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: message, error: messageError } = await admin
      .schema("jg_app")
      .from("messenger_messages")
      .select("id,user_id,sender_id,conversation_id,metadata")
      .eq("id", messageId)
      .maybeSingle();

    if (messageError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.conversation_id) {
      const { data: participant, error: participantError } = await admin
        .schema("jg_app")
        .from("messenger_conversation_participants")
        .select("id")
        .eq("conversation_id", message.conversation_id)
        .eq("user_id", userId)
        .is("left_at", null)
        .maybeSingle();

      if (participantError || !participant) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if ((message.sender_id ?? message.user_id) !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const metadata = normalizeMetadata(message.metadata);
    const reactions = { ...(metadata.reactions ?? {}) };
    const currentUsers = new Set(reactions[reaction] ?? []);

    if (currentUsers.has(userId)) {
      currentUsers.delete(userId);
    } else {
      currentUsers.add(userId);
    }

    if (currentUsers.size === 0) {
      delete reactions[reaction];
    } else {
      reactions[reaction] = Array.from(currentUsers);
    }

    const nextMetadata: MessageMetadata = {
      ...metadata,
      reactions,
    };

    const { data: updatedMessage, error: updateError } = await admin
      .schema("jg_app")
      .from("messenger_messages")
      .update({
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select()
      .single();

    if (updateError || !updatedMessage) {
      return NextResponse.json(
        { error: "Unable to update reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error("Error updating message reaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
