import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_SORT_FIELDS = ["name", "date", "size", "type"] as const;

type SortField = (typeof VALID_SORT_FIELDS)[number];

function isSortField(value: string): value is SortField {
  return VALID_SORT_FIELDS.includes(value as SortField);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedSortField = searchParams.get("sort") || "date";
    const sortField = isSortField(requestedSortField) ? requestedSortField : "date";
    const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";
    const searchQuery = searchParams.get("q")?.trim().toLowerCase() || "";

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .schema("jg_app")
      .from("file_manager_files")
      .select(
        "id,file_path,file_name,display_name,mime_type,size_bytes,file_type,is_directory,child_count,created_at,updated_at,deleted_at,is_deleted,is_starred"
      )
      .eq("user_id", user.id)
      .eq("is_deleted", true)
      .order("deleted_at", { ascending: false, nullsFirst: false })
      .limit(250);

    if (error) {
      console.error("Error listing trash:", error);
      return NextResponse.json(
        { error: "Failed to list trash" },
        { status: 500 }
      );
    }

    let files = data || [];

    if (searchQuery) {
      files = files.filter((file) => {
        const searchable = [
          file.display_name,
          file.file_name,
          file.mime_type,
          file.file_type,
          file.file_path,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(searchQuery);
      });
    }

    const sortedFiles = [...files].sort((a, b) => {
      let comparison = 0;

      if (a.is_directory && !b.is_directory) return -1;
      if (!a.is_directory && b.is_directory) return 1;

      switch (sortField) {
        case "name":
          comparison = (a.display_name || a.file_name).localeCompare(
            b.display_name || b.file_name
          );
          break;
        case "date":
          comparison =
            new Date(a.deleted_at || a.updated_at).getTime() -
            new Date(b.deleted_at || b.updated_at).getTime();
          break;
        case "size":
          comparison = (a.size_bytes || 0) - (b.size_bytes || 0);
          break;
        case "type":
          comparison = a.file_type.localeCompare(b.file_type);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return NextResponse.json({
      files: sortedFiles,
      count: sortedFiles.length,
      query: searchQuery,
    });
  } catch (error) {
    console.error("Error listing trash:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
