import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/files/[id]/copy
 * Copy a file to a new directory
 * Body: { targetPath: string, overwrite?: boolean, rename?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;

    // Parse request body
    const body = await request.json();
    const { targetPath, overwrite = false, rename = false } = body;

    // Validate input
    if (!targetPath || typeof targetPath !== "string") {
      return NextResponse.json(
        { error: "Target path is required" },
        { status: 400 },
      );
    }

    // Prevent path traversal attacks
    if (targetPath.includes("..") || !targetPath.startsWith("/")) {
      return NextResponse.json(
        { error: "Invalid target path" },
        { status: 400 },
      );
    }

    // Normalize target path (ensure it ends with /)
    const normalizedTargetPath =
      targetPath === "/"
        ? "/"
        : targetPath.endsWith("/")
          ? targetPath
          : `${targetPath}/`;

    // Get current file to check if it exists and belongs to user
    const { data: file, error: fileError } = await supabase
      .schema("studio")
      .from("file_entries")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Directories cannot be copied (would need recursive copy)
    if (file.is_directory) {
      return NextResponse.json(
        {
          error:
            "Folder copying is not supported. Please copy files individually.",
        },
        { status: 400 },
      );
    }

    // Construct the new file path
    const newFilePath = normalizedTargetPath + file.file_name;

    // Check if a file with the same name already exists at the destination
    const { data: existingFile } = await supabase
      .schema("studio")
      .from("file_entries")
      .select(
        "id, file_name, file_path, display_name, size_bytes, updated_at, storage_path",
      )
      .eq("user_id", user.id)
      .eq("file_path", newFilePath)
      .eq("is_deleted", false)
      .single();

    let finalFilePath = newFilePath;
    let finalFileName = file.file_name;

    if (existingFile) {
      if (overwrite) {
        // Hard delete the existing file
        const { error: deleteError } = await supabase
          .schema("studio")
          .from("file_entries")
          .delete()
          .eq("id", existingFile.id)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Error deleting existing file:", deleteError);
          return NextResponse.json(
            {
              error: "Failed to replace existing file: " + deleteError.message,
            },
            { status: 500 },
          );
        }

        // Also delete from storage if it exists
        if (existingFile.storage_path) {
          await supabase.storage
            .from("studio-files")
            .remove([existingFile.storage_path]);
        }
      } else if (rename) {
        // Generate a unique name by adding a number suffix
        let counter = 1;
        const lastDotIndex = file.file_name.lastIndexOf(".");
        const hasExtension = lastDotIndex > 0;
        const baseName = hasExtension
          ? file.file_name.substring(0, lastDotIndex)
          : file.file_name;
        const extension = hasExtension
          ? file.file_name.substring(lastDotIndex)
          : "";

        while (true) {
          finalFileName = `${baseName} (${counter})${extension}`;
          finalFilePath = normalizedTargetPath + finalFileName;

          const { data: checkFile } = await supabase
            .schema("studio")
            .from("file_entries")
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
            },
          },
          { status: 409 },
        );
      }
    }

    // Generate a new storage path for the copy
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newStoragePath = `${user.id}/${timestamp}-${randomSuffix}-${finalFileName}`;

    // Get the parent directory ID
    let parentId: string | null = null;
    if (normalizedTargetPath !== "/") {
      const { data: parentDir } = await supabase
        .schema("studio")
        .from("file_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("file_path", normalizedTargetPath)
        .eq("is_directory", true)
        .eq("is_deleted", false)
        .single();

      if (parentDir) {
        parentId = parentDir.id;
      }
    } else {
      // Copying to root - get root directory ID
      const { data: rootDir } = await supabase
        .schema("studio")
        .from("file_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("file_path", "/")
        .eq("is_directory", true)
        .eq("is_deleted", false)
        .single();

      if (rootDir) {
        parentId = rootDir.id;
      }
    }

    // Create the copy record in the database
    const { data: newFile, error: insertError } = await supabase
      .schema("studio")
      .from("file_entries")
      .insert({
        user_id: user.id,
        bucket_id: file.bucket_id,
        storage_path: newStoragePath,
        original_filename: file.original_filename,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        file_path: finalFilePath,
        file_name: finalFileName,
        is_directory: false,
        file_type: file.file_type,
        parent_id: parentId,
        is_deleted: false,
      })
      .select()
      .single();

    if (insertError || !newFile) {
      console.error("Error creating copy record:", insertError);
      return NextResponse.json(
        { error: "Failed to copy file" },
        { status: 500 },
      );
    }

    // Copy the actual file in Supabase Storage
    if (file.storage_path) {
      try {
        const { error: copyError } = await supabase.storage
          .from("studio-files")
          .copy(file.storage_path, newStoragePath);

        if (copyError) {
          console.error("Error copying file in storage:", copyError);
          // Rollback the database record if storage copy fails
          await supabase
            .schema("studio")
            .from("file_entries")
            .delete()
            .eq("id", newFile.id);

          return NextResponse.json(
            { error: "Failed to copy file in storage" },
            { status: 500 },
          );
        }
      } catch (storageError) {
        console.error("Error copying storage file:", storageError);
        // Rollback the database record
        await supabase
          .schema("studio")
          .from("file_entries")
          .delete()
          .eq("id", newFile.id);

        return NextResponse.json(
          { error: "Failed to copy file in storage" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "File copied successfully",
      newFileId: newFile.id,
      renamed: rename && finalFileName !== file.file_name,
      newName: finalFileName,
    });
  } catch (error) {
    console.error("Error copying file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
