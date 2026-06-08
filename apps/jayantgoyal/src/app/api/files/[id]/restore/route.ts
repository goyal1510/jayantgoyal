import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;
    const admin = createSupabaseAdminClient();

    const { data: file, error: fileError } = await admin
      .schema("jg_app")
      .from("file_manager_files")
      .select("id,file_path,file_name,is_directory,user_id,is_deleted")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .eq("is_deleted", true)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: "Deleted file not found" },
        { status: 404 }
      );
    }

    const { data: conflict } = await admin
      .schema("jg_app")
      .from("file_manager_files")
      .select("id")
      .eq("user_id", user.id)
      .eq("file_path", file.file_path)
      .eq("is_deleted", false)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json(
        { error: "An active item already exists at this path" },
        { status: 409 }
      );
    }

    const { error: updateError } = await admin
      .schema("jg_app")
      .from("file_manager_files")
      .update({
        is_deleted: false,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", file.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error restoring file:", updateError);
      return NextResponse.json(
        { error: "Failed to restore item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${file.is_directory ? "Folder" : "File"} restored successfully`,
    });
  } catch (error) {
    console.error("Error restoring file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
