import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureSelfConversation } from "@/lib/messenger/server";

// GET /api/messages - Fetch all messages for the authenticated user
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = createSupabaseAdminClient();
    const selfConversation = await ensureSelfConversation(admin, user.id);

    const { data: messages, error } = await admin
      .schema("jg_app")
      .from("messenger_messages")
      .select("*")
      .eq("conversation_id", selfConversation.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Error in GET /api/messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Create a new message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, message_type, language } = body;

    if (!content || !message_type) {
      return NextResponse.json(
        { error: "Content and message_type are required" },
        { status: 400 }
      );
    }

    if (message_type !== "text" && message_type !== "code") {
      return NextResponse.json(
        { error: "message_type must be 'text' or 'code'" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const selfConversation = await ensureSelfConversation(admin, user.id);
    const now = new Date().toISOString();

    const { data: message, error } = await admin
      .schema("jg_app")
      .from("messenger_messages")
      .insert({
        user_id: user.id,
        sender_id: user.id,
        conversation_id: selfConversation.id,
        content: content.trim(),
        message_type,
        language: message_type === "code" ? language || null : null,
        is_read: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating message:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create message" },
        { status: 500 }
      );
    }

    await admin
      .schema("jg_app")
      .from("messenger_conversations")
      .update({ last_message_at: now })
      .eq("id", selfConversation.id);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
