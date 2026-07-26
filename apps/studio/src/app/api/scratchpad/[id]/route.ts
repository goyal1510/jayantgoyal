import { NextRequest, NextResponse } from "next/server";
import { getVerifiedRequestUserId } from "@/lib/auth/verified-request-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SCRATCHPAD_SELECT_COLUMNS =
  "id,user_id,content,entry_type,language,created_at,updated_at,is_read";

// PATCH /api/entries/[id] - Update a entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getVerifiedRequestUserId(request, supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content, entry_type, language, is_read } = body;

    const updateData: Record<string, unknown> = {};
    if (content !== undefined) updateData.content = content.trim();
    if (entry_type !== undefined) {
      if (entry_type !== "text" && entry_type !== "code") {
        return NextResponse.json(
          { error: "entry_type must be 'text' or 'code'" },
          { status: 400 },
        );
      }
      updateData.entry_type = entry_type;
      if (entry_type === "text") updateData.language = null;
    }
    if (language !== undefined) {
      updateData.language = entry_type === "text" ? null : language;
    }
    if (is_read !== undefined) {
      updateData.is_read = !!is_read;
    }

    const { data: entry, error } = await supabase
      .schema("jg_app")
      .from("scratchpad_entries")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select(SCRATCHPAD_SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      console.error("Error updating entry:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update entry" },
        { status: 500 },
      );
    }

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error in PATCH /api/entries/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/entries/[id] - Delete a entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getVerifiedRequestUserId(request, supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: deletedEntry, error } = await supabase
      .schema("jg_app")
      .from("scratchpad_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Error deleting entry:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete entry" },
        { status: 500 },
      );
    }

    if (!deletedEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/entries/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
