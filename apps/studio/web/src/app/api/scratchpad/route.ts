import { NextRequest, NextResponse } from "next/server";
import { getVerifiedRequestUserId } from "@/lib/auth/verified-request-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SCRATCHPAD_SELECT_COLUMNS =
  "id,user_id,content,entry_type,language,created_at,updated_at,is_read";

// GET /api/entries - Fetch all entries for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getVerifiedRequestUserId(request, supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: entries, error } = await supabase
      .schema("jg_app")
      .from("scratchpad_entries")
      .select(SCRATCHPAD_SELECT_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching entries:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch entries" },
        { status: 500 },
      );
    }

    return NextResponse.json({ entries: entries || [], userId });
  } catch (error) {
    console.error("Error in GET /api/entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/entries - Create a new entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getVerifiedRequestUserId(request, supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, entry_type, language } = body;

    if (!content || !entry_type) {
      return NextResponse.json(
        { error: "Content and entry_type are required" },
        { status: 400 },
      );
    }

    if (entry_type !== "text" && entry_type !== "code") {
      return NextResponse.json(
        { error: "entry_type must be 'text' or 'code'" },
        { status: 400 },
      );
    }

    const { data: entry, error } = await supabase
      .schema("jg_app")
      .from("scratchpad_entries")
      .insert({
        user_id: userId,
        content: content.trim(),
        entry_type,
        language: entry_type === "code" ? language || null : null,
      })
      .select(SCRATCHPAD_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error("Error creating entry:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create entry" },
        { status: 500 },
      );
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
