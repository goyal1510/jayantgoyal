import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/files/[id]/move
 * Move a file or folder to a new directory
 * Body: { targetPath: string, overwrite?: boolean, rename?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: fileId } = await params;

    // Parse request body
    const body = await request.json();
    const { targetPath, overwrite = false, rename = false } = body;

    // Validate input
    if (!targetPath || typeof targetPath !== "string") {
      return NextResponse.json(
        { error: "Target path is required" },
        { status: 400 }
      );
    }

    // Prevent path traversal attacks
    if (targetPath.includes("..") || !targetPath.startsWith("/")) {
      return NextResponse.json(
        { error: "Invalid target path" },
        { status: 400 }
      );
    }

    // Normalize target path (ensure it ends with /)
    const normalizedTargetPath = targetPath === "/"
      ? "/"
      : targetPath.endsWith("/")
        ? targetPath
        : `${targetPath}/`;

    // Get current file to check if it exists and belongs to user
    const { data: file, error: fileError } = await supabase
      .schema("fmanager")
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Get current parent path
    const currentParentPath = file.file_path.substring(0, file.file_path.lastIndexOf(file.file_name));

    // Check if trying to move to the same location
    if (normalizedTargetPath === currentParentPath) {
      return NextResponse.json(
        { error: "File is already in this location" },
        { status: 400 }
      );
    }

    // For directories, prevent moving into itself or its children
    if (file.is_directory) {
      if (normalizedTargetPath.startsWith(file.file_path)) {
        return NextResponse.json(
          { error: "Cannot move a folder into itself or its subfolders" },
          { status: 400 }
        );
      }
    }

    // Get the new parent directory ID
    let newParentId: string | null = null;
    if (normalizedTargetPath !== "/") {
      const { data: parentDir } = await supabase
        .schema("fmanager")
        .from("files")
        .select("id")
        .eq("user_id", user.id)
        .eq("file_path", normalizedTargetPath)
        .eq("is_directory", true)
        .eq("is_deleted", false)
        .single();

      if (!parentDir) {
        return NextResponse.json(
          { error: "Target directory not found" },
          { status: 404 }
        );
      }
      newParentId = parentDir.id;
    } else {
      // Moving to root - get root directory ID
      const { data: rootDir } = await supabase
        .schema("fmanager")
        .from("files")
        .select("id")
        .eq("user_id", user.id)
        .eq("file_path", "/")
        .eq("is_directory", true)
        .eq("is_deleted", false)
        .single();

      newParentId = rootDir?.id || null;
    }

    // Construct the new file path
    const newFilePath = normalizedTargetPath + file.file_name + (file.is_directory ? "/" : "");

    // Check if a file with the same name already exists at the destination
    const { data: existingFile } = await supabase
      .schema("fmanager")
      .from("files")
      .select("id, file_name, file_path, display_name, size_bytes, updated_at, is_directory, storage_path")
      .eq("user_id", user.id)
      .eq("file_path", newFilePath)
      .eq("is_deleted", false)
      .single();

    let finalFilePath = newFilePath;
    let finalFileName = file.file_name;

    if (existingFile) {
      // If overwrite is true, delete the existing file first
      if (overwrite) {
        // Hard delete the existing file
        const { error: deleteError } = await supabase
          .schema("fmanager")
          .from("files")
          .delete()
          .eq("id", existingFile.id)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Error deleting existing file:", deleteError);
          return NextResponse.json(
            { error: "Failed to replace existing file: " + deleteError.message },
            { status: 500 }
          );
        }

        // Also delete from storage if it exists
        if (existingFile.storage_path) {
          await supabase.storage.from("private-files").remove([existingFile.storage_path]);
        }
      } else if (rename) {
        // Generate a unique name by adding a number suffix
        let counter = 1;

        // For files, insert number before extension
        const lastDotIndex = file.file_name.lastIndexOf(".");
        const hasExtension = !file.is_directory && lastDotIndex > 0;
        const baseName = hasExtension ? file.file_name.substring(0, lastDotIndex) : file.file_name;
        const extension = hasExtension ? file.file_name.substring(lastDotIndex) : "";

        while (true) {
          finalFileName = `${baseName} (${counter})${extension}`;
          finalFilePath = normalizedTargetPath + finalFileName + (file.is_directory ? "/" : "");

          const { data: checkFile } = await supabase
            .schema("fmanager")
            .from("files")
            .select("id")
            .eq("user_id", user.id)
            .eq("file_path", finalFilePath)
            .eq("is_deleted", false)
            .single();

          if (!checkFile) break;
          counter++;
        }
      } else {
        // Return conflict response
        return NextResponse.json(
          {
            error: "A file with this name already exists at the destination",
            code: "FILE_EXISTS",
            existingFile: {
              id: existingFile.id,
              name: existingFile.display_name || existingFile.file_name,
              fileName: existingFile.file_name,
              path: existingFile.file_path,
              size: existingFile.size_bytes,
              updated_at: existingFile.updated_at,
              is_directory: existingFile.is_directory,
            },
          },
          { status: 409 }
        );
      }
    }

    // Move the file (update path and parent)
    const { error: updateError } = await supabase
      .schema("fmanager")
      .from("files")
      .update({
        file_path: finalFilePath,
        file_name: finalFileName,
        parent_id: newParentId,
        display_name: null, // Clear display_name so UI shows file_name
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to move file" },
        { status: 500 }
      );
    }

    // Update child paths if it's a directory
    if (file.is_directory) {
      await updateChildPaths(supabase, user.id, file.file_path, finalFilePath);
    }

    return NextResponse.json({
      success: true,
      message: `${file.is_directory ? "Folder" : "File"} moved successfully`,
      renamed: finalFileName !== file.file_name,
      newName: finalFileName,
    });
  } catch (error) {
    console.error("Error moving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to update child paths when moving a directory
async function updateChildPaths(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  oldPath: string,
  newPath: string
) {
  const { data: children } = await supabase
    .schema("fmanager")
    .from("files")
    .select("id, file_path")
    .eq("user_id", userId)
    .like("file_path", `${oldPath}%`)
    .neq("file_path", oldPath)
    .eq("is_deleted", false);

  if (children && children.length > 0) {
    for (const child of children) {
      const newChildPath = child.file_path.replace(oldPath, newPath);
      await supabase
        .schema("fmanager")
        .from("files")
        .update({
          file_path: newChildPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", child.id)
        .eq("user_id", userId);
    }
  }
}
