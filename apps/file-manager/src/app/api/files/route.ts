import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listDirectory, createDirectoryPath } from "@/lib/db/files";

/**
 * GET /api/files
 * List directory contents
 * Query params:
 *   - path: Directory path (default: '/')
 *   - sort: Sort field (name, date, size, type) (default: 'name')
 *   - order: Sort order (asc, desc) (default: 'asc')
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const directoryPath = searchParams.get("path") || "/";
    const sortField = searchParams.get("sort") || "name";
    const sortOrder = searchParams.get("order") || "asc";

    // Validate sort field
    const validSortFields = ["name", "date", "size", "type"];
    if (!validSortFields.includes(sortField)) {
      return NextResponse.json(
        { error: `Invalid sort field. Must be one of: ${validSortFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate sort order
    if (sortOrder !== "asc" && sortOrder !== "desc") {
      return NextResponse.json(
        { error: "Invalid sort order. Must be 'asc' or 'desc'" },
        { status: 400 }
      );
    }

    // List directory contents
    let files = await listDirectory(supabase, user.id, directoryPath);

    // If directory doesn't exist (especially root), create it first
    if (files === null) {
      // Try to create the directory path (this will create all parent directories if needed)
      const dirId = await createDirectoryPath(supabase, user.id, directoryPath);
      
      if (dirId === null) {
        return NextResponse.json(
          { error: "Failed to create or access directory" },
          { status: 500 }
        );
      }

      // Try listing again after creating the directory
      files = await listDirectory(supabase, user.id, directoryPath);
      
      if (files === null) {
        return NextResponse.json(
          { error: "Failed to list directory" },
          { status: 500 }
        );
      }
    }

    // Sort files
    const sortedFiles = [...files].sort((a, b) => {
      let comparison = 0;

      // Always show directories first
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
            new Date(a.updated_at).getTime() -
            new Date(b.updated_at).getTime();
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
      directoryPath,
      count: sortedFiles.length,
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}