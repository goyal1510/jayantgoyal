import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/entries - Fetch all entries for the authenticated user
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

    const { data: entries, error } = await supabase
      .schema("jg_app")
      .from("scratchpad_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching entries:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch entries" },
        { status: 500 }
      );
    }

    return NextResponse.json({ entries: entries || [] });
  } catch (error) {
    console.error("Error in GET /api/entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/entries - Create a new entry
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
    const { content, entry_type, language } = body;

    if (!content || !entry_type) {
      return NextResponse.json(
        { error: "Content and entry_type are required" },
        { status: 400 }
      );
    }

    if (entry_type !== "text" && entry_type !== "code") {
      return NextResponse.json(
        { error: "entry_type must be 'text' or 'code'" },
        { status: 400 }
      );
    }

    const { data: entry, error } = await supabase
      .schema("jg_app")
      .from("scratchpad_entries")
      .insert({
        user_id: user.id,
        content: content.trim(),
        entry_type,
        language: entry_type === "code" ? language || null : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating entry:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
