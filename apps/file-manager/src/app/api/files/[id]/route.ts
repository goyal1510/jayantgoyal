import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateFileMetadata, deleteFile, getFileByPath } from "@/lib/db/files";

/**
 * GET /api/files/[id]
 * Get file details and signed URL for viewing
 */
export async function GET(
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

    // Get file details
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

    // If it's a directory, return just the file info
    if (file.is_directory) {
      return NextResponse.json({
        success: true,
        file: {
          id: file.id,
          name: file.file_name,
          display_name: file.display_name,
          path: file.file_path,
          is_directory: true,
          child_count: file.child_count,
          created_at: file.created_at,
          updated_at: file.updated_at,
        },
      });
    }

    // Generate signed URL for file viewing (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("private-files")
      .createSignedUrl(file.storage_path, 60); // 60 seconds expiry - short-lived for security

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate file URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        name: file.file_name,
        display_name: file.display_name,
        original_filename: file.original_filename,
        path: file.file_path,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        file_type: file.file_type,
        is_directory: false,
        created_at: file.created_at,
        updated_at: file.updated_at,
        url: signedUrlData.signedUrl,
      },
    });
  } catch (error) {
    console.error("Error getting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/files/[id]
 * Update file/folder metadata (rename)
 * Body: { name: string }
 */
export async function PATCH(
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
    const { name } = body;

    // Validate input
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Sanitize name (remove invalid characters)
    const sanitizedName = name.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, "");
    if (!sanitizedName) {
      return NextResponse.json(
        { error: "Invalid name" },
        { status: 400 }
      );
    }

    // Get current file to determine if it's a directory and get current path
    const currentFile = await supabase
      .schema("fmanager")
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single();

    if (currentFile.error || !currentFile.data) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const file = currentFile.data;

    // Check if file is deleted
    if (file.is_deleted) {
      return NextResponse.json(
        { error: "Cannot rename deleted file" },
        { status: 400 }
      );
    }

    // For directories, we need to update the path and all child paths
    if (file.is_directory) {
      // Extract parent path from current path
      const parentPath = file.file_path.substring(0, file.file_path.lastIndexOf(file.file_name));
      const newPath = parentPath + sanitizedName + "/";

      // Check if a folder with the new name already exists
      const existingFile = await getFileByPath(supabase, user.id, newPath);
      if (existingFile && existingFile.id !== fileId) {
        return NextResponse.json(
          { error: "A folder with this name already exists" },
          { status: 409 }
        );
      }

      // Update directory name and path
      const updated = await updateFileMetadata(supabase, fileId, user.id, {
        file_name: sanitizedName,
        file_path: newPath,
        display_name: sanitizedName,
      });

      if (!updated) {
        return NextResponse.json(
          { error: "Failed to rename folder" },
          { status: 500 }
        );
      }

      // Update all child paths recursively
      // Get all files/folders that start with the old path
      const oldPathPrefix = file.file_path;
      const { data: children, error: childrenError } = await supabase
        .schema("fmanager")
        .from("files")
        .select("id, file_path")
        .eq("user_id", user.id)
        .like("file_path", `${oldPathPrefix}%`)
        .neq("id", fileId)
        .eq("is_deleted", false);

      if (childrenError) {
        console.error("Error fetching children:", childrenError);
        // Continue anyway - the folder was renamed
      } else if (children && children.length > 0) {
        // Update each child's path
        for (const child of children) {
          const newChildPath = child.file_path.replace(oldPathPrefix, newPath);
          await supabase
            .schema("fmanager")
            .from("files")
            .update({
              file_path: newChildPath,
              updated_at: new Date().toISOString(),
            })
            .eq("id", child.id)
            .eq("user_id", user.id);
        }
      }

      return NextResponse.json({
        success: true,
        file: updated,
      });
    } else {
      // For files, update file_name and display_name, but keep file_path the same
      // (file_path includes the filename, so we need to reconstruct it)
      const parentPath = file.file_path.substring(0, file.file_path.lastIndexOf(file.file_name));
      const fileExtension = file.file_name.includes(".") 
        ? file.file_name.substring(file.file_name.lastIndexOf("."))
        : "";
      const newFileName = sanitizedName + fileExtension;
      const newPath = parentPath + newFileName;

      // Check if a file with the new name already exists
      const existingFile = await getFileByPath(supabase, user.id, newPath);
      if (existingFile && existingFile.id !== fileId) {
        return NextResponse.json(
          { error: "A file with this name already exists" },
          { status: 409 }
        );
      }

      const updated = await updateFileMetadata(supabase, fileId, user.id, {
        file_name: newFileName,
        file_path: newPath,
        display_name: sanitizedName,
      });

      if (!updated) {
        return NextResponse.json(
          { error: "Failed to rename file" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        file: updated,
      });
    }
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[id]
 * Soft delete a file/folder
 */
export async function DELETE(
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

    // Check if file exists and belongs to user
    const file = await supabase
      .schema("fmanager")
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single();

    if (file.error || !file.data) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Check if already deleted
    if (file.data.is_deleted) {
      return NextResponse.json(
        { error: "File is already deleted" },
        { status: 400 }
      );
    }

    // Soft delete the file/folder
    const success = await deleteFile(supabase, fileId, user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
