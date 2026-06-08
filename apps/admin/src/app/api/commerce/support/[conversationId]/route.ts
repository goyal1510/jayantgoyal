import { NextRequest, NextResponse } from "next/server";
import { authorizeCommerceAdmin } from "../../helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const SUPPORT_STATUSES = new Set(["open", "pending", "resolved"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    const status = typeof body.status === "string" ? body.status : "";

    if (!SUPPORT_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid support status" }, { status: 400 });
    }

    const { conversationId } = await params;
    const app = createSupabaseAdminClient().schema("jg_app");
    const { data: conversation, error: loadError } = await app
      .from("messenger_conversations")
      .select("id, metadata")
      .eq("id", conversationId)
      .eq("conversation_type", "support")
      .eq("is_archived", false)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 500 });
    }

    if (!conversation) {
      return NextResponse.json({ error: "Support thread not found" }, { status: 404 });
    }

    const metadata =
      conversation.metadata && typeof conversation.metadata === "object"
        ? conversation.metadata
        : {};

    const { data, error } = await app
      .from("messenger_conversations")
      .update({
        metadata: {
          ...metadata,
          support_status: status,
          support_status_updated_by: auth.user.id,
          support_status_updated_at: new Date().toISOString(),
        },
      })
      .eq("id", conversationId)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Unable to update support status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
