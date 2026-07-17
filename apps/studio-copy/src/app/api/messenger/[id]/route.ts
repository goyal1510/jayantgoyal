import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// PATCH /api/messages/[id] - Update a message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { content, message_type, language, is_read } = body;

    // Verify the message belongs to the user
    const { data: existingMessage, error: fetchError } = await supabase
      .schema("jg_app")
      .from("messenger_messages")
      .select("user_id, message_type")
      .eq("id", id)
      .single();

    if (fetchError || !existingMessage) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (existingMessage.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (content !== undefined) updateData.content = content.trim();
    if (message_type !== undefined) {
      if (message_type !== "text" && message_type !== "code") {
        return NextResponse.json(
          { error: "message_type must be 'text' or 'code'" },
          { status: 400 }
        );
      }
      updateData.message_type = message_type;
    }
    if (language !== undefined) {
      updateData.language =
        (message_type ?? existingMessage.message_type) === "code"
          ? language
          : null;
    }
    if (is_read !== undefined) {
      updateData.is_read = !!is_read;
    }

    const { data: message, error } = await supabase
      .schema("jg_app")
      .from("messenger_messages")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating message:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error in PATCH /api/messages/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify the message belongs to the user
    const { data: existingMessage, error: fetchError } = await supabase
      .schema("jg_app")
      .from("messenger_messages")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingMessage) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (existingMessage.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .schema("jg_app")
      .from("messenger_messages")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting message:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/messages/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
