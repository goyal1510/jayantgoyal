import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// PATCH /api/entries/[id] - Update a entry
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
    const { content, entry_type, language, is_read } = body;

    // Verify the entry belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .schema("jg_app")
      .from("scratchpad_entries")
      .select("user_id, entry_type")
      .eq("id", id)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    if (existingEntry.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (content !== undefined) updateData.content = content.trim();
    if (entry_type !== undefined) {
      if (entry_type !== "text" && entry_type !== "code") {
        return NextResponse.json(
          { error: "entry_type must be 'text' or 'code'" },
          { status: 400 }
        );
      }
      updateData.entry_type = entry_type;
    }
    if (language !== undefined) {
      updateData.language =
        (entry_type ?? existingEntry.entry_type) === "code"
          ? language
          : null;
    }
    if (is_read !== undefined) {
      updateData.is_read = !!is_read;
    }

    const { data: entry, error } = await supabase
      .schema("jg_app")
      .from("scratchpad_entries")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating entry:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error in PATCH /api/entries/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/entries/[id] - Delete a entry
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

    // Verify the entry belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .schema("jg_app")
      .from("scratchpad_entries")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    if (existingEntry.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .schema("jg_app")
      .from("scratchpad_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting entry:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/entries/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
