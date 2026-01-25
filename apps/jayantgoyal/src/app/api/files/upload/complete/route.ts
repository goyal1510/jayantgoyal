import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createFileRecord } from "@/lib/file-manager/database";
import type { CreateFileData, FileTypeCategory } from "@/lib/file-manager/types";

/**
 * POST /api/files/upload/complete
 * Create file record after successful direct upload to Supabase Storage
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

    // Parse JSON body
    const body = await request.json();
    const {
      storagePath,
      filePath,
      fileName,
      originalFileName,
      mimeType,
      fileSize,
      fileType,
      parentId,
      displayName,
    } = body;

    // Validate required fields
    if (!storagePath || !filePath || !fileName || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the file exists in storage
    const { data: fileList, error: listError } = await supabase.storage
      .from("private-files")
      .list(storagePath.split("/").slice(0, -1).join("/"), {
        search: storagePath.split("/").pop(),
      });

    if (listError) {
      console.error("Error verifying uploaded file:", listError);
      return NextResponse.json(
        { error: "Failed to verify uploaded file" },
        { status: 500 }
      );
    }

    const uploadedFile = fileList?.find(
      (f) => f.name === storagePath.split("/").pop()
    );

    if (!uploadedFile) {
      return NextResponse.json(
        { error: "File not found in storage. Upload may have failed." },
        { status: 400 }
      );
    }

    // Create file metadata record
    const fileData: CreateFileData = {
      original_filename: originalFileName || fileName,
      display_name: displayName || undefined,
      mime_type: mimeType || "application/octet-stream",
      size_bytes: fileSize,
      file_path: filePath,
      file_name: fileName,
      file_type: (fileType as FileTypeCategory) || "other",
      parent_id: parentId,
      storage_path: storagePath,
      bucket_id: "private-files",
    };

    const fileRecord = await createFileRecord(supabase, user.id, fileData);

    if (!fileRecord) {
      // Rollback: delete the uploaded file from storage
      await supabase.storage.from("private-files").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to create file record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        path: fileRecord.file_path,
        name: fileRecord.file_name,
        display_name: fileRecord.display_name,
        size_bytes: fileRecord.size_bytes,
        mime_type: fileRecord.mime_type,
        file_type: fileRecord.file_type,
      },
    });
  } catch (error) {
    console.error("Error completing file upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
