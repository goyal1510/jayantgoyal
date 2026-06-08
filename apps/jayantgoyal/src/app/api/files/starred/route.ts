import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listSpecialFiles } from "@/lib/file-manager/special-list";

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
    const searchQuery = searchParams.get("q") || "";

    const files = await listSpecialFiles(supabase, {
      userId: user.id,
      searchQuery,
      sortField,
      sortOrder,
      starredOnly: true,
      limit: 250,
    });

    return NextResponse.json({
      files,
      count: files.length,
      query: searchQuery.trim().toLowerCase(),
    });
  } catch (error) {
    console.error("Error listing starred files:", error);
    return NextResponse.json(
      { error: "Failed to list starred files" },
      { status: 500 }
    );
  }
}
