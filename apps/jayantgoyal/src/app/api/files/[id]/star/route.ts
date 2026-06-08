import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;
    const body = await request.json();
    const isStarred = Boolean(body.starred);

    const { data, error } = await supabase
      .schema("jg_app")
      .from("file_manager_files")
      .update({
        is_starred: isStarred,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .select("id,is_starred")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to update starred state" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: data,
    });
  } catch (error) {
    console.error("Error updating starred state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
