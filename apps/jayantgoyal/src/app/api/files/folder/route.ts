import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDirectoryPath } from "@/lib/file-manager/database";

/**
 * POST /api/files/folder
 * Create a new folder
 * Body: { name: string, parentPath: string }
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { name, parentPath = "/" } = body;

    // Validate input
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Sanitize folder name (remove invalid characters)
    const sanitizedName = name.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, "");
    if (!sanitizedName) {
      return NextResponse.json(
        { error: "Invalid folder name" },
        { status: 400 }
      );
    }

    // Ensure parent path ends with /
    const normalizedParentPath = parentPath === "/" ? "/" : parentPath.endsWith("/") ? parentPath : parentPath + "/";

    // Construct full directory path
    const directoryPath = normalizedParentPath + sanitizedName + "/";

    // Create directory path (this will create all parent directories if needed)
    const dirId = await createDirectoryPath(supabase, user.id, directoryPath);

    if (dirId === null) {
      return NextResponse.json(
        { error: "Failed to create folder. It may already exist." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: dirId,
      path: directoryPath,
      name: sanitizedName,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
