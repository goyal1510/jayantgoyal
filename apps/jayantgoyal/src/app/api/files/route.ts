import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listDirectory, createDirectoryPath } from "@/lib/file-manager/database";

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
    // URLSearchParams.get() already decodes the value, so we get the decoded path
    let directoryPath = searchParams.get("path") || "/";

    // Normalize the path: ensure it ends with / for directories
    if (directoryPath !== "/" && !directoryPath.endsWith("/")) {
      directoryPath = directoryPath + "/";
    }

    const sortField = searchParams.get("sort") || "name";
    const sortOrder = searchParams.get("order") || "asc";
    const searchQuery = searchParams.get("q")?.trim().toLowerCase() || "";

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

    // Only auto-create root directory if it doesn't exist
    // For nested directories, return an error if they don't exist
    if (files === null) {
      // Only auto-create root directory
      if (directoryPath === "/" || directoryPath === "") {
        const dirId = await createDirectoryPath(supabase, user.id, "/");

        if (dirId === null) {
          return NextResponse.json(
            { error: "Failed to create or access root directory" },
            { status: 500 }
          );
        }

        // Try listing again after creating the root directory
        files = await listDirectory(supabase, user.id, "/");

        if (files === null) {
          return NextResponse.json(
            { error: "Failed to list root directory after creation" },
            { status: 500 }
          );
        }

        // Return empty array if root directory was just created
        files = files || [];
      } else {
        // For nested directories that don't exist, return an error
        return NextResponse.json(
          { error: "Directory not found" },
          { status: 404 }
        );
      }
    }

    // Filter out any files/folders that have the same path as the current directory
    // This prevents showing a folder inside itself
    // The database function already filters by parent_id, but this is a safety check
    files = files.filter(file => {
      // Normalize paths for comparison (ensure trailing slash)
      const filePath = file.file_path.endsWith("/") ? file.file_path : file.file_path + "/"
      const dirPath = directoryPath.endsWith("/") ? directoryPath : directoryPath + "/"
      // File path should NOT equal directory path (can't show folder inside itself)
      return filePath !== dirPath
    })

    if (files.length > 0) {
      const { data: starredRows, error: starredError } = await supabase
        .schema("jg_app")
        .from("file_manager_files")
        .select("id,is_starred")
        .eq("user_id", user.id)
        .in("id", files.map((file) => file.id));

      if (starredError) {
        console.error("Error loading starred state:", starredError);
      } else {
        const starredById = new Map(
          (starredRows || []).map((row) => [row.id, row.is_starred])
        );
        files = files.map((file) => ({
          ...file,
          is_starred: starredById.get(file.id) || false,
        }));
      }
    }

    if (searchQuery) {
      files = files.filter((file) => {
        const searchable = [
          file.display_name,
          file.file_name,
          file.mime_type,
          file.file_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(searchQuery);
      });
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
      query: searchQuery,
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
