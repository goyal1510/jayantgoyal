import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .schema("jg_app")
      .from("file_manager_files")
      .select("size_bytes,file_type,is_directory,is_starred,updated_at")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .limit(5000);

    if (error) {
      console.error("Error loading file usage:", error);
      return NextResponse.json(
        { error: "Failed to load storage usage" },
        { status: 500 }
      );
    }

    const rows = data || [];
    const usageByType = rows.reduce<Record<string, number>>((acc, row) => {
      if (row.is_directory) return acc;
      acc[row.file_type] = (acc[row.file_type] || 0) + (row.size_bytes || 0);
      return acc;
    }, {});
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    return NextResponse.json({
      usedBytes: rows.reduce(
        (total, row) => total + (row.is_directory ? 0 : row.size_bytes || 0),
        0
      ),
      fileCount: rows.filter((row) => !row.is_directory).length,
      folderCount: rows.filter((row) => row.is_directory).length,
      starredCount: rows.filter((row) => row.is_starred).length,
      recentCount: rows.filter(
        (row) => new Date(row.updated_at).getTime() >= thirtyDaysAgo
      ).length,
      usageByType,
    });
  } catch (error) {
    console.error("Error loading file usage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
